import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QuizStartResponse } from "@/services/api.olympics";

interface QuizState {
  data: QuizStartResponse | null;
  userAnswers: Record<string, string>; // Maps QuestionID -> OptionID
  currentQuestionIndex: number;
}

const initialState: QuizState = {
  data: null,
  userAnswers: {},
  currentQuestionIndex: 0,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    // 1. Save the API response
    setQuizData: (state, action: PayloadAction<QuizStartResponse>) => {
      state.data = action.payload;
      // Reset progress when starting a new quiz
      state.currentQuestionIndex = 0;
      state.userAnswers = {};
    },
    // 2. Save an answer
    selectOption: (
      state,
      action: PayloadAction<{ questionId: string; optionId: string }>
    ) => {
      state.userAnswers[action.payload.questionId] = action.payload.optionId;
    },
    // 3. Move to next/prev question
    setQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
    clearQuiz: (state) => {
      state.data = null;
      state.userAnswers = {};
      state.currentQuestionIndex = 0;
    },
  },
});

export const { setQuizData, selectOption, setQuestionIndex, clearQuiz } =
  quizSlice.actions;
export default quizSlice.reducer;
