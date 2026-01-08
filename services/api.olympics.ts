import axios from "axios";

// 1. The Data Type (Same as before)
export interface OlympicQuiz {
  id: string;
  title: string;
  description: string;
  duration_seconds: number;
  grace_seconds: number;
  max_attempts: number;
}

export interface QuizResultResponse {
  attempt_id: string;
  quiz_id: string;
  status: string;
  score: number;
  max_score: number;
  attempted_count: number;
  total_questions: number;
  percentage: number;
  passing_percentage: number;
  result: "PASS" | "FAIL";
  result_out_at: string;
  correct_count: number;
  incorrect_count: number;
}

interface SubmitAnswerResponse {
  saved: boolean;
  remaining_seconds: number;
  attempted_count: number;
}

export interface SubmitQuizResponse {
  detail: string;
  attempt_id: string;
  status: string; // e.g. "SUBMITTED"
}

export interface QuizStartResponse {
  attempt_id: string;
  expires_at: string; // "2025-12-19T08:50:52..." -> We rely on THIS for the timer
  questions: {
    id: string;
    text: string;
    options: { id: string; text: string }[];
  }[];
}

export interface UnlockResponse {
  unlocked?: boolean;
  unlocked_via?: string;
  detail?: string;
  locked_until_admin?: string | boolean;
  attempts_left?: string | number;
}

export interface PreviewData {
  quiz: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    duration_seconds: number;
    max_attempts: number;
  };
  set: {
    id: string;
    set_code: string;
  };
  preview_token: string;
}

export interface PinRequiredResponse {
  detail: string;
  pin_required: "True";
  locked_until_admin: "True" | "False";
  attempts_left: string;
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

/**
 * Fetches the list of live quizzes.
 * @param token - The user's authorization token (JWT)
 */
export const getLiveQuizzes = async (token: string): Promise<OlympicQuiz[]> => {
  try {
    const response = await axios.get<OlympicQuiz[]>(
      `${API_BASE}/backend/api/olympics/quizzes/`,
      {
        headers: {
          // This is how we attach the "key" to the request
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching live quizzes:", error);
    throw error;
  }
};

// 1. Fetch Preview (Returns Union Type)
export const getQuizPreview = async (
  quizId: string,
  token: string,
  password?: string // 🟢 Added optional password parameter
): Promise<QuizStartResponse> => {
  try {
    const response = await axios.get<QuizStartResponse>(
      `${API_BASE}/backend/api/olympics/quizzes/${quizId}/preview/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
        // 🟢 Pass password as a query param if provided
        // Result: .../preview/?password=1234
        params: password ? { password: password } : {},
      }
    );
    return response.data;
  } catch (error) {
    // We intentionally don't catch/swallow the error here so the UI can handle the 400 status
    // console.error("Error fetching quiz preview:", error);
    throw error;
  }
};

// 2. Submit PIN (New Endpoint)
export const unlockQuiz = async (
  quizId: string,
  token: string,
  pin: string
): Promise<UnlockResponse> => {
  try {
    const response = await axios.post<UnlockResponse>(
      `${API_BASE}/backend/api/olympics/quizzes/${quizId}/unlock/`,
      { pin }, // Body
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    // We throw error to be handled by the UI (specifically 400s)
    throw error;
  }
};

export const startQuiz = async (
  quizId: string,
  token: string,
  previewToken: string
): Promise<QuizStartResponse> => {
  try {
    // Note: If your backend expects a POST, change axios.get to axios.post
    // Based on standard REST design, '/start' is usually a POST.
    const response = await axios.post<QuizStartResponse>(
      `${API_BASE}/backend/api/olympics/quizzes/${quizId}/start/`,
      { preview_token: previewToken },
      {
        headers: { Authorization: `Token ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error starting quiz:", error);
    throw error;
  }
};

export const submitAnswer = async (
  attemptId: string,
  questionId: string,
  selectedOptionId: string,
  token: string
): Promise<SubmitAnswerResponse> => {
  try {
    const url = `${process.env.EXPO_PUBLIC_API_BASE}/backend/api/olympics/attempts/${attemptId}/answer/`;

    const response = await axios.patch<SubmitAnswerResponse>(
      url,
      {
        question_id: questionId,
        selected_option_id: selectedOptionId,
      },
      {
        headers: {
          Authorization: `Token ${token}`, // Or 'Bearer' depending on your backend
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting answer:", error);
    throw error;
  }
};

export const submitQuiz = async (
  attemptId: string,
  token: string
): Promise<SubmitQuizResponse> => {
  try {
    const url = `${process.env.EXPO_PUBLIC_API_BASE}/backend/api/olympics/attempts/${attemptId}/submit/`;

    // It's a POST request (usually) or PATCH.
    // Based on standard flows, 'submit' actions are often POST.
    // If you get a 405 Method Not Allowed, change this to axios.patch or axios.put
    const response = await axios.post<SubmitQuizResponse>(
      url,
      {}, // Empty body
      {
        headers: { Authorization: `Token ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting quiz:", error);
    throw error;
  }
};

export const getQuizResult = async (
  attemptId: string,
  token: string
): Promise<QuizResultResponse> => {
  try {
    const url = `${process.env.EXPO_PUBLIC_API_BASE}/backend/api/olympics/attempts/${attemptId}/result/`;

    const response = await axios.get<QuizResultResponse>(url, {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching result:", error);
    throw error;
  }
};
