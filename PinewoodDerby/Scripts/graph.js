

function plotPieChart(div, title, data) {
    jQuery.jqplot(div, data,
        {
            title : title,
            seriesDefaults: {
                // Make this a pie chart.
                renderer: jQuery.jqplot.PieRenderer,
                rendererOptions: {
                    // Put data labels on the pie slices.
                    // By default, labels show the percentage of the slice.
                    showDataLabels: true
                }
            },
            legend: { show: true, location: 'e' }
        });
}

$.fn.plotPieChart = plotPieChart;
