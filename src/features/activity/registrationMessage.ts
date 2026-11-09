import type { Activity } from '@/mocks/model';
/** Celebrate the effort without claiming points before server approval. */
export function registrationMessage(activity: Activity, live: boolean) {
  if (!live) return 'Registro salvo neste aparelho.';
  if (activity.status === 'pending') return 'Salvo. Aguardando envio.';
  if (activity.status === 'sending') return 'Enviando seu registro…';
  if (activity.status === 'failed') return activity.error ?? 'Não foi possível enviar. Seu registro está salvo.';
  return activity.validationStatus === 'approved' ? `Atividade registrada · ${activity.awardedEv ?? 0} EV` : 'Registrado. Aguardando validação.';
}
