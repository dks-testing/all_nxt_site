"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { BookingAppearance, BookingField } from "@platform/db";

const STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
type Variant = "default" | "landing" | "appointment" | "micks";
type Props = { siteSlug: string; slots: string[]; closedDays: number[]; disabledDates?: string[]; leadDays: number; confirmation: string; fields: BookingField[]; variant?: Variant; appearance?: BookingAppearance | null };

function Icon({ name }: { name: "user" | "phone" | "mail" | "message" | "car" | "pin" | "calendar" | "clock" | "shield" | "lock" }) {
  const paths: Record<typeof name, ReactNode> = {
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    message: <path d="M4 4h16v13H8l-4 4V4Z"/>,
    car: <><path d="m5 11 2-5h10l2 5 2 2v5h-2v2h-3v-2H8v2H5v-2H3v-5l2-2Z"/><path d="M6 11h12M7 15h.01M17 15h.01"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
    shield: <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function styleFor(appearance?: BookingAppearance | null) {
  return {
    "--book-accent": appearance?.accentColor ?? "#d1272c",
    "--book-accent-text": appearance?.accentTextColor ?? "#ffffff",
    "--book-bg": appearance?.formBackground ?? "#ffffff",
    "--book-text": appearance?.formTextColor ?? "#111111",
    "--book-input-bg": appearance?.inputBackground ?? "#ffffff",
    "--book-input-text": appearance?.inputTextColor ?? "#111111",
  } as CSSProperties;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CalendarPicker({ minDate, closedDays, disabledDates, value, onChange }: { minDate: string; closedDays: number[]; disabledDates: string[]; value: string; onChange: (value: string) => void }) {
  const earliest = new Date(`${minDate}T12:00:00`);
  const [month, setMonth] = useState(new Date(earliest.getFullYear(), earliest.getMonth(), 1));
  const today = dateKey(new Date());
  const cells = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [month]);
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return <div className="book-calendar"><div className="book-calendar-head"><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button><strong>{label}</strong><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button></div><div className="book-calendar-grid">{"SMTWTFS".split("").map((day, index) => <small key={`${day}${index}`}>{day}</small>)}{cells.map((date) => {
    const key = dateKey(date);
    const unavailable = key < minDate || closedDays.includes(date.getDay()) || disabledDates.includes(key);
    const outside = date.getMonth() !== month.getMonth();
    return <button key={key} type="button" disabled={unavailable} className={`${outside ? "outside" : ""} ${!unavailable && !outside ? "available" : ""} ${key === today ? "today" : ""} ${value === key ? "selected" : ""}`} onClick={() => onChange(key)}>{date.getDate()}</button>;
  })}</div><div className="book-calendar-legend"><span><i className="today" />Today</span><span><i className="available" />Available Dates</span><span><i className="selected" />Selected Date</span></div></div>;
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

export function BookingFormClient({ siteSlug, slots, closedDays, disabledDates = [], leadDays, confirmation, fields, variant = "default", appearance }: Props) {
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
    if (!date || closedDays.includes(new Date(`${date}T12:00:00`).getDay()) || disabledDates.includes(date)) { setError("Please choose an available date."); return; }
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

  if (status === "done") return <div className="book-confirmation" style={styleFor(appearance)} role="status">{confirmation}</div>;
  if (normalizedVariant === "default") return <form onSubmit={onSubmit} className="book-tool book-tool--default" style={styleFor(appearance)}><VehicleFields mode={mode} setMode={setMode} /><div className="book-default-grid"><label>Preferred date<input type="date" name="preferredDate" min={minDate} required /></label><label>Time<select name="slot" defaultValue="Soonest available"><option>Soonest available</option>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></label><label>Drop-off<select name="dropOff"><option value="drop_off">I’ll drop it off</option><option value="wait">I’ll wait</option></select></label><label>Full name<input name="customerName" required /></label><label>Phone<input name="phone" type="tel" required /></label><label>Email<input name="email" type="email" /></label></div><input type="hidden" name="contactPref" value="phone" /><label>What can we help with?<textarea name="issue" maxLength={500} /></label><ExtraFields fields={fields} /><Submit status={status} error={error} /></form>;

  const visibleSlots = showAllSlots ? slots : slots.slice(0, 6);
  return <form onSubmit={onSubmit} className={`book-tool book-tool--${normalizedVariant}`} style={styleFor(appearance)}>
    {normalizedVariant === "appointment" && <header className="book-appointment-header"><div><h2>{appearance?.appointmentHeading || "Schedule Your Service Online"}</h2><p><strong>Fast, easy, and always free.</strong><span>A real advisor will confirm everything with you.</span></p></div><BookingBenefits /></header>}
    {normalizedVariant === "landing" && <BookingBenefits />}
    <div className="book-contact-fields"><Field icon="user" label="Full Name"><input name="customerName" autoComplete="name" placeholder="Full Name" required /></Field><Field icon="phone" label="Phone Number"><input name="phone" type="tel" autoComplete="tel" placeholder="Phone Number" required /></Field><Field icon="mail" label="Email (optional)"><input name="email" type="email" autoComplete="email" placeholder="Email (optional)" /></Field>{normalizedVariant === "landing" ? <Field icon="message" label="Preferred contact"><select name="contactPref" defaultValue="phone" aria-label="Preferred contact"><option value="phone">Phone Call</option><option value="text">Text Message</option><option value="email">Email</option></select></Field> : null}</div>
    {normalizedVariant === "appointment" && <div className="book-contact-preferences">{(["phone", "text", "email"] as const).map((value) => <label key={value}><span>Prefer {value === "phone" ? "phone call" : value === "text" ? "text messages" : "email"}</span><input type="radio" name="contactPreferenceDisplay" checked={contact === value} onChange={() => setContact(value)} /><i><svg viewBox="0 0 24 24"><path d="m5 12.4 4.1 4.1L19.4 6.8" /></svg></i></label>)}</div>}
    <p className="book-step-label">1. How should we look up your vehicle?</p><VehicleFields mode={mode} setMode={setMode} />
    {normalizedVariant === "appointment" ? <div className="book-appointment-grid"><section><h3><b>2.</b> When would you like to come in?</h3><CalendarPicker minDate={minDate} closedDays={closedDays} disabledDates={disabledDates} value={selectedDate} onChange={setSelectedDate} /></section><section><h3><b>3.</b> Preferred arrival time</h3><div className="book-time-grid">{visibleSlots.map((slot) => <button key={slot} type="button" className={selectedSlot === slot ? "selected" : ""} onClick={() => setSelectedSlot(slot)}>{slot}</button>)}</div>{slots.length > 6 && <button type="button" className="book-more-times" aria-expanded={showAllSlots} onClick={() => setShowAllSlots((value) => !value)}>{showAllSlots ? "Fewer times" : "More times"}<span>⌄</span></button>}<div className="book-time-or"><span>or</span></div><button type="button" className={selectedSlot === "Soonest available" ? "selected book-soonest" : "book-soonest"} onClick={() => setSelectedSlot("Soonest available")}><Icon name="clock" /><span><strong>Soonest Available</strong><small>We’ll contact you with the earliest opening.</small></span><i /></button></section><section><h3><b>4.</b> How will you leave your vehicle?</h3><button type="button" className={`book-drop-card ${dropOff === "drop_off" ? "selected" : ""}`} onClick={() => setDropOff("drop_off")}><Icon name="car" /><span><strong>I’ll Drop It Off</strong></span><i /></button><button type="button" className={`book-drop-card ${dropOff === "wait" ? "selected" : ""}`} onClick={() => setDropOff("wait")}><Icon name="clock" /><span><strong>I’ll Wait</strong><small>Waiting appointments must start by noon.</small></span><i /></button></section></div> : <div className="book-landing-when"><Field icon="calendar" label="Date"><input type="date" name="preferredDate" min={minDate} required /></Field><Field icon="clock" label="Arrival Time"><select name="slot" defaultValue="Soonest available"><option>Soonest available</option>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></Field><Field icon="car" label="Drop Off or Wait?"><select name="dropOff"><option value="drop_off">I’ll Drop It Off</option><option value="wait">I’ll Wait</option></select></Field></div>}
    <label className="book-issue"><strong>{normalizedVariant === "appointment" ? "5. " : ""}What can we help you with?</strong><textarea name="issue" maxLength={normalizedVariant === "appointment" ? 1500 : 500} rows={normalizedVariant === "appointment" ? 5 : 4} onChange={(event) => setIssueLen(event.target.value.length)} placeholder="Ex. Brakes squeaking, check engine light, oil change, tire vibration..." /><small>{issueLen}/{normalizedVariant === "appointment" ? 1500 : 500}</small></label><ExtraFields fields={fields} /><input type="text" name="website" tabIndex={-1} autoComplete="off" className="book-honeypot" aria-hidden /><Submit status={status} error={error} />
  </form>;
}

function Field({ icon, label, children }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; children: ReactNode }) { return <label className="book-field"><Icon name={icon} /><span>{label}</span>{children}</label>; }
function VehicleFields({ mode, setMode }: { mode: "plate" | "manual"; setMode: (mode: "plate" | "manual") => void }) { return <><div className="book-vehicle-mode"><button type="button" className={mode === "plate" ? "selected" : ""} onClick={() => setMode("plate")}><Icon name="car" /><span><strong>Use License Plate</strong><small>Fast and accurate</small></span><i /></button><button type="button" className={mode === "manual" ? "selected" : ""} onClick={() => setMode("manual")}><Icon name="car" /><span><strong>Enter Vehicle Manually</strong><small>Type year, make &amp; model</small></span><i /></button></div>{mode === "plate" ? <div className="book-plate-fields"><Field icon="message" label="License Plate"><input name="plate" autoComplete="off" placeholder="License Plate  Ex. ABC1234" required /></Field><Field icon="pin" label="State"><select name="state" defaultValue="MN" aria-label="State">{STATES.map((state) => <option key={state}>{state}</option>)}</select></Field></div> : <div className="book-manual-fields"><label>Year<input name="year" inputMode="numeric" pattern="[0-9]{4}" required /></label><label>Make<input name="make" required /></label><label>Model<input name="model" required /></label></div>}</>; }
function Submit({ status, error }: { status: "idle" | "sending" | "done" | "error"; error: string }) { return <>{error && <p className="book-error" role="alert">{error}</p>}<button type="submit" disabled={status === "sending"} className="book-submit"><Icon name="calendar" />{status === "sending" ? "Sending..." : "Book Appointment"}</button><p className="book-note"><Icon name="lock" />No payment required. A real advisor will confirm everything with you.</p></>; }
