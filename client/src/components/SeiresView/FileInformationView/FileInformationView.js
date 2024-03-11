import React, { Component } from 'react'
import { message } from "antd";
import './FileInformationView.less'

// const timeSeiresName = "硬件指标"
// const scope="[2007/01/01 - 2011/01/01]..."
export default class FileInformationView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isEditable: true,
        }
    }
    endEditing = () => {
        let title = this.titleNode.innerText;
        if (title === '') {
            message.info(this.props.intl.get('Title cannot be null'))
            this.titleNode.focus()
            this.titleNode.innerText = this.props.intl.get('Please input title here')
            return
        }
        // this.props.changeTitle(title)
    }
    render() {
        const { intl,timeValue,originTimeValue,rightBtnState } = this.props
        const { isEditable } = this.state
        let title=this.props.fileName.replace('.csv','').replace('.CSV','')

        let scope=''
        if(rightBtnState==='Start'){
            scope= `[${originTimeValue[0]} - ${originTimeValue[originTimeValue.length-1]}]...`
        }else{
            scope= `[${timeValue[0]} - ${timeValue[timeValue.length-1]}]...`
        }
        return (
            <div className="file-information">
                <div className='time-series-title-box'>
                    Visail:
                    {/* {intl.get("TimeSeiresTitle")} */}
                    <div className='time-series-title'
                        ref={(titleNode) => this.titleNode = titleNode}
                        suppressContentEditableWarning={true}
                        contentEditable={isEditable}
                        onBlur={this.endEditing}
                        onKeyDown={(e) => {
                            //console.log(e.keyCode)
                            if (e.keyCode === 13) {
                                if (this.titleNode) {
                                    this.titleNode.blur()
                                }
                                e.preventDefault()
                            }
                            if (e.keyCode === 8) {//删除按键
                                if (this.titleNode && this.titleNode.innerText.length === 1) {
                                    e.preventDefault()
                                    message.info(intl.get('Title cannot be null'))
                                }
                            }
                        }}>
                        {title}
                    </div>
                </div>
                <div className='time-scope-box'>
                    <p className='time-scope'>
                        <span className='scope-title'>
                            {intl.get("DataScope")}
                        </span>
                        <span className='scope-value'>
                            {scope}
                        </span>
                    </p>
                </div>
            </div>
        )
    }
}
