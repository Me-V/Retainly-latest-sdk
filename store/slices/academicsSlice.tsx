// src/store/slices/academicsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type IdName = { id: string; name: string };

type AcademicsState = {
  selectedClass: IdName | null;
  selectedBoard: IdName | null;
  selectedStream: IdName | null;
};

const initialState: AcademicsState = {
  selectedClass: null,
  selectedBoard: null,
  selectedStream: null,
};

const academicsSlice = createSlice({
  name: "academics",
  initialState,
  reducers: {
    setSelectedClass: (state, action: PayloadAction<IdName>) => {
      const same = state.selectedClass?.id === action.payload.id;
      state.selectedClass = action.payload;
      if (!same) {
        state.selectedBoard = null;
        state.selectedStream = null;
      }
    },
    setSelectedBoard: (state, action: PayloadAction<IdName>) => {
      state.selectedBoard = action.payload;
      state.selectedStream = null;
    },
    setSelectedStream: (state, action: PayloadAction<IdName>) => {
      state.selectedStream = action.payload;
    },
    clearAcademics: (state) => {
      state.selectedClass = null;
      state.selectedBoard = null;
      state.selectedStream = null;
    },
  },
});

export const {
  setSelectedClass,
  setSelectedBoard,
  setSelectedStream,
  clearAcademics,
} = academicsSlice.actions;
export default academicsSlice.reducer;
