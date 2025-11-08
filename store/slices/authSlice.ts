// store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  userInfo: any | null;
}

const initialState: AuthState = {
  token: null,
  userInfo: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ token: string; userInfo: any }>) {
      state.token = action.payload.token;
      state.userInfo = action.payload.userInfo;
    },
    logout(state) {
      state.token = null;
      state.userInfo = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
