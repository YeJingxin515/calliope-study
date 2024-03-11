//import { createSelector } from 'reselect';
import Cookies from 'js-cookie';

export const operateState = state => state.user.operateState;
export const isLogin = state => state.user.isLogin;
export const convertType = state => state.user.convertType;
export const currentLocale = state => state.user.currentLocale;

export const getUserInfo = state => {
    return Cookies.get("userInfo") && JSON.parse(Cookies.get("userInfo")) ? JSON.parse(Cookies.get("userInfo")) : {
        username: "",
        uid: -1
    }
}

