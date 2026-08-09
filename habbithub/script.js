"use strict";

import Chart from 'chart.js/auto';

const ctx = document.getElementById('habitChart');

new Chart(ctx, {
    type: 'bar',

    data: {
        labels: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'],

        datasets: [{
            label: 'Wykonane nawyki',
            data: [3, 5, 2, 6, 4, 7, 5]
        }]
    },

    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true
            }
        }
    }
});
