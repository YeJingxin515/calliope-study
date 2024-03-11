import React, { Component } from 'react'
import './FileSetting.less'
import { Tooltip, Collapse, Tag, Divider, Checkbox } from 'antd';
import TemporalSetting from './TemporalSetting/TemporalSetting';
const { Panel } = Collapse;
const { CheckableTag } = Tag;
// const granularityName = ['Year', 'Month', 'Day', 'Hour', 'Minute'];
// const columnsName = ['CPU usage[MHZ]', 'CPU usage[%]', 'Memory usage[KB]', 'CPU cores', 'Network received throughput[]KB'];

export default class FileSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectTags: true,
      selectedGranularity: this.props.granularityName[this.props.granularityName.length - 1],
      selectedColumns: this.props.originColumnName
    }
  }
  componentDidMount() {
    this.props.setProcessGranularity(this.props.granularityName[this.props.granularityName.length - 1])
    this.props.setProcessColumns(this.props.originColumnName)
  }
  handleGranularityChange = (tag, checked) => {
    const { selectedGranularity } = this.state;
    const nextSelectedTags = checked ? tag : selectedGranularity
    this.setState(state => ({ selectedGranularity: nextSelectedTags }), () => {
      this.props.setProcessGranularity(this.state.selectedGranularity)
      console.log(this.state.selectedGranularity)
    })
    this.setState({ selectedGranularity: nextSelectedTags });
  }
  handleColumnsChange = (tag, checked) => {
    const { selectedColumns, selectTags } = this.state;
    const nextSelectedTags = checked ? [...selectedColumns, tag] : selectedColumns.filter(t => t !== tag);

    this.setState(state => ({ selectedColumns: nextSelectedTags }), () => {
      //全选状态or非全选状态（联动）
      if (nextSelectedTags.length === this.props.originColumnName.length) {
        this.setState({ selectTags: true });
      } else {
        this.setState({ selectTags: false });
      }
      this.props.setProcessColumns(this.state.selectedColumns)
      console.log(this.state.selectedColumns)
    });
  }
  selectAllTags = (e) => {
    if (e.target.checked) {
      this.setState({ selectedColumns: this.props.originColumnName, selectTags: true });
    } else {
      this.setState({ selectedColumns: [], selectTags: false });
    }

  }
  render() {
    const { selectedGranularity, selectedColumns, selectTags } = this.state;
    const { intl } = this.props;
    return (
      <Collapse defaultActiveKey={["data-options"]}>
        <Panel header={intl.get("DataOptions")} key="data-options" >
          <div className='data-option'>
            <TemporalSetting {...this.props} />
            <div className='time-granularity'>
              <div className="time-granularity-tootip">
                <Tooltip title={intl.get("Granularity")}>
                  <p className="time-granularity-tootip-text">{intl.get("Granularity")}</p>
                </Tooltip>
              </div>
              <div className='time-granularity-content'>
                {
                  this.props.granularityName.map(tag => (
                    <CheckableTag
                      key={tag}
                      checked={selectedGranularity.indexOf(tag) > -1}
                      onChange={checked => this.handleGranularityChange(tag, checked)}>
                      {tag}
                    </CheckableTag>
                  ))}
              </div>
              <Divider />
            </div>
            <div className='time-columns'>
              <div className="time-columns-tootip">
                <Tooltip title={"Columns"}>
                  <p className="time-columns-tootip-text">{"Variables"}</p>
                </Tooltip>
              </div>
              <div className='time-columns-content'>
                <div className='select-all-tags'>
                  <Checkbox
                    onChange={this.selectAllTags}
                    checked={selectTags}>
                    {intl.get("SelectAll")}
                  </Checkbox>
                </div>
                {
                  this.props.originColumnName.map(tag => (
                    <CheckableTag
                      key={tag}
                      checked={selectedColumns.indexOf(tag) > -1}
                      onChange={checked => this.handleColumnsChange(tag, checked)}>
                      {tag}
                    </CheckableTag>
                  ))
                }
              </div>
            </div>
          </div>
        </Panel>
      </Collapse>
    )
  }
}
