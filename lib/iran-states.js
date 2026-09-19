// WooCommerce's current IR state codes. Keep these aligned with the connected store.
export const IRAN_STATES = {
  ADL: 'اردبیل', ABZ: 'البرز', ILM: 'ایلام', BHR: 'بوشهر', THR: 'تهران',
  CHB: 'چهارمحال و بختیاری', SKH: 'خراسان جنوبی', RKH: 'خراسان رضوی', NKH: 'خراسان شمالی',
  KHZ: 'خوزستان', ZJN: 'زنجان', SMN: 'سمنان', SBN: 'سیستان و بلوچستان', FRS: 'فارس',
  GZN: 'قزوین', QHM: 'قم', KRD: 'کردستان', KRN: 'کرمان', KRH: 'کرمانشاه',
  KBD: 'کهگیلویه و بویراحمد', GLS: 'گلستان', GIL: 'گیلان', LRS: 'لرستان',
  MZN: 'مازندران', MKZ: 'مرکزی', HRZ: 'هرمزگان', HDN: 'همدان', YZD: 'یزد',
  ESF: 'اصفهان', EAZ: 'آذربایجان شرقی', WAZ: 'آذربایجان غربی',
};

export function iranStateCode(value) {
  if (typeof value !== 'string') return null;
  const state = value.trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ');
  const code = state.toUpperCase();
  if (Object.hasOwn(IRAN_STATES, code)) return code;
  return Object.entries(IRAN_STATES).find(([, label]) => label === state)?.[0] || null;
}
