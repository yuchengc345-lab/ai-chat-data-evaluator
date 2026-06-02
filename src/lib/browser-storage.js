export const ANALYSIS_STORAGE_KEY = "ai-chat-data-evaluator:last-analysis";

export function saveAnalysis(analysis) {
  window.localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
}

export function loadAnalysis() {
  const raw = window.localStorage.getItem(ANALYSIS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
