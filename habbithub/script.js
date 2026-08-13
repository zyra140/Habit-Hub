"use strict";
//////////////////////////////// CHARTS //////////////////////////////////////
//Chart Options
const options = {
  chart: {
    height: 450,
    width: "100%",
    type: "line",
    background: "#F8FAFC",
    foreColor: "#0F172A",
  },
  stroke: {
    curve: "smooth",
  },
  markers: {
    size: 6,
  },
  series: [
    {
      data: [
        {
          x: new Date("2026-08-10").getTime(),
          y: 76,
        },
        {
          x: new Date("2026-08-11").getTime(),
          y: 30,
        },
        {
          x: new Date("2026-08-12").getTime(),
          y: 44,
        },
      ],
      name: "Średnia z dnia",
    },
  ],
  xaxis: {
    type: "datatime",
  },
  plotOptions: {
    bar: {
      horizontal: false,
    },
  },
  fill: {
    colors: ["#16A34A"],
    type: "gradient",
  },
  dataLabels: {
    enabled: false,
  },
  title: {
    text: "Średnia realizacja nawyków w czasie",
    // align: 'center',
    margin: 20,
    offsetY: 20,
    style: {
      fontSize: "25px",
      fontWeight: "light",
    },
  },
};

// Init Chart
const chart = new ApexCharts(document.querySelector("#chart"), options);
const chart2 = new ApexCharts(document.querySelector("#chart2"), options);
const chart3 = new ApexCharts(document.querySelector("#chart3"), options);

// Render Chart
chart.render();
chart2.render();
chart3.render();

//////////////////////////////// ICON INPUT //////////////////////////////////
const iconButton = document.querySelector(".color-input-button");
const iconDropdown = document.querySelector(".icon-dropdown");
const listDropdown = document.querySelector(".list-dropdown");
const habbitIcon = document.querySelector("#iconInput");
const body = document.querySelector("body");

iconButton?.addEventListener("click", function () {
  iconDropdown.classList.contains("hidden")
    ? iconDropdown.classList.remove("hidden")
    : iconDropdown.classList.add("hidden");
});

listDropdown?.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li) return;
  const imgEl = li.querySelector("img");
  if (!imgEl) return;
  const icon = imgEl.src;
  if (!icon) return;
  habbitIcon.src = icon;
  iconDropdown.classList.add("hidden");
});

// Close icon dropdown when clicking outside of it
document.addEventListener("click", function (e) {
  if (!iconDropdown || !iconButton) return;
  // if dropdown already hidden, nothing to do
  if (iconDropdown.classList.contains("hidden")) return;
  const clickedInsideDropdown = e.target.closest(".icon-dropdown");
  const clickedButton = e.target.closest(".color-input-button");
  if (!clickedInsideDropdown && !clickedButton) {
    iconDropdown.classList.add("hidden");
  }
});

//////////////////////////////// COLOR INPUT //////////////////////////////////
const colorInput = document.querySelector("#colorInput");

// helper: convert hex to rgba with alpha
function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function hexToRgba(hex, alpha = 0.2) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

colorInput?.addEventListener("input", function (e) {
  const color = e.target.value;
});

//////////////////////////////// NAVIGATION //////////////////////////////////
const navList = document.querySelector(".nav-list");
const navItemsAll = document.querySelectorAll(".nav-item");

navList?.addEventListener("click", function (e) {
  const navItem = e.target.closest("li");
  if (!navItem) return;

  //delete active class
  navItemsAll.forEach((item) => {
    const navItemContentAll = [
      item.querySelector("img"),
      item.querySelector("a"),
    ];
    navItemContentAll.forEach((item) => item.classList.remove("active"));
  });
  //add active class
  const navItemContent = [
    navItem.querySelector("img"),
    navItem.querySelector("a"),
  ];
  navItemContent.forEach((item) => item.classList.add("active"));

  // Nawiguj do strony
  const link = navItem.querySelector("a");
  if (link?.href) window.location.href = link.href;
});

// Ustaw active class po załadowaniu strony
const currentFile = window.location.pathname.split("/").pop() || "index.html";

navItemsAll.forEach((item) => {
  const link = item.querySelector("a");
  const isActive = link?.href.endsWith(currentFile);
  link?.classList.toggle("active", isActive);
  item.querySelector("img")?.classList.toggle("active", isActive);
});

//////////////////////////////// ADDING HABBIT //////////////////////////////////
const habitName = document.querySelector(".habbit-name-input");
const frequency = document.querySelector(".habbit-frequency-input");
const addHabbitButton = document.querySelector(".add-habbit-button");
const habbitContainer = document.querySelector(".container-habbit-in-month");

addHabbitButton?.addEventListener("click", function () {
  const icon = habbitIcon.src;
  const name = habitName.value;
  const freq = frequency.value;
  const color = colorInput.value;
  const fadedColor = hexToRgba(color, 0.2);

  const calendarDays = function () {
    let day = "";
    let dayName = ['P','W','Ś','CZ','P','S','N'];
    for (let i = 1; i <= 31; i++) {
      day += `
        <li>
          <p class="calendar-day-number">${i}</p>
          <p class="calendar-day-type"></p>
          <input class="input-checkbox" type="checkbox" />
        </li>
        `;
    }
    console.log(day);
    return day;
  };

  if (!name) return alert("Podaj nazwę nawyku");
  if (!freq) return alert("Wybierz częstotliwość!");

  let html = `
      <div class="container-calendar">
        <div class="item-calendar">
          <img
            class="calendar-icon"
            src="${icon}"
            alt=""
            style="background-color: ${fadedColor};"
          />
          <div class="item-description">
            <h4>${name}</h4>
            <p>${freq}</p>
          </div>
          <div class="calendar">
            <ul class="calendar-day-list">
              ${calendarDays()}
            </ul>
          </div>
        </div>
      </div>
    `;

  //Background color change

  habbitContainer.insertAdjacentHTML("beforeend", html);
});
