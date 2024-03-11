import * as d3 from 'd3';

class Chart {
    constructor() {
        this._container = document.createElement("div");
        this._width = 0;
        this._height = 0;
        this._table = [];
        this._factdata = [];
        this._subspace = [];
        this._measure = [];
        this._breakdown = [];
        this._focus = [];
        this._duration = 0;
        this._showTooltip=false;
        this._showSuggestion = false; // When true, it will show the suggestion that whether the chart supports the data.
    }

    container(value) {
        if (!value) {
            d3.select(this._container).selectAll("*").remove();
            return this._container;
        }
        this._container = value;
    }
   
    style(value) {
        if (!value) {
            return this._style;
        }
        this._style = value;
    }

    size(value) {
        if (!value) {
            return this._size;
        }
        this._size = value;
    }

    width(value) {
        if (!value) {
            if (this._width !== 0) {
                return this._width;
            } else {
                return 640;
            }
        }
        this._width = value;
    }

    height(value) {
        if (!value) {
            if (this._height !== 0) {
                return this._height;
            } else {
                return 400;
            }
        }
        this._height = value;
    }

    table(value) {
        if (!value) {
            return this._table;
        }
        this._table = value;
    }

    factdata(value) {
        if (!value) {
            return this._factdata;
        }
        this._factdata = value;
    }

    subspace(value) {
        if (!value) {
            return this._subspace;
        }
        this._subspace = value;
    }

    measure(value) {
        if (!value) {
            return this._measure;
        }
        this._measure = value;
    }

    breakdown(value) {
        if (!value) {
            return this._breakdown;
        }
        this._breakdown = value;
    }

    focus(value) {
        if (!value) {
            return this._focus;
        }
        this._focus = value
    }

    duration(value) {
        if (!value) {
            return this._duration;
        }
        this._duration = value;
    }

    showSuggestion(value) {
        if (!value) {
            return this._showSuggestion;
        }
        this._showSuggestion = value;
    }
    showTooltip(value) {
        if (!value) {
            return this._showTooltip;
        }
        this._showTooltip = value;
    }

    toSVG() { }

    toJPG() { }
}

export default Chart;