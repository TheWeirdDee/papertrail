import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/userSlice';
import txReducer from './features/txSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    tx: txReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
