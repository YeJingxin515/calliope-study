import React, { Component } from 'react'
import './TopicSetting.less'
import { Collapse, Select ,Tooltip} from 'antd';
const { Panel } = Collapse;
const { Option } = Select;
export default class TopicSetting extends Component {
    constructor(props) {
        super(props);
    }
    onTopicSelect = (value) => {
        this.props.setTask(value)
    }
    render() {
        const { intl } = this.props;
        return (
            <Collapse defaultActiveKey={["topic"]}>
                <Panel header={intl.get("TimeAnalysisTopic")} key="topic" >
                    <div>
                        <div className="topic-select-tootip">
                            <Tooltip title={"Task"}>
                                <p className="topic-select-tootip-text">{"Task"}</p>
                            </Tooltip>
                        </div>
                        <div className="topic-select-content" style={{ display: "inline-block" }}>
                            <Select defaultValue={-1} style={{ width:'100%', marginLeft: "5px" }} onChange={this.onTopicSelect}>
                                <Option value={-1}>No task</Option>
                                <Option value={0}>Anomaly detection</Option>
                                <Option value={1}>Summarization</Option>
                                <Option value={2}>Comparison</Option>
                                {/* <Option value={3}>Prediction</Option>
                                <Option value={4}>Causality analysis</Option> */}
                            </Select>
                        </div>
                    </div>
                </Panel>
            </Collapse>
        )
    }
}
