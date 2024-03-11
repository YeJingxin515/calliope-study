import * as d3 from 'd3';

class Display {
    constructor() {
        // visualization
        this._container = "";
        this._paragraph = "";
        this._vis = {};
    }

    container(value) {
        this._container = value;
    }

    paragraph(value) {
        this._paragraph = value;
    }

    vis(value) {
        if (!value) {
            return this._vis;   
        }
        this._vis = value;
    }

    render() {
        let vis = this.vis();
        let chart = vis.chart();
        chart.container(this._container);
        let fact = vis.fact();
        if (chart.duration() === 0) {
            chart.display(fact.type);
        } else {
            chart.animate(fact.type);
        }
    }

    update(prefact, nextfact) {
        let vis = this.vis();
        let chart = vis.chart();
        chart.update(prefact, nextfact);
    }

    showCaption() {
        let vis = this.vis();
        d3.select(this._paragraph)
            .style('font-size','1.5em')
            .style('text-align','center')
            .text(vis.caption());
    }
}

export default Display;