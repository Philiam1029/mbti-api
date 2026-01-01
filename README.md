# MBTI API 中介層

這是 Chrome 擴展 MBTI Lens 的中介 API 服務，用於調用 LLM 服務並返回結構化分析結果。

## 📁 項目結構

```
mbti-api/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.js          # 核心 API 端點
│   ├── page.js                   # 首頁（文檔）
│   └── layout.js                 # 根佈局
├── .env.local                    # 本機環境變數（不提交到 Git）
├── .env.example                  # 環境變數模板
├── next.config.js                # Next.js 配置
├── package.json                  # 依賴管理
└── README.md                     # 此文件
```

## 🚀 快速開始

### 1. 本機開發（支持模擬模式）

```bash
# 進入項目目錄
cd mbti-api

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:3000
```

此時 API 運行在 **模擬模式** (LLM_PROVIDER=mock)，可以測試流程但返回測試數據。

### 2. 配置真實 LLM 服務

創建 `.env.local` 文件：

**選項 A：使用 OpenAI**
```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-xxxxx（您的 OpenAI API Key）
LLM_MODEL=gpt-3.5-turbo
```

**選項 B：使用 Anthropic**
```env
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-xxxxx（您的 Anthropic API Key）
LLM_MODEL=claude-3-sonnet-20240229
```

### 3. 本機測試 API

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "這次會議非常重要，我希望大家能認真對待",
    "mbti": "INTJ",
    "locale": "zh-TW"
  }'
```

預期回應：
```json
{
  "literal": "...",
  "signals": [...],
  "mbti_lens": {...},
  "misunderstanding_risks": [...],
  "summary": "..."
}
```

## 🌐 部署到 Vercel（5 分鐘）

### 步驟 1：推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/mbti-api
git push -u origin main
```

### 步驟 2：在 Vercel 連接 GitHub

1. 打開 https://vercel.com
2. 點擊「New Project」
3. 選擇「Import Git Repository」
4. 授權並選擇剛才推送的 repo

### 步驟 3：配置環境變數

在 Vercel 項目設定中，點擊「Environment Variables」：

```
LLM_PROVIDER          openai （或 anthropic）
LLM_API_KEY           sk-xxxxx （您的 API Key）
LLM_MODEL             gpt-3.5-turbo
```

### 步驟 4：部署

1. 點擊「Deploy」
2. 等待部署完成（通常 1-2 分鐘）
3. 獲得公開 URL，例如：`https://mbti-api-xxx.vercel.app/api/analyze`

## 🧪 測試部署後的 API

```bash
curl -X POST https://mbti-api-xxx.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "測試文字",
    "mbti": "INTJ",
    "locale": "zh-TW"
  }'
```

## 🔐 安全建議

1. **不要提交 .env.local 到 GitHub**
   - 已在 .gitignore 中列出

2. **保護您的 API Key**
   - 只在 Vercel 環境變數中配置
   - 永遠不要在代碼中硬寫 Key

3. **設定 API 限流**
   - 在 Vercel 設定中啟用速率限制
   - 監控 API 使用量

## 📊 成本估計

### OpenAI
- gpt-3.5-turbo: 約 $0.002/請求（含輸入輸出）
- gpt-4: 約 $0.03/請求

### Anthropic
- claude-3-sonnet: 約 $0.003/請求（含輸入輸出）

### Vercel
- 免費層每月 100GB 出站帶寬
- 足以支持中等規模使用

## 🛠️ 故障排查

### 1. 本機開發時「模塊未找到」

```bash
# 重新安裝依賴
rm -rf node_modules package-lock.json
npm install
```

### 2. API 返回 401 錯誤

檢查 `.env.local` 中的 `LLM_API_KEY` 是否正確：
```bash
# 測試 OpenAI Key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-xxxxx"
```

### 3. Vercel 部署失敗

檢查構建日誌：
1. 打開 Vercel 項目儀表板
2. 點擊「Deployments」標籤
3. 查看失敗部署的「Build Logs」

## 📝 API 規格

### 端點
```
POST /api/analyze
```

### 請求
```json
{
  "text": "要分析的文字（最多 500 字）",
  "mbti": "INTJ （16 種之一）",
  "locale": "zh-TW （zh-TW, zh-CN, en）",
  "context": "general （可選）",
  "source": "chrome_extension （可選）"
}
```

### 成功回應（200）
```json
{
  "literal": "字面意思",
  "signals": [
    {
      "cue": "可能的信號",
      "evidence": "在文字中的證據"
    }
  ],
  "mbti_lens": {
    "focus": ["重點1", "重點2"],
    "likely_intentions": ["意圖1", "意圖2"],
    "unspoken_needs": ["需求1", "需求2"]
  },
  "misunderstanding_risks": [
    {
      "risk": "誤解風險",
      "why": "為什麼會產生這種誤解"
    }
  ],
  "summary": "整體分析摘要"
}
```

### 錯誤回應（4xx/5xx）
```json
{
  "error": "錯誤訊息",
  "status": "error"
}
```

## 🔗 集成到 Chrome 擴展

1. 在 Vercel 部署完成後，複製公開 URL
2. 打開 MBTI Lens 擴展的 Options 頁面
3. 在「API Endpoint」欄位輸入：`https://mbti-api-xxx.vercel.app/api/analyze`
4. 點擊「儲存」
5. 測試右鍵菜單「以 MBTI 視角分析」

## 💡 進階配置

### 使用自定義 Prompt

編輯 `app/api/analyze/route.js` 中的 `buildPrompt()` 函數

### 支持更多 LLM 提供商

在 `app/api/analyze/route.js` 中添加新的 `call<Provider>()` 函數

### 添加數據庫存儲

可選：添加 MongoDB/Supabase 存儲分析歷史

## 📞 支持

如有問題，請：
1. 檢查 Vercel 的「Function Logs」
2. 檢查 `.env.local`/環境變數配置
3. 用 curl 直接測試 API
4. 查看 `app/api/analyze/route.js` 的錯誤處理

## 📄 許可

MIT

