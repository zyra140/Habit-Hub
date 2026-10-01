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

// BLANK HABIT UI UPDATE
const habitBlankHabits = document.querySelector(".grid-blank-habit");
const habitBlankMain = document.querySelector(".grid-blank-habits");

const DisactiveBlankHabitUI = function () {
  if (habitBlankHabits?.classList.contains("display-none")) return;

  habitBlankHabits?.classList.add("display-none");
  habitBlankMain?.classList.add("display-none");
};

const ActiveBlankHabitUI = function () {
  if (!habitBlankHabits?.classList.contains("display-none")) return;

  habitBlankHabits?.classList.remove("display-none");
  habitBlankMain?.classList.remove("display-none");
};

// };

// blankHabitUI();

// RENDER HABIT
const renderHabit = function (habit) {
  const today = new Date();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const habitCreatedDate = new Date(habit.createdAt);
  const habitCreatedDay = today.getDate();

  const weekdays = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];

  const color = habit.color;
  const color02 = hexToRgba(color, 0.2);
  const gradient = `180deg, ${hexToRgba(color, 0.1)}, ${hexToRgba(color, 0.2)}`;

  //completed days
  const completedDays = habit.completedDates.map((date) => {
    const completedDate = new Date(date);

    // days only from current month
    if (
      completedDate.getFullYear() === currentYear &&
      completedDate.getMonth() === currentMonth
    ) {
      return completedDate.getDate();
    }
    return null;
  });

  //calendar
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
    // if (isCurrentMonth && missedDays.includes(day)) {
    //   dayClasses.push("is-missed");
    // }

    return `<li class="${dayClasses.join(" ")}"><span class="day-panel-fake-checkbox">${day}</span></li>`;
  }).join("");

  // adding html elements to one
  const calendarColumnsHTML = calendarHeadersHTML + calendarDaysHTML;

  //frequency
  const frequencyText =
    habit.frequency === "1"
      ? "raz w tygodniu"
      : `${habit.frequency} razy w tygodniu`;

  // final HTML to insert
  const HTML = `
              <div class="grid wrapper-habit-panel" data-habit-id=${habit._id}>
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
                    style="background: ${color02};"
                    src="${habit.icon}"
                    alt=""
                  />
                  <div class="wrapper-habit-description-text">
                    <h3 class="heading-tertiary">${habit.name}</h3>
                    <p class="paragraph-description">${habit.frequency === "1" ? `raz w tygodniu` : `${habit.frequency} razy w tygodniu`}</p>
                  </div>
                </div>

                <div class="wrapper-habit-calendar">
                  <ul class="habit-list grid grid--7-cols">
                    ${calendarColumnsHTML}
                  </ul>
                </div>
                <div class="wrapper-weekly-progres">
                  <ul class="habit-list-weekly-progres grid">
                    <li class="habit-weekly-progres is-active" style="border: 1px solid ${color02}; background: linear-gradient(${gradient});">
                      <p>Tydz. 1</p>
                      <p>0/${habit.frequency}</p>
                    </li>
                    <li class="habit-weekly-progres" style="border: 1px solid ${color02};">
                      <p>Tydz. 2</p>
                      <p>0/${habit.frequency}</p>
                    </li>
                    <li class="habit-weekly-progres" style="border: 1px solid ${color02};">
                      <p>Tydz. 3</p>
                      <p>0/${habit.frequency}</p>
                    </li>
                    <li class="habit-weekly-progres" style="border: 1px solid ${color02};">
                      <p>Tydz. 5</p>
                      <p>0/${habit.frequency}</p>
                    </li>
                    <li class="habit-weekly-progres" style="border: 1px solid ${color02};">
                      <p>Tydz. 4</p>
                      <p>0/${habit.frequency}</p>
                    </li>
                  </ul>
                </div>
              </div>
  `;

  //inserting html to container
  habitsContainer.insertAdjacentHTML("afterbegin", HTML);
};

// DELATE HABIT

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
const API_URL = "https://habit-hub.onrender.com";
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

// ZMIANA UI PO ZALOGOWANIU
function hideAuthModal() {
  if (loginPopup) {
    loginPopup.setAttribute("hidden", "hidden");
    loginPopup.style.display = "none";
  }

  document.body.classList.remove("modal-open");

  // Generate Profile image
  const name = localStorage.getItem("name");
  if (nameLetter) nameLetter.textContent = name[0].toUpperCase();
  
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
    habitsContainer.innerHTML = "";
    return;
  }

  try {
    const response = await fetch("https://habit-hub.onrender.com/api/habits", {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Nie udało się pobrać nawyków");
    }

    console.log("Pobrane nawyki:", data.habits);

    // Czyścimy aktualne karty
    if (!habitsContainer) return;
    habitsContainer.innerHTML = "";

    // UPDATE UI
    DisactiveBlankHabitUI();

    // Renderujemy każdy habit
    data.habits.forEach((habit) => {
      renderHabit(habit);
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
const inputColor = document.querySelector(".input-color");
const wrapperInputColor = document.querySelector(".wrapper-input-icon");
const inputColorCircle = document.querySelector(".color-circle");
const deleteButton = document.querySelector(".delete-button");

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

//color input
wrapperInputColor?.addEventListener("click", () => {
  inputColor.click();
});

wrapperInputColor?.addEventListener("input", () => {
  inputColorCircle.style.backgroundColor = inputColor.value;
});

/////////////////////////////////////
//// ADDING HABIT ///
////////////////////////////////////
addHabitBtn?.addEventListener("click", async function () {
  // VALIDATION
  if (!inputName.value) return alert("Nieprawidłowa nazwa nawyku!");

  // BACK AND SAVE / BACKEND VALIDATION => UPDATE UI
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Musisz być zalogowany!");
      return;
    }

    const response = await fetch("https://habit-hub.onrender.com/api/habits", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        name: inputName.value,
        frequency: inputFrequency.value,
        icon: inputIcon.src,
        color: inputColor.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Nie udało się zapisać nawyku");
    }

    console.log("Nawyk zapisany w MongoDB:", data.habit);

    // Możesz zachować ID na potrzeby późniejszych operacji
    const habitId = data.habit._id;

    console.log("ID nawyku:", habitId);

    //REDNER
    renderHabit(data.habit);

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
        `https://habit-hub.onrender.com/api/habits/${habitId}`,
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
    } catch (error) {
      console.error("Błąd podczas usuwania habit:", error);

      alert(error.message);
    }

    return;
  }

  //EDITING
  if (editButton) {
    const habitPanel = e.target.closest(".wrapper-habit-panel");
    const habitId = habitPanel.dataset.habitId;
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

  menu?.classList.toggle("is-open");
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
});

////////////////////////////////////// INDEX HTML //////////////////////////////////
const todayProgresText = document.querySelector(".stats-text");
const habitCounter = document.querySelector(".habit-count-text");
const sectionDayToDo = document.querySelector(".section-day-todo");
const mainPageNameDisplay = document.querySelector("#nameDisplay");

// CHANGING UI AFTER ADDING HABITS
async function changeMainPageUI() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name");
  const today = new Date().toISOString().split("T")[0];

  // Nie ma zalogowanego użytkownika
  if (!token) {
    habitsContainer.innerHTML = "";
    return;
  }

  // Chanign main page h1 to user name
  if (mainPageNameDisplay)
    mainPageNameDisplay.innerHTML = `Dzień dobry ${userName}`;

  try {
    const response = await fetch("https://habit-hub.onrender.com/api/habits", {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Nie udało się pobrać nawyków");
    }

    // if there is no habits return
    if (data.habits.length < 0) return;

    // changing stats text
    if (todayProgresText)
      todayProgresText.innerHTML = `0 / ${data.habits.length}`;

    //chaning habit counter text
    if (habitCounter) habitCounter.innerHTML = `${data.habits.length} nawyków`;

    // disactive blank UI
    DisactiveBlankHabitUI();

    // section day to do render habits
    const renderDailyHabit = function (habit) {
      const HTML = `
          <div class="container-daily-habits" data-habit-id=${habit._id}>
            <div class="desc-daily-habits">
              <div class="img-box img-box--habit">
                <img
                  class="img-box img-box--habbit-panel"
                  src="${habit.icon}"
                  alt=""
                />
              </div>
              <div class="text-daily-habits">
                <h3 class="heading-tertiary habit-title">${habit.name}</h3>
                <p class="p-daily-habits">${habit.frequency === "1" ? `raz w tygodniu` : `${habit.frequency} razy w tygodniu`}</p>
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
              <button class="btn btn--skip">
                <img
                  class="btn-icon-skip"
                  src="../icons/close-svgrepo-com (3).svg"
                  alt=""
                />
                Pomiń
              </button>
            </div>
          </div>
      `;

      sectionDayToDo?.insertAdjacentHTML("beforeend", HTML);
    };

    data.habits.forEach(habit => {
      console.log(habit.completedDates, today)
      if (!habit.completedDates.includes(today)) renderDailyHabit(habit);
    })
    

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
  const token = localStorage.getItem("token");

  // Nie ma zalogowanego użytkownika
  if (!token) {
    habitsContainer.innerHTML = "";
    return;
  }

  const doneButton = e.target.closest(".btn--done");
  const habitContainer = doneButton.closest(".container-daily-habits");
  const habitID = habitContainer.dataset.habitId;

  // passing done state to database
  const today = new Date().toISOString().split("T")[0];

  const response = await fetch(
    `https://habit-hub.onrender.com/api/habits/${habitID}/complete`,
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

  console.log(data.habit);
});

///////////////////////////// LOAD HABITS BACKEND //////////////////////////////
loadHabits();
