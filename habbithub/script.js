"use strict";

//Chart Options
const options = {
    chart: {
        height: 450,
        width: '100%',
        type: 'line',
        background: '#F8FAFC',
        foreColor: '#0F172A'
    },
    stroke: {
        curve: 'smooth'
    },
    markers: {
        size:6
    },
    series: [{
         data: [{
            x: new Date('2026-08-10').getTime(),
            y:76
         }, {
            x: new Date('2026-08-11').getTime(),
            y:30
         }, {
            x: new Date('2026-08-12').getTime(),
            y:44
         }],
        name: 'Średnia z dnia',
       
    }],
    xaxis: {
        type: 'datatime'
    },
    plotOptions: {
        bar: {
            horizontal: false
        }
    },
    fill: {
        colors: ['#16A34A'],
        type: 'gradient'
    },
    dataLabels: {
        enabled: false
    },
    title: {
        text: 'Średnia realizacja nawyków w czasie',
        // align: 'center',
        margin: 20,
        offsetY: 20,
        style: {
            fontSize: '25px',
            fontWeight: 'light'
        },
    }   
};

//Init Chart
const chart = new ApexCharts(document.querySelector('#chart'), options);
const chart2 = new ApexCharts(document.querySelector('#chart2'), options);
const chart3 = new ApexCharts(document.querySelector('#chart3'), options);
//Render Chart
chart.render();
chart2.render();
chart3.render();