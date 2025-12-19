import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import academicsReducer from "./slices/academicsSlice";
// 1. IMPORT YOUR NEW SLICE HERE
import quizReducer from "./slices/quizSlice";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  // 2. ADD "quiz" TO THIS LIST
  // This ensures the questions are saved to the phone's storage
  whitelist: ["auth", "academics", "quiz"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  academics: academicsReducer,
  // 3. REGISTER THE REDUCER HERE
  // This fixes the "Cannot read property 'data' of undefined" error
  quiz: quizReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
