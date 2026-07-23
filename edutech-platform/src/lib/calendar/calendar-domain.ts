export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

type Range = Readonly<{ startsAt: Date; endsAt: Date }>;

type RecurrenceInput = Readonly<{
  startsAt: Date;
  endsAt: Date;
  frequency: RecurrenceFrequency;
  interval: number;
  count?: number;
  until?: Date;
  exceptions?: readonly Readonly<{
    startsAt: string;
    cancelled?: boolean;
    movedTo?: string;
  }>[];
}>;

function addPeriod(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
  const next = new Date(date);
  if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + interval);
  if (frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + interval * 7);
  if (frequency === "MONTHLY") next.setUTCMonth(next.getUTCMonth() + interval);
  return next;
}

export function expandRecurringEvent(input: RecurrenceInput): Array<{
  startsAt: string;
  endsAt: string;
}> {
  const duration = input.endsAt.getTime() - input.startsAt.getTime();
  const limit = Math.min(Math.max(input.count ?? 52, 1), 366);
  const until = input.until?.getTime() ?? Number.POSITIVE_INFINITY;
  const exceptions = new Map(
    (input.exceptions ?? []).map((exception) => [exception.startsAt, exception]),
  );
  const instances: Array<{ startsAt: string; endsAt: string }> = [];
  let startsAt = new Date(input.startsAt);

  for (let index = 0; index < limit && startsAt.getTime() <= until; index += 1) {
    const startsAtIso = startsAt.toISOString();
    const exception = exceptions.get(startsAtIso);
    if (!exception?.cancelled) {
      const effectiveStart = exception?.movedTo ? new Date(exception.movedTo) : startsAt;
      instances.push({
        startsAt: effectiveStart.toISOString(),
        endsAt: new Date(effectiveStart.getTime() + duration).toISOString(),
      });
    }
    startsAt = addPeriod(startsAt, input.frequency, Math.max(input.interval, 1));
  }
  return instances;
}

export function hasTimeConflict(left: Range, right: Range): boolean {
  return left.startsAt < right.endsAt && right.startsAt < left.endsAt;
}

export function nextWaitlistPosition(positions: readonly number[]): number {
  return Math.max(0, ...positions) + 1;
}
