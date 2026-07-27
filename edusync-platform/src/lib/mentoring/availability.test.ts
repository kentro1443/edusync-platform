import { describe, expect, it } from "vitest";

import { calculateAvailabilitySlots } from "@/lib/mentoring/availability";

describe("calculateAvailabilitySlots", () => {
  const monday = new Date("2026-07-27T00:00:00.000Z");

  it("tạo slot theo giờ địa phương của cố vấn", () => {
    const slots = calculateAvailabilitySlots({
      from: monday,
      to: new Date("2026-07-28T00:00:00.000Z"),
      durationMinutes: 60,
      rules: [
        {
          weekday: 1,
          startsAtLocal: "09:00",
          endsAtLocal: "11:00",
          timezone: "Asia/Ho_Chi_Minh",
          capacity: 1,
          active: true,
        },
      ],
      exceptions: [],
      busyAppointments: [],
    });

    expect(slots).toEqual([
      {
        startsAt: new Date("2026-07-27T02:00:00.000Z"),
        endsAt: new Date("2026-07-27T03:00:00.000Z"),
        remainingCapacity: 1,
      },
      {
        startsAt: new Date("2026-07-27T03:00:00.000Z"),
        endsAt: new Date("2026-07-27T04:00:00.000Z"),
        remainingCapacity: 1,
      },
    ]);
  });

  it("loại slot bị exception và lịch bận chiếm hết capacity", () => {
    const slots = calculateAvailabilitySlots({
      from: monday,
      to: new Date("2026-07-28T00:00:00.000Z"),
      durationMinutes: 30,
      rules: [
        {
          weekday: 1,
          startsAtLocal: "09:00",
          endsAtLocal: "11:00",
          timezone: "Asia/Ho_Chi_Minh",
          capacity: 1,
          active: true,
        },
      ],
      exceptions: [
        {
          startsAt: new Date("2026-07-27T02:30:00.000Z"),
          endsAt: new Date("2026-07-27T03:00:00.000Z"),
          kind: "UNAVAILABLE",
        },
      ],
      busyAppointments: [
        {
          startsAt: new Date("2026-07-27T03:00:00.000Z"),
          endsAt: new Date("2026-07-27T03:30:00.000Z"),
        },
      ],
    });

    expect(slots.map(({ startsAt }) => startsAt.toISOString())).toEqual([
      "2026-07-27T02:00:00.000Z",
      "2026-07-27T03:30:00.000Z",
    ]);
  });

  it("bỏ rule tắt và khoảng thời gian không đủ một slot", () => {
    expect(
      calculateAvailabilitySlots({
        from: monday,
        to: new Date("2026-07-28T00:00:00.000Z"),
        durationMinutes: 60,
        rules: [
          {
            weekday: 1,
            startsAtLocal: "09:00",
            endsAtLocal: "09:30",
            timezone: "Asia/Ho_Chi_Minh",
            capacity: 1,
            active: true,
          },
          {
            weekday: 1,
            startsAtLocal: "10:00",
            endsAtLocal: "12:00",
            timezone: "Asia/Ho_Chi_Minh",
            capacity: 1,
            active: false,
          },
        ],
        exceptions: [],
        busyAppointments: [],
      }),
    ).toEqual([]);
  });
});
