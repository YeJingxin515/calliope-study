import Data from './data';
import Fact from './fact';
import Visualization from './visualization';
import Display from './display';

class AutoVis {
    constructor(origin) {
        this._container = document.createElement("div");
        this._paragraph = document.createElement("p");
        this._data = new Data();
        this._fact = new Fact();
        this._vis = new Visualization(origin);
        this._display = new Display();
        this._spec = {};
    }

    container(value) {
        if (!value) {
            return this._container;
        }
        this._container = value;
    }

    paragraph(value) {
        if (!value) {
            return this._paragraph;
        }
        this._paragraph = value;
    }

    load(spec) {
        this._spec = spec;
    }

    shouldShowCaption(value) {
        if (!value) {
            return this._shouldShowCaption;
        }
        this._shouldShowCaption = value;
    }

    generate() {
        // STEP 0: parse specification
        let spec = this._spec;
        let dataspec = spec.data ? spec.data : {};
        let factspec = spec.fact ? spec.fact : {};
        let chartspec = spec.chart ? spec.chart : {};

        // STEP 1: data
        this._data.load(dataspec)
            .then((data) => {
                // STEP 2: fact
                this._fact.table(data.table());
                this._fact.schema(data.schema());
                return this._fact.load(factspec);
            })
            .then((fact) => {
                // STEP 3: generate caption and setup visualization
                this._vis.table(fact.table());
                this._vis.data(fact.factdata());
                this._vis.fact(fact.fact());
                return this._vis.load(chartspec);
            })
            .then((vis) => {
                // STEP 4: display
                this._display.container(this.container());
                this._display.paragraph(this.paragraph());
                this._display.vis(vis);
                this._display.render();
                if (this.shouldShowCaption()) {
                    this._display.showCaption();
                }
            })
            .catch((reason) => {
                console.log(reason);
            })
    }

}

export default AutoVis;