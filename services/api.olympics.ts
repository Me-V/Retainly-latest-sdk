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

export interface QuizStartResponse {
  attempt_id: string;
  expires_at: string; // "2025-12-19T08:50:52..." -> We rely on THIS for the timer
  questions: {
    id: string;
    text: string;
    options: { id: string; text: string }[];
  }[];
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
export const startQuiz = async (
  quizId: string,
  token: string
): Promise<QuizStartResponse> => {
  try {
    // Note: If your backend expects a POST, change axios.get to axios.post
    // Based on standard REST design, '/start' is usually a POST.
    const response = await axios.post<QuizStartResponse>(
      `${API_BASE}/backend/api/olympics/quizzes/${quizId}/start/`,
      {},
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
