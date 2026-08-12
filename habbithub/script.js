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

//Init Chart
// const chart = new ApexCharts(document.querySelector("#chart"), options);
// const chart2 = new ApexCharts(document.querySelector("#chart2"), options);
// const chart3 = new ApexCharts(document.querySelector("#chart3"), options);

//Render Chart
// chart.render();
// chart2.render();
// chart3.render();

//////////////////////////////// ICON INPUT //////////////////////////////////
const iconButton = document.querySelector(".color-input-button");
const iconDropdown = document.querySelector(".icon-dropdown");
const listDropdown = document.querySelector(".list-dropdown");
const habbitIcon = document.querySelector("#iconInput");

iconButton?.addEventListener("click", function () {
  iconDropdown.classList.contains("hidden")
    ? iconDropdown.classList.remove("hidden")
    : iconDropdown.classList.add("hidden");
});

listDropdown?.addEventListener("click", function (e) {
  const icon = e.target.closest("li").querySelector("img").src;
  if (!icon) return;
  habbitIcon.src = icon;
  iconDropdown.classList.add("hidden");
});

//////////////////////////////// COLOR INPUT //////////////////////////////////
const colorInput = document.querySelector("#colorInput");

colorInput?.addEventListener("input", function (e) {
  const color = e.target.value;
  habbitIcon.style.color = color;
});

//////////////////////////////// NAVIGATION //////////////////////////////////
const navList = document.querySelector('.nav-list');
const navItemsAll = document.querySelectorAll('.nav-item')

navList?.addEventListener('click', function(e) {
  const navItem = e.target.closest('li');
  if (!navItem) return
  
  //delete active class
  navItemsAll.forEach(item => {
    const navItemContentAll = [item.querySelector('img'), item.querySelector('a')]
    navItemContentAll.forEach(item => item.classList.remove('active'));
  })
  //add active class
  const navItemContent = [navItem.querySelector('img'), navItem.querySelector('a')]
  navItemContent.forEach(item => item.classList.add('active'));
  
  // Nawiguj do strony
  const link = navItem.querySelector('a');
  if (link?.href) window.location.href = link.href;
});

// Ustaw active class po załadowaniu strony
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
navItemsAll.forEach(item => {
  const link = item.querySelector('a');
  const isActive = link?.href.endsWith(currentFile);
  link?.classList.toggle('active', isActive);
  item.querySelector('img')?.classList.toggle('active', isActive);
});