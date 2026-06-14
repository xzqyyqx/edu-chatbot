FROM node:18-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY backend/package*.json ./
RUN npm install --production

# 复制后端源码
COPY backend/src ./src
COPY backend/.env.example ./.env

# 复制前端文件（用户端 + 管理后台）
COPY frontend ./frontend

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production
ENV DB_PATH=/app/data/edu_chatbot.db

CMD ["node", "src/server.js"]
