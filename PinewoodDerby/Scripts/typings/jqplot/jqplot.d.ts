/// <reference path="../sugar/sugar.d.ts" />

interface JQuery {
    plotPieChart(div: string, title: string, data: {}[]);
}

interface Number {
    toLocaleString(): string;
}