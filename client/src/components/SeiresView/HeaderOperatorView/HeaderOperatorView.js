import React, { Component } from 'react'
import { NavLink as Link } from 'react-router-dom'
import './HeaderOperatorView.less'
import { message } from 'antd';
export default class HeaderOperatorView extends Component {
    constructor(props) {
        super(props);
        // this.history=useHistory();

    }
    exportResult = () => {
        const {rightBtnState}=this.props
        if(rightBtnState==="Start"){
            message.warning({ content: 'Cannot export currently!', duration: 1, style: { marginTop: '35vh' } })
        }
        // const w=window.open('about:blank');
        // w.location.href="/#export?sequence="+this.props.sequence + "&currentLocale="+this.props.currentLocale;
        // this.props.history.push("/export", {id:1});
        // this.history.push({pathname: '/export', state: {id: 1}})
    }
    render() {
        const { intl ,timeValue,sequence,currentLocale,rightBtnState} = this.props
        return (
            <div className='editor-box'>
                <div className="export-box-operator-wapper">
                    <div className="export-box-operator">
                        <div className="export-btn-div" onClick={this.exportResult}>
                            <div className="export-btn"></div>
                            
                            <Link
                                
                                to={rightBtnState!=="Start"?{ pathname: "/export",state:{sequence:sequence,currentLocale:currentLocale,timeValue:timeValue} }:{}}
                                // target="_blank"
                                >
                                {intl.get("Export")}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
