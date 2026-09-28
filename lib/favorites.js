export function readFavoriteIds(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter(id => Number.isSafeInteger(id) && id > 0))]
      : [];
  } catch {
    return [];
  }
}
