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
