import React, { Component } from 'react'
import { Row, Col } from 'antd';
import { generateSequence, processFile } from '../../../../axios';
import { message, Button } from 'antd';
import _ from 'lodash'
import * as d3 from 'd3'

export default class StartBackButton extends Component {
    constructor(props){
        super(props)
        this.state={
            isRequest:false
        }
    }
    clickBtn = () => {
        const {isRequest} =this.state
        const { originFileUrl, originTimeValue,file_url, timeColumnName, processTime, processGranularity, processColumns } = this.props
        if (this.props.rightBtnState === "Start") {
            // this.props.changeBtnState("Back")
            if(isRequest){
                message.warning({ content: 'Requesting, please wait!', duration: 1, style: { marginTop: '35vh' } })
                return 
            }
            this.setState({isRequest:true})
            message.loading({ content: 'Generating, please wait a moment', duration: 0, style: { marginTop: '35vh' } })
            //TODO:先请求文件处理函数
            processFile(originFileUrl, processTime[0], processTime[1], processColumns, processGranularity).then(response => {
                let result = response.data
                let newSchema = []
                let timeValue=_.cloneDeep(originTimeValue).slice(processTime[0],processTime[1])
                let _that = this
                newSchema.push({ "type": "temporal", "field": timeColumnName})
                for (let i = 0; i < processColumns.length; i++) {
                    newSchema.push({ "type": "numerical", "field": processColumns[i] })
                }
                let numericalFields = []
                let numerical = newSchema.filter(d => d.type === "numerical")
                numericalFields = numerical.map(d => d.field)
                d3.csv(result.file_url)
                    .then(function (data) {
                        data.forEach((d, i) => {
                            for (let key in d) {
                                if (numericalFields.indexOf(key) !== -1) {
                                    d[key] = parseFloat(d[key])
                                }
                            }
                        })
                        //TODO:Time value change 
                        _that.props.updateColumnsAndRange (processColumns, [0,data.length-1], result.timeValues)
                        _that.props.updateFileAndData(newSchema, data, result.file_url)
                        generateSequence(result.file_url, timeColumnName, _that.props.task).then(response => {
                            message.destroy()
                            message.success({ content: 'Generate success!', duration: 1, style: { marginTop: '35vh' } })
                            _that.props.setSequence(response.data.sequence)
                            // _that.props.setRedundantRecommend(response.data.add["recommendList"])
                            _that.props.changeBtnState("Back")
                            _that.setState({isRequest:false})
                        }).catch(error => {
                            console.log('失败', error)
                            _that.setState({isRequest:false})
                            message.error({ content: 'Sorry, time series analysis flow generation failed!', duration: 1, style: { marginTop: '35vh' } })
                            setTimeout(()=>{ message.destroy()},1000)
                        })
                    }).catch(function (error) {
                        _that.log(error)
                        this.setState({isRequest:false})
                    })
            }).catch(error => {
                console.log('失败', error)
                this.setState({isRequest:false})
                message.error({ content: 'Sorry, file preprocessing failed!', duration: 1, style: { marginTop: '35vh' } })
                setTimeout(()=>{ message.destroy()},1000)
            })
            
        } else {
            this.props.changeBtnState("Start")
        }
    }
    
    render() {
        const { intl, rightBtnState } = this.props;
        return (
            <div className="start-back-btn" style={{ width: "290px" }}>
                <Row className='edit-panel-btn'>
                    <Col onClick={this.clickBtn}>
                        <p> {rightBtnState === "Start" ? intl.get("Start") : intl.get("Back")}</p>
                    </Col>
                </Row>
            </div>
        )
    }
}
