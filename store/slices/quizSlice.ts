import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QuizStartResponse } from "@/services/api.olympics";

interface QuizState {
  data: QuizStartResponse | null;
  userAnswers: Record<string, string>; // Maps QuestionID -> OptionID
  currentQuestionIndex: number;
  activeQuizId: string | null;
}

const initialState: QuizState = {
  data: null,
  userAnswers: {},
  currentQuestionIndex: 0,
  activeQuizId: null,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    // 🟢 UPDATED: Accepts an object with both the API response and the Quiz ID
    setQuizData: (
      state,
      action: PayloadAction<{ response: QuizStartResponse; quizId: string }>
    ) => {
      state.data = action.payload.response;
      state.activeQuizId = action.payload.quizId;

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
      state.activeQuizId = null;
    },
  },
});

export const { setQuizData, selectOption, setQuestionIndex, clearQuiz } =
  quizSlice.actions;
export default quizSlice.reducer;
