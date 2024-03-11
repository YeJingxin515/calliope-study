import React, { Component } from 'react'
import StorylineWebView from './StorylineWebView/StorylineWebView'
import FactSheetView from './FactSheetView/FactSheetView'
import './ExportPage.less'
export default class ExportPage extends Component {
    constructor(props){
        super(props)
    }
    render() {
        let storyview =
            <StorylineWebView
                forPublish={true}
                visContainerSize={{width:750,height:669}}
                {...this.props}
            />
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {storyview}
                {/* <div style={{height:'90%',position:'relative'}}>
                    <div className='factsheetContainer'>
                        <FactSheetView {...this.props}/>
                    </div>
                </div> */}
            </div>
        )
    }
}