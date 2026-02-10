// services/api.chat.ts
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_BASE;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const startAttempt = async (token: string, questionId: string) => {
  try {
    const response = await api.post(
      "/backend/api/chatservice/attempt/start/",
      { question_id: questionId },
      { headers: { Authorization: `Token ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error("Start Attempt Error:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  token: string,
  attemptId: string,
  message: string,
) => {
  try {
    const response = await api.post(
      "/backend/api/chatservice/chat/send/",
      {
        attempt_id: attemptId,
        message: message,
      },
      { headers: { Authorization: `Token ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error("Send Message Error:", error);
    throw error;
  }
};

export const getChatHistory = async (token: string, attemptId: string) => {
  try {
    const response = await api.get("/backend/api/chatservice/chat/history/", {
      params: { attempt_id: attemptId }, // This adds ?attempt_id=... to the URL
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Get History Error:", error);
    throw error;
  }
};
