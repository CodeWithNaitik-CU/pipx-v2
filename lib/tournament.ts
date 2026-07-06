// Generates a consistent tournament ID based on the current ISO week
// Example: "week-2026-W28"
export function getCurrentTournamentId(): string {
  const now = new Date();
  const year = now.getFullYear();

  // Calculate ISO week number
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7; // Monday = 0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7
    );

  return `week-${year}-W${String(weekNumber).padStart(2, "0")}`;
}

// Returns the Monday 00:00 and Sunday 23:59 timestamps for the current week
export function getCurrentWeekRange(): { startDate: number; endDate: number } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { startDate: monday.getTime(), endDate: sunday.getTime() };
}