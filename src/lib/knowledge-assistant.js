const KNOWLEDGE_SOURCES = [
  {
    id: "faq-pricing",
    type: "FAQ",
    title: "服務與報價 FAQ",
    owner: "業務主管",
    updatedAt: "2026-06-01",
    tags: ["報價", "月費", "建置費", "服務包"],
    content:
      "內部效率包採一次性建置費加月費。建置費包含 FAQ、SOP、表格與文件整理、知識庫設定、範例問答與基本權限規劃。月費包含維護、文件更新、小幅流程調整與使用回報。",
    answer:
      "內部效率包建議用「一次性建置費 + 月費」報價。一次性建置費負責導入與文件整理，月費負責維護、更新和使用成效追蹤。",
    nextStep: "先盤點客戶現有 FAQ、SOP、表格與每月重複詢問量，再估導入範圍。",
  },
  {
    id: "sop-handoff",
    type: "SOP",
    title: "客服轉人工與異常處理 SOP",
    owner: "客服主管",
    updatedAt: "2026-05-28",
    tags: ["轉人工", "客訴", "SOP", "客服"],
    content:
      "當客戶出現客訴、不滿、退款、法務、資料錯誤、付款失敗或第三次重複提問時，AI 應提醒人工接手。人工接手後需記錄客戶問題、目前狀態、已回覆內容與下一步承諾時間。",
    answer:
      "遇到客訴、退款、付款失敗、資料錯誤或第三次重複提問時，要轉人工。接手人員要留下問題摘要、目前處理狀態、已回覆內容和下一步承諾時間。",
    nextStep: "把轉人工條件放進客服檢核表，並在每日報表追蹤高風險案例。",
  },
  {
    id: "sheet-weekly-report",
    type: "表格",
    title: "每週營運回報欄位",
    owner: "營運主管",
    updatedAt: "2026-05-30",
    tags: ["週報", "報表", "營運", "KPI"],
    content:
      "每週營運回報需包含總對話數、高購買意圖客戶數、負面情緒客戶數、需人工跟進案件、最常見問題 Top 5、AI 回覆品質問題與下週 SOP 更新建議。",
    answer:
      "週報至少要列出總對話數、高購買意圖、負面情緒、需人工跟進、常見問題 Top 5、AI 回覆品質問題和下週 SOP 更新建議。",
    nextStep: "用對話分析結果自動產出主管摘要，再由負責人補上決策和排程。",
  },
  {
    id: "sop-document-update",
    type: "SOP",
    title: "內部文件更新流程",
    owner: "行政窗口",
    updatedAt: "2026-05-25",
    tags: ["文件更新", "版本", "簽核", "知識庫"],
    content:
      "文件更新需先由部門窗口提交修改原因、適用範圍與生效日期。主管確認後，知識庫管理員更新正式版本，並保留舊版摘要。重大流程異動需公告所有使用者。",
    answer:
      "文件更新要先提交修改原因、適用範圍和生效日期，主管確認後再更新知識庫正式版本。重大流程變更要公告使用者並保留舊版摘要。",
    nextStep: "建立文件更新表單，讓每次調整都能追蹤版本和負責人。",
  },
];

const SUGGESTED_QUESTIONS = [
  "內部效率包應該怎麼報價？",
  "什麼情況客服要轉人工？",
  "主管每週報表要包含哪些欄位？",
  "SOP 或 FAQ 要怎麼更新才不會版本混亂？",
];

export function getKnowledgeSources() {
  return KNOWLEDGE_SOURCES.map(({ id, type, title, owner, updatedAt, tags }) => ({
    id,
    type,
    title,
    owner,
    updatedAt,
    tags,
  }));
}

export function getSuggestedQuestions() {
  return [...SUGGESTED_QUESTIONS];
}

export function answerKnowledgeQuestion(question) {
  const normalizedQuestion = normalize(question);

  if (!normalizedQuestion) {
    return {
      answer: "請先輸入想查詢的內部問題，例如報價、轉人工、週報欄位或文件更新流程。",
      confidence: 0,
      sources: [],
      nextStep: "選擇一個範例問題，或輸入公司內部 FAQ/SOP 相關問題。",
      reportDraft: buildReportDraft([]),
    };
  }

  const matches = KNOWLEDGE_SOURCES.map((source) => ({
    source,
    score: scoreSource(source, normalizedQuestion),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const topMatches = matches.slice(0, 2);

  if (topMatches.length === 0) {
    return {
      answer: "目前知識庫沒有直接命中的資料。建議先新增相關 FAQ 或 SOP，再讓助理引用正式文件回答。",
      confidence: 25,
      sources: [],
      nextStep: "把這題加入待補文件清單，並指定部門窗口補上標準答案。",
      reportDraft: buildReportDraft([]),
    };
  }

  return {
    answer: topMatches[0].source.answer,
    confidence: Math.min(95, 55 + topMatches[0].score * 10),
    sources: topMatches.map(({ source, score }) => ({
      id: source.id,
      type: source.type,
      title: source.title,
      owner: source.owner,
      updatedAt: source.updatedAt,
      score,
    })),
    nextStep: topMatches[0].source.nextStep,
    reportDraft: buildReportDraft(topMatches.map(({ source }) => source)),
  };
}

export function buildReportDraft(sources = KNOWLEDGE_SOURCES) {
  const selectedSources = sources.length > 0 ? sources : KNOWLEDGE_SOURCES.slice(0, 3);
  const sourceTitles = selectedSources.map((source) => `「${source.title}」`).join("、");

  return [
    "本週內部知識助理摘要：",
    `1. 主要引用文件：${sourceTitles}。`,
    "2. 重複問題可整理成 FAQ，降低客服與營運同仁查找時間。",
    "3. 需人工判斷的案例應標記負責人、狀態與下一步承諾時間。",
    "4. 下週建議：更新高頻問題答案，並補齊缺少正式 SOP 的流程。",
  ].join("\n");
}

function scoreSource(source, normalizedQuestion) {
  const haystack = normalize(
    [source.title, source.type, source.content, source.answer, source.tags.join(" ")].join(" "),
  );

  return source.tags.reduce((total, tag) => {
    const normalizedTag = normalize(tag);
    return normalizedQuestion.includes(normalizedTag) || haystack.includes(normalizedQuestion)
      ? total + 2
      : total + countKeywordHit(haystack, normalizedQuestion, normalizedTag);
  }, 0);
}

function countKeywordHit(haystack, question, keyword) {
  if (!keyword) return 0;
  if (question.includes(keyword)) return 2;

  const chunks = question.split(/[\s，。？?、/]+/).filter((chunk) => chunk.length >= 2);
  return chunks.some((chunk) => haystack.includes(chunk)) ? 1 : 0;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}
