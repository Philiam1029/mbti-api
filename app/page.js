export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>✅ MBTI API 中介層</h1>
      <p>API 已啟動並正在運行。</p>
      
      <h2>📍 可用端點</h2>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
{`POST /api/analyze
Content-Type: application/json

請求格式：
{
  "text": "要分析的文字",
  "mbti": "INTJ",
  "locale": "zh-TW",
  "context": "general",
  "source": "chrome_extension"
}

回應格式：
{
  "literal": "字面意思",
  "signals": [{"cue": "信號", "evidence": "證據"}],
  "mbti_lens": {
    "focus": ["重點"],
    "likely_intentions": ["意圖"],
    "unspoken_needs": ["需求"]
  },
  "misunderstanding_risks": [{"risk": "風險", "why": "原因"}],
  "summary": "摘要"
}`}
      </pre>

      <h2>🔧 配置說明</h2>
      <ul>
        <li><strong>LLM_PROVIDER</strong>: 'mock' (默認) | 'openai' | 'anthropic'</li>
        <li><strong>LLM_API_KEY</strong>: 您的 API 金鑰</li>
        <li><strong>LLM_MODEL</strong>: 使用的模型 (例如 'gpt-3.5-turbo')</li>
      </ul>

      <h2>🚀 部署步驟</h2>
      <ol>
        <li>推送此項目到 GitHub</li>
        <li>登入 Vercel (vercel.com)</li>
        <li>點擊「New Project」並選擇此 repo</li>
        <li>在環境變數中設定 LLM_API_KEY</li>
        <li>點擊「Deploy」</li>
      </ol>

      <h2>📚 支援的模型</h2>
      <h3>OpenAI</h3>
      <ul>
        <li>gpt-4 (最佳質量，成本較高)</li>
        <li>gpt-3.5-turbo (平衡選項)</li>
      </ul>
      <h3>Anthropic</h3>
      <ul>
        <li>claude-3-opus-20240229 (最佳質量)</li>
        <li>claude-3-sonnet-20240229 (推薦)</li>
        <li>claude-3-haiku-20240307 (快速)</li>
      </ul>
    </main>
  );
}
