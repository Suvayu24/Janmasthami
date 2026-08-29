import express from "express";
import Contributor from "../models/Contributor.js";

const router = express.Router();

// NOTE: env vars are read INSIDE the functions below (at request time), never
// as top-level constants here. Top-level `const x = process.env.X` would run
// during module import, which happens BEFORE server.js calls dotenv.config()
// — so it would always be undefined. Reading process.env lazily, inside a
// function body, avoids that trap.

// --- Email via Brevo's HTTP API ---
// Render's free tier blocks outbound SMTP ports (25/465/587), which broke the
// old Gmail SMTP approach. Brevo sends over plain HTTPS instead, so it isn't
// affected. Free tier: 300 emails/day, no domain needed — just a verified
// sender address (see README).
async function sendViaBrevo({ to, name, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.SMTP_USER; // reusing the same verified Gmail address as sender
  const fromName = process.env.FROM_NAME || "Janmashtami Festival Committee";

  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to, name }],
      subject,
      htmlContent: html,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Brevo ${resp.status}: ${errBody}`);
  }
}

// Matches the Contributor schema's phoneNumber validation: ^\+?\d{10,15}$
function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return (hasPlus ? "+" : "") + digits;
}

// The form asks "Do you want to stay anonymous on our website?" (Yes/No)
function parseAnonymous(value) {
  const v = String(value || "").trim().toLowerCase();
  return v === "yes" || v === "true";
}

async function sendReceiptEmail({ to, name, amount, transactionId }) {
  if (!to) return { ok: false, detail: "no email address provided" };

  const fromName = process.env.FROM_NAME || "Janmashtami Festival Committee";
  const txnLineHtml = transactionId ? `<p>Transaction ID: <b>${transactionId}</b></p>` : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <p>Hi ${name},</p>
      <p>We've received your contribution of <b>Rs ${amount}</b>. Thank you so much for your support!</p>
      ${txnLineHtml}
      <p>This is an automated confirmation — no action is needed from you.</p>
      <p>Regards,<br>${fromName}</p>
    </div>
  `;

  try {
    await sendViaBrevo({
      to,
      name,
      subject: "Payment Received — Thank You for Your Contribution",
      html,
    });
    return { ok: true, detail: "sent" };
  } catch (error) {
    return { ok: false, detail: error.message };
  }
}


// Called by the Apps Script trigger the instant a Sheet row's Payment Status
// is set to "Approved". Protected by a shared secret header — this is a
// machine-to-machine call, not a logged-in admin session, so it deliberately
// does NOT use requireAuth.
router.post("/payment-approved", async (req, res) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const receivedSecret = req.headers["x-webhook-secret"];

  

  // TEMPORARY DEBUG LOGGING — remove once the 401 is sorted out.
  console.log("=== DEBUG payment-approved ===");
  console.log("expected (from .env) :", JSON.stringify(webhookSecret));
  console.log("received (from header):", JSON.stringify(receivedSecret));
  console.log("match?                :", webhookSecret === receivedSecret);
  console.log("===============================");

  if (receivedSecret !== webhookSecret) {
    return res.status(401).json({ status: "error", message: "unauthorized" });
  }

  const { name, email, phone, roll_number, hostel_room, amount, anonymous, transaction_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ status: "error", message: "missing name or email" });
  }

  // 1. Save the contributor. If this fails, nothing was created — safe for
  //    Apps Script to mark "Failed" and let you retry by re-approving the row.
  let contributor;
  try {
    contributor = await Contributor.create({
      name,
      amountContributed: Number(amount) || 0,
      rollNumber: roll_number,
      roomNumber: hostel_room,
      phoneNumber: normalizePhone(phone),
      anonymous: parseAnonymous(anonymous),
      facilitatorName: process.env.FORM_FACILITATOR_NAME || "Google Form (Auto)",
    });
  } catch (error) {
    const message =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((e) => e.message).join(", ")
        : error.message;
    return res.status(502).json({ status: "error", message });
  }

  // 2. Send the receipt email. If this fails, the contributor is already
  //    saved — return 200 with status "partial" so Apps Script marks the row
  //    processed and doesn't retry (which would otherwise create a duplicate).
  const emailResult = await sendReceiptEmail({
    to: email,
    name,
    amount,
    transactionId: transaction_id,
  });

  if (!emailResult.ok) {
    return res.status(200).json({
      status: "partial",
      message: `contributor saved, email failed: ${emailResult.detail}`,
      contributorId: contributor._id,
    });
  }

  return res.status(200).json({ status: "success", contributorId: contributor._id });
});

export default router;