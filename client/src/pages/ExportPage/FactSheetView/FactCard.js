import React, { Component } from 'react'
import { originChartSize } from '../../../constant/ChartSize'
import Chart from '../../../insight_charts/Chart';
import _ from 'lodash';
import './FactCard.less'
export default class FactCard extends Component {
    constructor(props){
        super(props)
        this.calcuChartSize()
    }
    calcuChartSize(){
        switch(this.props.factStyle){
            case '2p3':// 每行三个
                this.width=230;
                break;
            case '2p':
                this.width=300;
                break;
            case '3p':
                this.width=350;
                break

            case '4p':
                this.width=400;
                break

            case '6p':
                this.width=560;
                break
            default:
                break;
        }
    }
    componentDidMount() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = this.width / originChartSize[chartType].width
                let y = (this.width/2+50) / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
    componentDidUpdate() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = this.width / originChartSize[chartType].width
                let y = this.height / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
  render() {
    const {index,factType,insightSpec}=this.props
    // let origin=require('../../../insight_charts/spec/trend.json');
    let exportSpec=insightSpec
    exportSpec.chart.id='export-'+index+'-'+factType
    exportSpec.chart.width=originChartSize[factType].width
    exportSpec.chart.height=originChartSize[factType].height
    exportSpec.chart.showTooltip=false
    return (
        <div 
            className='insight-fact-card'
            ref={(node) => this.visNode = node}>
            <Chart spec={exportSpec}/>
        </div>
    )
  }
}
