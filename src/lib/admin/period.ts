export type ComparisonPeriod = "day" | "month";

export type DateRange = { start: Date; end: Date };

// "day" compares today-so-far vs. yesterday (used for point-in-time counts
// like pending tasks, which don't accumulate over a month). "month" compares
// month-to-date vs. the same span last month (used for accumulating counts
// like new leads or revenue).
export function getComparisonRanges(
  period: ComparisonPeriod,
  now: Date = new Date()
): { current: DateRange; previous: DateRange } {
  if (period === "day") {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return {
      current: { start: todayStart, end: now },
      previous: { start: yesterdayStart, end: todayStart },
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    current: { start: monthStart, end: now },
    previous: { start: prevMonthStart, end: monthStart },
  };
}

// Explicit sentinel for zero/small previous-period values instead of
// Infinity/NaN — a boutique agency's period-over-period counts are often
// small integers or zero.
export function computeEvolution(current: number, previous: number): { percent: number | null; isNew: boolean } {
  if (previous === 0) {
    return { percent: null, isNew: current > 0 };
  }
  return { percent: Math.round(((current - previous) / previous) * 100), isNew: false };
}

// Day-start buckets spanning [start, end) — used to build sparkline x-axes
// from real day-bucketed counts, capped to a sane number of points.
export function getDailyBuckets(start: Date, end: Date, maxPoints = 14): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= endDay && days.length < maxPoints) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
