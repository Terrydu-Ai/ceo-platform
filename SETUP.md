# CEO Platform - AI 新闻 Dashboard 配置指南

## 1. 创建 Supabase 数据库

1. 登录 [supabase.com](https://supabase.com) 创建新项目
2. 进入 **SQL Editor**，粘贴并运行 `supabase/schema.sql` 中的内容
3. 在 **Settings > API** 中获取：
   - Project URL
   - anon public key
   - service_role key

## 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

填入你的密钥：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=your-random-secret
```

## 3. 本地启动

```bash
npm run dev
```

访问 http://localhost:3000

## 4. 首次抓取新闻

点击界面右上角「抓取新闻」按钮，等待约 2-3 分钟（Claude AI 处理每条新闻需要时间）。

## 5. 部署到 Vercel

```bash
npx vercel deploy
```

在 Vercel 项目设置中添加相同的环境变量。

`vercel.json` 中已配置每天凌晨 1 点自动抓取（UTC 时间 = 北京时间 9 AM）。

## 新闻来源

| 来源 | 语言 | 类型 |
|------|------|------|
| TechCrunch AI | 英文 | 综合 |
| VentureBeat | 英文 | 综合 |
| The Verge AI | 英文 | 综合 |
| OpenAI Blog | 英文 | 官方 |
| Anthropic | 英文 | 官方 |
| HuggingFace | 英文 | 技术 |
| Google DeepMind | 英文 | 研究 |
| 机器之心 | 中文 | 综合 |
| 36氪 | 中文 | 商业 |

## 手动触发抓取（API）

```bash
curl -X POST http://localhost:3000/api/fetch-news \
  -H "Authorization: Bearer your-cron-secret"
```
