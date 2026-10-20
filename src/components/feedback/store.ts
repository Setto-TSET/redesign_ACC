import type { FeedbackEntry } from './csv';

const KEY = 'accpharm_feedback';
const NAME_KEY = 'accpharm_feedback_name';

/** อ่านแบบทนข้อมูลเสีย/ถูกบล็อก — คืน [] แทนการ throw */
export function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFeedback(list: FeedbackEntry[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const loadName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

export const saveName = (name: string) => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ไม่จำชื่อได้ก็ไม่เป็นไร */
  }
};

export const FEEDBACK_KEY = KEY;
