import { Linking } from "react-native";
import {
  normalizeWorkout,
  type HealthAdapter,
  type HealthWorkout,
} from "./model";
// Import on user action so web/old native builds remain usable without the native module.
const healthKit = () => import("@kingstinct/react-native-healthkit");
const adapter: HealthAdapter = {
  label: "Apple Saúde",
  async availability() {
    const hk = await healthKit();
    return (await hk.isHealthDataAvailable()) ? "available" : "unsupported";
  },
  async requestAccess() {
    const hk = await healthKit();
    await hk.requestAuthorization({
      toRead: ["HKWorkoutTypeIdentifier"],
      toShare: [],
    });
    // HealthKit deliberately does not disclose read authorization status.
    return { steps: "denied", workouts: "unknown" };
  },
  async read(days) {
    const hk = await healthKit();
    const records = await hk.queryWorkoutSamples({
      limit: 0,
      ascending: false,
      filter: {
        date: {
          startDate: days[0].start,
          endDate: days[days.length - 1].end,
          strictStartDate: true,
          strictEndDate: true,
        },
      },
    });
    const names: Record<number, string> = {
      [hk.WorkoutActivityType.badminton]: "Badminton",
      [hk.WorkoutActivityType.baseball]: "Beisebol",
      [hk.WorkoutActivityType.basketball]: "Basquete",
      [hk.WorkoutActivityType.boxing]: "Boxe",
      [hk.WorkoutActivityType.cricket]: "Críquete",
      [hk.WorkoutActivityType.elliptical]: "Elíptico",
      [hk.WorkoutActivityType.fencing]: "Esgrima",
      [hk.WorkoutActivityType.golf]: "Golfe",
      [hk.WorkoutActivityType.gymnastics]: "Ginástica",
      [hk.WorkoutActivityType.handball]: "Handebol",
      [hk.WorkoutActivityType.hiking]: "Trilha",
      [hk.WorkoutActivityType.martialArts]: "Artes marciais",
      [hk.WorkoutActivityType.racquetball]: "Raquetebol",
      [hk.WorkoutActivityType.rowing]: "Remo",
      [hk.WorkoutActivityType.rugby]: "Rúgbi",
      [hk.WorkoutActivityType.sailing]: "Vela",
      [hk.WorkoutActivityType.soccer]: "Futebol",
      [hk.WorkoutActivityType.softball]: "Softbol",
      [hk.WorkoutActivityType.squash]: "Squash",
      [hk.WorkoutActivityType.tableTennis]: "Tênis de mesa",
      [hk.WorkoutActivityType.tennis]: "Tênis",
      [hk.WorkoutActivityType.volleyball]: "Vôlei",
      [hk.WorkoutActivityType.yoga]: "Yoga",
      [hk.WorkoutActivityType.pilates]: "Pilates",
      [hk.WorkoutActivityType.snowboarding]: "Snowboard",
      [hk.WorkoutActivityType.americanFootball]: "Futebol americano",
      [hk.WorkoutActivityType.archery]: "Tiro com arco",
      [hk.WorkoutActivityType.australianFootball]: "Futebol australiano",
      [hk.WorkoutActivityType.bowling]: "Boliche",
      [hk.WorkoutActivityType.climbing]: "Escalada",
      [hk.WorkoutActivityType.crossTraining]: "Treino cruzado",
      [hk.WorkoutActivityType.curling]: "Curling",
      [hk.WorkoutActivityType.cycling]: "Ciclismo",
      [hk.WorkoutActivityType.dance]: "Dança",
      [hk.WorkoutActivityType.danceInspiredTraining]: "Treino de dança",
      [hk.WorkoutActivityType.equestrianSports]: "Hipismo",
      [hk.WorkoutActivityType.fishing]: "Pesca",
      [hk.WorkoutActivityType.functionalStrengthTraining]: "Treino funcional",
      [hk.WorkoutActivityType.hockey]: "Hóquei",
      [hk.WorkoutActivityType.hunting]: "Caça",
      [hk.WorkoutActivityType.lacrosse]: "Lacrosse",
      [hk.WorkoutActivityType.mindAndBody]: "Corpo e mente",
      [hk.WorkoutActivityType.mixedMetabolicCardioTraining]: "Treino cardiovascular misto",
      [hk.WorkoutActivityType.paddleSports]: "Esportes com remo",
      [hk.WorkoutActivityType.play]: "Brincadeiras",
      [hk.WorkoutActivityType.preparationAndRecovery]: "Preparação e recuperação",
      [hk.WorkoutActivityType.running]: "Corrida",
      [hk.WorkoutActivityType.skatingSports]: "Patinação",
      [hk.WorkoutActivityType.snowSports]: "Esportes na neve",
      [hk.WorkoutActivityType.stairClimbing]: "Subida de escadas",
      [hk.WorkoutActivityType.surfingSports]: "Surfe",
      [hk.WorkoutActivityType.swimming]: "Natação",
      [hk.WorkoutActivityType.trackAndField]: "Atletismo",
      [hk.WorkoutActivityType.traditionalStrengthTraining]: "Musculação",
      [hk.WorkoutActivityType.walking]: "Caminhada",
      [hk.WorkoutActivityType.waterFitness]: "Hidroginástica",
      [hk.WorkoutActivityType.waterPolo]: "Polo aquático",
      [hk.WorkoutActivityType.waterSports]: "Esportes aquáticos",
      [hk.WorkoutActivityType.wrestling]: "Luta",
      [hk.WorkoutActivityType.barre]: "Barra",
      [hk.WorkoutActivityType.coreTraining]: "Treino de core",
      [hk.WorkoutActivityType.crossCountrySkiing]: "Esqui cross-country",
      [hk.WorkoutActivityType.downhillSkiing]: "Esqui alpino",
      [hk.WorkoutActivityType.flexibility]: "Flexibilidade",
      [hk.WorkoutActivityType.highIntensityIntervalTraining]: "Treino intervalado",
      [hk.WorkoutActivityType.jumpRope]: "Pular corda",
      [hk.WorkoutActivityType.kickboxing]: "Kickboxing",
      [hk.WorkoutActivityType.stairs]: "Escadas",
      [hk.WorkoutActivityType.stepTraining]: "Step",
      [hk.WorkoutActivityType.wheelchairWalkPace]: "Cadeira de rodas em ritmo de caminhada",
      [hk.WorkoutActivityType.wheelchairRunPace]: "Cadeira de rodas em ritmo de corrida",
      [hk.WorkoutActivityType.taiChi]: "Tai chi",
      [hk.WorkoutActivityType.mixedCardio]: "Cardio misto",
      [hk.WorkoutActivityType.handCycling]: "Ciclismo com as mãos",
      [hk.WorkoutActivityType.discSports]: "Esportes com disco",
      [hk.WorkoutActivityType.fitnessGaming]: "Jogos de exercício",
      [hk.WorkoutActivityType.cardioDance]: "Dança aeróbica",
      [hk.WorkoutActivityType.socialDance]: "Dança social",
      [hk.WorkoutActivityType.pickleball]: "Pickleball",
      [hk.WorkoutActivityType.cooldown]: "Desaceleração",
      [hk.WorkoutActivityType.swimBikeRun]: "Triatlo",
      [hk.WorkoutActivityType.transition]: "Transição",
      [hk.WorkoutActivityType.underwaterDiving]: "Mergulho",
      [hk.WorkoutActivityType.rest]: "Descanso",
      [hk.WorkoutActivityType.group]: "Treino em grupo",
      [hk.WorkoutActivityType.other]: "Outro treino",
    };
    const workouts: HealthWorkout[] = [];
    for (const record of records) {
      const quantity = record.duration;
      const durationMinutes =
        quantity.unit === "s"
          ? quantity.quantity / 60
          : quantity.unit === "min"
            ? quantity.quantity
            : undefined;
      const normalized = normalizeWorkout("healthkit", {
        id: record.uuid,
        origin: record.sourceRevision.source.name,
        nativeType: String(record.workoutActivityType),
        kind: names[record.workoutActivityType] || "Outro treino",
        name: typeof record.metadata?.HKWorkoutBrandName === 'string' ? record.metadata.HKWorkoutBrandName : undefined,
        start: record.startDate.toISOString(),
        end: record.endDate.toISOString(),
        durationMinutes,
      });
      if (normalized) workouts.push(normalized);
    }
    return {
      source: "healthkit",
      access: { steps: "denied", workouts: "unknown" },
      steps: [],
      workouts,
      syncedAt: new Date().toISOString(),
    };
  },
  async managePermissions() {
    await Linking.openURL("x-apple-health://");
  },
};
export default adapter;
