import React from 'react'
import './EditPage.less'
import { Layout, Divider, Button } from "antd"
import HeadBarView from "@/components/HeadBar/index";
import OperationType from '@/constant/OperationType';
import EditTimeView from './EditTimeView';


const { Header, Content } = Layout;

export default class EditPage extends React.Component {
    publish = () => {
        this.props.updateOperation(OperationType.PUBLISHED)
        this.props.history.push('/')
    }

    render() {
        const { intl, initDone } = this.props;
        return (
            <div className='edit-page' id='whole-container'>
                {/* <HeadBarView isLogIn={false} {...this.props} /> */}
                <Divider className="customDivider" />
                <div className='edit-page-content'>
                    <div className='edit-page-core'>
                        <EditTimeView btnState={this.props.rightBtnState} {...this.props} />
                    </div>
                </div>
            </div>
            //  <Layout >
            //      <Header style={{ height: "50px" }}>
            //         <HeadBarView isLogIn={false} {...this.props} />
            //      </Header>
            //     <Divider className="customDivider" />
            //     <Content className="eidt-page-wrapper">
            //         render your edit page
            //         <Button className='save-btn' onClick={this.publish}>{initDone && intl.get("publish")}</Button>
            //     </Content>
            // </Layout >
        )
    }
}