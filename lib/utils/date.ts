export function toIsoWithOffset(date = new Date(), offsetHours = 8) {
  // create a date adjusted to target timezone by adding offsetHours
  const tzMillis = offsetHours * 60 * 60 * 1000;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const target = new Date(utc + tzMillis);
  const yyyy = target.getUTCFullYear();
  const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(target.getUTCDate()).padStart(2, "0");
  const hh = String(target.getUTCHours()).padStart(2, "0");
  const min = String(target.getUTCMinutes()).padStart(2, "0");
  const ss = String(target.getUTCSeconds()).padStart(2, "0");
  const ms = String((target.getUTCMilliseconds() ?? 0)).padStart(3, "0");
  const sign = offsetHours >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetHours);
  const offH = String(Math.floor(absOffset)).padStart(2, "0");
  const offM = String(Math.round((absOffset - Math.floor(absOffset)) * 60)).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}${sign}${offH}:${offM}`;
}

export function formatForUI_MMDD_HHmm(isoString: string) {
  try {
    const d = new Date(isoString);
    // convert to Taipei timezone by adding +8 hours to UTC
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const target = new Date(utc + 8 * 60 * 60 * 1000);
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    const hh = String(target.getHours()).padStart(2, "0");
    const min = String(target.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:${min}`;
  } catch (_e) {
    return isoString;
  }
}

export function formatForUI_HHmm(isoString: string) {
  try {
    const d = new Date(isoString);
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const target = new Date(utc + 8 * 60 * 60 * 1000);
    const hh = String(target.getHours()).padStart(2, "0");
    const min = String(target.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  } catch (_e) {
    return isoString;
  }
}
