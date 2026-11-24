import {
  normalizeWorkout,
  type Access,
  type HealthAdapter,
  type HealthWorkout,
} from "./model";
const healthConnect = () => import("react-native-health-connect");
async function permissions(): Promise<Access> {
  const hc = await healthConnect();
  const granted = await hc.getGrantedPermissions();
  const has = (type: string) =>
    granted.some(
      (p) =>
        "recordType" in p && p.recordType === type && p.accessType === "read",
    );
  return {
    steps: "denied",
    workouts: has("ExerciseSession") ? "granted" : "denied",
  };
}
const adapter: HealthAdapter = {
  label: "Health Connect",
  async availability() {
    const hc = await healthConnect();
    const status = await hc.getSdkStatus();
    if (
      status ===
      hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
    )
      return "update-required";
    return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE &&
      (await hc.initialize())
      ? "available"
      : "unsupported";
  },
  async requestAccess() {
    const hc = await healthConnect();
    await hc.requestPermission([
      { accessType: "read", recordType: "ExerciseSession" },
    ]);
    return permissions();
  },
  async read(days) {
    const hc = await healthConnect();
    if (!(await hc.initialize())) throw new Error("Unavailable");
    const access = await permissions();
    const workouts: HealthWorkout[] = [];
    if (access.workouts === "granted") {
      const names: Record<number, string> = {
        [hc.ExerciseType.OTHER_WORKOUT]: "Outro treino",
        [hc.ExerciseType.BACK_EXTENSION]: "Extensão lombar",
        [hc.ExerciseType.BADMINTON]: "Badminton",
        [hc.ExerciseType.BARBELL_SHOULDER_PRESS]: "Desenvolvimento com barra",
        [hc.ExerciseType.BASEBALL]: "Beisebol",
        [hc.ExerciseType.BASKETBALL]: "Basquete",
        [hc.ExerciseType.BENCH_PRESS]: "Supino",
        [hc.ExerciseType.BENCH_SIT_UP]: "Abdominal no banco",
        [hc.ExerciseType.BIKING]: "Ciclismo",
        [hc.ExerciseType.BIKING_STATIONARY]: "Bicicleta ergométrica",
        [hc.ExerciseType.BOOT_CAMP]: "Treino em circuito",
        [hc.ExerciseType.BOXING]: "Boxe",
        [hc.ExerciseType.BURPEE]: "Burpee",
        [hc.ExerciseType.CALISTHENICS]: "Calistenia",
        [hc.ExerciseType.CRICKET]: "Críquete",
        [hc.ExerciseType.CRUNCH]: "Abdominal",
        [hc.ExerciseType.DANCING]: "Dança",
        [hc.ExerciseType.DEADLIFT]: "Levantamento terra",
        [hc.ExerciseType.DUMBBELL_CURL_LEFT_ARM]: "Rosca com halter no braço esquerdo",
        [hc.ExerciseType.DUMBBELL_CURL_RIGHT_ARM]: "Rosca com halter no braço direito",
        [hc.ExerciseType.DUMBBELL_FRONT_RAISE]: "Elevação frontal com halteres",
        [hc.ExerciseType.DUMBBELL_LATERAL_RAISE]: "Elevação lateral com halteres",
        [hc.ExerciseType.DUMBBELL_TRICEPS_EXTENSION_LEFT_ARM]: "Extensão de tríceps no braço esquerdo",
        [hc.ExerciseType.DUMBBELL_TRICEPS_EXTENSION_RIGHT_ARM]: "Extensão de tríceps no braço direito",
        [hc.ExerciseType.DUMBBELL_TRICEPS_EXTENSION_TWO_ARM]: "Extensão de tríceps com os dois braços",
        [hc.ExerciseType.ELLIPTICAL]: "Elíptico",
        [hc.ExerciseType.EXERCISE_CLASS]: "Treino",
        [hc.ExerciseType.FENCING]: "Esgrima",
        [hc.ExerciseType.FOOTBALL_AMERICAN]: "Futebol americano",
        [hc.ExerciseType.FOOTBALL_AUSTRALIAN]: "Futebol australiano",
        [hc.ExerciseType.FORWARD_TWIST]: "Rotação de tronco",
        [hc.ExerciseType.FRISBEE_DISC]: "Frisbee",
        [hc.ExerciseType.GOLF]: "Golfe",
        [hc.ExerciseType.GUIDED_BREATHING]: "Respiração guiada",
        [hc.ExerciseType.GYMNASTICS]: "Ginástica",
        [hc.ExerciseType.HANDBALL]: "Handebol",
        [hc.ExerciseType.HIGH_INTENSITY_INTERVAL_TRAINING]: "Treino intervalado",
        [hc.ExerciseType.HIKING]: "Trilha",
        [hc.ExerciseType.ICE_HOCKEY]: "Hóquei no gelo",
        [hc.ExerciseType.ICE_SKATING]: "Patinação no gelo",
        [hc.ExerciseType.JUMPING_JACK]: "Polichinelo",
        [hc.ExerciseType.JUMP_ROPE]: "Pular corda",
        [hc.ExerciseType.LAT_PULL_DOWN]: "Puxada alta",
        [hc.ExerciseType.LUNGE]: "Afundo",
        [hc.ExerciseType.MARTIAL_ARTS]: "Artes marciais",
        [hc.ExerciseType.PADDLING]: "Esportes com remo",
        [hc.ExerciseType.PARAGLIDING]: "Parapente",
        [hc.ExerciseType.PILATES]: "Pilates",
        [hc.ExerciseType.PLANK]: "Prancha",
        [hc.ExerciseType.RACQUETBALL]: "Raquetebol",
        [hc.ExerciseType.ROCK_CLIMBING]: "Escalada",
        [hc.ExerciseType.ROLLER_HOCKEY]: "Hóquei sobre patins",
        [hc.ExerciseType.ROWING]: "Remo",
        [hc.ExerciseType.ROWING_MACHINE]: "Remo ergométrico",
        [hc.ExerciseType.RUGBY]: "Rúgbi",
        [hc.ExerciseType.RUNNING]: "Corrida",
        [hc.ExerciseType.RUNNING_TREADMILL]: "Corrida em esteira",
        [hc.ExerciseType.SAILING]: "Vela",
        [hc.ExerciseType.SCUBA_DIVING]: "Mergulho",
        [hc.ExerciseType.SKATING]: "Patinação",
        [hc.ExerciseType.SKIING]: "Esqui",
        [hc.ExerciseType.SNOWBOARDING]: "Snowboard",
        [hc.ExerciseType.SNOWSHOEING]: "Caminhada na neve",
        [hc.ExerciseType.SOCCER]: "Futebol",
        [hc.ExerciseType.SOFTBALL]: "Softbol",
        [hc.ExerciseType.SQUASH]: "Squash",
        [hc.ExerciseType.SQUAT]: "Agachamento",
        [hc.ExerciseType.STAIR_CLIMBING]: "Subida de escadas",
        [hc.ExerciseType.STAIR_CLIMBING_MACHINE]: "Simulador de escadas",
        [hc.ExerciseType.STRENGTH_TRAINING]: "Musculação",
        [hc.ExerciseType.STRETCHING]: "Alongamento",
        [hc.ExerciseType.SURFING]: "Surfe",
        [hc.ExerciseType.SWIMMING_OPEN_WATER]: "Natação",
        [hc.ExerciseType.SWIMMING_POOL]: "Natação",
        [hc.ExerciseType.TABLE_TENNIS]: "Tênis de mesa",
        [hc.ExerciseType.TENNIS]: "Tênis",
        [hc.ExerciseType.UPPER_TWIST]: "Rotação de tronco superior",
        [hc.ExerciseType.VOLLEYBALL]: "Vôlei",
        [hc.ExerciseType.WALKING]: "Caminhada",
        [hc.ExerciseType.WATER_POLO]: "Polo aquático",
        [hc.ExerciseType.WEIGHTLIFTING]: "Musculação",
        [hc.ExerciseType.WHEELCHAIR]: "Cadeira de rodas",
        [hc.ExerciseType.YOGA]: "Yoga",
      };
      let pageToken: string | undefined;
      const tokens = new Set<string>();
      do {
        const page = await hc.readRecords("ExerciseSession", {
          timeRangeFilter: {
            operator: "between",
            startTime: days[0].start.toISOString(),
            endTime: days[days.length - 1].end.toISOString(),
          },
          pageSize: 500,
          pageToken,
        });
        for (const record of page.records) {
          if (
            Date.parse(record.startTime) < days[0].start.getTime() ||
            Date.parse(record.endTime) > days[days.length - 1].end.getTime()
          )
            continue;
          const normalized = normalizeWorkout("health-connect", {
            id: record.metadata?.id ?? "",
            origin: record.metadata?.dataOrigin || "Origem não informada",
            nativeType: String(record.exerciseType),
            kind: names[record.exerciseType] || "Outro treino",
            name: record.title,
            start: record.startTime,
            end: record.endTime,
          });
          if (normalized) workouts.push(normalized);
        }
        pageToken = page.pageToken || undefined;
        if (pageToken) {
          if (tokens.has(pageToken) || tokens.size >= 100)
            throw new Error("Incomplete pagination");
          tokens.add(pageToken);
        }
      } while (pageToken);
    }
    return {
      source: "health-connect",
      access,
      steps: [],
      workouts,
      syncedAt: new Date().toISOString(),
    };
  },
  async managePermissions() {
    const hc = await healthConnect();
    hc.openHealthConnectSettings();
  },
};
export default adapter;
