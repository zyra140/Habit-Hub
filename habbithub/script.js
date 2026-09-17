"use strict";
//////////////////////////////// MAIN PAGE //////////////////////////////////
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
      data: [60],
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
const registerPasswordConfirmInput = document.querySelector("#register-password-confirm",);
const registerSubmitBtn = document.querySelector(".auth-view-register .btn--login",);
const logoutBtn = document.querySelector(".btn-logout");
const mainPageNameDisplay = document.querySelector('#nameDisplay');

// ZMIANA UI PO ZALOGOWANIU
function hideAuthModal() {
  if (loginPopup) {
    loginPopup.setAttribute("hidden", "hidden");
    loginPopup.style.display = "none";
  }

  document.body.classList.remove("modal-open");
}

// ZMIANA UI PRZED ZALOGOWANIEM
function showAuthModal() {
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
}

const savedToken = localStorage.getItem("token");

if (savedToken) {
  hideAuthModal();
}

// LOG OUT BUTTON
logoutBtn?.addEventListener("click", function () {
  localStorage.removeItem("token");
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
// mainPageNameDisplay.textContent = `Dzień dobry, ${}! 👋`;
console.log(registerNameInput.value);
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
const inputColor = document.querySelector(".input-color");

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

//// ADDING HABIT ///
addHabitBtn?.addEventListener("click", function () {
  // VALIDATION
  if (!inputName.value) return alert("Nieprawidłowa nazwa nawyku!");

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const habitCreatedDay = today.getDate();
  const weekdays = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];

  // RENDERING CALENDAR - start the grid on Monday and render five complete weeks
  // These arrays will later come from the DATABASE
  const completedDays = [10, 12, 15];
  const missedDays = [11, 13];

  // first day on a month
  const firstDayOfMonth =
    (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  // rendering weekdays names
  const calendarHeadersHTML = weekdays
    .map(function (weekday) {
      return `<li class="calendar-cell calendar-header"><p class="paragraph-description">${weekday}</p></li>`;
    })
    .join("");

  // Render previous, current and next month days in chronological order.
  const calendarDaysHTML = Array.from({ length: 35 }, function (_, index) {
    // checking wchich day is first monday // current month or previous
    const date = new Date(
      currentYear,
      currentMonth,
      index - firstDayOfMonth + 1,
    );
    const day = date.getDate();
    const dayClasses = ["calendar-cell", "calendar-day"];
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = date.toDateString() === today.toDateString();

    // adding adjacent month class
    if (!isCurrentMonth) dayClasses.push("is-adjacent-month");

    // adding today class
    if (isToday) dayClasses.push("is-today");

    // adding day before habit class
    if (isCurrentMonth && date < today && date.getDate() < habitCreatedDay) {
      dayClasses.push("is-before-habit");
    }

    // adding completed day class
    if (isCurrentMonth && completedDays.includes(day)) {
      dayClasses.push("is-completed");
    }

    // adding missed day class
    if (isCurrentMonth && missedDays.includes(day)) {
      dayClasses.push("is-missed");
    }

    return `<li class="${dayClasses.join(" ")}"><span class="day-panel-fake-checkbox">${day}</span></li>`;
  }).join("");

  // adding html elements to one
  const calendarColumnsHTML = calendarHeadersHTML + calendarDaysHTML;

  // final HTML to insert
  const HTML = `
              <div class="grid wrapper-habit-panel">
                <div class="habit-dropdown-wrapper">
                  <button class="btn--edit-habit">&vellip;</button>
                  <div class="habit-dropdown-menu">
                    <button class="edit-button">
                      <img
                        class="icon-dropdown"
                        src="../icons/edit-pencil-line-01-svgrepo-com.svg"
                        alt=""
                      />
                      Edytuj
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
                  <img
                    class="img-box img-box--habbit-panel"
                    src="${inputIcon.src}"
                    alt=""
                  />
                  <div class="wrapper-habit-description-text">
                    <h3 class="heading-tertiary">${inputName.value}</h3>
                    <p class="paragraph-description">${inputFrequency.value}</p>
                  </div>
                </div>

                <div class="wrapper-habit-calendar">
                  <ul class="habit-list grid grid--7-cols">
                    ${calendarColumnsHTML}
                  </ul>
                </div>
                <div class="wrapper-weekly-progres">
                  <ul class="habit-list-weekly-progres grid">
                    <li class="habit-weekly-progres is-active">
                      <p>Tydz. 1</p>
                      <p>5/7</p>
                    </li>
                    <li class="habit-weekly-progres">
                      <p>Tydz. 2</p>
                      <p>5/7</p>
                    </li>
                    <li class="habit-weekly-progres">
                      <p>Tydz. 3</p>
                      <p>5/7</p>
                    </li>
                    <li class="habit-weekly-progres">
                      <p>Tydz. 5</p>
                      <p>5/7</p>
                    </li>
                    <li class="habit-weekly-progres">
                      <p>Tydz. 4</p>
                      <p>5/7</p>
                    </li>
                  </ul>
                </div>
              </div>
  `;

  //inserting html to container
  habitsContainer.insertAdjacentHTML("afterbegin", HTML);
});
