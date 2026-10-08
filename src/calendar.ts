import type { CalendarCell, CalendarModel, ContributionDay } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function formatISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabels(cells: CalendarCell[]): Record<number, string> {
  const weeks = new Map<number, CalendarCell[]>();
  for (const cell of cells) {
    const list = weeks.get(cell.week) ?? [];
    list.push(cell);
    weeks.set(cell.week, list);
  }

  const labels: Record<number, string> = {};
  let lastLabeledWeek = -10;

  for (const [week, list] of weeks) {
    const firstOfMonth = list.find((cell) => Number(cell.date.slice(8, 10)) === 1);
    if (week !== 0 && !firstOfMonth) continue;
    if (week !== 0 && week - lastLabeledWeek < 3) continue;
    const source = firstOfMonth ?? list[0];
    labels[week] = MONTHS[Number(source.date.slice(5, 7)) - 1] ?? "";
    lastLabeledWeek = week;
  }

  return labels;
}

export function buildCalendar(days: ContributionDay[]): CalendarModel {
  if (days.length === 0) {
    return { cells: [], weekCount: 0, monthLabels: {} };
  }

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((day) => [day.date, day]));
  const rangeStart = parseISODate(sorted[0].date);
  const rangeEnd = parseISODate(sorted[sorted.length - 1].date);
  const cursor = new Date(rangeStart);
  cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());

  const cells: CalendarCell[] = [];
  let week = 0;

  while (cursor.getTime() <= rangeEnd.getTime()) {
    const dayIndex = cursor.getUTCDay();
    const iso = formatISODate(cursor);
    if (cursor.getTime() >= rangeStart.getTime()) {
      const found = byDate.get(iso);
      const level = found?.level ?? 0;
      cells.push({
        week,
        day: dayIndex,
        date: iso,
        count: found?.count ?? 0,
        level: Math.max(0, Math.min(4, level)),
      });
    }
    if (dayIndex === 6) week += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const weekCount = cells.length > 0 ? cells[cells.length - 1].week + 1 : 0;
  return { cells, weekCount, monthLabels: monthLabels(cells) };
}

export function formatContributionDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function contributionYears(totalsByYear: Record<string, number>): number[] {
  return Object.keys(totalsByYear)
    .map(Number)
    .filter((year) => Number.isInteger(year))
    .sort((a, b) => b - a);
}
