export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;
export const TRAVEL_BUFFER_MINUTES = 60;

export const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

export const formatTime12Hour = (time) => {
  if (!time) return "";
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const computeTravelBuffer = (
  eventTime,
  appointmentDurationMinutes = DEFAULT_APPOINTMENT_DURATION_MINUTES,
  scheduleEndTime,
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

export const getBlockedWindow = (booking, fallbackScheduleEndTime) => {
  const startTime = booking.blockedStartTime || booking.blocked_start_time || booking.eventTime || booking.event_time;
  if (!startTime) return null;

  const start = timeToMinutes(startTime);
  const end = booking.blockedEndTime || booking.blocked_end_time
    ? timeToMinutes(booking.blockedEndTime || booking.blocked_end_time)
    : timeToMinutes(
        computeTravelBuffer(
          startTime,
          booking.appointmentDurationMinutes ||
            booking.appointment_duration_minutes ||
            DEFAULT_APPOINTMENT_DURATION_MINUTES,
          booking.schedule_end_time || booking.scheduleEndTime || fallbackScheduleEndTime,
        ).blocked_end_time,
      );

  return { start, end };
};

export const hasBlockedWindowOverlap = (start, end, blockedWindows) =>
  blockedWindows.some((window) => start < window.end && end > window.start);
