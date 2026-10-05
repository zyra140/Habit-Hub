const toDateString = (value) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);

const getWeekRange = (date) => {
  const requestedDate = new Date(`${date}T00:00:00.000Z`);
  const weekStart = new Date(requestedDate);
  weekStart.setUTCDate(
    weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  return {
    start: weekStart.toISOString().slice(0, 10),
    end: weekEnd.toISOString().slice(0, 10),
  };
};

const isEligibleHabitDate = (habit, date) =>
  !(
    habit.weekdaysOnly &&
    [0, 6].includes(new Date(`${date}T00:00:00.000Z`).getUTCDay())
  );

const getWeekDates = (habit, date) => {
  const { start, end } = getWeekRange(date);
  const dates = [];

  for (
    let currentDate = new Date(`${start}T00:00:00.000Z`);
    currentDate.toISOString().slice(0, 10) <= end;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  ) {
    const dateString = currentDate.toISOString().slice(0, 10);
    if (isEligibleHabitDate(habit, dateString)) dates.push(dateString);
  }

  return dates;
};

const getEligibleWeekDates = (habit, date) => {
  const createdDate = toDateString(habit.createdAt);
  return getWeekDates(habit, date).filter((entry) => entry >= createdDate);
};

const getWeeklySkipLimit = (
  habit,
  date,
  completedDates = habit.completedDates || [],
) => {
  const weekDates = getWeekDates(habit, date);
  const eligibleDates = getEligibleWeekDates(habit, date);
  const completedSet = new Set(
    completedDates.map((entry) => toDateString(entry)),
  );
  const completedCount = eligibleDates.filter((entry) =>
    completedSet.has(entry),
  ).length;
  const weeklyTarget = Math.min(
    Math.max(0, Number(habit.frequency) || 0),
    weekDates.length,
  );
  return Math.max(
    0,
    weekDates.length - Math.max(weeklyTarget, completedCount),
  );
};

const getWeeklySkippedCount = (
  habit,
  date,
  skippedDays = habit.skippedDays || [],
) => {
  const eligibleDates = new Set(getEligibleWeekDates(habit, date));
  const skippedSet = new Set(skippedDays.map((entry) => toDateString(entry)));
  return [...eligibleDates].filter((entry) => skippedSet.has(entry)).length;
};

const getAutomaticPastDayStatus = (habit, date) => {
  const dateString = toDateString(date);
  if (!isEligibleHabitDate(habit, dateString)) return null;

  const completedSet = new Set(
    (habit.completedDates || []).map((entry) => toDateString(entry)),
  );
  const skippedDays = habit.skippedDays || [];
  const skippedSet = new Set(skippedDays.map((entry) => toDateString(entry)));
  const missedSet = new Set(
    (habit.missedDays || []).map((entry) => toDateString(entry)),
  );

  if (
    completedSet.has(dateString) ||
    skippedSet.has(dateString) ||
    missedSet.has(dateString)
  ) {
    return null;
  }

  return getWeeklySkippedCount(habit, dateString, skippedDays) <
    getWeeklySkipLimit(habit, dateString)
    ? "skipped"
    : "missed";
};

const getAvailableSkips = (habit, date) => {
  const dates = getEligibleWeekDates(habit, date);
  const completedSet = new Set(
    (habit.completedDates || []).map((entry) => toDateString(entry)),
  );
  const skippedSet = new Set(
    (habit.skippedDays || []).map((entry) => toDateString(entry)),
  );
  const remainingDays = dates.filter(
    (entry) =>
      entry >= date && !completedSet.has(entry) && !skippedSet.has(entry),
  ).length;
  const availableByLimit = Math.max(
    0,
    getWeeklySkipLimit(habit, date) - getWeeklySkippedCount(habit, date),
  );

  return Math.min(remainingDays, availableByLimit);
};

module.exports = {
  getAvailableSkips,
  getAutomaticPastDayStatus,
  getWeeklySkipLimit,
  getWeeklySkippedCount,
  isEligibleHabitDate,
};
