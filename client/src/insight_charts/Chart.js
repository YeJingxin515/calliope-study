import React, { Component } from 'react';
import { AutoVis } from './vis';

export default class Chart extends Component {
    componentDidMount() {
        const { id } = this.props.spec.chart;
        let spec = this.props.spec;
        let container = id ? `#vischart_${id}` : "#demo-chart";
        this.autovis = new AutoVis(this);
        this.autovis.container(container);
        this.autovis.load(spec);
        this.autovis.generate();
    }

    componentDidUpdate(preProps) {
        const { id } = this.props.spec.chart;
        let spec = this.props.spec;
        let container = id ? `#vischart_${id}` : "#demo-chart";
        this.autovis = new AutoVis(this);
        this.autovis.container(container);
        this.autovis.load(spec);
        this.autovis.generate();
    }

    render() {
        const {width,height}=this.props.spec.chart;
        // let height = 640, width = 400;

        let a_height=height!==undefined?height:640
        let a_width=width!==undefined?width:400
        const { id } = this.props.spec.chart ? this.props.spec.chart : { id: "demo-chart" };
        return (
            <div id={id ? `vischart_${id}` : 'demo-chart'} style={{ height: a_height, width: a_width, position: "relative" }} />
        )
    }
}
