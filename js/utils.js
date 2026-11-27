// Function: normalizeUsername
function normalizeUsername(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '') // an email becomes its local part
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32);
}


// Function: formatDate
function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}


// Function: initials
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0] || '?').slice(0, 2);
  return letters.toUpperCase();
}


// Function: esc
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}


// Function: safeText
function safeText(value) {
  return esc(value);
}


// Function: shuffled
function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}


// Display names for scenario categories, shown wherever a category reaches the screen.
const CATEGORY_LABELS = {
  'Suspicious sender': 'Suspicious Sender',
  'Impersonation': 'Impersonation',
  'Fake links': 'Fake Link',
  'Credential requests': 'OTP Request',
  'Payment change': 'Payment Change',
  'Malicious attachments': 'Malicious Attachment',
  'Social engineering': 'Social Engineering',
  'QR phishing': 'QR Phishing',
  'Legitimate message': 'Legit',
  'Urgency tactics': 'Urgency',
  'Account takeover': 'Account Takeover'
};


// Function: categoryLabel
function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category || '';
}


// Function: html
// Tagged template for markup. Lets a template span several indented lines
// without adding whitespace to the output: every line break, together with
// the indentation that follows it, is removed from the literal parts.
// Interpolated values are inserted unchanged, so arrays must be joined first.
function html(strings, ...values) {
  return strings.reduce((output, part, index) =>
    output + part.replace(/\n\s*/g, '') + (index < values.length ? values[index] : ''), '');
}
