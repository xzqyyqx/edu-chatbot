# 🎓 职职学院 · AI智能客服系统

一套完整的**线上职业教育课程咨询 + 学员售后**双模式 AI 客服系统，支持招生话术与售后安抚双风格大模型提示词，集成课程知识库、工单系统与响应式聊天界面。

---

## 🚀 快速启动

### 方式一：双击启动（Windows）
```
双击 start.bat
```

### 方式二：命令行启动
```bash
cd backend
node src/server.js
```

访问：**http://localhost:3001**

---

## 🗂️ 项目结构

```
edu-chatbot/
├── backend/                 # Node.js + Express 后端
│   ├── src/
│   │   ├── server.js        # 服务器入口
│   │   ├── database.js      # SQLite数据库（sql.js）
│   │   ├── seedData.js      # 知识库初始数据
│   │   ├── prompts.js       # 双风格提示词系统
│   │   ├── llmService.js    # 大模型API对接（含Demo模式）
│   │   ├── knowledgeService.js  # 知识库检索服务
│   │   └── routes/
│   │       ├── chat.js      # 会话管理接口
│   │       ├── tickets.js   # 工单管理接口
│   │       └── knowledge.js # 知识库查询接口
│   ├── data/
│   │   └── edu_chatbot.db   # SQLite数据库文件
│   └── .env                 # 环境变量配置
│
├── frontend/
│   └── index.html           # 响应式聊天界面（原生HTML/CSS/JS）
│
├── start.bat                # Windows一键启动脚本
└── README.md
```

---

## ⚙️ 对接大模型 API

编辑 `backend/.env` 文件：

```env
# 支持任何 OpenAI 兼容接口
LLM_API_KEY=your_api_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-3.5-turbo
```

**支持的接口（OpenAI 兼容）：**
- OpenAI（GPT-4o, GPT-3.5）
- DeepSeek（deepseek-chat）
- 通义千问（qwen-plus）
- 智谱AI（glm-4）
- 月之暗面（moonshot-v1-8k）
- 零一万物（yi-34b-chat）

> 💡 不配置 API Key 时系统自动进入 **Demo演示模式**，根据关键词生成本地模拟回复，无需任何账号即可体验完整功能。

---

## 🎯 核心功能

### 👥 用户画像双模式
| 模式 | 用户类型 | AI风格 | 快捷问题 |
|------|---------|--------|---------|
| 🌟 意向学员 | 有意向报名的潜在学员 | 招生话术 - 热情专业推广 | 课程推荐、价格咨询 |
| 📚 在读学员 | 已报名正在学习的学员 | 售后安抚 - 耐心解决问题 | 技术故障、退费政策 |

### 📖 知识库（4大模块）
- **课程介绍**：6大热门课程（Java/Python AI/前端/UI/产品/数据）
- **班型价格**：就业保障班、VIP精英班、自学就业班等10+班型
- **设备故障**：7类常见技术问题的标准化解决方案
- **退费政策**：7天无理由/分阶段退款/就业协议退款等6条政策

### 💬 聊天功能
- ✅ 响应式聊天界面，支持移动端
- ✅ 课程卡片自动推送（关键词触发）
- ✅ Markdown消息渲染（加粗、列表、分割线）
- ✅ 打字动画效果
- ✅ 会话历史归档

### 🎫 工单系统
- ✅ 智能工单触发建议（退费/故障/投诉自动检测）
- ✅ 工单创建、状态管理、转人工接口
- ✅ 工单列表筛选（全部/待处理/处理中/已解决）

### 📊 数据存储
- ✅ 学员咨询记录（sessions + messages表）
- ✅ 工单记录（tickets表）
- ✅ 知识库内容（kb_*系列表）
- ✅ SQLite持久化存储

---

## 🌐 API 接口文档

### 会话管理
```
POST /api/chat/sessions           创建新会话
POST /api/chat/sessions/:id/messages  发送消息
GET  /api/chat/sessions/:id/messages  获取历史消息
PUT  /api/chat/sessions/:id/archive   归档会话
```

### 工单管理
```
POST /api/tickets                 创建工单
GET  /api/tickets                 获取工单列表（?status=open|processing|resolved）
GET  /api/tickets/:id             获取单个工单
PUT  /api/tickets/:id             更新工单状态
POST /api/tickets/:id/transfer    转接人工
```

### 知识库查询
```
GET /api/knowledge/courses        获取课程列表（?q=搜索词）
GET /api/knowledge/device-issues  获取故障知识库（?q=搜索词）
GET /api/knowledge/refund-policies 获取退费政策
```

### 系统接口
```
GET /api/health                   健康检查
GET /api/stats                    系统统计数据
```

---

## 🔧 技术栈

**后端**
- Node.js + Express
- sql.js（纯JS SQLite，无需编译）
- node-fetch（LLM API调用）
- uuid（ID生成）

**前端**
- 原生 HTML5 + CSS3 + Vanilla JS
- 响应式设计（移动端适配）
- 无需构建工具，开箱即用

---

## 📝 扩展指南

### 添加新课程
编辑 `backend/src/seedData.js`，在 `courses` 和 `classes` 数组中添加数据，重启服务。

### 自定义提示词
编辑 `backend/src/prompts.js`：
- `getSystemPrompt('prospect', ...)` - 招生话术风格
- `getSystemPrompt('enrolled', ...)` - 售后安抚风格

### 扩展知识库
直接通过 API 或修改 `seedData.js` 添加故障解决方案和退费政策。
