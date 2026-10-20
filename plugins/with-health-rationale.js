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

        Este teste consulta passos diários e treinos dos últimos sete dias no Health Connect, após sua autorização. A atualização automática ocorre ao abrir ou voltar ao aplicativo quando a última tentativa tiver pelo menos cinco minutos, e a cada cinco minutos durante o uso. Você pode desativá-la e usar Atualizar agora.

        Para treinos, são exibidos tipo, início, fim, duração e aplicativo de origem. Você pode permitir passos, treinos, ambos ou nenhum deles.

        Os resultados ficam apenas na memória durante a sessão. Não são enviados à API, gravados em armazenamento permanente pelo Bóra, usados para publicidade ou para calcular Energia Vital. Apenas as preferências de conexão e atualização são salvas no aparelho.

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
