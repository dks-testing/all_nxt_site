/**
 * Booking notifications. Works without config (logs only); set RESEND_API_KEY + NOTIFY_FROM_EMAIL
 * for email and TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM for SMS.
 */
export async function sendEmail(to: string[], subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL;
  if (!key || !from || !to.length) {
    console.info(`[notify] email skipped (${to.length ? "no RESEND_API_KEY" : "no recipients"}): ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) console.error("[notify] email failed", res.status, await res.text());
}

export async function sendSms(to: string[], body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !to.length) return;
  await Promise.all(
    to.map(async (num) => {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: num, From: from, Body: body }),
      });
      if (!res.ok) console.error("[notify] sms failed", res.status, await res.text());
    }),
  );
}
