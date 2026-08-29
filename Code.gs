const WEBHOOK_URL = "https://yoursite.com/api/webhooks/payment-approved";
const SHARED_SECRET = "PUT-A-LONG-RANDOM-SECRET-HERE";

const PAYMENT_STATUS_HEADER = "Payment Status";
const EMAIL_SENT_HEADER = "Email Sent";

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
  if (String(event.value || "").trim().toLowerCase() !== "approved") return;

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
    sheet.getRange(row, emailSentColumn).setValue("Yes (email failed - check logs)");
    return;
  }

  const message = body.message || responseText || "Unknown error";
  sheet.getRange(row, emailSentColumn).setValue(`Failed: ${statusCode} ${message}`.slice(0, 500));
}

function buildPayload_(headers, values) {
  return {
    name: pick_(headers, values, ["Name of User", "Name"]),
    email: pick_(headers, values, ["Email Address", "Email"]),
    phone: pick_(headers, values, ["Phone Number", "Phone"]),
    roll_number: pick_(headers, values, ["Roll Number"]),
    hostel_room: pick_(headers, values, ["Hostel and Room Number", "Hostel Room"]),
    amount: pick_(headers, values, ["Amount You want to contribute", "Amount"]),
    anonymous: pick_(headers, values, ["Anonymous", "Do you want to stay anonymous on our website?"]),
    transaction_id: pick_(headers, values, ["Transaction ID", "Extracted Transaction ID", "UPI Transaction ID"]),
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

function pick_(headers, values, possibleHeaders) {
  for (const headerName of possibleHeaders) {
    const index = headers.findIndex((header) => header === headerName);
    if (index !== -1) return String(values[index] || "").trim();
  }

  return "";
}

function parseJson_(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}
