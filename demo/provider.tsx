import React from 'react';
import { HashRouter } from 'react-router-dom'
import { ReduxProvider, initStore } from '../src';

export const {
  store,
  updateReducer,
} = initStore({}, {})

export const Provider:React.FC = ({ children }) => {
  return (
    <ReduxProvider store={store}>
      <HashRouter>
        {children}
      </HashRouter>
    </ReduxProvider>
  )
}