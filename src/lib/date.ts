const DAY_MS = 24 * 60 * 60 * 1000;

function localDate(dateOrIso: Date | string) {
  const date = typeof dateOrIso === 'string' ? new Date(`${dateOrIso}T00:00:00`) : new Date(dateOrIso);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfWeek(date: Date) {
  const result = localDate(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = localDate(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function formatFullDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(localDate(isoDate));
}

export function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(localDate(isoDate));
}

export function formatWeekRange(startIso: string) {
  const start = localDate(startIso);
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function isSameIsoDate(left: string, right: string) {
  return left === right;
}

export function weekSeedFor(date: Date) {
  return Math.floor(startOfWeek(date).getTime() / (7 * DAY_MS));
}