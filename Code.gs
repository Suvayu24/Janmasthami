/**
 * ====== CONFIGURATION — edit these two lines ======
 */
const WEBHOOK_URL = 'https://janmasthami-festival.onrender.com/webhooks/payment-approved'; // see README for pre-deploy testing
const SHARED_SECRET = 'ed23b709e7010fe170c70f9144e694a96223ddf238dfcfd58366707f7da30a76'; // must match server .env WEBHOOK_SECRET

// These must match your Sheet's header row EXACTLY (case-sensitive, including punctuation)
const PAYMENT_STATUS_HEADER = 'Payment Status';
const EMAIL_SENT_HEADER = 'Email Sent';        // <-- add this column to your sheet if not already there, leave it blank
const APPROVED_VALUE = 'Approved';             // whatever text you type/select to mean "approved"

const NAME_HEADER = 'Full Name';
const PHONE_HEADER = 'Phone Number (WhatsApp Number)';
const ROLL_HEADER = 'Roll Number';
const HOSTEL_HEADER = 'Hostel and Room Number (Ex: BH5 - 5xxx)';
const AMOUNT_HEADER = 'Amount you want to contribute (in Rs)';
const EMAIL_HEADER = 'Email Address';
const ANONYMOUS_HEADER = 'Do you want to stay anonymous on our website?';
const TRANSACTION_ID_HEADER = 'Transaction ID'; // optional — fine if this column doesn't exist yet

/**
 * Run this ONCE manually from the Apps Script editor (select it in the
 * function dropdown, click Run) to install the trigger.
 */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onEditInstallable') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
  Logger.log('Installable onEdit trigger created.');
}

/**
 * Fires on every edit to the sheet. Filters down to edits in the
 * "Payment Status" column where the new value is "Approved".
 */
function onEditInstallable(e) {
  try {
    const sheet = e.range.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const statusCol = headers.indexOf(PAYMENT_STATUS_HEADER) + 1;
    const sentCol = headers.indexOf(EMAIL_SENT_HEADER) + 1;

    if (statusCol === 0 || sentCol === 0) {
      Logger.log('Header "' + PAYMENT_STATUS_HEADER + '" or "' + EMAIL_SENT_HEADER + '" not found. Check spelling/casing in row 1.');
      return;
    }

    // Only care about edits that touched the Payment Status column
    if (e.range.getColumn() > statusCol || e.range.getColumn() + e.range.getNumColumns() - 1 < statusCol) {
      return;
    }

    for (let row = e.range.getRow(); row < e.range.getRow() + e.range.getNumRows(); row++) {
      if (row === 1) continue; // header row

      const statusValue = sheet.getRange(row, statusCol).getValue().toString().trim();
      const sentValue = sheet.getRange(row, sentCol).getValue().toString().trim();

      if (statusValue.toLowerCase() !== APPROVED_VALUE.toLowerCase()) continue;
      if (sentValue.toLowerCase().indexOf('yes') === 0) continue; // already processed (starts with "Yes")

      processApprovedRow(sheet, headers, row, sentCol);
    }
  } catch (err) {
    Logger.log('onEditInstallable error: ' + err);
  }
}

function processApprovedRow(sheet, headers, row, sentCol) {
  const rowValues = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  const data = {};
  headers.forEach((h, i) => { data[h] = rowValues[i]; });

  const payload = {
    row_number: row,
    name: data[NAME_HEADER] || '',
    phone: data[PHONE_HEADER] || '',
    roll_number: data[ROLL_HEADER] || '',
    hostel_room: data[HOSTEL_HEADER] || '',
    amount: data[AMOUNT_HEADER] || '',
    email: data[EMAIL_HEADER] || '',
    anonymous: data[ANONYMOUS_HEADER] || '',
    transaction_id: data[TRANSACTION_ID_HEADER] || '',
    timestamp: data['Timestamp'] ? data['Timestamp'].toString() : ''
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Webhook-Secret': SHARED_SECRET },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  // Mark immediately so a second edit while this is in flight doesn't double-fire
  sheet.getRange(row, sentCol).setValue('Sending...');

  const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  const code = response.getResponseCode();

  if (code === 200) {
    let body = {};
    try { body = JSON.parse(response.getContentText()); } catch (parseErr) { /* leave body empty */ }

    if (body.status === 'success') {
      sheet.getRange(row, sentCol).setValue('Yes');
    } else {
      // Contributor was saved but the email failed — mark as processed
      // (starts with "Yes") so it's never retried/duplicated, but flag it
      // for you to notice and resend the receipt manually.
      sheet.getRange(row, sentCol).setValue('Yes (email failed - check logs)');
      Logger.log('Row ' + row + ' partial: ' + (body.message || response.getContentText()));
    }
  } else {
    sheet.getRange(row, sentCol).setValue('Failed: ' + code);
    Logger.log('Webhook failed for row ' + row + ': ' + response.getContentText());
  }
}
