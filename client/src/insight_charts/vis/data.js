import * as d3 from 'd3';

class Data {
    constructor() {
        this._table = [];
        this._schema = [];
    }

    table() {
        return this._table;
    }

    schema() {
        return this._schema;
    }

    load(spec) {
        return new Promise((resolve, reject) => {
            let numericalFields = [];
            let numerical = spec.schema.filter(d => d.type === "numerical");
            numericalFields = numerical.map(d => d.field);
            if ('values' in spec) {
                let data = spec.values;
                data.forEach((d, i) => {
                    for (let key in d) {
                        if (numericalFields.indexOf(key) !== -1) {
                            d[key] = parseFloat(d[key])
                        }
                    }
                })
                this._table = data;
                this._schema = spec.schema;
                resolve(this);
            } else {
                d3.csv(spec.url)
                .then(function (data) {
                    data.forEach((d, i) => {
                        for (let key in d) {
                            if (numericalFields.indexOf(key) !== -1) {
                                d[key] = parseFloat(d[key])
                            }
                        }
                    })
                    this._table = data;
                    this._schema = spec.schema;
                    resolve(this);
                }.bind(this)).catch(function (error) {
                    reject(error);
                })
            }
        });
    }
}

export default Data;