import React, { Component } from 'react'
import './SeriesInsightsEditor.less'
import TopicSetting from './Settings/TopicSetting/TopicSetting'
import FileSetting from './Settings/FileSetting/FileSetting'
import RecommendedList from './RecommendedList'
import StartBackButton from './StartBackButton'
import ConfigureInsightSetting from '../ConfigureInsightSetting'

export default class SeriesInsightsEditor extends Component {

    render() {
        const { rightBtnState } = this.props
        return (
            <div className='time-analysis-right-wrapper' style={{ height: "100%", position: 'relative' }}>
                {rightBtnState === "Start" ?
                    <div className="init-edit-pannel" >
                        {/* <TopicSetting {...this.props} /> */}
                        <FileSetting {...this.props} />
                    </div> : <div className="init-edit-pannel" >
                        <ConfigureInsightSetting {...this.props} />
                        <RecommendedList {...this.props} />
                    </div>}
                <StartBackButton {...this.props} />
            </div>
        )
    }
}