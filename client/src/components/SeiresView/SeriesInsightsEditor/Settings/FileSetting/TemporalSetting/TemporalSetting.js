import React, { Component } from 'react'
import {Tooltip,Slider,Divider } from 'antd';
import * as d3 from 'd3'
// let values = ["2003/3/17","2003/3/17","2003/3/17","2003/3/17","2003/3/17",
// "2003/3/18","2003/3/18","2003/3/18","2003/3/18","2003/3/18","2003/3/18","2003/3/18","2003/3/18",
// "2003/3/19","2003/3/19","2003/3/19","2003/3/19","2003/3/19",
// "2003/3/20","2003/3/20","2003/3/20","2003/3/20","2003/3/20","2003/3/20",
// "2003/3/21","2003/3/21","2003/3/21","2003/3/21"]
export default class TemporalSetting extends Component {
    componentDidMount(){
        this.props.setProcessTime([0,this.props.originTimeValue.length-1])
    }
    changeSlider = () => {
        
    }
    afterChange=(value)=>{
        console.log(value)
        this.props.setProcessTime(value)
    }
    formatter=(value)=>{
        return `${this.props.originTimeValue[value]}`
    }
    render() {
        let field = "Time"
        let values=this.props.originTimeValue
        return (
            <div className="time-temporal">
                <div className="time-temporal-tootip">
                    <Tooltip title={field}>
                        <p className="time-temporal-text">{field}</p>
                    </Tooltip>
                </div>

                <div className="time-temporal-content">
                    <Slider
                        range={true}
                        defaultValue={[0, values.length-1]}
                        dots={true}
                        step={1}
                        min={0}
                        max={values.length-1}
                        tipFormatter={this.formatter}
                        onChange={this.changeSlider}
                        onAfterChange={this.afterChange}
                    />
                </div>
                <Divider />
            </div>
        )
    }
}
