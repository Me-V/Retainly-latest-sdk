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
  classId: string
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
  classId: string
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
  opts: { boardId: string; classId: string; streamId?: string }
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
  opts: { subjectId: string }
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
  opts: { topicId: string }
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
  opts: { subTopicId: string }
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
