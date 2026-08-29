import express from "express";
import nodemailer from "nodemailer";
import Contributor from "../models/Contributor.js";

const router = express.Router();

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return (hasPlus ? "+" : "") + digits;
}

function parseAnonymous(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "yes" || normalized === "true";
}

async function sendReceiptEmail({ to, name, amount, transactionId }) {
  if (!to) return { ok: false, detail: "no email address provided" };

  const fromName = process.env.FROM_NAME || "Janmashtami Festival Committee";
  const txnLineHtml = transactionId ? `<p>Transaction ID: <b>${transactionId}</b></p>` : "";
  const txnLineText = transactionId ? `Transaction ID: ${transactionId}\n` : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <p>Hi ${name},</p>
      <p>We've received your contribution of <b>Rs ${amount}</b>. Thank you so much for your support!</p>
      ${txnLineHtml}
      <p>This is an automated confirmation - no action is needed from you.</p>
      <p>Regards,<br>${fromName}</p>
    </div>
  `;
  const text =
    `Hi ${name},\n\n` +
    `We've received your contribution of Rs ${amount}. Thank you for your support!\n` +
    txnLineText +
    `\nRegards,\n${fromName}`;

  try {
    await getTransporter().sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject: "Payment Received - Thank You for Your Contribution",
      text,
      html,
    });
    return { ok: true, detail: "sent" };
  } catch (error) {
    return { ok: false, detail: error.message };
  }
}

router.post("/payment-approved", async (req, res) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const receivedSecret = req.headers["x-webhook-secret"];

  if (receivedSecret !== webhookSecret) {
    return res.status(401).json({ status: "error", message: "unauthorized" });
  }

  const { name, email, phone, roll_number, hostel_room, amount, anonymous, transaction_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ status: "error", message: "missing name or email" });
  }

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
        ? Object.values(error.errors).map((entry) => entry.message).join(", ")
        : error.message;
    return res.status(502).json({ status: "error", message });
  }

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
