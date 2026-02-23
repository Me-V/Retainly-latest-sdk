// services/api.edu.ts
import axios from "axios";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE; // inlined at build time in Expo [web:27][web:22]

export type ClassItem = { id: string; name: string };
export type BoardItem = { id: string; name: string };
export type StreamItem = { id: string; name: string };
export type SubjectItem = { id: string; name: string };
export type TopicItem = { id: string; name: string };
export type SubTopicItem = { id: string; name: string };
export type QuestionItem = { id: string; name?: string; title?: string };
export type ClassboardAnalyticsItem = {
  class_board_id: string;
  class_id: string;
  board_id: string;
  stream_id: string | null;
  attempted_sum_score: number;
  attempted_question_count: number;
  total_question_count: number;
  attempted_average: number;
  overall_average: number;
  completion_percentage: number;
  is_complete: boolean;
};
export type LeaderboardUserItem = {
  rank: number | null;
  user_id?: string;
  name?: string;
  questions_completed?: number;
  score?: number;
};

export type LeaderboardResponse = {
  date?: string;
  class_board_id?: string;
  mode: string;
  top: LeaderboardUserItem[];
  my_rank: LeaderboardUserItem | null;
};

export async function getClasses(token: string): Promise<ClassItem[]> {
  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/classes/`, {
      headers: {
        Authorization: `Token ${token}`, // DRF TokenAuthentication format [web:139][web:140]
      },
    });
    return res.data as ClassItem[];
  } catch (err: any) {
    console.error("Class fetch error:", err.response?.data || err.message);
    throw err;
  }
}
export async function getBoards(
  token: string,
  classId: string,
): Promise<BoardItem[]> {
  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/boards/`, {
      headers: { Authorization: `Token ${token}` },
      params: { class: classId }, // per API: query key is "class"
    });
    return res.data as BoardItem[];
  } catch (err: any) {
    console.error("Boards fetch error:", err.response?.data || err.message);
    throw err;
  }
}
export async function getStreams(
  token: string,
  classId: string,
): Promise<StreamItem[]> {
  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/streams/`, {
      headers: { Authorization: `Token ${token}` }, // DRF TokenAuth
      params: { class: classId }, // per API docs/screenshot
    });
    return res.data as StreamItem[];
  } catch (err: any) {
    console.error("Streams fetch error:", err.response?.data || err.message);
    throw err;
  }
}

export async function getSubjects(
  token: string,
  opts: { boardId: string; classId: string; streamId?: string },
): Promise<SubjectItem[]> {
  const { boardId, classId, streamId } = opts;

  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/subjects/`, {
      headers: { Authorization: `Token ${token}` }, // DRF TokenAuth [web:79]
      // Send only keys that exist; omit stream unless provided [web:71][web:69]
      params: {
        board: boardId,
        class: classId,
        ...(streamId ? { stream: streamId } : {}),
      },
    });
    return res.data as SubjectItem[];
  } catch (err: any) {
    // Keep error surface consistent with other helpers
    console.error("Subjects fetch error:", err?.response?.data || err?.message);
    throw err;
  }
}
export async function getTopics(
  token: string,
  opts: { subjectId: string },
): Promise<SubjectItem[]> {
  const { subjectId } = opts;

  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/topics/`, {
      headers: { Authorization: `Token ${token}` }, // DRF TokenAuth [web:79]
      // Send only keys that exist; omit stream unless provided [web:71][web:69]
      params: {
        subject: subjectId,
      },
    });
    return res.data as TopicItem[];
  } catch (err: any) {
    // Keep error surface consistent with other helpers
    console.error("Subjects fetch error:", err?.response?.data || err?.message);
    throw err;
  }
}
export async function getSubTopics(
  token: string,
  opts: { topicId: string },
): Promise<SubjectItem[]> {
  const { topicId } = opts;

  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/subtopics/`, {
      headers: { Authorization: `Token ${token}` }, // DRF TokenAuth [web:79]
      // Send only keys that exist; omit stream unless provided [web:71][web:69]
      params: {
        chapter: topicId,
      },
    });
    return res.data as SubTopicItem[];
  } catch (err: any) {
    // Keep error surface consistent with other helpers
    console.error("Subjects fetch error:", err?.response?.data || err?.message);
    throw err;
  }
}
export async function getQuestions(
  token: string,
  opts: { subTopicId: string },
): Promise<QuestionItem[]> {
  const { subTopicId } = opts;

  try {
    const res = await axios.get(`${API_BASE}/backend/api/content/questions/`, {
      headers: { Authorization: `Token ${token}` }, // DRF TokenAuth [web:79]
      // Send only keys that exist; omit stream unless provided [web:71][web:69]
      params: {
        subtopic: subTopicId,
      },
    });
    return res.data as QuestionItem[];
  } catch (err: any) {
    // Keep error surface consistent with other helpers
    console.error("Subjects fetch error:", err?.response?.data || err?.message);
    throw err;
  }
}
export async function getClassboardAnalytics(
  token: string,
  opts: { boardId: string; classId: string; streamId?: string },
): Promise<ClassboardAnalyticsItem> {
  const { boardId, classId, streamId } = opts;

  try {
    const res = await axios.get(
      `${API_BASE}/backend/api/analytics/classboard/`,
      {
        headers: { Authorization: `Token ${token}` },
        params: {
          board_id: boardId,
          class_id: classId,
          ...(streamId ? { stream_id: streamId } : {}),
        },
      },
    );
    return res.data as ClassboardAnalyticsItem;
  } catch (err: any) {
    console.error(
      "Analytics fetch error:",
      err?.response?.data || err?.message,
    );
    throw err;
  }
}
export async function getLeaderboard(
  token: string,
  opts: {
    boardId: string;
    classId: string;
    streamId?: string;
    mode?: "attempts" | "marks";
    timeframe: "today" | "all-time"; // 🟢 NEW: Add timeframe parameter
  },
): Promise<LeaderboardResponse> {
  const { boardId, classId, streamId, mode = "attempts", timeframe } = opts;

  try {
    const res = await axios.get(
      // 🟢 NEW: Dynamically insert the timeframe into the URL
      `${API_BASE}/backend/api/analytics/leaderboard/${timeframe}/`,
      {
        headers: { Authorization: `Token ${token}` },
        params: {
          board_id: boardId,
          class_id: classId,
          mode: mode,
          ...(streamId ? { stream_id: streamId } : {}),
        },
      },
    );
    return res.data as LeaderboardResponse;
  } catch (err: any) {
    console.error(
      "Leaderboard fetch error:",
      err?.response?.data || err?.message,
    );
    throw err;
  }
}
