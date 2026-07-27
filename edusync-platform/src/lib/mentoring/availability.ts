export type AvailabilityRuleInput = Readonly<{
  weekday: number;
  startsAtLocal: string;
  endsAtLocal: string;
  timezone: string;
  capacity: number;
  active: boolean;
}>;

export type AvailabilityExceptionInput = Readonly<{
  startsAt: Date;
  endsAt: Date;
  kind: "AVAILABLE" | "UNAVAILABLE";
}>;

export type BusyAppointmentInput = Readonly<{
  startsAt: Date;
  endsAt: Date;
}>;

export type AvailabilitySlot = Readonly<{
  startsAt: Date;
  endsAt: Date;
  remainingCapacity: number;
}>;

type LocalDate = Readonly<{ year: number; month: number; day: number }>;

function parseTime(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error(`Giờ địa phương không hợp lệ: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

function localPartsAt(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function zonedLocalToUtc(
  date: LocalDate,
  minuteOfDay: number,
  timezone: string,
): Date {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const localAsUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  let candidate = localAsUtc;

  for (let pass = 0; pass < 3; pass += 1) {
    const actual = localPartsAt(new Date(candidate), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    const delta = localAsUtc - actualAsUtc;
    if (delta === 0) break;
    candidate += delta;
  }

  return new Date(candidate);
}

function overlapping(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function collectLocalDates(from: Date, to: Date, timezone: string): LocalDate[] {
  const dates = new Map<string, LocalDate>();
  const dayMs = 86_400_000;

  for (
    let cursor = from.getTime() - dayMs;
    cursor <= to.getTime() + dayMs;
    cursor += dayMs
  ) {
    const parts = localPartsAt(new Date(cursor), timezone);
    const key = `${parts.year}-${parts.month}-${parts.day}`;
    dates.set(key, {
      year: parts.year,
      month: parts.month,
      day: parts.day,
    });
  }

  return [...dates.values()];
}

export function calculateAvailabilitySlots({
  from,
  to,
  durationMinutes,
  rules,
  exceptions,
  busyAppointments,
}: Readonly<{
  from: Date;
  to: Date;
  durationMinutes: number;
  rules: readonly AvailabilityRuleInput[];
  exceptions: readonly AvailabilityExceptionInput[];
  busyAppointments: readonly BusyAppointmentInput[];
}>): AvailabilitySlot[] {
  if (to <= from || durationMinutes <= 0) return [];

  const slots = new Map<string, AvailabilitySlot>();

  for (const rule of rules) {
    if (!rule.active || rule.capacity <= 0) continue;
    const startMinute = parseTime(rule.startsAtLocal);
    const endMinute = parseTime(rule.endsAtLocal);

    for (const date of collectLocalDates(from, to, rule.timezone)) {
      const weekday = new Date(
        Date.UTC(date.year, date.month - 1, date.day),
      ).getUTCDay();
      if (weekday !== rule.weekday) continue;

      for (
        let minute = startMinute;
        minute + durationMinutes <= endMinute;
        minute += durationMinutes
      ) {
        const startsAt = zonedLocalToUtc(date, minute, rule.timezone);
        const endsAt = zonedLocalToUtc(
          date,
          minute + durationMinutes,
          rule.timezone,
        );
        if (startsAt < from || endsAt > to) continue;
        if (
          exceptions.some(
            (exception) =>
              exception.kind === "UNAVAILABLE" &&
              overlapping(
                startsAt,
                endsAt,
                exception.startsAt,
                exception.endsAt,
              ),
          )
        ) {
          continue;
        }

        const occupied = busyAppointments.filter((appointment) =>
          overlapping(
            startsAt,
            endsAt,
            appointment.startsAt,
            appointment.endsAt,
          ),
        ).length;
        const remainingCapacity = rule.capacity - occupied;
        if (remainingCapacity <= 0) continue;

        const key = `${startsAt.toISOString()}:${endsAt.toISOString()}`;
        const existing = slots.get(key);
        if (!existing || existing.remainingCapacity < remainingCapacity) {
          slots.set(key, { startsAt, endsAt, remainingCapacity });
        }
      }
    }
  }

  return [...slots.values()].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );
}
