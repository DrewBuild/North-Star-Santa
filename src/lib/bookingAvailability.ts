export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;
export const TRAVEL_BUFFER_MINUTES = 60;

export interface BookingWindowInput {
  event_time?: string | null;
  appointment_duration_minutes?: number | null;
  blocked_start_time?: string | null;
  blocked_end_time?: string | null;
  schedule_end_time?: string | null;
}

export interface BlockedWindow {
  start: number;
  end: number;
}

export const timeToMinutes = (time: string | null | undefined): number => {
  if (!time) return 0;
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

export const formatTime12Hour = (time: string | null | undefined): string => {
  if (!time) return "";
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const computeTravelBuffer = (
  eventTime: string,
  appointmentDurationMinutes = DEFAULT_APPOINTMENT_DURATION_MINUTES,
  scheduleEndTime: string,
) => {
  const appointmentStartMinutes = timeToMinutes(eventTime);
  const appointmentEndMinutes = appointmentStartMinutes + appointmentDurationMinutes;
  const scheduleEndMinutes = timeToMinutes(scheduleEndTime);
  const isEndOfDayBooking = appointmentEndMinutes === scheduleEndMinutes;
  const travelBufferMinutes = isEndOfDayBooking ? 0 : TRAVEL_BUFFER_MINUTES;

  return {
    appointment_end_time: minutesToTime(appointmentEndMinutes),
    travel_buffer_minutes: travelBufferMinutes,
    blocked_start_time: eventTime.slice(0, 5),
    blocked_end_time: minutesToTime(appointmentEndMinutes + travelBufferMinutes),
    schedule_end_time: scheduleEndTime.slice(0, 5),
    is_end_of_day_booking: isEndOfDayBooking,
  };
};

export const getBlockedWindow = (
  booking: BookingWindowInput,
  fallbackScheduleEndTime: string,
): BlockedWindow | null => {
  const startTime = booking.blocked_start_time || booking.event_time;
  if (!startTime) return null;

  const start = timeToMinutes(startTime);
  const end = booking.blocked_end_time
    ? timeToMinutes(booking.blocked_end_time)
    : timeToMinutes(
        computeTravelBuffer(
          startTime,
          booking.appointment_duration_minutes || DEFAULT_APPOINTMENT_DURATION_MINUTES,
          booking.schedule_end_time || fallbackScheduleEndTime,
        ).blocked_end_time,
      );

  return { start, end };
};

export const hasBlockedWindowOverlap = (
  start: number,
  end: number,
  blockedWindows: BlockedWindow[],
): boolean => blockedWindows.some((window) => start < window.end && end > window.start);

export const isValidAvailableStartTime = ({
  startTime,
  scheduleEndTime,
  blockedWindows,
  appointmentDurationMinutes = DEFAULT_APPOINTMENT_DURATION_MINUTES,
}: {
  startTime: string;
  scheduleEndTime: string;
  blockedWindows: BlockedWindow[];
  appointmentDurationMinutes?: number;
}): boolean => {
  const start = timeToMinutes(startTime);
  const scheduleEnd = timeToMinutes(scheduleEndTime);
  const appointmentEnd = start + appointmentDurationMinutes;

  if (appointmentEnd > scheduleEnd) return false;

  const { blocked_end_time } = computeTravelBuffer(startTime, appointmentDurationMinutes, scheduleEndTime);
  return !hasBlockedWindowOverlap(start, timeToMinutes(blocked_end_time), blockedWindows);
};
