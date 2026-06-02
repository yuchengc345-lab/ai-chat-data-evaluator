export function exportFollowUpCsv(conversations) {
  const headers = [
    "user_id",
    "primary_category",
    "purchase_intent",
    "emotion_score",
    "churn_risk",
    "reason",
  ];

  const rows = conversations
    .filter((conversation) => conversation.requiresFollowUp)
    .map((conversation) => [
      conversation.userId,
      conversation.primaryCategory,
      conversation.purchaseIntent,
      conversation.emotionScore,
      conversation.churnRisk,
      getFollowUpReason(conversation),
    ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function getFollowUpReason(conversation) {
  if (conversation.purchaseIntent >= 70) return "高購買意圖";
  if (conversation.churnRisk >= 60) return "高流失風險";
  if (conversation.emotionScore <= 40) return "負面情緒";
  return "需要人工跟進";
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}
