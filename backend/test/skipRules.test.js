const assert = require("node:assert/strict");
const test = require("node:test");

const { getAvailableSkips } = require("../src/utils/skipRules");

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
});

test("first-week skips cover all scheduled days remaining after Friday creation", () => {
  const habit = makeHabit({ createdAt: "2026-10-02" });

  assert.equal(getAvailableSkips(habit, "2026-10-02"), 3);
});

test("first-week skips respect a weekdays-only schedule", () => {
  const habit = makeHabit({ createdAt: "2026-10-02", weekdaysOnly: true });

  assert.equal(getAvailableSkips(habit, "2026-10-02"), 1);
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
