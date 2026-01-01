/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境變數
  env: {
    LLM_PROVIDER: process.env.LLM_PROVIDER || 'mock',
  }
};

module.exports = nextConfig;
