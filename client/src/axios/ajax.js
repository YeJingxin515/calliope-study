/*
发送异步ajax请求的模块
封装axios库
函数的返回值是promise对象
 */
import axios from 'axios'
export default function ajax(url,data={},type='GET',config={}){
    if(type==='GET'){
        return axios.get(url,{
            params:data
        });
    }else{
        if(JSON.stringify(config)==='{}'){
            return axios.post(url,data);
        }
        return axios.post(url,data,config);
    }
}