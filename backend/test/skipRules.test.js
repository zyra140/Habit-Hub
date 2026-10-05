const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getAvailableSkips,
  getAutomaticPastDayStatus,
} = require("../src/utils/skipRules");

const makeHabit = ({
  createdAt,
  frequency = 3,
  weekdaysOnly = false,
} = {}) => ({
  createdAt: new Date(`${createdAt}T12:00:00.000Z`),
  frequency: String(frequency),
  weekdaysOnly,
  completedDates: [],
  skippedDays: [],
  missedDays: [],
});

test("automatic past-day status spends available workday skips before marking missed", () => {
  const habit = makeHabit({
    createdAt: "2026-10-05",
    frequency: 2,
    weekdaysOnly: true,
  });
  const statuses = [];

  for (const date of [
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
  ]) {
    const status = getAutomaticPastDayStatus(habit, date);
    statuses.push(status);
    if (status === "skipped") habit.skippedDays.push(date);
    if (status === "missed") habit.missedDays.push(date);
  }

  assert.deepEqual(statuses, ["skipped", "skipped", "skipped", "missed"]);
});

test("automatic past-day status marks daily habits missed without skip allowance", () => {
  const habit = makeHabit({ createdAt: "2026-10-05", frequency: 7 });

  assert.equal(getAutomaticPastDayStatus(habit, "2026-10-05"), "missed");
});

test("automatic past-day status ignores dates outside a weekdays-only schedule", () => {
  const habit = makeHabit({
    createdAt: "2026-10-05",
    weekdaysOnly: true,
  });

  assert.equal(getAutomaticPastDayStatus(habit, "2026-10-10"), null);
});

test("Friday creation can use the remaining weekly skip allowance", () => {
  const habit = makeHabit({ createdAt: "2026-10-02" });

  assert.equal(getAvailableSkips(habit, "2026-10-02"), 3);
});

test("Monday creation gives four skips for a three-times-weekly habit", () => {
  const habit = makeHabit({ createdAt: "2026-10-05" });

  assert.equal(getAvailableSkips(habit, "2026-10-05"), 4);
});

test("Monday creation gives three skips for a two-day weekdays-only habit", () => {
  const habit = makeHabit({
    createdAt: "2026-10-05",
    frequency: 2,
    weekdaysOnly: true,
  });

  assert.equal(getAvailableSkips(habit, "2026-10-05"), 3);
});

test("Friday weekdays-only creation can skip its one remaining workday", () => {
  const habit = makeHabit({ createdAt: "2026-10-02", weekdaysOnly: true });

  assert.equal(getAvailableSkips(habit, "2026-10-02"), 1);
});

test("Thursday creation keeps two skips for a three-day weekdays-only habit", () => {
  const habit = makeHabit({
    createdAt: "2026-10-08",
    weekdaysOnly: true,
  });

  assert.equal(getAvailableSkips(habit, "2026-10-08"), 2);
});

test("daily habits do not get first-week skips", () => {
  const habit = makeHabit({ createdAt: "2026-10-02", frequency: 7 });

  assert.equal(getAvailableSkips(habit, "2026-10-02"), 0);
});

test("five-day weekdays-only habits do not get first-week skips", () => {
  const habit = makeHabit({
    createdAt: "2026-10-02",
    frequency: 5,
    weekdaysOnly: true,
  });

  assert.equal(getAvailableSkips(habit, "2026-10-02"), 0);
});

test("later weeks retain the frequency-based skip allowance", () => {
  const habit = makeHabit({ createdAt: "2026-09-25" });

  assert.equal(getAvailableSkips(habit, "2026-10-05"), 4);
});

test("changing a skipped day to completed returns one available skip", () => {
  const habit = makeHabit({ createdAt: "2026-09-25" });
  habit.skippedDays = ["2026-10-06"];

  const availableWhileSkipped = getAvailableSkips(habit, "2026-10-05");
  habit.skippedDays = [];
  habit.completedDates = ["2026-10-06"];

  assert.equal(availableWhileSkipped, 3);
  assert.equal(getAvailableSkips(habit, "2026-10-05"), 4);
});
