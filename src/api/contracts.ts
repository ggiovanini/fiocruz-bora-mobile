export type Membership = { id: string; organization_id: string; organization_name: string; role: string };
export type Profile = { id: string; display_name: string; email?: string | null; phone?: string | null };
export type CatalogItem = {
  code: string; name: string; discovery_group: string; requires_custom_name: boolean;
  energy_dimension: 'physical' | 'intellectual' | 'choice' | null;
  ev_per_minute: string | null; scoring_status: string; timezone: string; recording_window_days: number;
};
export type Consent = {
  configured: boolean; policy_version: string | null; policy_url: string | null;
  status: 'granted' | 'revoked' | null; document_slug?: string; document_version?: number;
};
export type EnergyDay = { date: string; physical_ev: number; intellectual_ev: number; total_ev: number; goal_ev: number; goal_met: boolean };
export type EnergySummary = {
  timezone: string; today: EnergyDay; days: EnergyDay[]; lifetime_earned_ev: number; streak_days: number;
  inactivity: { completed_days: number | null };
  scheduled_goal: { goal_ev: number; effective_from: string } | null;
  vitality: { points: number; daily_decay_percent: number; daily_decay_pv: number; level_status: string;
    level: { number: number; name: string; minimum_pv: number; next: { number: number; name: string; minimum_pv: number } | null;
      remaining_pv: number; progress_percent: number; maximum_reached: boolean } | null };
};
export type ManualPayload = {
  client_activity_id: string; activity_type: string; activity_date: string; timezone: string; duration_seconds: number;
  custom_name?: string; energy_dimension?: 'physical' | 'intellectual';
};
export type ServerActivity = {
  id: string; client_activity_id: string; membership_id: string; activity_type: string; activity_name: string;
  activity_date: string; duration_seconds: number; created_at: string; validation_status: string;
  scoring: { awarded_ev: number | null; energy_dimension: string | null };
};
export type JourneySnapshot = {
  profile: Profile | null; memberships: Membership[]; catalog: CatalogItem[]; energy: EnergySummary | null;
  consent: Consent | null; nextCursor: string | null;
};
export const emptyJourney: JourneySnapshot = { profile: null, memberships: [], catalog: [], energy: null, consent: null, nextCursor: null };
