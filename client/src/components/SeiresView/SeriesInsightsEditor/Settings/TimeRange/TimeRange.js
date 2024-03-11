import React, { Component } from 'react'
import { Slider, Switch } from 'antd';

export default class TimeRange extends Component {
  setTipValue=(index)=>{
    const {timeValue}=this.props
    if (timeValue.length===0)return
    return timeValue[index]
  }

  render() {
    const {min,max,start,end}=this.props
    return (
        <Slider 
            range={true}
            min={min}
            max={max}
            defaultValue={[start, end]} 
            value={[start, end]}
            // tooltipVisible={true}
            tipFormatter={this.setTipValue}
            onChange={this.props.changeTime}
        />
    )
  }
}
