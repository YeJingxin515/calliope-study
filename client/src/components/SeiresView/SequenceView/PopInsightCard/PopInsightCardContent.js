import React, { Component } from 'react'
import Chart from '../../../../insight_charts/Chart'
import { originChartSize } from '../../../../constant/ChartSize';
export default class PopInsightCardContent extends Component {
    componentDidMount() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x,y
                if(chartType=="multivariate_distribution"||chartType=="multivariate_outlier"){
                    x = 350 / originChartSize[chartType].width
                    y = 200 / originChartSize[chartType].height
                }else{
                    x = 446 / originChartSize[chartType].width
                    y = 222 / originChartSize[chartType].height
                }
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
    shouldComponentUpdate(nextProps){
        const { currentPopInsightList } = this.props
        return !_.isEqual(currentPopInsightList, nextProps.currentPopInsightList);
    }
    componentDidUpdate() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x,y
                if(chartType=="multivariate_distribution"||chartType=="multivariate_outlier"){
                    x = 400 / originChartSize[chartType].width
                    y = 222 / originChartSize[chartType].height
                }else{
                    x = 446 / originChartSize[chartType].width
                    y = 222 / originChartSize[chartType].height
                }
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
  shouldComponentUpdate(nextProps){
        const { insightSpec} = this.props
        let nextFact = nextProps.insightSpec["fact"];
        return !_.isEqual(insightSpec["fact"], nextFact);
  }
  render() {
    const{index,insightSpec,factType}=this.props
    //修改图表显示的格式
    insightSpec.chart.id = 'popCard-' + index.toString()
    insightSpec.chart.width = originChartSize[factType].width
    insightSpec.chart.height = 0 // originChartSize[factType].height
    insightSpec.chart.showTooltip = true
    return (
        <div 
            className='vis' 
            ref={(node) => this.visNode = node}>
            <Chart spec={insightSpec} />
        </div>
    )
  }
}

// style = {(factType === "multivariate_outlier" || factType === "similarity") ? { overflowY: 'scroll', overflowX: 'hidden' } : null}