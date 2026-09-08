"use strict";
// //////////////////////////////// ICON INPUT //////////////////////////////////
// const iconButton = document.querySelector(".color-input-button");
// const iconDropdown = document.querySelector(".icon-dropdown");
// const listDropdown = document.querySelector(".list-dropdown");
// const habbitIcon = document.querySelector("#iconInput");
// const body = document.querySelector("body");

// iconButton?.addEventListener("click", function () {
//   iconDropdown.classList.contains("hidden")
//     ? iconDropdown.classList.remove("hidden")
//     : iconDropdown.classList.add("hidden");
// });

// listDropdown?.addEventListener("click", function (e) {
//   const li = e.target.closest("li");
//   if (!li) return;
//   const imgEl = li.querySelector("img");
//   if (!imgEl) return;
//   const icon = imgEl.src;
//   if (!icon) return;
//   habbitIcon.src = icon;
//   iconDropdown.classList.add("hidden");
// });

// // Close icon dropdown when clicking outside of it
// document.addEventListener("click", function (e) {
//   if (!iconDropdown || !iconButton) return;
//   // if dropdown already hidden, nothing to do
//   if (iconDropdown.classList.contains("hidden")) return;
//   const clickedInsideDropdown = e.target.closest(".icon-dropdown");
//   const clickedButton = e.target.closest(".color-input-button");
//   if (!clickedInsideDropdown && !clickedButton) {
//     iconDropdown.classList.add("hidden");
//   }
// });

// //////////////////////////////// COLOR INPUT //////////////////////////////////
// const colorInput = document.querySelector("#colorInput");

// // helper: convert hex to rgba with alpha
// function hexToRgb(hex) {
//   if (!hex) return { r: 0, g: 0, b: 0 };
//   const h = hex.replace("#", "");
//   const full =
//     h.length === 3
//       ? h
//           .split("")
//           .map((c) => c + c)
//           .join("")
//       : h;
//   const num = parseInt(full, 16);
//   return {
//     r: (num >> 16) & 255,
//     g: (num >> 8) & 255,
//     b: num & 255,
//   };
// }

// function hexToRgba(hex, alpha = 0.2) {
//   const { r, g, b } = hexToRgb(hex);
//   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
// }

// colorInput?.addEventListener("input", function (e) {
//   const color = e.target.value;
// });

// //////////////////////////////// NAVIGATION //////////////////////////////////
// const navList = document.querySelector(".nav-list");
// const navItemsAll = document.querySelectorAll(".nav-item");

// navList?.addEventListener("click", function (e) {
//   const navItem = e.target.closest("li");
//   if (!navItem) return;

//   //delete active class
//   navItemsAll.forEach((item) => {
//     const navItemContentAll = [
//       item.querySelector("img"),
//       item.querySelector("a"),
//     ];
//     navItemContentAll.forEach((item) => item.classList.remove("active"));
//   });
//   //add active class
//   const navItemContent = [
//     navItem.querySelector("img"),
//     navItem.querySelector("a"),
//   ];
//   navItemContent.forEach((item) => item.classList.add("active"));

//   // Nawiguj do strony
//   const link = navItem.querySelector("a");
//   if (link?.href) window.location.href = link.href;
// });

// // Ustaw active class po załadowaniu strony
// const currentFile = window.location.pathname.split("/").pop() || "index.html";

// navItemsAll.forEach((item) => {
//   const link = item.querySelector("a");
//   const isActive = link?.href.endsWith(currentFile);
//   link?.classList.toggle("active", isActive);
//   item.querySelector("img")?.classList.toggle("active", isActive);
// });

// //////////////////////////////// ADDING HABBIT //////////////////////////////////
// const habitName = document.querySelector(".habbit-name-input");
// const frequency = document.querySelector(".habbit-frequency-input");
// const addHabbitButton = document.querySelector(".add-habbit-button");
// const habbitContainer = document.querySelector(".container-habbit-in-month");

// const localStorageHabbits = localStorage.getItem("habbits");
// if (localStorageHabbits)
//   habbitContainer?.insertAdjacentHTML("beforeend", localStorageHabbits);

// addHabbitButton?.addEventListener("click", function () {
//   const icon = habbitIcon.src;
//   const name = habitName.value;
//   const freq = frequency.value;
//   const color = colorInput.value;
//   const fadedColor = hexToRgba(color, 0.2);

//   if (!name) return alert("Podaj nazwę nawyku");
//   if (!freq) return alert("Wybierz częstotliwość!");

//   // cannot add habbit to past month
//   if (
//     (date.getMonth() < new Date().getMonth() &&
//       date.getFullYear() === new Date().getFullYear()) ||
//     date.getFullYear() < new Date().getFullYear()
//   )
//     return alert("Nie można dodawać nawyków do poprzednich miesięcy!");

//   const calendarDays = function () {
//     const dayName = new Date(date);

//     let dayStr = "";

//     const dayLength = daysInMonth(
//       dayName.getMonth() + 1,
//       dayName.getFullYear(),
//     );

//     for (let i = date.getDate(); i <= dayLength; i++) {
//       let dayFirstCapital = dayName
//         .toLocaleString("pl-PL", {
//           weekday: "long",
//         })
//         .slice(0, 1)
//         .toUpperCase();

//       dayStr += `
//         <li>
//           <p class="calendar-day-number">${i}</p>
//           <p class="${dayFirstCapital === "S" || dayFirstCapital === "N" ? "calendar-day-type-weekend" : "calendar-day-type"}">${dayFirstCapital}</p>
//           <input class="input-checkbox" type="checkbox" />
//         </li>
//         `;

//       dayName.setDate(dayName.getDate() + 1);
//     }
//     return dayStr;
//   };

//   let html = `
//       <div class="container-calendar">
//         <div class="item-calendar">
//           <img
//             class="calendar-icon"
//             src="${icon}"
//             alt=""
//             style="background-color: ${fadedColor};"
//           />
//           <div class="item-description">
//             <h4>${name}</h4>
//             <p>${freq}</p>
//           </div>
//           <div class="calendar">
//             <ul class="calendar-day-list">
//               ${calendarDays()}
//             </ul>
//           </div>
//         </div>
//       </div>
//     `;

//   //Background color change

//   habbitContainer.insertAdjacentHTML("beforeend", html);

//   // Set local storage
//   localStorage.setItem("habbits", habbitContainer.innerHTML);
// });

// //////////////////////////////// DATES //////////////////////////////////

// // date changer
// const dateInput = document.querySelector(".date-input");

// const containerDate = document.querySelector(".container-date-input");

// const STORAGE_KEY = "date-switcher";

// const date = new Date(localStorage.getItem(STORAGE_KEY) || Date.now());

// const daysInMonth = function (month, year) {
//   return new Date(year, month, 0).getDate();
// };

// const renderDate = function (date) {
//   if (!dateInput) return;
//   dateInput.innerHTML = date.toLocaleString("pl-PL", {
//     month: "long",
//     year: "numeric",
//   });
// };

// const saveCurrentDate = function () {
//   localStorage.setItem(STORAGE_KEY, date.toISOString());
// };

// renderDate(date);

// containerDate?.addEventListener("click", function (e) {
//   let input = e.target.closest("button");

//   if (!input) return;

//   date.setMonth(date.getMonth() + Number(input.id));

//   if (date.getMonth() !== new Date().getMonth()) date.setDate(1);
//   if (date.getMonth() === new Date().getMonth())
//     date.setDate(new Date().getDate());

//   renderDate(date);

//   saveCurrentDate();
// });

// // full date in main page
// const fullDate = document.querySelector(".full-date");
// const fullDateHtml = new Date().toLocaleString("pl-PL", {
//   weekday: "long",
//   day: "numeric",
//   month: "long",
//   year: "numeric",
// });

// fullDate?.insertAdjacentHTML(
//   "afterbegin",
//   fullDateHtml.slice(0, 1).toUpperCase() + fullDateHtml.slice(1),
// );

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

dailyChart.render();

//////////////////////////////// DROPDOWNS //////////////////////////////////