import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  type AvailabilityDay,
  type BlockoutDate,
  type BookedSlot,
  BLOCKED_DATE_MESSAGE,
  BLOCKED_TIME_MESSAGE,
  getActiveBlockoutDates,
  getBookedSlots,
  getDefaultAvailability,
  isDateBlocked,
  isTimeBlocked,
} from "@/lib/sanityQueries";
import { isSanityConfigured } from "@/lib/sanityClient";

const eventTypes = [
  "Home Visit",
  "Corporate Party",
  "School Event",
  "Hospital Event",
  "Community Event",
  "Breakfast with Santa",
  "Lunch with Santa",
  "Dinner with Santa",
  "Other",
];

const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;

interface FormState {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  streetAddress: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  eventType: string;
  numChildren: string;
  ageRange: string;
  notes: string;
  source: string;
}

const initial: FormState = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  streetAddress: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  eventType: "",
  numChildren: "",
  ageRange: "",
  notes: "",
  source: "",
};

// ─── Travel buffer helpers ─────────────────────────────────────────────────

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const computeBlockedWindows = (
  bookedSlots: BookedSlot[],
  selectedDate: string,
  scheduleEndTime: string,
): Array<{ start: number; end: number }> => {
  const scheduleEndMinutes = timeToMinutes(scheduleEndTime);
  return bookedSlots
    .filter((slot) => slot.event_date === selectedDate)
    .map((slot) => {
      const startMinutes = timeToMinutes(slot.event_time.slice(0, 5));
      const duration = slot.appointment_duration_minutes ?? 60;
      const appointmentEnd = startMinutes + duration;
      const buffer = appointmentEnd >= scheduleEndMinutes ? 0 : 60;
      return { start: startMinutes, end: appointmentEnd + buffer };
    });
};

const isSlotInBlockedWindow = (
  slotTime: string,
  blockedWindows: Array<{ start: number; end: number }>,
): boolean => {
  const slotMinutes = timeToMinutes(slotTime);
  return blockedWindows.some((w) => slotMinutes >= w.start && slotMinutes < w.end);
};

// ──────────────────────────────────────────────────────────────────────────

const Book = () => {
  const [form, setForm] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availability] = useState<AvailabilityDay[]>(getDefaultAvailability());
  const [blockoutDates, setBlockoutDates] = useState<BlockoutDate[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [dateBlockMessage, setDateBlockMessage] = useState<string | null>(null);
  const [timeBlockMessage, setTimeBlockMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadBookedSlots = async () => {
      try {
        setBookedSlots(await getBookedSlots());
      } catch {
        toast({
          title: "Could not load booked times",
          description: "Some already-booked times may not appear as unavailable.",
          variant: "destructive",
        });
      }
    };

    const loadBlockoutDates = async () => {
      try {
        const dates = await getActiveBlockoutDates();
        setBlockoutDates(dates);
      } catch {
        toast({
          title: "Could not load unavailable dates",
          description: "Please submit only if you know Santa is available.",
          variant: "destructive",
        });
      }
    };

    loadBookedSlots();
    loadBlockoutDates();
  }, [toast]);

  useEffect(() => {
    if (!form.date) return;
    setDateBlockMessage(isDateBlocked(form.date, blockoutDates) ? BLOCKED_DATE_MESSAGE : null);
  }, [form.date, blockoutDates]);

  useEffect(() => {
    if (!form.date || !form.time || !isTimeBlocked(form.date, form.time, blockoutDates)) return;
    setForm((current) => ({ ...current, time: "" }));
    setTimeBlockMessage(BLOCKED_TIME_MESSAGE);
  }, [blockoutDates, form.date, form.time]);

  const update = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectedDay = useMemo(() => {
    if (!form.date) return null;
    return availability.find((day) => day.day_of_week === getDayOfWeek(form.date)) ?? null;
  }, [availability, form.date]);

  const selectedDate = form.date ? new Date(`${form.date}T00:00:00`) : undefined;

  const blockedEntry = form.date ? blockoutDates.find((b) => isDateBlocked(form.date, [b])) : null;
  const isUnavailableDay = Boolean(form.date && selectedDay && !selectedDay.is_available);
  const isBlockedDate = Boolean(form.date && isDateBlocked(form.date, blockoutDates));
  const isBlockedTime = Boolean(form.date && form.time && isTimeBlocked(form.date, form.time, blockoutDates));
  const isOutsideHours = Boolean(
    form.time &&
      selectedDay?.is_available &&
      (form.time < selectedDay.start_time.slice(0, 5) || form.time > selectedDay.end_time.slice(0, 5)),
  );

  // Travel buffer: check if selected slot falls in an existing booking's blocked window
  const blockedWindows = useMemo(() => {
    if (!form.date || !selectedDay?.is_available) return [];
    return computeBlockedWindows(bookedSlots, form.date, selectedDay.end_time);
  }, [bookedSlots, form.date, selectedDay]);

  const isBookedSlot = Boolean(
    form.date &&
      form.time &&
      isSlotInBlockedWindow(form.time, blockedWindows),
  );

  // Validate the selected time + default visit duration fits within schedule.
  const selectedDurationMinutes = DEFAULT_APPOINTMENT_DURATION_MINUTES;
  const appointmentEndMinutes = form.time ? timeToMinutes(form.time) + selectedDurationMinutes : 0;
  const scheduleEndMinutes = selectedDay ? timeToMinutes(selectedDay.end_time) : 0;
  const isAppointmentPastScheduleEnd = Boolean(
    form.time && selectedDay?.is_available && appointmentEndMinutes > scheduleEndMinutes,
  );

  const cannotBookSelectedTime =
    isUnavailableDay ||
    isBlockedDate ||
    isBlockedTime ||
    isOutsideHours ||
    isBookedSlot ||
    isAppointmentPastScheduleEnd;

  const timeSlots = useMemo(() => {
    if (!selectedDay?.is_available || isBlockedDate) return [];
    return buildTimeSlots(selectedDay.start_time, selectedDay.end_time);
  }, [isBlockedDate, selectedDay]);

  const location = [
    form.streetAddress,
    form.apartment,
    `${form.city}, ${form.state} ${form.zipCode}`.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      toast({
        title: "Choose a date and time",
        description: "Select an open date on the calendar and one of Santa's available start times.",
        variant: "destructive",
      });
      return;
    }

    if (cannotBookSelectedTime) {
      toast({
        title: isBlockedDate
          ? "Santa is unavailable on this date"
          : isAppointmentPastScheduleEnd
            ? "Appointment extends past Santa's schedule"
            : "That time is not available",
        description: isBlockedDate
          ? BLOCKED_DATE_MESSAGE
          : isBlockedTime
            ? BLOCKED_TIME_MESSAGE
            : isAppointmentPastScheduleEnd
              ? "Please choose an earlier start time so the appointment fits within Santa's available hours."
              : "Please choose a date and time inside Santa's available booking window.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const scheduleEndTime = selectedDay?.end_time ?? "";
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          companyName: form.companyName,
          email: form.email,
          phone: form.phone,
          eventType: form.eventType,
          eventDate: form.date,
          eventTime: form.time,
          eventLocation: location,
          appointmentDuration: selectedDurationMinutes,
          scheduleEndTime,
          numberOfGuests: form.numChildren ? Number(form.numChildren) : undefined,
          message: [
            form.notes,
            form.ageRange ? `Age range: ${form.ageRange}` : "",
            form.source ? `Referral source: ${form.source}` : "",
          ].filter(Boolean).join("\n\n"),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not send booking request.");
      }

      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isTakenSlot =
        message.toLowerCase().includes("time slot") ||
        message.toLowerCase().includes("duplicate") ||
        message.includes("23505");

      toast({
        title: isTakenSlot ? "That time slot is already taken" : "Could not send booking request",
        description: isTakenSlot
          ? "Please choose a different available start time on the calendar."
          : error instanceof Error
            ? error.message
            : "Check the Sanity connection.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <section className="container py-24 md:py-32">
        <div className="max-w-xl mx-auto bg-card border border-border rounded-lg shadow-elegant p-10 text-center">
          <CheckCircle2 className="h-16 w-16 text-secondary mx-auto mb-4" />
          <h1 className="font-display text-3xl md:text-4xl text-secondary mb-3">Ho ho ho!</h1>
          <p className="text-lg text-foreground/85">
            Your request has been received. Santa's team will be in touch within 24 hours!
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20 text-center">
        <div className="container">
          <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Book Santa</p>
          <h1 className="font-display text-4xl md:text-6xl text-gold">
            Request a Visit from North Star Santa
          </h1>
          <p className="mt-4 text-secondary-foreground/85 max-w-xl mx-auto">
            Fill out the form below and Santa's team will be in touch within 24 hours
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <form
          onSubmit={onSubmit}
          className="max-w-3xl mx-auto bg-card border border-border rounded-lg shadow-elegant p-6 md:p-10 space-y-6"
        >
          {/* Name */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={update("firstName")} required />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" value={form.lastName} onChange={update("lastName")} required />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="companyName">Company Name (optional)</Label>
            <Input id="companyName" value={form.companyName} onChange={update("companyName")} placeholder="Organization or company" />
          </div>

          {/* Contact */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={update("phone")} required />
            </div>
          </div>

          {/* Calendar */}
          <BookingCalendar
            availability={availability}
            blockoutDates={blockoutDates}
            selectedDate={selectedDate}
            selectedDay={selectedDay}
            timeSlots={timeSlots}
            bookedSlots={bookedSlots}
            blockedWindows={blockedWindows}
            selectedTime={form.time}
            selectedDuration={selectedDurationMinutes}
            scheduleEndTime={selectedDay?.end_time ?? ""}
            dateBlockMessage={dateBlockMessage}
            timeBlockMessage={timeBlockMessage}
            onDateSelect={(date) => {
              const dateStr = date ? toDateInputValue(date) : "";
              if (dateStr && isDateBlocked(dateStr, blockoutDates)) {
                setDateBlockMessage(BLOCKED_DATE_MESSAGE);
                return;
              }
              setDateBlockMessage(null);
              setTimeBlockMessage(null);
              setForm((current) => ({ ...current, date: dateStr, time: "" }));
            }}
            onTimeSelect={(time) => {
              if (form.date && isTimeBlocked(form.date, time, blockoutDates)) {
                setTimeBlockMessage(BLOCKED_TIME_MESSAGE);
                return;
              }
              setTimeBlockMessage(null);
              setForm((current) => ({ ...current, time }));
            }}
            status={{
              blockedReason: blockedEntry?.reason ?? null,
              isBlockedDate,
              isBlockedTime,
              isOutsideHours,
              isUnavailableDay,
              isBookedSlot,
              isAppointmentPastScheduleEnd,
            }}
          />

          {/* Address */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Label htmlFor="streetAddress">Street Address *</Label>
              <Input id="streetAddress" value={form.streetAddress} onChange={update("streetAddress")} required />
            </div>
            <div>
              <Label htmlFor="apartment">Apartment / Suite (optional)</Label>
              <Input id="apartment" value={form.apartment} onChange={update("apartment")} />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={update("city")} required />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input id="state" value={form.state} onChange={update("state")} maxLength={2} placeholder="NC" required />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input id="zipCode" inputMode="numeric" value={form.zipCode} onChange={update("zipCode")} required />
            </div>
          </div>

          {/* Event Type — after address */}
          <div>
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
              <SelectTrigger id="eventType">
                <SelectValue placeholder="Select an event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Children / Age */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="numChildren">Number of Children (optional)</Label>
              <Input
                id="numChildren"
                type="number"
                min={0}
                value={form.numChildren}
                onChange={update("numChildren")}
              />
            </div>
            <div>
              <Label htmlFor="ageRange">Age Range of Children (optional)</Label>
              <Input
                id="ageRange"
                placeholder="e.g., 2, 4, and 7 years old"
                value={form.ageRange}
                onChange={update("ageRange")}
              />
            </div>
          </div>

          {/* Notes & Source */}
          <div>
            <Label htmlFor="notes">Additional Notes or Special Requests (optional)</Label>
            <Textarea id="notes" rows={4} value={form.notes} onChange={update("notes")} />
          </div>
          <div>
            <Label htmlFor="source">How did you hear about us? (optional)</Label>
            <Input id="source" value={form.source} onChange={update("source")} />
          </div>

          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={
              saving ||
              !isSanityConfigured ||
              !form.date ||
              !form.time ||
              cannotBookSelectedTime
            }
          >
            {isSanityConfigured
              ? saving
                ? "Sending..."
                : "Send My Request to Santa"
              : "Booking Requests Opening Soon"}
          </Button>
        </form>
      </section>
    </>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTime = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayOfWeek = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const adjustedMonth = month < 3 ? month + 12 : month;
  const adjustedYear = month < 3 ? year - 1 : year;
  const zeroBasedDay =
    (day +
      Math.floor((13 * (adjustedMonth + 1)) / 5) +
      adjustedYear +
      Math.floor(adjustedYear / 4) -
      Math.floor(adjustedYear / 100) +
      Math.floor(adjustedYear / 400)) %
    7;
  return (zeroBasedDay + 6) % 7;
};

const buildTimeSlots = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const slots: string[] = [];

  for (let current = start; current < end; current += 30) {
    const hour = String(Math.floor(current / 60)).padStart(2, "0");
    const minute = String(current % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }

  return slots;
};

// ─── BookingCalendar ───────────────────────────────────────────────────────

const BookingCalendar = ({
  availability,
  blockoutDates,
  selectedDate,
  selectedDay,
  timeSlots,
  bookedSlots,
  blockedWindows,
  selectedTime,
  selectedDuration,
  scheduleEndTime,
  dateBlockMessage,
  timeBlockMessage,
  onDateSelect,
  onTimeSelect,
  status,
}: {
  availability: AvailabilityDay[];
  blockoutDates: BlockoutDate[];
  selectedDate: Date | undefined;
  selectedDay: AvailabilityDay | null;
  timeSlots: string[];
  bookedSlots: BookedSlot[];
  blockedWindows: Array<{ start: number; end: number }>;
  selectedTime: string;
  selectedDuration: number;
  scheduleEndTime: string;
  dateBlockMessage: string | null;
  timeBlockMessage: string | null;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  status: {
    blockedReason: string | null;
    isBlockedDate: boolean;
    isBlockedTime: boolean;
    isOutsideHours: boolean;
    isUnavailableDay: boolean;
    isBookedSlot: boolean;
    isAppointmentPastScheduleEnd: boolean;
  };
}) => {
  const openDays = availability.filter((day) => day.is_available);
  const unavailableDayIndexes = availability.filter((day) => !day.is_available).map((day) => day.day_of_week);
  const isSanityDateBlocked = (date: Date) => isDateBlocked(toDateInputValue(date), blockoutDates);
  const [blockedTapMessage, setBlockedTapMessage] = useState<string | null>(null);

  const allSlotsBooked = (date: Date) => {
    const dateValue = toDateInputValue(date);
    const day = availability.find((item) => item.day_of_week === getDayOfWeek(dateValue));
    if (!day?.is_available) return false;
    const slots = buildTimeSlots(day.start_time, day.end_time);
    const windows = computeBlockedWindows(bookedSlots, dateValue, day.end_time);
    const blockedByBlockout = (t: string) => isTimeBlocked(dateValue, t, blockoutDates);
    return slots.length > 0 && slots.every((slot) => isSlotInBlockedWindow(slot, windows) || blockedByBlockout(slot));
  };

  const disabledDate = (date: Date) => {
    const dateValue = toDateInputValue(date);
    const day = availability.find((item) => item.day_of_week === getDayOfWeek(dateValue));
    return Boolean(
      isDateBlocked(dateValue, blockoutDates) || (day && !day.is_available) || allSlotsBooked(date),
    );
  };

  const scheduleEndMinutes = scheduleEndTime ? timeToMinutes(scheduleEndTime) : Infinity;

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 md:p-5">
      <div className="mb-4">
        <p className="text-gold uppercase tracking-[0.22em] text-xs font-bold mb-2">Choose a Visit Time</p>
        <h2 className="font-display text-2xl text-secondary">Santa's Booking Calendar</h2>
        <p className="mt-2 text-sm text-foreground/75">
          Pick an available date first, then choose one of the available Eastern Standard Time start times. Light red dates are unavailable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="rounded-lg bg-background border border-border p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={disabledDate}
            defaultMonth={selectedDate}
            onDayClick={(day, activeModifiers) => {
              if (activeModifiers.disabled) {
                setBlockedTapMessage(BLOCKED_DATE_MESSAGE);
              } else {
                setBlockedTapMessage(null);
              }
            }}
            modifiers={{
              available: (date) => !disabledDate(date),
              blocked: isSanityDateBlocked,
              unavailableWeekday: (date) => unavailableDayIndexes.includes(date.getDay()),
              fullyBooked: allSlotsBooked,
            }}
            modifiersClassNames={{
              available: "hover:bg-accent hover:text-accent-foreground",
              blocked: "!opacity-100 bg-primary/10 text-primary line-through cursor-not-allowed hover:!bg-primary/15",
              unavailableWeekday: "bg-primary/10 text-primary/80",
              fullyBooked: "bg-primary/10 text-primary line-through",
            }}
            classNames={{
              months: "flex flex-col",
              month: "space-y-4 w-full",
              table: "w-full border-collapse",
              head_row: "grid grid-cols-7",
              head_cell: "text-muted-foreground rounded-md text-center font-normal text-[0.8rem]",
              row: "grid grid-cols-7 mt-2",
              cell: "aspect-square text-center text-sm p-0 relative",
              day: "h-full w-full rounded-md p-0 font-semibold hover:bg-accent hover:text-accent-foreground",
              day_disabled: "opacity-50 cursor-not-allowed",
            }}
          />
          <div className="grid grid-cols-3 gap-2 px-2 pb-2 text-xs">
            <span className="rounded-md border border-border bg-background px-2 py-1 text-center text-foreground">Available</span>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-center text-primary line-through">Unavailable</span>
            <span className="rounded-md bg-primary px-2 py-1 text-center text-primary-foreground">Selected</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-background border border-border p-4">
            <p className="font-semibold text-secondary">Weekly booking hours, Eastern Standard Time</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {openDays.length > 0 ? (
                openDays.map((day) => (
                  <div key={day.day_of_week} className="flex min-w-[210px] items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                    <span className="font-semibold">{dayNames[day.day_of_week]}</span>
                    <span className="whitespace-nowrap text-muted-foreground">{formatTime(day.start_time)} - {formatTime(day.end_time)}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No booking hours have been published yet.</span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-background border border-border p-4">
            <p className="font-semibold text-secondary">Available start times</p>
            {selectedDate && timeSlots.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {timeSlots.map((time) => {
                  const dateValue = selectedDate ? toDateInputValue(selectedDate) : "";
                  const blockedByBlockout = isTimeBlocked(dateValue, time, blockoutDates);
                  const blockedByBuffer = isSlotInBlockedWindow(time, blockedWindows);
                  const slotMinutes = timeToMinutes(time);
                  const pastScheduleEnd = slotMinutes + selectedDuration > scheduleEndMinutes;
                  const unavailable = blockedByBlockout || blockedByBuffer || pastScheduleEnd;

                  return (
                    <button
                      type="button"
                      key={time}
                      onClick={() => onTimeSelect(time)}
                      disabled={unavailable}
                      aria-label={unavailable ? `${formatTime(time)} unavailable` : undefined}
                      className={cn(
                        "rounded-md border border-border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:line-through",
                        selectedTime === time
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-secondary/10 hover:text-secondary",
                      )}
                    >
                      {formatTime(time)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedDate ? "No start times are available for that date." : "Select an open date on the calendar to see times."}
              </p>
            )}
            {blockedWindows.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">Crossed-out times include travel buffer windows from existing bookings.</p>
            )}
          </div>
        </div>
      </div>

      {blockedTapMessage && (
        <p className="mt-4 rounded-md bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-semibold text-primary">
          {blockedTapMessage}
        </p>
      )}
      {dateBlockMessage && !blockedTapMessage && (
        <p className="mt-4 rounded-md bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-semibold text-primary">
          {dateBlockMessage}
        </p>
      )}
      {timeBlockMessage && (
        <p className="mt-4 rounded-md bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-semibold text-primary">
          {timeBlockMessage}
        </p>
      )}
      {selectedDate && selectedDay?.is_available && selectedTime && !status.isOutsideHours && !status.blockedReason && !status.isBlockedDate && !status.isBlockedTime && !status.isBookedSlot && !status.isAppointmentPastScheduleEnd && (
        <p className="mt-4 rounded-md bg-secondary/10 px-4 py-3 text-sm font-semibold text-secondary">
          Selected: {selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedTime)} EST
        </p>
      )}
      {(status.isUnavailableDay || status.isBlockedDate || status.blockedReason || status.isBlockedTime || status.isOutsideHours || status.isBookedSlot || status.isAppointmentPastScheduleEnd) && (
        <p className="mt-4 rounded-md bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          {(status.isBlockedDate || status.blockedReason)
            ? BLOCKED_DATE_MESSAGE
            : status.isBlockedTime
              ? BLOCKED_TIME_MESSAGE
              : status.isBookedSlot
                ? "That time slot is already booked or within a travel buffer window."
                : status.isAppointmentPastScheduleEnd
                  ? "That start time would end past Santa's schedule. Choose an earlier time."
                  : status.isOutsideHours
                    ? "That time is outside Santa's available hours."
                    : "Santa is not available on that day of the week."}
        </p>
      )}
    </div>
  );
};

export default Book;
