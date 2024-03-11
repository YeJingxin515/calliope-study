import ChartType from './visualization/charttype';
import { Origin, Autocorrelation, Outstanding, MultivariateOutlier, Trend, UnivariateDistribution, Seasonality, MultivariateDistribution, FrequentPattern, Clustering, Forecasting, UnivariateOutlier, Similarity } from './charts';

class Visualization {
    constructor(origin) {
        this._table = [];
        this._fact = {};
        this._factdata = [];
        this._width = 0;
        this._height = 0;
        this._type = ChartType.VERTICAL_BAR_CHART;
        this._duration = 0;
        this._chart = {};
        this._caption = "";
        this._showSuggestion = false; // When true, it will show the suggestion that whether the chart supports the data.
        this._showTooltip = false;
        this.props = origin.props
    }

    size() {
        return this._size;
    }

    width(value) {
        if (!value) {
            return this._width;
        }
        this._width = value;
    }

    height(value) {
        if (!value) {
            return this._height;
        }
        this._height = value;
    }

    table(value) {
        if (!value) {
            return this._table;
        }
        this._table = value;
    }

    data(value) {
        if (!value) {
            return this._factdata;
        }
        this._factdata = value;
    }

    fact(value) {
        if (!value) {
            return this._fact;
        }
        this._fact = value;
    }

    chart(value) {
        if (!value) {
            return this._chart;
        }
        this._chart = value;
    }

    caption(value) {
        if (!value) {
            return this._caption;
        }
        this._caption = value;
    }

    style() {
        return this._style;
    }

    showSuggestion() {
        return this._showSuggestion
    }
    showTooltip() {
        return this._showTooltip
    }

    load(spec) {
        this._width = spec.width ? spec.width : 0;
        this._height = spec.height ? spec.height : 0;
        this._style = spec.style;
        this._type = spec.type;
        this._duration = spec.duration ? spec.duration : 0;
        this._showSuggestion = spec.showSuggestion ? spec.showSuggestion : false;
        this._showTooltip = spec.showTooltip ? spec.showTooltip : false;
        return new Promise((resolve, reject) => {
            try {
                let data = this.data();
                let fact = this.fact();
                let chart = this._type2chart(spec.type);
                chart.height(this._height);
                chart.width(this._width);
                chart.table(this._table);
                chart.factdata(data);
                chart.subspace(fact.subspace);
                chart.measure(fact.measure);
                chart.breakdown(fact.breakdown);
                chart.focus(fact.focus);
                chart.duration(this._duration);
                chart.showSuggestion(this._showSuggestion);
                chart.showTooltip(this._showTooltip);
                this.chart(chart);
                resolve(this);
            } catch (error) {
                reject(error);
            }
        });
    }

    update() {
        return new Promise((resolve, reject) => {
            try {
                let data = this.data();
                let fact = this.fact();
                this._chart.factdata(data);
                this._chart.subspace(fact.subspace);
                this._chart.measure(fact.measure);
                this._chart.breakdown(fact.breakdown);
                this._chart.focus(fact.focus);
                this._chart.duration(this._duration);
                this._chart.showSuggestion(this._showSuggestion);
                this._chart.showTooltip(this._showTooltip);
                resolve(this);
            } catch (error) {
                reject(error);
            }
        });
    }

    _type2chart(type) {
        switch (type) {
            case ChartType.MULTIVARIATE_OUTLIER:
                return new MultivariateOutlier(this.props);
            case ChartType.UNIVARIATE_DISTRIBUTION:
                return new UnivariateDistribution(this.props);
            case ChartType.TREND:
                return new Trend(this.props);
            case ChartType.SEASONALITY:
                return new Seasonality(this.props);
            case ChartType.MULTIVARIATE_DISTRIBUTION:
                return new MultivariateDistribution(this.props);
            case ChartType.FREQUENT_PATTERN:
                return new FrequentPattern(this.props);
            case ChartType.CLUSTERING:
                return new Clustering(this.props);
            case ChartType.FORECASTING:
                return new Forecasting(this.props);
            case ChartType.UNIVARIATE_OUTLIER:
                return new UnivariateOutlier(this.props);
            case ChartType.SIMILARITY:
                return new Similarity(this.props);
            case ChartType.ORIGIN:
                return new Origin(this.props);
            case ChartType.AUTOCORRELATION:
                return new Autocorrelation(this.props);
            case ChartType.OUTSTANDING:
                return new Outstanding(this.props);
            default: return
        }
    }
}

export default Visualization;