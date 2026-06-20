import { configureStore } from "@reduxjs/toolkit";
import { cardApi } from "../entities/card/api/cardApi";

export const store = configureStore({
  reducer: {
    [cardApi.reducerPath]: cardApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cardApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
