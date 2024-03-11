import React, { Component } from 'react'
import './VisOptionView.less'
import { Select } from 'antd';
const { Option } = Select;
export default class VisOptionView extends Component {
    changeLayout = (value) => {

    }
    render() {
        const { intl } = this.props;
        return (
            <div >
                <div className='VisOptionViewDiv' style={{ display: 'flex' }}>
                    {intl.get("timeSeires")}
                    {/* <Select
                        className='optionsDiv'
                        defaultValue={intl.get("timeSeires")}
                        onChange={this.changeLayout}>
                        <Option key={intl.get("table")} value={intl.get("table")}>{intl.get("table")}</Option>
                        <Option key={intl.get("timeSeires")}  value={intl.get("timeSeires")}>{intl.get("timeSeires")}</Option>
                        <Option key={intl.get("factsheet")}  value={intl.get("factsheet")}>{intl.get("factsheet")}</Option>
                    </Select> */}
                </div>
            </div>
        )
    }
}
