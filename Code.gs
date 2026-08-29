const WEBHOOK_URL = "https://yoursite.com/api/webhooks/payment-approved";
const SHARED_SECRET = "PUT-A-LONG-RANDOM-SECRET-HERE";

const PAYMENT_STATUS_HEADER = "Payment Status";
const EMAIL_SENT_HEADER = "Email Sent";
const APPROVED_VALUE = "Approved";

const NAME_HEADER = "Full Name";
const PHONE_HEADER = "Phone Number (WhatsApp Number)";
const ROLL_HEADER = "Roll Number";
const HOSTEL_HEADER = "Hostel and Room Number (Ex: BH5 - 5xxx)";
const AMOUNT_HEADER = "Amount you want to contribute (in Rs)";
const EMAIL_HEADER = "Email Address";
const ANONYMOUS_HEADER = "Do you want to stay anonymous on our website?";
const TRANSACTION_ID_HEADER = "Transaction ID";

function installTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();

  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "onEditInstallable")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("onEditInstallable")
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

function onEditInstallable(event) {
  if (!event || !event.range) return;

  const sheet = event.range.getSheet();
  const row = event.range.getRow();
  const column = event.range.getColumn();

  if (row === 1) return;

  const headers = getHeaders_(sheet);
  const paymentStatusColumn = findColumn_(headers, PAYMENT_STATUS_HEADER);

  if (!paymentStatusColumn || column !== paymentStatusColumn) return;
  if (String(event.value || "").trim() !== APPROVED_VALUE) return;

  processApprovedRow_(sheet, row);
}

function processApprovedRow_(sheet, row) {
  const emailSentColumn = ensureColumn_(sheet, EMAIL_SENT_HEADER);
  const currentEmailStatus = String(sheet.getRange(row, emailSentColumn).getDisplayValue() || "").trim();

  if (currentEmailStatus.toLowerCase().startsWith("yes")) return;

  sheet.getRange(row, emailSentColumn).setValue("Sending...");

  const headers = getHeaders_(sheet);
  const values = sheet.getRange(row, 1, 1, headers.length).getDisplayValues()[0];
  const payload = buildPayload_(headers, values);

  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Webhook-Secret": SHARED_SECRET,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();
  const body = parseJson_(responseText);

  if (statusCode >= 200 && statusCode < 300 && body.status === "success") {
    sheet.getRange(row, emailSentColumn).setValue("Yes");
    return;
  }

  if (statusCode >= 200 && statusCode < 300 && body.status === "partial") {
    const message = body.message || "email failed - check Render logs";
    sheet.getRange(row, emailSentColumn).setValue(`Yes (${message})`.slice(0, 500));
    return;
  }

  const message = body.message || responseText || "Unknown error";
  sheet.getRange(row, emailSentColumn).setValue(`Failed: ${statusCode} ${message}`.slice(0, 500));
}

function buildPayload_(headers, values) {
  return {
    name: pick_(headers, values, NAME_HEADER),
    email: pick_(headers, values, EMAIL_HEADER),
    phone: pick_(headers, values, PHONE_HEADER),
    roll_number: pick_(headers, values, ROLL_HEADER),
    hostel_room: pick_(headers, values, HOSTEL_HEADER),
    amount: pick_(headers, values, AMOUNT_HEADER),
    anonymous: pick_(headers, values, ANONYMOUS_HEADER),
    transaction_id: pickOptional_(headers, values, TRANSACTION_ID_HEADER),
  };
}

function getHeaders_(sheet) {
  return sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getDisplayValues()[0]
    .map((value) => String(value || "").trim());
}

function findColumn_(headers, headerName) {
  const index = headers.findIndex((header) => header === headerName);
  return index === -1 ? 0 : index + 1;
}

function ensureColumn_(sheet, headerName) {
  const headers = getHeaders_(sheet);
  const existingColumn = findColumn_(headers, headerName);
  if (existingColumn) return existingColumn;

  const newColumn = headers.length + 1;
  sheet.getRange(1, newColumn).setValue(headerName);
  return newColumn;
}

function pick_(headers, values, headerName) {
  const index = headers.findIndex((header) => header === headerName);
  if (index !== -1) return String(values[index] || "").trim();

  throw new Error(`Missing required header: ${headerName}`);
}

function pickOptional_(headers, values, headerName) {
  const index = headers.findIndex((header) => header === headerName);
  return index === -1 ? "" : String(values[index] || "").trim();
}

function parseJson_(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}
