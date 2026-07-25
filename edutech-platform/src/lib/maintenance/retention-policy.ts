const DAY_MS = 86_400_000;

function daysBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * DAY_MS);
}

export function buildRetentionCutoffs(now = new Date()) {
  return {
    now,
    staleSession: daysBefore(now, 30),
    staleToken: daysBefore(now, 7),
    staleRateLimit: daysBefore(now, 1),
    staleNotification: daysBefore(now, 180),
    staleDelivery: daysBefore(now, 30),
    staleFailedDelivery: daysBefore(now, 90),
    staleInvitation: daysBefore(now, 90),
  };
}
