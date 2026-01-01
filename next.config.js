/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 路由配置
  serverRuntimeConfig: {
    // 這些只在伺服器端可用
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_MODEL: process.env.LLM_MODEL,
  },
  publicRuntimeConfig: {
    // 這些會暴露到客戶端
  },
};

module.exports = nextConfig;
