import {
  normalizeWorkout,
  type Access,
  type HealthAdapter,
  type HealthSteps,
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
    steps: has("Steps") ? "granted" : "denied",
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
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "ExerciseSession" },
    ]);
    return permissions();
  },
  async read(days) {
    const hc = await healthConnect();
    if (!(await hc.initialize())) throw new Error("Unavailable");
    const access = await permissions();
    const steps: HealthSteps[] = [];
    const workouts: HealthWorkout[] = [];
    if (access.steps === "granted")
      for (const day of days) {
        const result = await hc.aggregateRecord({
          recordType: "Steps",
          timeRangeFilter: {
            operator: "between",
            startTime: day.start.toISOString(),
            endTime: day.end.toISOString(),
          },
        });
        steps.push({
          date: day.date,
          count:
            result.dataOrigins.length > 0 &&
            typeof result.COUNT_TOTAL === "number" &&
            Number.isFinite(result.COUNT_TOTAL)
              ? Math.max(0, Math.round(result.COUNT_TOTAL))
              : null,
          source: "health-connect",
        });
      }
    if (access.workouts === "granted") {
      const names: Record<number, string> = {
        [hc.ExerciseType.WALKING]: "Caminhada",
        [hc.ExerciseType.RUNNING]: "Corrida",
        [hc.ExerciseType.RUNNING_TREADMILL]: "Corrida em esteira",
        [hc.ExerciseType.BIKING]: "Ciclismo",
        [hc.ExerciseType.SWIMMING_POOL]: "Natação",
        [hc.ExerciseType.SWIMMING_OPEN_WATER]: "Natação",
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
            kind: names[record.exerciseType] || "Outro treino",
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
      steps,
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
