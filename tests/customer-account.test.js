import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCustomerAccount, customerOrderDate, customerOrderMoney, customerOrderStatus } from '../lib/customer-account.js';

test('guest/malformed tokens never reach the backend', async () => {
  for (const token of [null, '', 'bad', 'a'.repeat(65), 'G'.repeat(64)]) assert.deepEqual(await loadCustomerAccount(token, () => assert.fail('must not fetch')), { state: 'guest', account: null });
});
test('private account reads remain authenticated POST and keep users isolated', async () => {
  for (const token of ['a'.repeat(64), 'b'.repeat(64)]) {
    const account = { name: token[0], email: `${token[0]}@example.test`, orders: [] };
    const result = await loadCustomerAccount(token, async (...args) => { assert.deepEqual(args, ['me', token, 'POST']); return { status: 200, data: account }; });
    assert.equal(result.state, 'ready');
    assert.equal(result.account, account);
  }
});
test('only expired authentication is expired; upstream failures disclose no account/error data', async () => {
  const token = 'a'.repeat(64);
  assert.deepEqual(await loadCustomerAccount(token, async () => ({ status: 401 })), { state: 'expired', account: null });
  for (const status of [403, 404, 429, 500, 503]) assert.deepEqual(await loadCustomerAccount(token, async () => ({ status, data: { secret: 'not-public' } })), { state: 'unavailable', account: null });
  assert.deepEqual(await loadCustomerAccount(token, async () => { throw Error('private upstream detail'); }), { state: 'unavailable', account: null });
  assert.deepEqual(await loadCustomerAccount(token, async () => ({ status: 200, data: null })), { state: 'unavailable', account: null });
  assert.deepEqual(await loadCustomerAccount(token, async () => ({ status: 200, data: { name: 'a', email: 'a@example.test', orders: {} } })), { state: 'unavailable', account: null });
});
test('native store dates use Persian calendar without timezone drift or rolled-over invalid dates', () => {
  assert.equal(customerOrderDate('2026-10-09'), new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date('2026-10-09T00:00:00Z')));
  for (const date of ['', null, 'invalid', '2026-02-30', '2026-13-01', '2026-00-01', '2026-10-09T00:00:00Z']) assert.equal(customerOrderDate(date), 'تاریخ ثبت نشده');
  assert.notEqual(customerOrderDate('2024-02-29'), 'تاریخ ثبت نشده');
});
test('native order money keeps its own unit and never makes missing values zero/NaN', () => {
  assert.equal(customerOrderMoney('180000', 'IRT'), '۱۸۰٬۰۰۰ تومان');
  assert.equal(customerOrderMoney('180000', 'IRR'), '۱۸۰٬۰۰۰ ریال');
  assert.equal(customerOrderMoney('0', 'TOMAN'), '۰ تومان');
  assert.equal(customerOrderMoney('1.5', 'USD'), '۱٫۵ USD');
  for (const value of [null, undefined, '', '  ', 'NaN', 'bad', Infinity, -1, true]) assert.equal(customerOrderMoney(value, 'IRT'), 'مبلغ ثبت نشده');
});
test('localized and custom statuses are not mistaken for verified payment', () => {
  assert.deepEqual(customerOrderStatus('در حال انجام'), { label: 'در حال آماده‌سازی', tone: 'active' });
  assert.deepEqual(customerOrderStatus('تکمیل شده'), { label: 'تکمیل‌شده', tone: 'success' });
  assert.deepEqual(customerOrderStatus('failed'), { label: 'ناموفق', tone: 'danger' });
  assert.deepEqual(customerOrderStatus('سفارش سفارشی'), { label: 'سفارش سفارشی', tone: 'muted' });
  assert.deepEqual(customerOrderStatus(null), { label: 'وضعیت ثبت نشده', tone: 'muted' });
});
