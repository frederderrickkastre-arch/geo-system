# GEO 优化排名系统

GEO（Generative Engine Optimization）优化排名系统 - 面向商户的 AI 内容营销后台管理平台。

帮助企业在 8 大中国 AI 搜索平台（DeepSeek、豆包、元宝、千问、文心、纳米、KIMI、智谱）上获得内容收录和品牌曝光。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + ECharts |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | MySQL 8 + Redis |
| 部署 | Docker + Nginx |

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

演示账号：`geo123` / `geo5201314`

### 后端开发

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API 运行在 http://localhost:3001

### Docker 部署

```bash
docker-compose up -d
```

访问 http://localhost

## 功能模块

### AI 创作准备
- **AI 素材源力**: 关键词管理、写作标题、企业画像图库、企业知识库
- **AI 文章写作**: 写作指令模板、文章分类、AI 写作任务、文章列表
- **AI 流量复刻**: 全网爆文复刻、批量爆文复刻

### 文章发布
- **网站媒体**: 9 维度筛选的媒体市场 + 投稿记录
- **自媒体大V**: 多平台自媒体资源市场
- **个人自媒体**: 账号授权绑定、自动化发布
- **AI 官网 SEO**: 站点管理、SEO 发布任务

### AI 数据中心
- **数据报表**: KPI 大屏、8 大 AI 平台收录占比图、关键词明细
- **查询功能**: 实时查询关键词在 AI 平台的收录情况

### AI 工具助手
- 关键词指数查询、AI 拓词、手动拓词工具

### 个人中心
- 消耗明细（点数 + 余额）、实名认证、账号权益总览

## 项目结构

```
GEO/
├── frontend/           # Vue 3 前端
│   ├── src/
│   │   ├── components/ # 通用组件（布局、CrudTable）
│   │   ├── router/     # 路由配置
│   │   ├── stores/     # Pinia 状态管理
│   │   ├── utils/      # 工具函数
│   │   └── views/      # 页面视图
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── material/   # AI素材源力
│   │       ├── writing/    # AI文章写作
│   │       ├── traffic/    # AI流量复刻
│   │       ├── publish/    # 文章发布
│   │       ├── data/       # AI数据中心
│   │       ├── tools/      # AI工具助手
│   │       └── user/       # 个人中心
│   ├── Dockerfile
│   └── nginx.conf
├── backend/            # Express 后端 API
│   └── src/
│       ├── common/     # 中间件、工具
│       └── modules/    # 业务模块
├── database/
│   └── schema.sql      # 数据库建表语句
├── docker-compose.yml
└── README.md
```
