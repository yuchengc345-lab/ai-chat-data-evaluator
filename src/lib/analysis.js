const REQUIRED_COLUMNS = ["user_id", "message", "sender", "created_at"];

const CATEGORY_RULES = [
  { category: "付款", keywords: ["付款", "刷卡", "分期", "匯款", "轉帳", "支付"] },
  { category: "物流", keywords: ["物流", "配送", "運送", "寄送", "到貨", "出貨"] },
  { category: "退貨", keywords: ["退貨", "退款", "退費", "取消", "換貨"] },
  { category: "價格", keywords: ["價格", "價錢", "多少錢", "費用", "報價", "太貴"] },
  { category: "產品", keywords: ["產品", "方案", "功能", "規格", "客製化", "課程", "服務"] },
  { category: "客訴", keywords: ["抱怨", "客訴", "不滿", "生氣", "沒回", "爛", "投訴"] },
];

const CATEGORY_PRIORITY = ["退貨", "物流", "付款", "價格", "產品", "客訴", "其他"];

const POSITIVE_WORDS = ["謝謝", "感謝", "喜歡", "滿意", "想買", "預約"];
const NEGATIVE_WORDS = ["抱怨", "不滿", "生氣", "太貴", "沒回", "糟", "爛", "失望", "問題"];

const INDUSTRY_PROFILES = [
  {
    id: "general",
    label: "通用",
    highIntentKeywords: ["預約", "諮詢", "聯絡"],
    categoryKeywords: {},
  },
  {
    id: "medical_beauty",
    label: "醫美",
    highIntentKeywords: ["療程", "診所", "諮詢", "預約", "醫師", "皮秒", "音波", "肉毒"],
    categoryKeywords: {
      產品: ["療程", "皮秒", "音波", "肉毒", "玻尿酸", "醫師"],
      價格: ["單次", "包套"],
    },
  },
  {
    id: "education",
    label: "教育",
    highIntentKeywords: ["試聽", "報名", "課程", "班級", "老師"],
    categoryKeywords: {
      產品: ["課程", "班級", "老師", "試聽", "教材"],
      付款: ["學費"],
    },
  },
  {
    id: "real_estate",
    label: "房仲",
    highIntentKeywords: ["看屋", "預約", "房貸", "自備款", "格局"],
    categoryKeywords: {
      產品: ["物件", "格局", "坪數", "看屋", "社區"],
      價格: ["總價", "單價", "房貸", "自備款"],
    },
  },
  {
    id: "ecommerce",
    label: "電商",
    highIntentKeywords: ["下單", "庫存", "折扣", "優惠", "尺寸"],
    categoryKeywords: {
      產品: ["尺寸", "顏色", "庫存", "材質"],
      價格: ["折扣", "優惠", "免運"],
    },
  },
];

export function parseCsv(csvText) {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) {
    throw new Error(`CSV 缺少必要欄位：${missing.join(", ")}`);
  }

  return rows.slice(1).filter(hasAnyValue).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ? row[index].trim() : "";
    });
    return record;
  });
}

export function getIndustryProfiles() {
  return INDUSTRY_PROFILES.map(({ id, label }) => ({ id, label }));
}

export function analyzeRows(rows, options = {}) {
  const industry = getIndustryProfile(options.industry);
  const validRows = rows
    .filter((row) => row.user_id && row.message && row.sender)
    .map((row) => ({
      userId: String(row.user_id),
      message: String(row.message),
      sender: String(row.sender).toLowerCase(),
      createdAt: row.created_at || "",
    }));

  const grouped = groupBy(validRows, (row) => row.userId);
  const conversations = Object.entries(grouped).map(([userId, messages]) =>
    analyzeConversation(userId, messages, industry),
  );

  return {
    generatedAt: new Date().toISOString(),
    industry: {
      id: industry.id,
      label: industry.label,
    },
    conversations,
    metrics: buildDashboardMetrics(conversations),
  };
}

export function buildDashboardMetrics(conversations) {
  const categoryCounts = new Map();
  const poorAiCounts = new Map();

  conversations.forEach((conversation) => {
    Object.entries(conversation.categoryCounts).forEach(([category, count]) => {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + count);
    });

    conversation.aiQualityIssues.forEach((issue) => {
      poorAiCounts.set(issue.category, (poorAiCounts.get(issue.category) || 0) + 1);
    });
  });

  return {
    totalConversations: conversations.length,
    highPurchaseIntentCount: conversations.filter((item) => item.purchaseIntent >= 70).length,
    negativeEmotionCount: conversations.filter((item) => item.emotionScore <= 40).length,
    requiresFollowUpCount: conversations.filter((item) => item.requiresFollowUp).length,
    topCategories: toSortedCountList(categoryCounts).slice(0, 5),
    poorAiAnswerCategories: toSortedCountList(poorAiCounts).slice(0, 5),
  };
}

function analyzeConversation(userId, messages, industry) {
  const userMessages = messages.filter((message) => message.sender === "user");
  const joinedUserText = userMessages.map((message) => message.message).join("\n");
  const categoryCounts = scoreCategories(joinedUserText, industry);
  const primaryCategory = choosePrimaryCategory(categoryCounts);
  const purchaseIntentReasons = getPurchaseIntentReasons(joinedUserText, industry);
  const emotionReasons = getEmotionReasons(joinedUserText);
  const emotionScore = clamp(60 + sumReasonPoints(emotionReasons), 0, 100);
  const churnRiskReasons = getChurnRiskReasons(joinedUserText, userMessages, emotionScore);
  const purchaseIntent = clamp(sumReasonPoints(purchaseIntentReasons), 0, 100);
  const churnRisk = clamp(sumReasonPoints(churnRiskReasons), 0, 100);
  const requiresFollowUp = purchaseIntent >= 70 || churnRisk >= 60 || emotionScore <= 40;
  const aiQualityIssues = detectAiQualityIssues(messages, categoryCounts);

  return {
    userId,
    messageCount: messages.length,
    firstMessageAt: messages[0]?.createdAt || "",
    lastMessageAt: messages[messages.length - 1]?.createdAt || "",
    purchaseIntent,
    emotionScore,
    churnRisk,
    primaryCategory,
    categoryCounts,
    scoreReasons: {
      purchaseIntent: purchaseIntentReasons,
      churnRisk: churnRiskReasons,
      emotion: emotionReasons,
    },
    requiresFollowUp,
    aiQualityIssues,
    sampleMessages: messages.slice(0, 4),
  };
}

function getPurchaseIntentReasons(text, industry) {
  const reasons = [];
  addReasonIfMatch(reasons, text, ["價格", "價錢", "多少錢", "費用", "報價"], "詢問價格", 20);
  addReasonIfMatch(reasons, text, ["付款", "刷卡", "分期", "匯款", "轉帳", "支付"], "詢問付款", 15);
  addReasonIfMatch(reasons, text, ["方案", "套餐", "課程方案"], "詢問方案", 20);
  addReasonIfMatch(reasons, text, ["客製化", "客制化", "量身", "企業方案"], "詢問客製化", 25);
  addReasonIfMatch(reasons, text, ["電話", "手機", "LINE", "line", "聯絡"], "留下聯絡方式", 30);
  addReasonIfMatch(reasons, text, ["免費", "試用", "資料", "資訊"], "只問免費資訊", 5);
  addIndustryIntentReason(reasons, text, industry.highIntentKeywords);
  return reasons;
}

function getChurnRiskReasons(text, userMessages, emotionScore) {
  const reasons = [];
  addReasonIfMatch(reasons, text, ["抱怨", "客訴", "不滿", "生氣", "沒回", "失望"], "抱怨或不滿", 30);
  addReasonIfMatch(reasons, text, ["太貴", "比較貴", "預算不夠"], "價格疑慮", 25);
  if (hasRepeatedQuestion(userMessages)) reasons.push({ label: "重複詢問", points: 20 });
  addReasonIfMatch(reasons, text, ["再看看", "考慮一下", "之後再說"], "表示再看看", 15);
  if (emotionScore <= 40) reasons.push({ label: "情緒負面", points: 20 });
  return reasons;
}

function getEmotionReasons(text) {
  const reasons = [];
  POSITIVE_WORDS.forEach((word) => {
    if (text.includes(word)) reasons.push({ label: `正面詞：${word}`, points: 8 });
  });
  NEGATIVE_WORDS.forEach((word) => {
    if (text.includes(word)) reasons.push({ label: `負面詞：${word}`, points: -12 });
  });
  return reasons;
}

function scoreCategories(text, industry) {
  const counts = {};
  const rules = CATEGORY_RULES.map((rule) => ({
    ...rule,
    keywords: [...rule.keywords, ...(industry.categoryKeywords[rule.category] || [])],
  }));

  rules.forEach((rule) => {
    const count = [...new Set(rule.keywords)].reduce(
      (total, keyword) => total + countOccurrences(text, keyword),
      0,
    );
    if (count > 0) counts[rule.category] = count;
  });
  if (Object.keys(counts).length === 0) counts["其他"] = 1;
  return counts;
}

function getIndustryProfile(industryId = "general") {
  return INDUSTRY_PROFILES.find((profile) => profile.id === industryId) || INDUSTRY_PROFILES[0];
}

function addReasonIfMatch(reasons, text, keywords, label, points) {
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword));
  if (matchedKeywords.length > 0) {
    reasons.push({ label, points, matchedKeywords });
  }
}

function addIndustryIntentReason(reasons, text, keywords) {
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword));
  if (matchedKeywords.length > 0) {
    reasons.push({
      label: "行業高意圖詞",
      points: Math.min(75, matchedKeywords.length * 25),
      matchedKeywords,
    });
  }
}

function sumReasonPoints(reasons) {
  return reasons.reduce((total, reason) => total + reason.points, 0);
}

function choosePrimaryCategory(categoryCounts) {
  if (categoryCounts["付款"]) return "付款";

  return Object.entries(categoryCounts).sort(([categoryA, countA], [categoryB, countB]) => {
    if (countA !== countB) return countB - countA;
    return CATEGORY_PRIORITY.indexOf(categoryA) - CATEGORY_PRIORITY.indexOf(categoryB);
  })[0][0];
}

function detectAiQualityIssues(messages, categoryCounts) {
  const hasAiReply = messages.some((message) => message.sender === "ai");
  const userText = messages
    .filter((message) => message.sender === "user")
    .map((message) => message.message)
    .join("\n");

  const repeated = hasRepeatedQuestion(messages.filter((message) => message.sender === "user"));
  const negativeAfterAi = hasAiReply && matches(userText, ["沒解決", "沒回答", "還是不懂", "不清楚", "不滿"]);

  if (!repeated && !negativeAfterAi) return [];

  return Object.keys(categoryCounts).map((category) => ({
    category,
    reason: repeated ? "客戶重複詢問，可能代表 AI 回覆沒有解決問題" : "AI 回覆後仍出現負面訊號",
  }));
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  return rows;
}

function hasAnyValue(row) {
  return row.some((value) => value.trim().length > 0);
}

function hasRepeatedQuestion(messages) {
  const normalized = messages
    .map((message) => message.message.replace(/[？?！!。,.，\s]/g, ""))
    .filter((message) => message.length > 3);

  return normalized.some((message, index) =>
    normalized.slice(index + 1).some((other) => other.includes(message) || message.includes(other)),
  );
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function matches(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function countOccurrences(text, keyword) {
  return text.split(keyword).length - 1;
}

function toSortedCountList(counts) {
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        CATEGORY_PRIORITY.indexOf(a.category) - CATEGORY_PRIORITY.indexOf(b.category),
    );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
