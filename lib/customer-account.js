// Never cache a session or an authenticated response across requests/users.
export async function loadCustomerAccount(token, request) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return { state: 'guest', account: null };
  try {
    const result = await request('me', token, 'POST');
    if (result?.status === 401) return { state: 'expired', account: null };
    const account = result?.data;
    if (result?.status === 200 && account && typeof account.name === 'string' && typeof account.email === 'string' && Array.isArray(account.orders)) return { state: 'ready', account };
  } catch { /* Do not disclose upstream errors or discard a potentially valid session. */ }
  return { state: 'unavailable', account: null };
}

export function customerOrderDate(value) {
  // /me supplies the store's calendar date, not a UTC timestamp. Do not shift
  // an order into another day through the browser/server's timezone.
  const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return 'تاریخ ثبت نشده';
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return 'تاریخ ثبت نشده';
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function customerOrderMoney(value, currency) {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) return 'مبلغ ثبت نشده';
  const code = typeof currency === 'string' ? currency.toUpperCase() : '';
  const unit = { IRT: 'تومان', TOMAN: 'تومان', IRR: 'ریال' }[code] || (/^[A-Z]{3}$/.test(code) ? code : '');
  // Native order totals are already in the order's own currency unit.
  return `${Number(value).toLocaleString('fa-IR')}${unit ? ` ${unit}` : ''}`;
}

const statuses = [
  ['processing', 'در حال آماده‌سازی', 'active', ['در حال انجام', 'در حال پردازش']],
  ['completed', 'تکمیل‌شده', 'success', ['تکمیل شده']],
  ['pending', 'در انتظار پرداخت', 'warning', ['در انتظار پرداخت']],
  ['on-hold', 'در انتظار بررسی', 'warning', ['در انتظار بررسی', 'در انتظار', 'در حالت تعلیق']],
  ['failed', 'ناموفق', 'danger', ['ناموفق']],
  ['cancelled', 'لغوشده', 'muted', ['لغو شده', 'لغو شده است']],
  ['refunded', 'بازپرداخت‌شده', 'muted', ['مسترد شده', 'بازپرداخت شده']],
];
const normalized = value => value.replace(/\u200c/g, ' ').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase();
export function customerOrderStatus(value) {
  if (typeof value !== 'string' || !value.trim()) return { label: 'وضعیت ثبت نشده', tone: 'muted' };
  const found = statuses.find(([code, label, , aliases]) => [code, label, ...aliases].some(candidate => normalized(candidate) === normalized(value)));
  // Preserve custom localized statuses without implying verified payment.
  return found ? { label: found[1], tone: found[2] } : { label: value, tone: 'muted' };
}
