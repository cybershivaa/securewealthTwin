/**
 * Redux Store Configuration
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import authReducer from './reducers/authReducer';
import registrationReducer from './reducers/registrationReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  registration: registrationReducer,
});

const middleware = [thunk];

const store = createStore(rootReducer, applyMiddleware(...middleware));

export default store;
