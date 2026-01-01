/**
 * MBTI 分析 API 中介層
 * 接收來自 Chrome 擴展的請求，調用 LLM 服務，返回結構化結果
 */

// ============ 配置部分 ============
// 支持的 LLM 提供商
// 重要：這些必須從 Vercel 環境變數中讀取，不能有預設值
const LLM_PROVIDER = process.env.LLM_PROVIDER;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL;

// 驗證必要的配置
if (!LLM_PROVIDER) {
  console.error('❌ 錯誤：未設定 LLM_PROVIDER 環境變數');
}

// ============ 核心 API Handler ============
export async function POST(request) {
  try {
    // 1. 驗證請求
    const body = await request.json();
    const { text, mbti, locale } = body;

    if (!text || !mbti) {
      return jsonResponse({
        error: '缺少必要參數: text 或 mbti',
        status: 'error'
      }, 400);
    }

    if (text.length > 500) {
      return jsonResponse({
        error: '文字超過 500 字限制',
        status: 'error'
      }, 400);
    }

    // 2. 調用 LLM 服務
    let analysisResult;
    if (LLM_PROVIDER === 'mock' || !LLM_API_KEY) {
      // 模擬回應（用於測試）
      analysisResult = getMockAnalysis(text, mbti, locale);
    } else if (LLM_PROVIDER === 'openai') {
      analysisResult = await callOpenAI(text, mbti, locale);
    } else if (LLM_PROVIDER === 'anthropic') {
      analysisResult = await callAnthropic(text, mbti, locale);
    } else {
      throw new Error(`不支持的 LLM 提供商: ${LLM_PROVIDER}`);
    }

    // 3. 確保返回結構符合擴展期望
    const response = {
      literal: analysisResult.literal || '',
      signals: analysisResult.signals || [],
      mbti_lens: analysisResult.mbti_lens || {},
      misunderstanding_risks: analysisResult.misunderstanding_risks || [],
      summary: analysisResult.summary || ''
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error('API 錯誤:', error);
    return jsonResponse({
      error: error.message || '伺服器錯誤',
      status: 'error'
    }, 500);
  }
}

// ============ LLM 調用實現 ============

/**
 * 調用 OpenAI API
 */
async function callOpenAI(text, mbti, locale) {
  const systemPrompt = buildPrompt(mbti, locale);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `請分析以下文字：\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析 LLM 的 JSON 響應
  return parseAnalysisResponse(content);
}

/**
 * 調用 Anthropic API
 */
async function callAnthropic(text, mbti, locale) {
  const systemPrompt = buildPrompt(mbti, locale);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LLM_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: LLM_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `請分析以下文字：\n\n${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  return parseAnalysisResponse(content);
}

/**
 * 構建 LLM Prompt
 */
function buildPrompt(mbti, locale) {
  const localeLabel = {
    'zh-TW': '繁體中文',
    'zh-CN': '簡體中文',
    'en': 'English'
  }[locale] || '繁體中文';

  return `你是一位專業的心理學家，擅長 MBTI 人格分析。

請以 ${mbti} 人格類型的視角分析用戶提供的文字。你的回應必須是 JSON 格式，使用 ${localeLabel} 表達。

JSON 結構必須如下：
{
  "literal": "字面意思（對原文的直白理解）",
  "signals": [
    {"cue": "可能的信號1", "evidence": "在文字中的證據"},
    {"cue": "可能的信號2", "evidence": "在文字中的證據"}
  ],
  "mbti_lens": {
    "focus": ["${mbti} 會關注的重點1", "重點2"],
    "likely_intentions": ["可能的意圖1", "可能的意圖2"],
    "unspoken_needs": ["可能的潛在需求1", "潛在需求2"]
  },
  "misunderstanding_risks": [
    {"risk": "誤解風險1", "why": "為什麼會產生這種誤解"},
    {"risk": "誤解風險2", "why": "為什麼會產生這種誤解"}
  ],
  "summary": "整體分析摘要（一句話）"
}

重要：
1. 只返回 JSON，不要有其他文字
2. 所有文字使用 ${localeLabel}
3. 每個陣列至少包含 2-3 個項目
4. 保持專業、客觀的語氣`;
}

/**
 * 解析 LLM 返回的 JSON
 */
function parseAnalysisResponse(content) {
  try {
    // 嘗試直接解析 JSON
    return JSON.parse(content);
  } catch (e) {
    // 如果失敗，嘗試提取 JSON 部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // 最後回退到模擬回應
        return getMockAnalysis(content.substring(0, 100), 'INTJ', 'zh-TW');
      }
    }
    throw new Error('無法解析 LLM 回應');
  }
}

/**
 * 模擬分析回應（用於無 API Key 時的測試）
 */
function getMockAnalysis(text, mbti, locale) {
  const localeTexts = {
    'zh-TW': {
      literal: `「${text.substring(0, 50)}...」的字面意思是使用者想表達這個想法。`,
      signals: [
        { cue: '用詞較為直接', evidence: '選擇了簡潔的表達方式' },
        { cue: '可能有情緒', evidence: '表述中隱含的態度' }
      ],
      focus: ['邏輯一致性', '實際意義'],
      intentions: ['清楚表達想法', '尋求理解'],
      needs: ['被認真對待', '被正確理解'],
      risk1: '過於直接可能被誤解為態度冷漠',
      risk2: '缺乏上下文可能導致歧義'
    },
    'zh-CN': {
      literal: `「${text.substring(0, 50)}...」的字面意思是用户想表达这个想法。`,
      signals: [
        { cue: '用词较为直接', evidence: '选择了简洁的表达方式' },
        { cue: '可能有情绪', evidence: '表述中隐含的态度' }
      ],
      focus: ['逻辑一致性', '实际意义'],
      intentions: ['清楚表达想法', '寻求理解'],
      needs: ['被认真对待', '被正确理解'],
      risk1: '过于直接可能被误解为态度冷漠',
      risk2: '缺乏上下文可能导致歧义'
    },
    'en': {
      literal: `The literal meaning of "${text.substring(0, 50)}..." is what the user intends to express.`,
      signals: [
        { cue: 'Direct word choice', evidence: 'Uses concise expression' },
        { cue: 'Possible emotion', evidence: 'Implied attitude in statement' }
      ],
      focus: ['Logical consistency', 'Practical meaning'],
      intentions: ['Express idea clearly', 'Seek understanding'],
      needs: ['Be taken seriously', 'Be understood correctly'],
      risk1: 'Too direct might be misread as coldness',
      risk2: 'Lack of context may cause ambiguity'
    }
  };

  const t = localeTexts[locale] || localeTexts['zh-TW'];

  return {
    literal: t.literal,
    signals: t.signals,
    mbti_lens: {
      focus: t.focus,
      likely_intentions: t.intentions,
      unspoken_needs: t.needs
    },
    misunderstanding_risks: [
      { risk: t.risk1, why: '溝通風格差異導致的誤會' },
      { risk: t.risk2, why: '信息不完整引發的理解偏差' }
    ],
    summary: `從 ${mbti} 的視角看，使用者的表述反映了邏輯性和直接性的特點。`
  };
}

/**
 * 工具函數：返回 JSON 響應
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

/**
 * 處理 CORS OPTIONS 請求
 */
export async function OPTIONS() {
  return jsonResponse({}, 200);
}
