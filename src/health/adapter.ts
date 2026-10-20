import type { HealthAdapter } from "./model";
const adapter: HealthAdapter = {
  label: "Dados de atividade",
  availability: async () => "unsupported",
  requestAccess: async () => ({ steps: "denied", workouts: "denied" }),
  read: async () => {
    throw new Error("Native build required");
  },
  managePermissions: async () => {},
};
export default adapter;
