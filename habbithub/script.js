"use strict";

// MODAL TAB LOCK

const trapModalFocus = function () {
  const body = document.body;
  if (!body.classList.contains("modal-open")) return;

  const modal = document.querySelector(".section-login-popup");
  if (!modal) return;

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  const getFocusable = function () {
    return Array.from(modal.querySelectorAll(focusableSelector)).filter(
      (element) => !element.hasAttribute("disabled") && !element.closest("[hidden]"),
    );
  };

  const focusFirst = function () {
    const focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
    else modal.focus();
  };

  focusFirst();

  document.addEventListener("keydown", function (event) {
    if (!body.classList.contains("modal-open")) return;
    if (event.key !== "Tab") return;

    const focusable = getFocusable();
    if (!focusable.length) {
      event.preventDefault();
      modal.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (!modal.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  });
};

trapModalFocus();

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

//////////////////////////////// ADDING HABITS //////////////////////////////////

//// ICON DROPDOWN ///
const iconPicker = document.querySelector('.icon-picker');
const pickerTrigger = document.querySelector('.picker-trigger');
const iconMenu = document.querySelector('.icon-picker-menu');
const habitsContainer = document.querySelector('.habits-container');
const addHabitBtn = document.querySelector('.btn--add-habit');
const inputIcon = document.querySelector('.icon-selector-icon');
const inputName = document.querySelector('.input-name');
const inputFrequency = document.querySelector('.input-frequency');
const inputColor = document.querySelector('.input-color');

// toggle dropdown
pickerTrigger?.addEventListener('click', function() {
  iconPicker.classList.toggle('open');
});

// close dropdown when clicking on the page
if (iconPicker) document.addEventListener('click', function(e) {
  if (!iconPicker.contains(e.target)) iconPicker.classList.remove('open');
});

// changing icon to picked one
iconMenu?.addEventListener('click', function(e) {
  const iconInput = e.target.closest('.icon-option');
  
  if (!iconInput) return;

  inputIcon.src = iconInput.querySelector('img').src;
  iconPicker.classList.toggle('open');
});

// ADDING HABIT ///
addHabitBtn?.addEventListener('click', function() {

  // validation
  if (!inputName.value) return alert('Nieprawidłowa nazwa nawyku!');

  const HTML = 
  `
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
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">PON</p>
                      <span class="day-panel-fake-checkbox">1</span>
                      <span class="day-panel-fake-checkbox">8</span>
                      <span class="day-panel-fake-checkbox">15</span>
                      <span class="day-panel-fake-checkbox">22</span>
                      <span class="day-panel-fake-checkbox">29</span>
                    </li>
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">WT</p>
                      <span class="day-panel-fake-checkbox">2</span>
                      <span class="day-panel-fake-checkbox">9</span>
                      <span class="day-panel-fake-checkbox">16</span>
                      <span class="day-panel-fake-checkbox">23</span>
                      <span class="day-panel-fake-checkbox">30</span>
                    </li>
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">ŚR</p>
                      <span class="day-panel-fake-checkbox">3</span>
                      <span class="day-panel-fake-checkbox">10</span>
                      <span class="day-panel-fake-checkbox">17</span>
                      <span class="day-panel-fake-checkbox">24</span>
                      <span class="day-panel-fake-checkbox">31</span>
                    </li>
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">CZW</p>
                      <span class="day-panel-fake-checkbox">4</span>
                      <span class="day-panel-fake-checkbox">11</span>
                      <span class="day-panel-fake-checkbox">18</span>
                      <span class="day-panel-fake-checkbox">25</span>
                    </li>
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">PT</p>
                      <span class="day-panel-fake-checkbox">5</span>
                      <span class="day-panel-fake-checkbox">12</span>
                      <span class="day-panel-fake-checkbox">19</span>
                      <span class="day-panel-fake-checkbox">26</span>
                    </li>
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">SOB</p>
                      <span class="day-panel-fake-checkbox">6</span>
                      <span class="day-panel-fake-checkbox">13</span>
                      <span class="day-panel-fake-checkbox">20</span>
                      <span class="day-panel-fake-checkbox">27</span>
                    </li>
                    <li class="grid wrapper-list-item">
                      <p class="paragraph-description">ND</p>
                      <span class="day-panel-fake-checkbox">7</span>
                      <span class="day-panel-fake-checkbox">14</span>
                      <span class="day-panel-fake-checkbox">21</span>
                      <span class="day-panel-fake-checkbox">28</span>
                    </li>
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
                      <p>Tydz. 4</p>
                      <p>5/7</p>
                    </li>
                  </ul>
                </div>
              </div>
  `

  habitsContainer.insertAdjacentHTML('afterbegin', HTML);
});