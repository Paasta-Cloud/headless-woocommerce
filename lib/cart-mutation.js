// A failed response is not proof that WooCommerce did not commit the mutation.
export async function mutateCart(action, { request, sync, onError, invalidate }) {
  try {
    sync(await request('POST', action));
    return true;
  } catch (reason) {
    onError(reason.message || 'وضعیت سبد مشخص نشد. صفحه را تازه کنید.');
    try { sync(await request('GET')); } catch { invalidate(); }
    return false;
  }
}
