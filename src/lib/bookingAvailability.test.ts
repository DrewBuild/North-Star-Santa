import { describe, expect, it } from "vitest";
import {
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  computeTravelBuffer,
  isValidAvailableStartTime,
  timeToMinutes,
} from "./bookingAvailability";

describe("booking availability travel buffer", () => {
  it("adds a 60-minute travel buffer during the day", () => {
    const result = computeTravelBuffer("14:00", DEFAULT_APPOINTMENT_DURATION_MINUTES, "17:00");

    expect(result.appointment_end_time).toBe("15:00");
    expect(result.travel_buffer_minutes).toBe(60);
    expect(result.blocked_start_time).toBe("14:00");
    expect(result.blocked_end_time).toBe("16:00");
    expect(result.is_end_of_day_booking).toBe(false);
  });

  it("does not require a buffer when the appointment ends at schedule end", () => {
    const result = computeTravelBuffer("16:00", DEFAULT_APPOINTMENT_DURATION_MINUTES, "17:00");

    expect(result.appointment_end_time).toBe("17:00");
    expect(result.travel_buffer_minutes).toBe(0);
    expect(result.blocked_end_time).toBe("17:00");
    expect(result.is_end_of_day_booking).toBe(true);
  });

  it("does not allow appointments that extend past schedule end", () => {
    expect(
      isValidAvailableStartTime({
        startTime: "16:30",
        scheduleEndTime: "17:00",
        appointmentDurationMinutes: DEFAULT_APPOINTMENT_DURATION_MINUTES,
        blockedWindows: [],
      }),
    ).toBe(false);
  });

  it("uses blocked end time when calculating future availability", () => {
    const blocked = computeTravelBuffer("14:00", DEFAULT_APPOINTMENT_DURATION_MINUTES, "17:00");
    const blockedWindows = [
      {
        start: timeToMinutes(blocked.blocked_start_time),
        end: timeToMinutes(blocked.blocked_end_time),
      },
    ];

    expect(
      isValidAvailableStartTime({
        startTime: "15:00",
        scheduleEndTime: "17:00",
        appointmentDurationMinutes: DEFAULT_APPOINTMENT_DURATION_MINUTES,
        blockedWindows,
      }),
    ).toBe(false);

    expect(
      isValidAvailableStartTime({
        startTime: "16:00",
        scheduleEndTime: "17:00",
        appointmentDurationMinutes: DEFAULT_APPOINTMENT_DURATION_MINUTES,
        blockedWindows,
      }),
    ).toBe(true);
  });

  it("allows the final open slot of the day", () => {
    expect(
      isValidAvailableStartTime({
        startTime: "16:00",
        scheduleEndTime: "17:00",
        appointmentDurationMinutes: DEFAULT_APPOINTMENT_DURATION_MINUTES,
        blockedWindows: [],
      }),
    ).toBe(true);
  });
});
