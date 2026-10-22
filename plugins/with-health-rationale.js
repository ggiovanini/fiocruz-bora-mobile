const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");
const action = "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE";
const activity = ".HealthPermissionsActivity";
module.exports = function withHealthRationale(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    const main = AndroidConfig.Manifest.getMainActivityOrThrow(
      config.modResults,
    );
    main["intent-filter"] = (main["intent-filter"] || []).filter(
      (filter) =>
        !(filter.action || []).some(
          (item) => item.$["android:name"] === action,
        ),
    );
    app.activity = (app.activity || []).filter(
      (item) => item.$["android:name"] !== activity,
    );
    app.activity.push({
      $: { "android:name": activity, "android:exported": "true" },
      "intent-filter": [{ action: [{ $: { "android:name": action } }] }],
    });
    for (const alias of app["activity-alias"] || []) {
      if (alias.$["android:name"] === "ViewPermissionUsageActivity")
        alias.$["android:targetActivity"] = activity;
    }
    manifest.queries ||= [];
    if (
      !manifest.queries.some((query) =>
        (query.package || []).some(
          (item) =>
            item.$["android:name"] === "com.google.android.apps.healthdata",
        ),
      )
    ) {
      manifest.queries.push({
        package: [
          { $: { "android:name": "com.google.android.apps.healthdata" } },
        ],
      });
    }
    return config;
  });
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android.package;
      const folder = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        ...packageName.split("."),
      );
      await fs.mkdir(folder, { recursive: true });
      // Standalone policy remains accessible from Android settings without login or Metro.
      await fs.writeFile(
        path.join(folder, "HealthPermissionsActivity.kt"),
        `package ${packageName}

import android.app.Activity
import android.os.Bundle
import android.widget.ScrollView
import android.widget.TextView

class HealthPermissionsActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    title = "Bóra · Dados de atividade"
    val content = TextView(this).apply {
      textSize = 18f
      val padding = (24 * resources.displayMetrics.density).toInt()
      setPadding(padding, padding * 2, padding, padding * 2)
      text = """
        Bóra — uso dos dados de atividade

        O Bóra consulta treinos dos últimos sete dias no Health Connect, após sua autorização. A atualização automática ocorre ao abrir ou voltar ao aplicativo quando a última tentativa tiver pelo menos cinco minutos, e a cada cinco minutos durante o uso. Você pode desativá-la e usar Atualizar agora.

        Para treinos, são exibidos tipo, início, fim, duração e aplicativo de origem. Você pode permitir ou negar o acesso aos treinos. Passos não são consultados.

        A consulta fica apenas na memória durante a sessão e não gera Energia Vital automaticamente. Para registrar um treino na jornada, você precisa selecioná-lo, escolher uma atividade do catálogo e confirmar a importação. Com sessão ativa, vínculo e consentimento de registro de atividades, essa ação envia à API o identificador de origem, tipo, início, fim e duração do treino para validação e cálculo de Energia Vital. Apenas as preferências de conexão e atualização são salvas localmente. Os dados não são usados para publicidade.

        Não há leitura em segundo plano, localização, dados cardíacos ou gravação de dados no Health Connect. O registro manual continua disponível.

        Para interromper a integração, use Desconectar no Bóra. Para revogar as permissões, abra Health Connect → Permissões do app → Bóra. Sair da conta ou fechar o aplicativo limpa a leitura local.
      """.trimIndent()
    }
    setContentView(ScrollView(this).apply { addView(content) })
  }
}
`,
      );
      return config;
    },
  ]);
};
