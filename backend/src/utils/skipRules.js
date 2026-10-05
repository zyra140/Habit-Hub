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

const getEligibleWeekDates = (habit, date) => {
  const createdDate = toDateString(habit.createdAt);
  const { start, end } = getWeekRange(date);
  const firstDate = createdDate > start ? createdDate : start;
  const dates = [];

  for (
    let currentDate = new Date(`${firstDate}T00:00:00.000Z`);
    currentDate.toISOString().slice(0, 10) <= end;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  ) {
    const dateString = currentDate.toISOString().slice(0, 10);
    if (isEligibleHabitDate(habit, dateString)) dates.push(dateString);
  }

  return dates;
};

const getWeeklySkipLimit = (
  habit,
  date,
  completedDates = habit.completedDates || [],
) => {
  const dates = getEligibleWeekDates(habit, date);
  const createdDate = toDateString(habit.createdAt);
  const { start, end } = getWeekRange(date);
  const isCreationWeek = createdDate >= start && createdDate <= end;
  const completedSet = new Set(
    completedDates.map((entry) => toDateString(entry)),
  );
  const completedCount = dates.filter((entry) =>
    completedSet.has(entry),
  ).length;

  if (isCreationWeek) {
    if (Number(habit.frequency) >= (habit.weekdaysOnly ? 5 : 7)) return 0;
    return Math.max(0, dates.length - completedCount);
  }

  const weeklyTarget = Math.min(
    Math.max(0, Number(habit.frequency) || 0),
    dates.length,
  );
  return Math.max(0, dates.length - Math.max(weeklyTarget, completedCount));
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

const getAvailableSkips = (habit, date) => {
  const dates = getEligibleWeekDates(habit, date);
  const createdDate = toDateString(habit.createdAt);
  const { start, end } = getWeekRange(date);
  const isCreationWeek = createdDate >= start && createdDate <= end;
  const completedSet = new Set(
    (habit.completedDates || []).map((entry) => toDateString(entry)),
  );
  const skippedSet = new Set(
    (habit.skippedDays || []).map((entry) => toDateString(entry)),
  );
  const completedCount = dates.filter((entry) =>
    completedSet.has(entry),
  ).length;
  const remainingDays = dates.filter(
    (entry) =>
      entry >= date && !completedSet.has(entry) && !skippedSet.has(entry),
  ).length;
  const requiredCompletions = Math.max(
    0,
    Math.min(Math.max(0, Number(habit.frequency) || 0), dates.length) -
      completedCount,
  );
  const normalRuleAvailability = Math.max(
    0,
    remainingDays - requiredCompletions,
  );
  const availableByLimit = Math.max(
    0,
    getWeeklySkipLimit(habit, date) - getWeeklySkippedCount(habit, date),
  );

  return Math.min(
    isCreationWeek ? remainingDays : normalRuleAvailability,
    availableByLimit,
  );
};

module.exports = {
  getAvailableSkips,
  getWeeklySkipLimit,
  getWeeklySkippedCount,
  isEligibleHabitDate,
};
