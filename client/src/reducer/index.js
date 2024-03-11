import { combineReducers } from 'redux';
import story from './story';
import user from './user';
import series from './series';

export default combineReducers({
    story,
    user,
    series
});