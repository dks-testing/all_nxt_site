"use client";

import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import type { BookingAppearance, BookingField } from "@platform/db";
import { isDisabledBookingDate } from "@platform/db/booking";
import { BookingVehicleDropdowns } from "./BookingVehicleDropdowns";

const STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
type Variant = "default" | "landing" | "appointment" | "micks";
type Props = { siteSlug: string; slots: string[]; closedDays: number[]; disabledDates?: string[]; leadDays: number; confirmation: string; fields: BookingField[]; variant?: Variant; appearance?: BookingAppearance | null; heading?: string; subheading?: string; initialSlotCount?: number; plateState?: string };

function Icon({ name }: { name: "user" | "phone" | "mail" | "message" | "car" | "plate" | "pin" | "calendar" | "clock" | "shield" | "lock" | "issue" | "wait" | "dropoff" | "soonest" }) {
  if (name === "user") return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="9" r="5.2" /><path d="M6.2 27c1.6-6.1 4.9-9.2 9.8-9.2s8.2 3.1 9.8 9.2" /></svg>;
  if (name === "car") return <svg viewBox="0 0 31 28" aria-hidden="true" fill="currentColor"><path d="M7.606 0.105C6.046.648 5.84.986 4.108 5.884L2.804 9.555l-.36.112C1.432 9.995.557 10.941.197 12.112.034 12.645.026 12.936.009 17.572L0 22.47l1.252-.01 1.261-.018-.018 1.732c-.008 2.023.078 2.435.618 3.053 1.14 1.283 3.147.899 3.824-.73.112-.272.155-.721.18-2.201l.035-1.845H23.84l.034 1.845c.026 1.798.034 1.873.257 2.332.883 1.845 3.319 1.826 4.16-.038l.24-.533-.018-1.808-.025-1.807 1.26.018L31 22.47l-.017-4.889c-.026-5.338-.035-5.423-.532-6.294-.463-.786-1.157-1.376-1.92-1.62l-.344-.112-1.303-3.68C25.237 1.22 25.074.929 23.797.274L23.299.021 15.624.002C9.587-.007 7.872.012 7.606.105Zm15.367 2.641c.335.272.541.703 1.141 2.473.292.852.738 2.107.995 2.791.257.693.463 1.292.463 1.339 0 .047-3.962.084-10.076.084-5.54 0-10.076-.037-10.076-.075 0-.047.154-.496.343-1.011.197-.506.643-1.77.994-2.8.875-2.52.978-2.707 1.493-2.941.137-.056 2.744-.085 7.349-.075 7.083.019 7.134.019 7.374.215ZM6.336 14.178c1.807.922 1.274 3.946-.696 3.97-1 .009-1.932-.986-1.932-2.062 0-.695.548-1.609 1.148-1.908.392-.202 1.088-.194 1.48 0Zm19.995-.048c.611.305 1.169 1.236 1.169 1.944 0 1.334-1.358 2.43-2.496 2.002-1.69-.627-1.773-3.196-.129-3.979.355-.164 1.094-.148 1.456.033Z" /></svg>;
  if (name === "plate") return <svg viewBox="3 3 25 25" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8.5" width="24" height="16" rx="1.4" /><path d="M7 12h4M21 12h4M8 20h16M9 16h.2M13 16h.2M17 16h.2M21 16h.2" /></svg>;
  if (name === "issue") return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.2 24.2A10.5 10.5 0 1 1 11 27.1L5.5 28.6l1.7-4.4Z" /></svg>;
  if (name === "soonest") return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M36 14h8M40 14v7" /><circle cx="38" cy="37" r="16" /><path d="M38 27v12l-7 4M8 30h17M3 38h18M11 46h13m39-25 5-5" /></svg>;
  if (name === "shield") return <svg viewBox="0 -2 30 42" aria-hidden="true" fill="currentColor"><path d="M15 0C15 0 19.5711 3.7113 22.5 4.80762C25.4289 5.90389 30 5.61426 30 5.61426V18.3545L29.9951 18.8301C29.7994 28.7848 23.4657 35.7641 15 39.2812C6.53427 35.7641.200604 28.7848.00488281 18.8301L0 18.3545V5.61426C0 5.61426 4.28975 5.88596 7.2207 4.90625L7.5 4.80762C10.4289 3.7113 15 0 15 0ZM15 2.52832C14.5743 2.84948 14.0642 3.23017 13.502 3.62695C11.991 4.69321 9.93065 6.03331 8.20117 6.68066C6.43216 7.34281 4.29889 7.55307 2.7373 7.62012C2.48035 7.63115 2.23348 7.63711 2 7.6416V18.3545C2.00013 27.2672 7.35829 33.6679 15 37.1016C22.6417 33.6679 27.9999 27.2672 28 18.3545V7.6416C27.7665 7.63711 27.5197 7.63115 27.2627 7.62012C25.7011 7.55307 23.5678 7.34281 21.7988 6.68066C20.0694 6.03331 18.009 4.69321 16.498 3.62695C15.9358 3.23017 15.4257 2.84948 15 2.52832ZM19.8369 14.8311C20.1433 14.3716 20.7642 14.2473 21.2236 14.5537C21.6829 14.8601 21.8072 15.481 21.501 15.9404L15.832 24.4404C15.6529 24.7089 15.3548 24.8743 15.0322 24.8848C14.7098 24.8952 14.4022 24.7493 14.2061 24.4932L7.70605 15.9932C7.37066 15.5546 7.45416 14.9273 7.89258 14.5918C8.33123 14.2564 8.95843 14.3398 9.29395 14.7783L14.9434 22.167L19.8369 14.8311Z" /></svg>;
  if (name === "dropoff") return <svg viewBox="0 0 88 125" aria-hidden="true" fill="currentColor"><path d="M17.0586 19.5V17.5C17.0586 13.3578 20.4168 10.0002 24.5586 10H52.5459C55.8044 4.07282 61.9104 0 69 0C79.63 0 88 9.09493 88 20C88 30.9051 79.63 40 69 40C60.7659 40 53.8724 34.5219 51.1992 27H24.5586C20.4168 26.9998 17.0586 23.6422 17.0586 19.5ZM22.0586 19.5C22.0586 20.8805 23.1778 21.9999 24.5586 22H53.0518C54.1988 22 55.1982 22.7808 55.4766 23.8936C57.1003 30.3836 62.6192 35 69 35C76.5954 35 83 28.4249 83 20C83 11.5751 76.5954 5 69 5C63.5014 5 58.6572 8.41655 56.3701 13.5225C55.9672 14.4214 55.074 15 54.0889 15H24.5586C23.1778 15.0001 22.0586 16.1195 22.0586 17.5V19.5Z" /><path d="M52.9519 65C55.2333 65.0002 57.2778 66.4092 58.0906 68.541L62.9439 82C64.3161 85.6 60.998 87 57.1452 87H15.8542C12.0015 87 8.68362 85.6 10.0558 82L14.9089 68.541C15.7217 66.4092 17.7662 65.0002 20.0476 65H52.9519ZM20.0476 70C19.8404 70.0002 19.6546 70.1286 19.5808 70.3223L15.3874 81.3223C15.2628 81.6495 15.504 82 15.8542 82H57.1452C57.4954 82 57.7367 81.6495 57.612 81.3223L53.4187 70.3223C53.3448 70.1286 53.1591 70.0002 52.9519 70H20.0476Z" /><path d="M70.5 82C71.8807 82 73 83.1193 73 84.5V108.5C73 109.881 71.8807 111 70.5 111H2.5C1.11932 111 0 109.881 0 108.5V84.5C0 83.837 0.263582 83.2013.732422 82.7324C1.20126 82.2636 1.83696 82 2.5 82H70.5ZM5 106H68V87H5V106Z" /><path d="M19.5 97.5A5 5 0 1 1 9.5 97.5a5 5 0 0 1 10 0Zm54.5-77.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-9.5 77.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM33.5 26.5h5v39h-5v-39Z" /><path d="M15 111.5C15 111.224 14.7761 111 14.5 111H11.5C11.2239 111 11 111.224 11 111.5V118C11 119.105 11.8954 120 13 120C14.1046 120 15 119.105 15 118V111.5ZM20 118C20 121.866 16.866 125 13 125C9.13401 125 6 121.866 6 118V111.5C6 108.462 8.46243 106 11.5 106H14.5C17.5376 106 20 108.462 20 111.5V118Zm42-6.5c0-.276-.224-.5-.5-.5h-3c-.276 0-.5.224-.5.5v6.5a2 2 0 1 0 4 0v-6.5Zm5 6.5a7 7 0 1 1-14 0v-6.5a5.5 5.5 0 0 1 5.5-5.5h3a5.5 5.5 0 0 1 5.5 5.5v6.5Z" /></svg>;
  if (name === "wait") return <svg viewBox="0 0 94 67" aria-hidden="true" fill="currentColor"><path d="M3.889 28.786a2 2 0 0 1 3.323 2.226c-1.057 1.579-1.654 2.303-2.165 3.294-.443.861-.793 1.909-1.009 3.818-.092.815-.018 2.788.198 5.519.42 5.297 1.17 12.263 2.297 20.488a2 2 0 1 1-3.928.733C1.755 58.65-.234 40.3.063 37.674c.257-2.267.713-3.81 1.429-5.2.649-1.26 1.566-2.447 2.397-3.688Zm85.823 0a2 2 0 0 0-3.323 2.226c1.057 1.579 1.654 2.303 2.165 3.294.443.861.793 1.909 1.009 3.818.092.815.018 2.788-.198 5.519-.42 5.297-1.17 12.263-2.297 20.488a2 2 0 1 0 3.928.733c.85-6.214 2.839-24.564 2.542-27.19-.257-2.267-.713-3.81-1.429-5.2-.649-1.26-1.566-2.447-2.397-3.688Z" /><path d="M14.255 7.5a3.5 3.5 0 1 0-3.5 3.5v4a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5v-4a3.5 3.5 0 0 0 3.5-3.5Zm71.796 0a3.5 3.5 0 1 0-3.5 3.5v4a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5v-4a3.5 3.5 0 0 0 3.5-3.5ZM51.55 27.4a5 5 0 1 0-5 5v4a9 9 0 1 1 9-9 9 9 0 0 1-9 9v-4a5 5 0 0 0 5-5Z" /><path d="M29.55 60.899v-8.821c-5.34-1.138-10.148-4.119-13.708-8.944-3.927-5.321-6.256-12.765-6.291-22.227a2 2 0 1 1 4-.016c.032 8.832 2.203 15.388 5.509 19.868 3.292 4.461 7.789 6.981 12.761 7.659a2 2 0 0 1 1.73 1.981v10.5a2 2 0 1 1-4 0Zm34.5 0v-8.821c5.341-1.138 10.149-4.119 13.71-8.944 3.926-5.321 6.255-12.765 6.29-22.227a2 2 0 1 0-4-.016c-.032 8.832-2.203 15.388-5.509 19.868-3.292 4.461-7.789 6.981-12.761 7.659a2 2 0 0 0-1.73 1.981v10.5a2 2 0 1 0 4 0Z" /><path d="M56.05 40.399a2 2 0 0 1 1.982 2.272l-1.652 12a2 2 0 0 1-1.982 1.728H38.703a2 2 0 0 1-1.982-1.728l-1.652-12a2 2 0 0 1 1.982-2.272h19Zm-15.604 12h12.209l1.102-8H39.345l1.101 8Zm38.604 8a2 2 0 1 1 0 4h-66a2 2 0 1 1 0-4h66Z" /></svg>;
  const paths: Record<string, ReactNode> = {
    user: null,
    phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    message: <path d="M4 4h16v13H8l-4 4V4Z"/>,
    car: null,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
    shield: null,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    plate: null,
    issue: null,
    wait: null,
    dropoff: null,
    soonest: null,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function SelectionIndicator() {
  return <i className="book-selection-indicator" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.4 4.1 4.1L19.4 6.8" /></svg></i>;
}

const bookingColorStyle = {
  "--book-accent": "var(--color-accent)",
  "--book-accent-text": "var(--color-booking-accent-text)",
  "--book-bg": "var(--color-booking-surface)",
  "--book-text": "var(--color-booking-text)",
  "--book-input-bg": "var(--color-booking-input-surface)",
  "--book-input-text": "var(--color-booking-input-text)",
} as CSSProperties;

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DatePickerProps = { minDate: string; closedDays: number[]; disabledDates: string[]; value: string; onChange: (value: string) => void };

function CalendarPicker({ minDate, closedDays, disabledDates, value, onChange }: DatePickerProps) {
  const earliest = new Date(`${minDate}T12:00:00`);
  const [month, setMonth] = useState(new Date(earliest.getFullYear(), earliest.getMonth(), 1));
  const today = dateKey(new Date());
  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const offset = month.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const weeks = Math.max(5, Math.ceil((offset + daysInMonth) / 7));
    return Array.from({ length: weeks * 7 }, (_, index) => new Date(year, monthIndex, index + 1 - offset));
  }, [month]);
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return <>
    <div className="book-calendar">
      <div className="book-calendar-head">
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
        <strong aria-live="polite">{label}</strong>
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button>
      </div>
      <div className="book-calendar-grid">
        {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => <small key={day}>{day}</small>)}
        {cells.map((date) => {
          const key = dateKey(date);
          const outside = date.getMonth() !== month.getMonth();
          const unavailable = outside || key < minDate || closedDays.includes(date.getDay()) || isDisabledBookingDate(key, disabledDates);
          const classes = [outside && "outside", !unavailable && "available", key === today && !outside && "today", value === key && !outside && "selected"];
          return <button key={key} type="button" disabled={unavailable}
            className={classes.filter(Boolean).join(" ")} aria-pressed={value === key && !outside}
            aria-label={date.toLocaleDateString(undefined, { dateStyle: "full" })} onClick={() => onChange(key)}>
            {date.getDate()}
          </button>;
        })}
      </div>
    </div>
    <div className="book-calendar-legend"><span><i className="today" />Today</span><span><i className="available" />Available Dates</span><span><i className="selected" />Selected Date</span></div>
  </>;
}

function BookingBenefits() {
  return <div className="book-benefits" aria-label="Booking benefits">
    <span><Icon name="shield" /><b>No payment<br />required</b></span><i />
    <span><Icon name="clock" /><b>Quick &amp; easy<br />in minutes</b></span><i />
    <span><Icon name="phone" /><b>We&apos;ll confirm<br />with you</b></span>
  </div>;
}

function ExtraFields({ fields }: { fields: BookingField[] }) {
  if (!fields.length) return null;
  return <div className="book-extra-fields">{fields.map((field) => <label key={field.key}>{field.label}{field.type === "textarea" ? <textarea name={`extra:${field.key}`} required={field.required} placeholder={field.placeholder} /> : field.type === "select" ? <select name={`extra:${field.key}`} required={field.required}><option value="">Select</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "checkbox" ? <input type="checkbox" name={`extra:${field.key}`} required={field.required} /> : <input type={field.type} name={`extra:${field.key}`} required={field.required} placeholder={field.placeholder} />}</label>)}</div>;
}

export function BookingFormClient({ siteSlug, slots, closedDays, disabledDates = [], leadDays, confirmation, fields, variant = "default", appearance, heading, subheading, initialSlotCount = 6, plateState }: Props) {
  const normalizedVariant = variant === "micks" ? "landing" : variant;
  const [mode, setMode] = useState<"plate" | "manual">("plate");
  const [contact, setContact] = useState<"phone" | "text" | "email">("phone");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(slots[0] ?? "Soonest available");
  const [dropOff, setDropOff] = useState<"drop_off" | "wait">("drop_off");
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [issueLen, setIssueLen] = useState(0);
  const minDate = useMemo(() => { const date = new Date(); date.setDate(date.getDate() + leadDays); return dateKey(date); }, [leadDays]);
  const [appointmentLead, ...appointmentDetailParts] = (subheading ?? "").split("\n");
  const appointmentDetail = appointmentDetailParts.join("\n");

  function validateNativeDate(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const value = input.value;
    const unavailable = Boolean(value) && (
      closedDays.includes(new Date(`${value}T12:00:00`).getDay())
      || isDisabledBookingDate(value, disabledDates)
    );
    const message = unavailable ? "This date is unavailable. Please choose another date." : "";
    input.setCustomValidity(message);
    if (unavailable) {
      setError("Please choose an available date.");
      input.reportValidity();
    } else {
      setError("");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const fd = new FormData(form);
    if (normalizedVariant === "appointment") {
      fd.set("preferredDate", selectedDate);
      fd.set("slot", selectedSlot);
      fd.set("dropOff", dropOff);
      fd.set("contactPref", contact);
    }
    const date = String(fd.get("preferredDate") || "");
    if (!date || closedDays.includes(new Date(`${date}T12:00:00`).getDay()) || isDisabledBookingDate(date, disabledDates)) { setError("Please choose an available date."); return; }
    setStatus("sending");
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    const extraFields: Record<string, string | boolean> = {};
    for (const field of fields) { extraFields[field.key] = field.type === "checkbox" ? fd.get(`extra:${field.key}`) === "on" : String(fd.get(`extra:${field.key}`) ?? ""); delete body[`extra:${field.key}`]; }
    body.extraFields = extraFields;
    body.siteSlug = siteSlug;
    try {
      const response = await fetch("/api/appointments/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("done");
      form.reset();
    } catch (caught) { setStatus("error"); setError(caught instanceof Error ? caught.message : "Something went wrong"); }
  }

  if (status === "done") return <div className="book-confirmation" style={bookingColorStyle} role="status">{confirmation}</div>;
  if (normalizedVariant === "default") return <form onSubmit={onSubmit} className="book-tool book-tool--default" style={bookingColorStyle}><VehicleFields mode={mode} setMode={setMode} /><div className="book-default-grid"><label>Preferred date<input type="date" name="preferredDate" min={minDate} onChange={validateNativeDate} required /></label><label>Time<select name="slot" defaultValue="Soonest available"><option>Soonest available</option>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></label><label>Drop-off<select name="dropOff"><option value="drop_off">I’ll drop it off</option><option value="wait">I’ll wait</option></select></label><label>Full name<input name="customerName" required /></label><label>Phone<input name="phone" type="tel" required /></label><label>Email<input name="email" type="email" /></label></div><input type="hidden" name="contactPref" value="phone" /><label>What can we help with?<textarea name="issue" maxLength={500} /></label><ExtraFields fields={fields} /><Submit status={status} error={error} /></form>;

  const selectedSlotIndex = slots.indexOf(selectedSlot);
  const collapsedSlotStart = selectedSlotIndex >= 0 ? selectedSlotIndex : 0;
  const visibleSlots = showAllSlots ? slots : slots.slice(collapsedSlotStart, collapsedSlotStart + initialSlotCount);
  return <form onSubmit={onSubmit} className={`book-tool book-tool--${normalizedVariant}`} style={bookingColorStyle}>
    {normalizedVariant === "appointment" && <header className="book-appointment-header"><div><h2>{heading || appearance?.appointmentHeading || "Schedule Your Service Online"}</h2><p>{subheading ? <><strong>{appointmentLead}</strong>{appointmentDetail && <span>{appointmentDetail}</span>}</> : <><strong>Fast, easy, and always free.</strong><span>A real advisor will confirm everything with you.</span></>}</p></div><BookingBenefits /></header>}
    {normalizedVariant === "landing" && <BookingBenefits />}
    <div className="book-contact-fields"><Field icon="user" label="Full Name"><input name="customerName" autoComplete="name" placeholder="Full Name" required /></Field><Field icon="phone" label="Phone Number"><input name="phone" type="tel" autoComplete="tel" placeholder="Phone Number" required /></Field><Field icon="mail" label="Email (optional)"><input name="email" type="email" autoComplete="email" placeholder="Email (optional)" /></Field>{normalizedVariant === "landing" ? <Field icon="message" label="Preferred contact"><select name="contactPref" defaultValue="phone" aria-label="Preferred contact"><option value="phone">Phone Call</option><option value="text">Text Message</option><option value="email">Email</option></select></Field> : null}</div>
    {normalizedVariant === "appointment" && <div className="book-contact-preferences">{(["phone", "text", "email"] as const).map((value) => <label key={value}><span>Prefer {value === "phone" ? "phone call" : value === "text" ? "text messages" : "email"}</span><input type="radio" name="contactPreferenceDisplay" checked={contact === value} onChange={() => setContact(value)} /><SelectionIndicator /></label>)}</div>}
    <p className="book-step-label">1. How should we look up your vehicle?</p>
    <VehicleFields mode={mode} setMode={setMode} siteSlug={siteSlug} isLanding={normalizedVariant === "landing"} useCatalog plateState={normalizedVariant === "appointment" ? (plateState ?? "") : undefined} />
    {normalizedVariant === "appointment" ?
      <div className="book-appointment-grid">
        <section>
          <h3>2. When would you like to come in?</h3>
          <CalendarPicker minDate={minDate} closedDays={closedDays} disabledDates={disabledDates} value={selectedDate} onChange={setSelectedDate} />
        </section>
        <section>
          <h3>3. Preferred arrival time</h3>
          <div className="book-time-grid">
            {visibleSlots.map((slot) => (
              <button key={slot} type="button" aria-pressed={selectedSlot === slot} className={selectedSlot === slot ? "selected" : ""} onClick={() => setSelectedSlot(slot)}>{slot}</button>
            ))}
          </div>
          {slots.length > initialSlotCount && (
            <button type="button" className="book-more-times" aria-expanded={showAllSlots} onClick={() => setShowAllSlots((value) => !value)}>
              {showAllSlots ? "Fewer times" : "More times"}<span aria-hidden="true" />
            </button>
          )}
          {slots.length > 0 && <div className="book-time-or">or</div>}
          <button type="button" aria-pressed={selectedSlot === "Soonest available"} className={`book-soonest ${selectedSlot === "Soonest available" ? "selected" : ""}`} onClick={() => setSelectedSlot("Soonest available")}>
            <Icon name="soonest" /><span><strong>Soonest Available</strong><small>We&apos;ll contact you with the earliest opening.</small></span><i aria-hidden="true" />
          </button>
        </section>
        <section>
          <h3>4. How will you leave your vehicle?</h3>
          <button type="button" aria-pressed={dropOff === "drop_off"} className={`book-drop-card ${dropOff === "drop_off" ? "selected" : ""}`} onClick={() => setDropOff("drop_off")}>
            <Icon name="dropoff" /><span><strong>I&apos;ll Drop It Off</strong></span><i aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={dropOff === "wait"} className={`book-drop-card book-wait-card ${dropOff === "wait" ? "selected" : ""}`} onClick={() => setDropOff("wait")}>
            <Icon name="wait" /><span><strong>I&apos;ll Wait</strong></span><small>If your appointment will be longer than 1–2 hours, we&apos;ll let you know in advance. All waiting appointments must start by noon.</small><i aria-hidden="true" />
          </button>
        </section>
      </div> : <div className="book-landing-when"><Field icon="calendar" label="Date"><input type="date" name="preferredDate" min={minDate} onChange={validateNativeDate} required /></Field><Field icon="clock" label="Arrival Time"><select name="slot" defaultValue="Soonest available"><option>Soonest available</option>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></Field><Field icon="car" label="Drop Off or Wait?"><select name="dropOff"><option value="drop_off">I&apos;ll Drop It Off</option><option value="wait">I&apos;ll Wait</option></select></Field></div>}
    <label className="book-issue">
      <strong>{normalizedVariant === "appointment" ? "5. " : ""}What can we help you with?</strong>
      {normalizedVariant === "appointment" && <Icon name="issue" />}
      <textarea name="issue" maxLength={500} rows={normalizedVariant === "appointment" ? 5 : 4} onChange={(event) => setIssueLen(event.target.value.length)} placeholder="Ex. Brakes squeaking, check engine light, oil change, tire vibration..." />
      <small>{issueLen}{normalizedVariant === "appointment" ? " / " : "/"}500</small>
    </label>
    <ExtraFields fields={fields} />
    <input type="text" name="website" tabIndex={-1} autoComplete="off" className="book-honeypot" aria-hidden />
    <Submit status={status} error={error} />
  </form>;
}

function Field({ icon, label, children }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; children: ReactNode }) { return <label className={`book-field${icon === "plate" ? " book-field--plate" : ""}`}><Icon name={icon} /><span>{label}</span>{children}</label>; }

type PlateVehicle = { vin: string; year: string; make: string; model: string; trim?: string };

function BookingPlateFields({ siteSlug, isLanding, defaultState, showResult }: { siteSlug: string; isLanding: boolean; defaultState: string; showResult: boolean }) {
  const [plate, setPlate] = useState("");
  const [state, setState] = useState(defaultState);
  const [vehicle, setVehicle] = useState<PlateVehicle | null>(null);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lookupMessage, setLookupMessage] = useState("Enter a plate and select its state.");
  const requestId = useRef(0);
  const lastLookup = useRef("");

  function clearLookup() {
    requestId.current += 1;
    lastLookup.current = "";
    setVehicle(null);
    setLookupStatus("idle");
    setLookupMessage("Enter a plate and select its state.");
  }

  async function lookup(nextPlate = plate, nextState = state) {
    const normalizedPlate = nextPlate.replace(/\s+/g, "").toUpperCase();
    const normalizedState = nextState.trim().toUpperCase();
    if (!normalizedPlate || !normalizedState) return;
    const key = `${normalizedPlate}:${normalizedState}`;
    if (lastLookup.current === key && (lookupStatus === "loading" || lookupStatus === "success")) return;
    lastLookup.current = key;
    const currentRequest = ++requestId.current;
    setVehicle(null);
    setLookupStatus("loading");
    setLookupMessage("Looking up vehicle...");
    try {
      const response = await fetch("/api/booking-vehicle-lookup/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteSlug, plate: normalizedPlate, state: normalizedState }),
      });
      const data = await response.json().catch(() => ({})) as { vehicle?: PlateVehicle; error?: string };
      if (!response.ok || !data.vehicle) throw new Error(data.error || "Vehicle lookup failed.");
      if (requestId.current !== currentRequest) return;
      setVehicle(data.vehicle);
      setLookupStatus("success");
      setLookupMessage("Vehicle details found.");
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      lastLookup.current = "";
      setLookupStatus("error");
      setLookupMessage(error instanceof Error ? error.message : "Vehicle lookup failed.");
    }
  }

  const vehicleName = vehicle ? [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ") : "Vehicle details";
  const hasPlateAndState = Boolean(plate.trim() && state.trim());
  return <div className={`book-plate-fields${showResult ? "" : " book-plate-fields--compact"}`}>
    <Field icon="plate" label="License Plate"><input type="text" name="plate" value={plate} onChange={(event) => { setPlate(event.target.value); clearLookup(); }} onBlur={() => void lookup()} autoComplete="off" aria-label="License Plate" placeholder={isLanding ? "License Plate Ex. ABC1234" : "Ex. ABC1234"} required /></Field>
    <Field icon="pin" label="State">
      <select name="state" value={state} aria-label="State" required onChange={(event) => { const nextState = event.target.value; setState(nextState); clearLookup(); void lookup(plate, nextState); }}>
        {!defaultState && <option value="" disabled>Select your state</option>}
        {STATES.map((stateOption) => <option key={stateOption}>{stateOption}</option>)}
      </select>
    </Field>
    {showResult && hasPlateAndState && <div className={`book-vehicle-result is-${lookupStatus}`} role="status" aria-live="polite">
      <Icon name="car" />
      <span><strong>{lookupStatus === "loading" ? "Looking up vehicle..." : vehicleName}</strong><small>{vehicle ? `VIN ${vehicle.vin}` : lookupMessage}</small></span>
    </div>}
    <input type="hidden" name="vin" value={vehicle?.vin ?? ""} />
    <input type="hidden" name="year" value={vehicle?.year ?? ""} />
    <input type="hidden" name="make" value={vehicle?.make ?? ""} />
    <input type="hidden" name="model" value={vehicle?.model ?? ""} />
  </div>;
}

function VehicleFields({ mode, setMode, siteSlug = "", isLanding = false, useCatalog = false, plateState = "MN" }: {
  mode: "plate" | "manual";
  setMode: (mode: "plate" | "manual") => void;
  siteSlug?: string;
  isLanding?: boolean;
  useCatalog?: boolean;
  plateState?: string;
}) {
  const state = plateState.trim().toUpperCase();
  const defaultState = STATES.includes(state) ? state : "";
  return <>
    <div className="book-vehicle-mode">
      <button type="button" className={mode === "plate" ? "selected" : ""} aria-pressed={mode === "plate"} onClick={() => setMode("plate")}>
        <span className="book-vehicle-icon" aria-hidden="true"><Icon name="car" /></span>
        <span><strong>Use License Plate</strong><small>Fast and accurate</small></span><SelectionIndicator />
      </button>
      <button type="button" className={mode === "manual" ? "selected" : ""} aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>
        <span className="book-vehicle-icon" aria-hidden="true"><Icon name="car" /></span>
        <span><strong>Enter Vehicle Manually</strong><small>{useCatalog ? "Choose year, make & model" : "Type year, make & model"}</small></span><SelectionIndicator />
      </button>
    </div>
    {mode === "plate" ? <BookingPlateFields siteSlug={siteSlug} isLanding={isLanding} defaultState={defaultState} showResult={!isLanding} /> : useCatalog ? <BookingVehicleDropdowns siteSlug={siteSlug} /> : <div className="book-manual-fields">
      <label><span>Year</span><input name="year" inputMode="numeric" pattern="[0-9]{4}" required /></label>
      <label><span>Make</span><input name="make" required /></label>
      <label><span>Model</span><input name="model" required /></label>
    </div>}
  </>;
}

function Submit({ status, error }: { status: "idle" | "sending" | "done" | "error"; error: string }) { return <>{error && <p className="book-error" role="alert">{error}</p>}<button type="submit" disabled={status === "sending"} className="book-submit"><Icon name="calendar" />{status === "sending" ? "Sending..." : "Book Appointment"}</button><p className="book-note"><Icon name="lock" />No payment required. A real advisor will confirm everything with you.</p></>; }
