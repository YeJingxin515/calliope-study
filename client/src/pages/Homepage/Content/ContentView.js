import React from 'react';
import { Layout, Divider, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import "./ContentView.less";

export default class ContentView extends React.Component {

    render() {
        const { intl, initDone } = this.props;

        const SloganView = () => {
            return (
                <div>
                    <div style={{ height: "148px" }} className='slogan'>
                        <span >{initDone && intl.get("CalliopeTimeSeries")}</span>
                        <span>{initDone && intl.get("slogan")}</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: '1px' }}>
                        <div className='decorationImage'></div>
                        <div className='customDivider' ></div>
                    </div>
                </div>
            )
        };

        const BelowPannel = () => {
            return (
                <div>
                    <div className="slogan" style={{ height: "68px" }}>
                        <span style={{ color: "#F28B30" }}>Sample Datasets</span>
                    </div>
                    <div className='belowPannel'>
                        <div className="cloumnDiv">
                            <div className="icon5 iconSize"></div>
                            <span>{initDone && intl.get("5")}</span>
                            <a href='/Global Covid-19.csv'>
                                <Button type="primary" shape="round" icon={<DownloadOutlined />} size={'large'}>
                                </Button>
                            </a>
                        </div>
                        <div className="cloumnDiv">
                            <div className="icon2 iconSize"></div>
                            <span>{initDone && intl.get("2")}</span>
                            <a href='/Physiological Measurements.csv'>
                                <Button type="primary" shape="round" icon={<DownloadOutlined />} size={'large'}>
                                </Button>
                            </a>
                        </div>
                        <div className="cloumnDiv">
                            <div className="icon3 iconSize"></div>
                            <span>{initDone && intl.get("3")}</span>
                            <a href='/Bitbrain Datacenter Traces.csv'>
                                <Button type="primary" shape="round" icon={<DownloadOutlined />} size={'large'}>
                                </Button>
                            </a>
                        </div>
                        {/* <div className="cloumnDiv" >
                        <div className="icon4 iconSize"></div>
                        <span>{initDone && intl.get("4")}</span>
                        <span>{initDone && intl.get("41")}</span>
                    </div>
                    <div className="cloumnDiv">
                        <div className="icon1 iconSize"></div>
                        <span >{initDone && intl.get("1")}</span>
                        <span>{initDone && intl.get("11")}</span>
                    </div>
                    <div className="cloumnDiv">
                        <div className="icon6 iconSize"></div>
                        <span>{initDone && intl.get("6")}</span>
                        <span>{initDone && intl.get("61")}</span>
                    </div> */}
                    </div>
                </div>
            )
        };
        const HowtoConvert = () => {
            return (
                <div className="howtoConvert">
                    <div></div>
                    <div >
                        <span>{initDone && intl.get("Howtoconvert")}</span>
                        <span>{initDone && intl.get("step1")}</span>
                        <span>{initDone && intl.get("step2")}</span>
                        <span>{initDone && intl.get("step3")}</span>
                    </div>
                </div>
            )
        };
        return (
            <div className='ContentView' >
                <SloganView />
                <Layout style={{ marginTop: "23px", width: "100%", backgroundColor: "white" }}>
                    {
                        this.props.children
                    }
                    <BelowPannel {...this.props} />
                    {/* <Divider style={{ backgroundColor: "#979797", margin: "0px" }} /> */}
                    {/* <HowtoConvert {...this.props} /> */}
                </Layout>
            </div>
        )
    }
}