import { Linking } from "react-native";
import {
  normalizeWorkout,
  type HealthAdapter,
  type HealthSteps,
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
      toRead: ["HKQuantityTypeIdentifierStepCount", "HKWorkoutTypeIdentifier"],
      toShare: [],
    });
    // HealthKit deliberately does not disclose read authorization status.
    return { steps: "unknown", workouts: "unknown" };
  },
  async read(days) {
    const hk = await healthKit();
    const steps: HealthSteps[] = [];
    for (const day of days) {
      const result = await hk.queryStatisticsForQuantity(
        "HKQuantityTypeIdentifierStepCount",
        ["cumulativeSum"],
        {
          unit: "count",
          filter: { date: { startDate: day.start, endDate: day.end } },
        },
      );
      const value = result.sumQuantity?.quantity;
      steps.push({
        date: day.date,
        count:
          typeof value === "number" && Number.isFinite(value)
            ? Math.max(0, Math.round(value))
            : null,
        source: "healthkit",
      });
    }
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
      [hk.WorkoutActivityType.walking]: "Caminhada",
      [hk.WorkoutActivityType.running]: "Corrida",
      [hk.WorkoutActivityType.cycling]: "Ciclismo",
      [hk.WorkoutActivityType.swimming]: "Natação",
      [hk.WorkoutActivityType.yoga]: "Yoga",
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
        kind: names[record.workoutActivityType] || "Outro treino",
        start: record.startDate.toISOString(),
        end: record.endDate.toISOString(),
        durationMinutes,
      });
      if (normalized) workouts.push(normalized);
    }
    return {
      source: "healthkit",
      access: { steps: "unknown", workouts: "unknown" },
      steps,
      workouts,
      syncedAt: new Date().toISOString(),
    };
  },
  async managePermissions() {
    await Linking.openURL("x-apple-health://");
  },
};
export default adapter;
