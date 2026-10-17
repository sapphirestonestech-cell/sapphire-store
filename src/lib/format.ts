/** Date helpers shared by server and client. */

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parse(iso: string | Date): Date | null {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Dec" — badge form (DESIGN.md §7.7). */
export function formatArrivalShort(iso: string | Date): string | null {
  const d = parse(iso);
  if (!d) return null;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "12 December" — detail-page form. */
export function formatArrivalLong(iso: string | Date): string | null {
  const d = parse(iso);
  if (!d) return null;
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}
