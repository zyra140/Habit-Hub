"use strict";
//////////////////////////////// SUPPORT FUNCTIONS //////////////////////////////////
// HEX TO RGBA
const hexToRgba = function (hex, alpha) {
  const hexClean = hex.replace("#", "");
  const full =
    hexClean.length === 3
      ? hexClean
          .split("")
          .map((c) => c + c)
          .join("")
      : hexClean;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getReadableIconRgb = (hex) => {
  const channels = hexToRgba(hex, 1)
    .match(/\d+/g)
    .slice(0, 3)
    .map((channel) => Math.round(Number(channel) * 0.45));

  return `rgb(${channels.join(", ")})`;
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const habitDateStatusDisplay = {
  inactive: { label: "Przed utworzeniem nawyku" },
  "not-scheduled": { label: "Poza harmonogramem" },
  completed: { label: "Wykonano" },
  skipped: { label: "Pominięto" },
  missed: { label: "Nie wykonano" },
  pending: { label: "Dzisiaj, czeka na status" },
  upcoming: { label: "Nadchodzący dzień" },
};

const habitDateStatusLegend = Object.entries(habitDateStatusDisplay)
  .map(
    ([status, { label }]) =>
      `<li><span class="calendar-status-legend-color is-${status}" aria-hidden="true"></span><span>${label}</span></li>`,
  )
  .join("");

const closeHabitInfoPopovers = () => {
  document.querySelectorAll(".habit-info-button").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.closest(".habit-dropdown-wrapper")?.classList.remove("has-open-info");
    const popover = document.getElementById(button.getAttribute("aria-controls"));
    if (popover) popover.hidden = true;
  });
  document.body.classList.remove("has-habit-info");
};

const createHabitDateStatusResolver = (habit, todayString) => {
  const createdDate = String(habit.createdAt).slice(0, 10);
  const completedDates = new Set(
    (habit.completedDates || []).map((date) => String(date).slice(0, 10)),
  );
  const skippedDates = new Set(
    (habit.skippedDays || []).map((date) => String(date).slice(0, 10)),
  );
  const missedDates = new Set(
    (habit.missedDays || []).map((date) => String(date).slice(0, 10)),
  );

  return (dateString) => {
    if (dateString < createdDate) return "inactive";

    const weekday = new Date(`${dateString}T00:00:00.000Z`).getUTCDay();
    if (habit.weekdaysOnly && [0, 6].includes(weekday))
      return "not-scheduled";
    if (completedDates.has(dateString)) return "completed";
    if (skippedDates.has(dateString)) return "skipped";
    if (missedDates.has(dateString)) return "missed";
    if (dateString === todayString) return "pending";
    if (dateString > todayString) return "upcoming";
    return "missed";
  };
};

const getAvailableSkips = (habit, dateString = getLocalDateString()) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const requestedDate = new Date(Date.UTC(year, month - 1, day));
  const weekStart = new Date(requestedDate);
  weekStart.setUTCDate(
    weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekStartString = weekStart.toISOString().slice(0, 10);
  const weekEndString = weekEnd.toISOString().slice(0, 10);
  const createdDate = String(habit.createdAt).slice(0, 10);
  const firstEligibleDate =
    createdDate > weekStartString ? createdDate : weekStartString;
  const completedDates = new Set(
    (habit.completedDates || []).map((completedDate) =>
      String(completedDate).slice(0, 10),
    ),
  );
  const skippedDates = new Set(
    (habit.skippedDays || []).map((skippedDate) =>
      String(skippedDate).slice(0, 10),
    ),
  );
  let completedDaysThisWeek = 0;
  let eligibleDaysRemaining = 0;
  let skippedDaysThisWeek = 0;

  for (
    let currentDate = new Date(`${firstEligibleDate}T00:00:00.000Z`);
    currentDate.toISOString().slice(0, 10) <= weekEndString;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  ) {
    const currentDateString = currentDate.toISOString().slice(0, 10);
    const isWeekend = [0, 6].includes(currentDate.getUTCDay());
    if (habit.weekdaysOnly && isWeekend) continue;

    if (completedDates.has(currentDateString)) completedDaysThisWeek++;
    if (skippedDates.has(currentDateString)) skippedDaysThisWeek++;
    if (
      currentDateString >= dateString &&
      !skippedDates.has(currentDateString) &&
      !completedDates.has(currentDateString)
    ) {
      eligibleDaysRemaining++;
    }
  }

  const scheduledDaysPerWeek = habit.weekdaysOnly ? 5 : 7;
  const weeklyTarget = Math.min(Number(habit.frequency), scheduledDaysPerWeek);
  const weeklySkipLimit =
    scheduledDaysPerWeek - Math.max(weeklyTarget, completedDaysThisWeek);
  const availableByLimit = Math.max(0, weeklySkipLimit - skippedDaysThisWeek);

  return Math.min(eligibleDaysRemaining, availableByLimit);
};

const calculateStreaks = (habits, today = getLocalDateString()) => {
  if (!habits.length) return { current: 0, longest: 0 };

  const createdDates = habits
    .map((habit) => String(habit.createdAt).slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  if (!createdDates.length || createdDates[0] > today) {
    return { current: 0, longest: 0 };
  }

  const firstDate = createdDates[0];
  const missedDates = new Set(
    habits.flatMap((habit) =>
      (habit.missedDays || []).map((date) => String(date).slice(0, 10)),
    ),
  );
  const isWeekend = [0, 6].includes(
    new Date(`${today}T00:00:00.000Z`).getUTCDay(),
  );
  const hasPendingHabitToday = habits.some((habit) => {
    const createdDate = String(habit.createdAt).slice(0, 10);
    if (createdDate > today || (habit.weekdaysOnly && isWeekend)) return false;

    const isCompletedToday = (habit.completedDates || []).some(
      (date) => String(date).slice(0, 10) === today,
    );
    const isSkippedToday = (habit.skippedDays || []).some(
      (date) => String(date).slice(0, 10) === today,
    );
    return !isCompletedToday && !isSkippedToday;
  });
  const streakEndDate = new Date(`${today}T00:00:00.000Z`);
  if (hasPendingHabitToday)
    streakEndDate.setUTCDate(streakEndDate.getUTCDate() - 1);
  const streakEnd = streakEndDate.toISOString().slice(0, 10);

  if (streakEnd < firstDate) return { current: 0, longest: 0 };

  let current = 0;
  let currentDate = new Date(`${streakEnd}T00:00:00.000Z`);

  while (currentDate.toISOString().slice(0, 10) >= firstDate) {
    const date = currentDate.toISOString().slice(0, 10);
    if (missedDates.has(date)) break;
    current++;
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }

  let longest = 0;
  let running = 0;
  for (
    let date = new Date(`${firstDate}T00:00:00.000Z`);
    date.toISOString().slice(0, 10) <= streakEnd;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    if (missedDates.has(date.toISOString().slice(0, 10))) {
      running = 0;
    } else {
      running++;
      longest = Math.max(longest, running);
    }
  }

  return { current, longest };
};

const formatStreakDays = (count) => `${count} ${count === 1 ? "dzień" : "dni"}`;
const formatHabitCount = (count) =>
  count === 1
    ? "1 nawyk"
    : count >= 2 && count <= 4
      ? `${count} nawyki`
      : `${count} nawyków`;

const getHabitScheduleText = (habit) => {
  const frequencyText =
    habit.frequency === "7"
      ? "Codziennie"
      : habit.frequency === "1"
        ? "1 raz w tygodniu"
        : `${habit.frequency} razy w tygodniu`;
  const scheduleDaysText = habit.weekdaysOnly ? "dni robocze" : "dowolne dni";
  return `${frequencyText} (${scheduleDaysText})`;
};

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const renderWeekCalendar = (habits) => {
  const calendar = document.querySelector("#weekCalendar");
  if (!calendar) return;

  if (!habits.length) {
    calendar.innerHTML = `
      <div class="container-week-calendar-info">
        <div class="img-box img-box--week-calendar">
          <img src="../icons/calendar-days-regular-full.svg" alt="" />
        </div>
        <div class="week-calendar-text-wrapper">
          <p>Twój kalendarz pojawi się tutaj, gdy dodasz pierwszy nawyk</p>
        </div>
      </div>
    `;
    return;
  }

  const todayString = getLocalDateString();
  const [year, month, day] = todayString.split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
  const weekdayNames = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
  const headers = weekDates
    .map((date, index) => {
      const dateString = getLocalDateString(date);
      return `<div class="week-calendar-cell week-calendar-header ${dateString === todayString ? "is-today" : ""}">
        <span>${weekdayNames[index]}</span><span>${date.getDate()}</span>
      </div>`;
    })
    .join("");

  const rows = habits
    .map((habit) => {
      const getDateStatus = createHabitDateStatusResolver(habit, todayString);
      const cells = weekDates
        .map((date) => {
          const dateString = getLocalDateString(date);
          const status = getDateStatus(dateString);
          const { label } = habitDateStatusDisplay[status];
          const todayClass = dateString === todayString ? " is-today" : "";
          const adjacentMonthClass =
            dateString.slice(0, 7) !== todayString.slice(0, 7)
              ? " is-adjacent-month"
              : "";

          return `<div class="week-calendar-cell week-calendar-status is-${status}${todayClass}${adjacentMonthClass}" title="${label}: ${dateString}" aria-label="${label}: ${dateString}"></div>`;
        })
        .join("");

      return `<div class="week-calendar-row">
        <div class="week-calendar-habit" title="${escapeHTML(habit.name)}">${escapeHTML(habit.name)}</div>
        ${cells}
      </div>`;
    })
    .join("");

  calendar.innerHTML = `
    <div class="week-calendar-grid">
      <div class="week-calendar-habit week-calendar-header">Nawyk</div>
      ${headers}
      ${rows}
    </div>
  `;
};

const renderWeekStatusEditor = (habit) => {
  const today = getLocalDateString();
  const [year, month, day] = today.split("-").map(Number);
  const weekStart = new Date(Date.UTC(year, month - 1, day));
  weekStart.setUTCDate(
    weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
  );
  const weekStartString = weekStart.toISOString().slice(0, 10);
  const createdDate = String(habit.createdAt).slice(0, 10);
  const firstDate =
    createdDate > weekStartString ? createdDate : weekStartString;
  const completedDates = new Set(
    (habit.completedDates || []).map((date) => String(date).slice(0, 10)),
  );
  const skippedDates = new Set(
    (habit.skippedDays || []).map((date) => String(date).slice(0, 10)),
  );
  const missedDates = new Set(
    (habit.missedDays || []).map((date) => String(date).slice(0, 10)),
  );
  const initialAvailableSkips = getAvailableSkips(habit, weekStartString);
  const options = [];

  for (
    let date = new Date(`${firstDate}T00:00:00.000Z`);
    date.toISOString().slice(0, 10) <= today;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const dateString = date.toISOString().slice(0, 10);
    if (habit.weekdaysOnly && [0, 6].includes(date.getUTCDay())) continue;

    const status = completedDates.has(dateString)
      ? "completed"
      : skippedDates.has(dateString)
        ? "skipped"
        : missedDates.has(dateString)
          ? "missed"
          : "pending";
    const label = new Intl.DateTimeFormat("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date);
    options.push(
      `<option value="${dateString}" data-status="${status}">${label}</option>`,
    );
  }

  return `
    <div class="week-status-editor" hidden>
      <label>
        Dzień
        <select class="week-edit-date" ${options.length ? "" : "disabled"}>
          ${options.join("")}
        </select>
      </label>
      <label>
        Status
        <select class="week-edit-status" ${options.length ? "" : "disabled"}>
          <option value="completed">Wykonano</option>
          <option value="skipped" ${initialAvailableSkips === 0 ? "disabled" : ""}>Pominięto</option>
          <option value="missed">Nie wykonano</option>
          <option value="pending">Bez statusu</option>
        </select>
      </label>
      <p class="week-skips-remaining" aria-live="polite">Pozostałe pominięcia w tym tygodniu: ${initialAvailableSkips}</p>
      <button class="save-week-status" type="button" ${options.length ? "" : "disabled"}>
        Zapisz dzień
      </button>
    </div>
  `;
};

const updateWeekStatusEditor = (editor) => {
  const habitPanel = editor.closest(".wrapper-habit-panel");
  const habit = dashboardHabits.find(
    (entry) => String(entry._id) === habitPanel?.dataset.habitId,
  );
  if (!habit) return;

  const dateSelect = editor.querySelector(".week-edit-date");
  const statusSelect = editor.querySelector(".week-edit-status");
  const selectedOption = dateSelect.selectedOptions[0];
  const currentStatus = selectedOption?.dataset.status || "pending";
  const isAlreadySkipped = currentStatus === "skipped";
  const skippedOption = statusSelect.querySelector('option[value="skipped"]');
  const saveButton = editor.querySelector(".save-week-status");
  const remainingText = editor.querySelector(".week-skips-remaining");
  const weekStart = new Date(`${getLocalDateString()}T00:00:00.000Z`);
  weekStart.setUTCDate(
    weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
  );
  const weekStartString = weekStart.toISOString().slice(0, 10);
  const availableBeforeChange = getAvailableSkips(habit, weekStartString);
  const cannotAddSkip = availableBeforeChange === 0 && !isAlreadySkipped;

  skippedOption.disabled = cannotAddSkip;
  saveButton.disabled =
    !dateSelect.value || (statusSelect.value === "skipped" && cannotAddSkip);

  const updatedHabit = {
    ...habit,
    completedDates: (habit.completedDates || []).filter(
      (date) => String(date).slice(0, 10) !== dateSelect.value,
    ),
    skippedDays: (habit.skippedDays || []).filter(
      (date) => String(date).slice(0, 10) !== dateSelect.value,
    ),
    missedDays: (habit.missedDays || []).filter(
      (date) => String(date).slice(0, 10) !== dateSelect.value,
    ),
  };
  if (statusSelect.value === "completed")
    updatedHabit.completedDates.push(dateSelect.value);
  if (statusSelect.value === "skipped")
    updatedHabit.skippedDays.push(dateSelect.value);
  if (statusSelect.value === "missed")
    updatedHabit.missedDays.push(dateSelect.value);

  const projectedAvailableSkips = getAvailableSkips(
    updatedHabit,
    weekStartString,
  );
  remainingText.textContent = `Pozostałe pominięcia w tym tygodniu: ${projectedAvailableSkips}`;
  remainingText.classList.toggle(
    "is-limit-reached",
    projectedAvailableSkips === 0,
  );
};

// BLANK HABIT UI UPDATE
const habitBlankHabits = document.querySelector(".grid-blank-habit");
const habitBlankMain = document.querySelector(".grid-blank-habits");

const DisactiveBlankHabitUI = function () {
  habitBlankHabits?.classList.add("display-none");
  habitBlankMain?.classList.add("display-none");
};

const ActiveBlankHabitUI = function () {
  habitBlankHabits?.classList.remove("display-none");
  habitBlankMain?.classList.remove("display-none");
};

// };

// blankHabitUI();

// RENDER HABIT
const renderHabit = function (habit, prepend = true) {
  const today = new Date();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const weekdays = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];

  const color = habit.color;
  const iconBackgroundColor = hexToRgba(color, 0.15);
  const todayString = getLocalDateString(today);
  const getDateStatus = createHabitDateStatusResolver(habit, todayString);

  //calendar
  const firstDayOfMonth =
    (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCellCount = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  // rendering weekdays names
  const calendarHeadersHTML = weekdays
    .map(function (weekday) {
      return `<li class="calendar-cell calendar-header"><p class="paragraph-description">${weekday}</p></li>`;
    })
    .join("");

  // Render previous, current and next month days in chronological order.
  const calendarDaysHTML = Array.from(
    { length: calendarCellCount },
    function (_, index) {
      // checking wchich day is first monday // current month or previous
      const date = new Date(
        currentYear,
        currentMonth,
        index - firstDayOfMonth + 1,
      );
      const dateString = getLocalDateString(date);
      const day = date.getDate();
      const dayClasses = ["calendar-cell", "calendar-day"];
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isToday = date.toDateString() === today.toDateString();
      const status = getDateStatus(dateString);
      const { label } = habitDateStatusDisplay[status];

      if (!isCurrentMonth) dayClasses.push("is-adjacent-month");
      if (isToday) dayClasses.push("is-today");
      dayClasses.push(`is-${status}`);

      return `<li class="${dayClasses.join(" ")}" title="${label}: ${dateString}" aria-label="${label}: ${dateString}"><span class="day-panel-fake-checkbox">${day}</span></li>`;
    },
  ).join("");

  // adding html elements to one
  const calendarColumnsHTML = calendarHeadersHTML + calendarDaysHTML;

  //frequency
  const scheduleText = getHabitScheduleText(habit);
  const availableSkips = getAvailableSkips(habit);

  // final HTML to insert
  const HTML = `
              <div class="grid wrapper-habit-panel" data-habit-id=${habit._id}>
                <div class="habit-dropdown-wrapper">
                  <button class="btn--edit-habit" type="button" aria-label="Opcje nawyku" title="Opcje nawyku">&vellip;</button>
                  <button class="habit-info-button" type="button" aria-label="Legenda i informacje o nawyku" aria-haspopup="dialog" aria-expanded="false" aria-controls="habit-info-${habit._id}" title="Legenda statusów">i</button>
                  <div class="habit-info-popover" id="habit-info-${habit._id}" role="dialog" aria-label="Legenda statusów" hidden>
                    <button class="habit-info-close" type="button" aria-label="Zamknij legendę">×</button>
                    <strong>Legenda statusów</strong>
                    <ul class="calendar-status-legend" aria-label="Kolory statusów dni">
                      ${habitDateStatusLegend}
                    </ul>
                    <strong>Informacje o nawyku</strong>
                    <p>${scheduleText}</p>
                    <p>Pozostałe pominięcia w tym tygodniu: <strong>${availableSkips}</strong></p>
                  </div>
                  <div class="habit-dropdown-menu">
                    <button class="edit-button">
                      <img
                        class="icon-dropdown"
                        src="../icons/edit-pencil-line-01-svgrepo-com.svg"
                        alt=""
                      />
                      <span class="edit-button-label">Edytuj</span>
                    </button>
                    <button class="delete-button">
                      <img
                        class="icon-dropdown"
                        src="../icons/delete-2-svgrepo-com.svg"
                        alt=""
                      />
                      Usuń
                    </button>
                  </div>
                </div>

                <div class="wrapper-habit-content">
                  <div class="img-box img-box--habit" style="background-color: ${iconBackgroundColor};">
                    <span
                      class="habit-card-icon"
                      style="--habit-icon: url('${resolveHabitIcon(habit.icon)}'); --habit-icon-color: ${getReadableIconRgb(color)};"
                      aria-hidden="true"
                    ></span>
                  </div>
                  <div class="wrapper-habit-description-text">
                    <h3 class="heading-tertiary">${habit.name}</h3>
                    <p class="paragraph-description">${scheduleText}</p>
                  </div>
                </div>

                <div class="wrapper-habit-calendar">
                  <ul class="habit-list grid grid--7-cols">
                    ${calendarColumnsHTML}
                  </ul>
                </div>
                ${renderWeekStatusEditor(habit)}
              </div>
  `;

  //inserting html to container
  habitsContainer.insertAdjacentHTML(prepend ? "afterbegin" : "beforeend", HTML);
};

// DELATE HABIT

//////////////////////////////// LOGIN / REGISER //////////////////////////////////
const API_URL = "http://localhost:5000";
const loginPopup = document.querySelector(".section-login-popup");
const loginView = document.querySelector(".auth-view-login");
const registerView = document.querySelector(".auth-view-register");
const authSwitchers = document.querySelectorAll(".auth-switch");
const loginEmailInput = document.querySelector("#login-email");
const loginPasswordInput = document.querySelector("#login-password");
const loginSubmitBtn = document.querySelector(".auth-view-login .btn--login");
const registerNameInput = document.querySelector("#register-name");
const registerEmailInput = document.querySelector("#register-email");
const registerPasswordInput = document.querySelector("#register-password");
const registerPasswordConfirmInput = document.querySelector(
  "#register-password-confirm",
);
const registerSubmitBtn = document.querySelector(
  ".auth-view-register .btn--login",
);
const logoutBtn = document.querySelector(".log-out-button");
const profileWrapper = document.querySelector(".nav-profile-wrapper");
const profileDropdown = document.querySelector(".profile-dropdown-menu");
const profileImage = document.querySelector(".profile-img");
const nameLetter = document.querySelector(".name-letter");
const profileName = document.querySelector("#profileName");

function updateProfileName() {
  const name = localStorage.getItem("name")?.trim().split(/\s+/)[0] || "";
  if (profileName) profileName.textContent = name;
  if (nameLetter) nameLetter.textContent = name.charAt(0).toUpperCase();
}

// ZMIANA UI PO ZALOGOWANIU
function hideAuthModal() {
  document.documentElement.classList.add("has-saved-session");

  if (loginPopup) {
    loginPopup.setAttribute("hidden", "hidden");
    loginPopup.style.display = "none";
  }

  document.body.classList.remove("modal-open");

  updateProfileName();
}

// ZMIANA UI PRZED ZALOGOWANIEM
function showAuthModal() {
  document.documentElement.classList.remove("has-saved-session");

  if (loginPopup) {
    loginPopup.removeAttribute("hidden");
    loginPopup.style.display = "grid";
  }
  document.body.classList.add("modal-open");
}

function completeAuthSuccess() {
  hideAuthModal();
  loginView?.removeAttribute("hidden");
  registerView?.setAttribute("hidden", "hidden");
  loadHabits();
}

const savedToken = localStorage.getItem("token");

if (savedToken) {
  hideAuthModal();
}

//LOAD HABITS FROM BACKEND
async function loadHabits() {
  const token = localStorage.getItem("token");

  // Nie ma zalogowanego użytkownika
  if (!token) {
    if (habitsContainer) habitsContainer.innerHTML = "";
    if (habitListCount) habitListCount.textContent = formatHabitCount(0);
    ActiveBlankHabitUI();
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/habits?today=${getLocalDateString()}`,
      {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Nie udało się pobrać nawyków");
    }

    const currentHabitOrder = new Map(
      Array.from(habitsContainer?.children || [], (panel, index) => [
        panel.dataset.habitId,
        index,
      ]),
    );
    const habitsToRender = [...data.habits];
    if (currentHabitOrder.size) {
      habitsToRender.sort((left, right) => {
        const leftIndex = currentHabitOrder.get(String(left._id));
        const rightIndex = currentHabitOrder.get(String(right._id));
        if (leftIndex === undefined) return rightIndex === undefined ? 0 : 1;
        if (rightIndex === undefined) return -1;
        return leftIndex - rightIndex;
      });
    } else {
      habitsToRender.reverse();
    }

    dashboardHabits = data.habits;
    renderWeekCalendar(data.habits);
    if (habitListCount) {
      habitListCount.textContent = formatHabitCount(data.habits.length);
    }
    if (data.habits.length === 0) ActiveBlankHabitUI();
    else DisactiveBlankHabitUI();

    console.log("Pobrane nawyki:", data.habits);

    // Czyścimy aktualne karty
    if (!habitsContainer) return;
    habitsContainer.innerHTML = "";

    // Renderujemy każdy habit
    habitsToRender.forEach((habit) => {
      renderHabit(habit, false);
    });
  } catch (error) {
    console.error("Błąd podczas pobierania nawyków:", error);

    // Jeżeli token wygasł / jest nieprawidłowy
    if (error.message === "Nieprawidłowy lub wygasły token") {
      localStorage.removeItem("token");
      habitsContainer.innerHTML = "";
    }
  }
}

// PROFILE DROPDOWN
// opening dropdown
profileWrapper?.addEventListener("click", function () {
  profileDropdown.classList.toggle("is-open");
});

// log out button
logoutBtn?.addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
  updateProfileName();

  if (habitsContainer) {
    habitsContainer.innerHTML = "";
  }
  showAuthModal();
  loginView?.removeAttribute("hidden");
  registerView?.setAttribute("hidden", "hidden");
});

//// SWITCHING MODLAS LOGIN / REGISTER ///
authSwitchers.forEach((btn) => {
  btn.addEventListener("click", function () {
    const showRegister = registerView.hasAttribute("hidden"); // true or flase

    loginView.toggleAttribute("hidden", showRegister);
    registerView.toggleAttribute("hidden", !showRegister);
  });
});

//// BACKEND ///
// autoryzacja
async function handleAuthRequest(url, payload, successMessage) {
  try {
    const response = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      alert(data.message || "Wystąpił błąd");
      return null;
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.user.name);
    }

    alert(successMessage || data.message);
    return data;
  } catch (error) {
    console.error("Auth error:", error);
    alert("Nie udało się połączyć z serwerem");
    return null;
  }
}

// login
loginSubmitBtn?.addEventListener("click", async function () {
  const email = loginEmailInput?.value.trim();
  const password = loginPasswordInput?.value.trim();

  if (!email || !password) {
    alert("Uzupełnij email i hasło");
    return;
  }

  const data = await handleAuthRequest(
    "/api/auth/login",
    { email, password },
    "Zalogowano pomyślnie",
  );

  if (data?.user) {
    completeAuthSuccess();
    console.log("Zalogowany użytkownik:", data.user);
  }
});

//register
registerSubmitBtn?.addEventListener("click", async function () {
  const name = registerNameInput?.value.trim();
  const email = registerEmailInput?.value.trim();
  const password = registerPasswordInput?.value.trim();
  const confirmPassword = registerPasswordConfirmInput?.value.trim();

  if (!name || !email || !password || !confirmPassword) {
    alert("Uzupełnij wszystkie pola");
    return;
  }

  if (password !== confirmPassword) {
    alert("Hasła nie są takie same");
    return;
  }

  const data = await handleAuthRequest(
    "/api/auth/register",
    { name, email, password },
    "Konto zostało utworzone",
  );

  if (data?.token) {
    completeAuthSuccess();
  }
});

// ZMIANA IMIENIA PO ZALOGOWANIU
// mainPageNameDisplay?.textContent = `Dzień dobry, Hubert! 👋`;

//////////////////////////////// ADDING HABITS //////////////////////////////////
//// ICON DROPDOWN ///
const iconPicker = document.querySelector(".icon-picker");
const pickerTrigger = document.querySelector(".picker-trigger");
const iconMenu = document.querySelector(".icon-picker-menu");
const habitsContainer = document.querySelector(".habits-container");
const addHabitBtn = document.querySelector(".btn--add-habit");
const inputIcon = document.querySelector(".icon-selector-icon");
const inputName = document.querySelector(".input-name");
const inputFrequency = document.querySelector(".input-frequency");
const inputWeekdaysOnly = document.querySelector(".input-weekdays-only");
const inputColor = document.querySelector(".input-color");
const inputColorCircle = document.querySelector(".color-circle");
const deleteButton = document.querySelector(".delete-button");

const highFrequencyOptions = Array.from(inputFrequency?.options || []).filter(
  (option) => Number(option.value) > 5,
);
inputWeekdaysOnly?.addEventListener("change", () => {
  highFrequencyOptions.forEach((option) => {
    option.disabled = inputWeekdaysOnly.checked;
    option.hidden = inputWeekdaysOnly.checked;
  });

  if (inputWeekdaysOnly.checked && Number(inputFrequency.value) > 5) {
    inputFrequency.value = "5";
  }
});

// dropdown content render
const iconArr = [
  "../icons/habit-icons/alarm-clock.svg",
  "../icons/habit-icons/ball.svg",
  "../icons/habit-icons/battery.svg",
  "../icons/habit-icons/bed.svg",
  "../icons/habit-icons/bicycle.svg",
  "../icons/habit-icons/book.svg",
  "../icons/habit-icons/brain.svg",
  "../icons/habit-icons/briefcase.svg",
  "../icons/habit-icons/camera.svg",
  "../icons/habit-icons/carrot.svg",
  "../icons/habit-icons/coffee.svg",
  "../icons/habit-icons/color-palette.svg",
  "../icons/habit-icons/croissant.svg",
  "../icons/habit-icons/drop.svg",
  "../icons/habit-icons/fire.svg",
  "../icons/habit-icons/fist.svg",
  "../icons/habit-icons/flag-mountain.svg",
  "../icons/habit-icons/gamepad.svg",
  "../icons/habit-icons/glass.svg",
  "../icons/habit-icons/gym.svg",
  "../icons/habit-icons/headphones.svg",
  "../icons/habit-icons/heart-book.svg",
  "../icons/habit-icons/heart-music.svg",
  "../icons/habit-icons/ladder.svg",
  "../icons/habit-icons/lamp.svg",
  "../icons/habit-icons/laundry.svg",
  "../icons/habit-icons/lightning.svg",
  "../icons/habit-icons/medicine.svg",
  "../icons/habit-icons/money-bag.svg",
  "../icons/habit-icons/monitor.svg",
  "../icons/habit-icons/moon.svg",
  "../icons/habit-icons/pen.svg",
  "../icons/habit-icons/phone.svg",
  "../icons/habit-icons/plant.svg",
  "../icons/habit-icons/running.svg",
  "../icons/habit-icons/shop-cart.svg",
  "../icons/habit-icons/stairs-flag.svg",
  "../icons/habit-icons/sun.svg",
  "../icons/habit-icons/sunrise.svg",
  "../icons/habit-icons/toast-bread.svg",
  "../icons/habit-icons/tooth-brush.svg",
  "../icons/habit-icons/weight-loss.svg",
];

const resolveHabitIcon = function (icon) {
  const storedIcon = String(icon || "");
  const filename = storedIcon.split(/[\\/]/).pop().split(/[?#]/)[0];

  return (
    iconArr.find((iconPath) => iconPath.endsWith(`/${filename}`)) || storedIcon
  );
};

const iconsHTML = iconArr
  .map(
    (icon) => `
      <button type="button" class="icon-option">
        <img
          src="${icon}"
        />
      </button>
    `,
  )
  .join("");

iconMenu?.insertAdjacentHTML("afterbegin", iconsHTML);

// toggle dropdown
pickerTrigger?.addEventListener("click", function () {
  iconPicker.classList.toggle("open");
});

// close dropdown when clicking on the page
if (iconPicker)
  document.addEventListener("click", function (e) {
    if (!iconPicker.contains(e.target)) iconPicker.classList.remove("open");
  });

// changing icon to picked one
iconMenu?.addEventListener("click", function (e) {
  const iconInput = e.target.closest(".icon-option");

  if (!iconInput) return;

  inputIcon.src = iconInput.querySelector("img").src;
  iconPicker.classList.toggle("open");
});

// color input
inputColor?.addEventListener("input", () => {
  if (inputColorCircle)
    inputColorCircle.style.backgroundColor = inputColor.value;
});

/////////////////////////////////////
//// ADDING HABIT ///
////////////////////////////////////
addHabitBtn?.addEventListener("click", async function () {
  // VALIDATION
  const habitName = inputName.value.trim();
  if (!habitName) return alert("Nieprawidłowa nazwa nawyku!");

  const normalizedName = habitName.toLowerCase();
  const duplicateName = dashboardHabits.some(
    (habit) => habit.name.trim().toLowerCase() === normalizedName,
  );
  if (duplicateName) return alert("Nawyk o takiej nazwie już istnieje");

  // BACK AND SAVE / BACKEND VALIDATION => UPDATE UI
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Musisz być zalogowany!");
      return;
    }

    const response = await fetch(`${API_URL}/api/habits`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        name: habitName,
        frequency: inputFrequency.value,
        weekdaysOnly: inputWeekdaysOnly.checked,
        icon: inputIcon.src,
        color: inputColor.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Nie udało się zapisać nawyku");
    }

    console.log("Nawyk zapisany w MongoDB:", data.habit);

    //REDNER
    renderHabit(data.habit);
    dashboardHabits.push(data.habit);
    if (habitListCount) {
      habitListCount.textContent = formatHabitCount(dashboardHabits.length);
    }

    // UPDATE UI
    DisactiveBlankHabitUI();
  } catch (error) {
    console.error("Błąd podczas zapisywania nawyku:", error);
    alert(error.message);
  }
});

//// EDIT HABIT BUTTON ///
// event listener
habitsContainer?.addEventListener("click", async function (e) {
  const closeInfoButton = e.target.closest(".habit-info-close");
  if (closeInfoButton) {
    closeHabitInfoPopovers();
    return;
  }

  const infoButton = e.target.closest(".habit-info-button");
  if (infoButton) {
    const wrapper = infoButton.closest(".habit-dropdown-wrapper");
    const popover = wrapper?.querySelector(".habit-info-popover");
    if (!popover) return;

    const shouldOpen = popover.hidden;
    closeHabitInfoPopovers();
    wrapper.querySelector(".habit-dropdown-menu")?.classList.remove("is-open");
    popover.hidden = !shouldOpen;
    infoButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) {
      wrapper.classList.add("has-open-info");
      document.body.classList.add("has-habit-info");
    }
    return;
  }

  const saveDayButton = e.target.closest(".save-week-status");
  if (saveDayButton) {
    const habitPanel = saveDayButton.closest(".wrapper-habit-panel");
    const date = habitPanel.querySelector(".week-edit-date").value;
    const status = habitPanel.querySelector(".week-edit-status").value;
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Musisz być zalogowany!");
      return;
    }

    saveDayButton.disabled = true;
    try {
      const response = await fetch(
        `${API_URL}/api/habits/${habitPanel.dataset.habitId}/day-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date, status }),
        },
      );
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Nie udało się zmienić statusu dnia");
      await loadHabits();
    } catch (error) {
      alert(error.message);
    } finally {
      saveDayButton.disabled = false;
    }
    return;
  }

  const actionButton = e.target.closest(".edit-button, .delete-button");
  const deleteButton = e.target.closest(".delete-button");
  const editButton = e.target.closest(".edit-button");

  // DELETING
  if (deleteButton) {
    const habitPanel = e.target.closest(".wrapper-habit-panel");
    const habitId = habitPanel.dataset.habitId;

    // pobieramy token zalogowanego użytkownika
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Musisz być zalogowany!");
      return;
    }

    // delete confirm
    const confirmed = confirm("Czy na pewno chcesz usunąć ten nawyk?");

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/habits/${habitId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Nie udało się usunąć nawyku");
      }

      console.log("Backend usunął habit:", data);

      // usuwamy habit również z UI
      habitPanel.remove();
      dashboardHabits = dashboardHabits.filter(
        (habit) => String(habit._id) !== String(habitId),
      );
      if (habitListCount) {
        habitListCount.textContent = formatHabitCount(dashboardHabits.length);
      }
      renderWeekCalendar(dashboardHabits);
      if (dashboardHabits.length === 0) ActiveBlankHabitUI();
    } catch (error) {
      console.error("Błąd podczas usuwania habit:", error);

      alert(error.message);
    }

    return;
  }

  //EDITING
  if (editButton) {
    const habitPanel = e.target.closest(".wrapper-habit-panel");
    const isEditing = habitPanel.classList.toggle("is-editing");
    const editor = habitPanel.querySelector(".week-status-editor");
    const dateSelect = habitPanel.querySelector(".week-edit-date");
    const statusSelect = habitPanel.querySelector(".week-edit-status");
    const editLabel = editButton.querySelector(".edit-button-label");

    editor.hidden = !isEditing;
    editLabel.textContent = isEditing ? "Zakończ edycję" : "Edytuj";
    if (isEditing) {
      statusSelect.value =
        dateSelect.selectedOptions[0]?.dataset.status || "pending";
      updateWeekStatusEditor(editor);
    }
  }

  if (actionButton) {
    // closing dropdown on action button click
    const wrapper = actionButton.closest(".habit-dropdown-wrapper");
    const menu = wrapper?.querySelector(".habit-dropdown-menu");
    menu?.classList.remove("is-open");
    return;
  }

  const button = e.target.closest(".btn--edit-habit");
  if (!button) return;

  const wrapper = button.closest(".habit-dropdown-wrapper");
  const menu = wrapper?.querySelector(".habit-dropdown-menu");

  closeHabitInfoPopovers();
  menu?.classList.toggle("is-open");
});

habitsContainer?.addEventListener("change", (e) => {
  const editor = e.target.closest(".week-status-editor");
  if (!editor) return;

  if (e.target.matches(".week-edit-date")) {
    const statusSelect = editor.querySelector(".week-edit-status");
    statusSelect.value =
      e.target.selectedOptions[0]?.dataset.status || "pending";
  }

  updateWeekStatusEditor(editor);
});

// Closing dropdowns
document.addEventListener("click", function (e) {
  const editHabitDropdowns = document.querySelectorAll(".habit-dropdown-menu");
  const clickedInsideDropdown = e.target.closest(".habit-dropdown-wrapper");
  const clickedInsideProfileDropdown = e.target.closest(".nav-profile-wrapper");

  if (clickedInsideDropdown || clickedInsideProfileDropdown) return;

  if (profileDropdown?.classList.contains("is-open")) {
    profileDropdown.classList.remove("is-open");
  }

  editHabitDropdowns.forEach((dropdown) => {
    if (dropdown.classList.contains("is-open")) {
      dropdown.classList.remove("is-open");
    }
  });
  closeHabitInfoPopovers();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeHabitInfoPopovers();
});

////////////////////////////////////// INDEX HTML //////////////////////////////////
const todayProgresText = document.querySelector(".stats-text");
const habitCounter = document.querySelector(".habit-count-text");
const habitListCount = document.querySelector(".habit-list-count");
const sectionDayToDo = document.querySelector(".container-day-to-do");
const mainPageNameDisplay = document.querySelector("#nameDisplay");
const mainPageDate = document.querySelector(".day-summary-date");
const dailyChartPercentText = document.querySelector("#dailyChartPercentText");
const currentStreakText = document.querySelector("#currentStreak");
const longestStreakText = document.querySelector("#longestStreak");
let totalHabits = 0;
let completedHabitsToday = 0;
let dashboardHabits = [];

const updateStreakStats = (habits, date) => {
  const streaks = calculateStreaks(habits, date);
  if (currentStreakText)
    currentStreakText.textContent = formatStreakDays(streaks.current);
  if (longestStreakText)
    longestStreakText.textContent = formatStreakDays(streaks.longest);
};

// CHANGING UI AFTER ADDING HABITS
async function changeMainPageUI() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name");
  const today = getLocalDateString();

  // Nie ma zalogowanego użytkownika
  if (!token) {
    if (habitsContainer) habitsContainer.innerHTML = "";
    if (habitCounter) habitCounter.textContent = formatHabitCount(0);
    ActiveBlankHabitUI();
    return;
  }

  // Chanign main page h1 to user name
  if (mainPageNameDisplay)
    mainPageNameDisplay.innerHTML = `Dzień dobry ${userName}`;

  if (mainPageDate) {
    mainPageDate.textContent = new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  try {
    const response = await fetch(
      `${API_URL}/api/habits?today=${getLocalDateString()}`,
      {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Nie udało się pobrać nawyków");
    }

    if (!Array.isArray(data.habits)) return;

    dashboardHabits = data.habits;
    renderWeekCalendar(dashboardHabits);
    updateStreakStats(dashboardHabits, today);

    // changing stats text and chart %
    const isCompletedToday = (habit) =>
      habit.completedDates.some((date) => String(date).startsWith(today));
    const isSkippedToday = (habit) =>
      (habit.skippedDays || []).some((date) => String(date).startsWith(today));
    const isWeekend = [0, 6].includes(new Date().getDay());
    const habitsDueToday = data.habits.filter(
      (habit) => !(habit.weekdaysOnly && isWeekend),
    );

    totalHabits = habitsDueToday.length;

    completedHabitsToday = habitsDueToday.filter(isCompletedToday).length;

    const completionPercentage = totalHabits
      ? Math.round((completedHabitsToday / totalHabits) * 100)
      : 0;

    if (todayProgresText)
      todayProgresText.innerHTML = `${completedHabitsToday} / ${totalHabits}`;

    // daily chart %
    dailyChart.updateSeries([{ data: [completionPercentage] }]);

    if (dailyChartPercentText)
      dailyChartPercentText.innerHTML = `${completionPercentage}%`;

    //chaning habit counter text
    const pendingHabitsToday = habitsDueToday.filter(
      (habit) => !isCompletedToday(habit) && !isSkippedToday(habit),
    );
    if (habitCounter)
      habitCounter.textContent = formatHabitCount(pendingHabitsToday.length);

    sectionDayToDo
      ?.querySelectorAll(".container-daily-habits")
      .forEach((habit) => {
        habit.remove();
      });

    if (data.habits.length === 0) ActiveBlankHabitUI();
    else DisactiveBlankHabitUI();

    // section day to do render habits
    const renderDailyHabit = function (habit) {
      const availableSkips = getAvailableSkips(habit);
      const HTML = `
          <div class="container-daily-habits" data-habit-id=${habit._id}>
            <div class="desc-daily-habits">
              <div class="img-box img-box--habit" style="background-color: ${hexToRgba(habit.color, 0.15)};">
                <span
                  class="habit-card-icon"
                  style="--habit-icon: url('${resolveHabitIcon(habit.icon)}'); --habit-icon-color: ${getReadableIconRgb(habit.color)};"
                  aria-hidden="true"
                ></span>
              </div>
              <div class="text-daily-habits">
                <h3 class="heading-tertiary habit-title">${habit.name}</h3>
                <p class="p-daily-habits">${getHabitScheduleText(habit)}</p>
              </div>
            </div>
            <div class="container-daily-habbits-btn">
              <button class="btn btn--done">
                <img
                  class="btn-icon-done"
                  src="../icons/done-v-svgrepo-com.svg"
                  alt=""
                />
                Wykonano
              </button>
              <button class="btn btn--skip" ${availableSkips === 0 ? "disabled" : ""}>
                <img
                  class="btn-icon-skip"
                  src="../icons/close-svgrepo-com (3).svg"
                  alt=""
                />
                Pomiń (${availableSkips})
              </button>
            </div>
          </div>
      `;

      sectionDayToDo?.insertAdjacentHTML("beforeend", HTML);
    };

    // render only not copleted habits
    pendingHabitsToday.slice().reverse().forEach(renderDailyHabit);
  } catch (error) {
    console.error("Błąd podczas pobierania nawyków:", error);

    // Jeżeli token wygasł / jest nieprawidłowy
    if (error.message === "Nieprawidłowy lub wygasły token") {
      localStorage.removeItem("token");
      habitsContainer.innerHTML = "";
    }
  }
}

changeMainPageUI();

// DONE STATE BUTTON LISTENERS
sectionDayToDo?.addEventListener("click", async function (e) {
  const actionButton = e.target.closest(".btn--done, .btn--skip");
  if (!actionButton) return;

  const token = localStorage.getItem("token");

  // Nie ma zalogowanego użytkownika
  if (!token) {
    habitsContainer.innerHTML = "";
    return;
  }

  const habitContainer = actionButton.closest(".container-daily-habits");
  const habitID = habitContainer.dataset.habitId;
  const isSkip = actionButton.classList.contains("btn--skip");

  // passing done state to database
  const today = getLocalDateString();

  const response = await fetch(
    `${API_URL}/api/habits/${habitID}/${isSkip ? "skip" : "complete"}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        date: today,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  dashboardHabits = dashboardHabits.map((habit) =>
    String(habit._id) === String(habitID) ? data.habit : habit,
  );
  renderWeekCalendar(dashboardHabits);
  updateStreakStats(dashboardHabits, today);

  if (!isSkip) {
    completedHabitsToday++;
    const completionPercentage = totalHabits
      ? Math.round((completedHabitsToday / totalHabits) * 100)
      : 0;
    if (todayProgresText)
      todayProgresText.innerHTML = `${completedHabitsToday} / ${totalHabits}`;
    dailyChart.updateSeries([{ data: [completionPercentage] }]);
    dailyChartPercentText.innerHTML = `${completionPercentage}%`;
  }
  habitContainer.remove();
  if (habitCounter) {
    const remainingHabits = sectionDayToDo.querySelectorAll(
      ".container-daily-habits",
    ).length;
    habitCounter.textContent = formatHabitCount(remainingHabits);
  }

  console.log(data.habit);
});

// DAILY CHART

const optionsDailyChart = {
  chart: {
    type: "bar",
    height: 24,
    sparkline: {
      enabled: true,
    },
  },

  series: [
    {
      data: [0],
    },
  ],

  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: "100%",
      borderRadiusApplication: "around",
      colors: {
        backgroundBarColors: ["#dcdafa"],
      },
    },
  },

  colors: ["#4f46e5"],

  xaxis: {
    min: 0,
    max: 100,
  },

  tooltip: {
    enabled: false,
  },

  states: {
    hover: {
      filter: {
        type: "none",
      },
    },
    active: {
      filter: {
        type: "none",
      },
    },
  },
};

const dailyChart = new ApexCharts(
  document.querySelector("#dailyChart"),
  optionsDailyChart,
);

dailyChart?.render();

///////////////////////////// LOAD HABITS BACKEND //////////////////////////////
loadHabits();

let lastRenderedLocalDate = getLocalDateString();

const refreshIfLocalDateChanged = async () => {
  const currentLocalDate = getLocalDateString();
  if (currentLocalDate === lastRenderedLocalDate) return;

  lastRenderedLocalDate = currentLocalDate;
  await changeMainPageUI();
  await loadHabits();
};

const scheduleNextMidnightRefresh = () => {
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 1, 0);

  window.setTimeout(async () => {
    try {
      await refreshIfLocalDateChanged();
    } finally {
      scheduleNextMidnightRefresh();
    }
  }, nextMidnight.getTime() - Date.now());
};

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshIfLocalDateChanged();
});

scheduleNextMidnightRefresh();
