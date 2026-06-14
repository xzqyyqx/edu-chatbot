# 职业教育AI客服系统 - 云部署指南

## 方式一：Docker 部署（推荐）

### 1. 安装 Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# CentOS
yum install -y docker
systemctl start docker && systemctl enable docker
```

### 2. 上传项目到服务器
```bash
# 在本地打包
tar -czf edu-chatbot.tar.gz edu-chatbot/

# 上传到服务器
scp edu-chatbot.tar.gz user@your-server:/opt/

# 在服务器解压
ssh user@your-server
cd /opt && tar -xzf edu-chatbot.tar.gz
```

### 3. 配置环境变量
```bash
cd /opt/edu-chatbot
cp .env.example .env
# 编辑 .env 填入实际的 LLM API Key
vim .env
```

### 4. 一键启动
```bash
docker-compose up -d --build
```

### 5. 查看状态
```bash
docker-compose ps
docker-compose logs -f
```

访问地址：
- 用户端：http://your-server:3001
- 管理后台：http://your-server:3001/admin

---

## 方式二：直接部署（Node.js）

### 1. 安装 Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 上传并安装依赖
```bash
cd /opt/edu-chatbot/backend
npm install --production
```

### 3. 配置环境
```bash
cp .env.example .env
# 编辑 .env
```

### 4. 使用 PM2 守护进程
```bash
npm install -g pm2
pm2 start src/server.js --name edu-chatbot
pm2 save
pm2 startup
```

---

## 方式三：部署到腾讯云/阿里云

### 轻量应用服务器
1. 购买轻量应用服务器（2核2G即可）
2. 选择 Ubuntu 22.04 镜像
3. 按方式一或方式二部署
4. 在防火墙规则中开放 3001 端口

### 云函数（Serverless）
如需 Serverless 部署，可使用阿里云函数计算或腾讯云云函数，
将 Express 应用适配为 Serverless Handler。

---

## Nginx 反向代理（可选，支持 HTTPS）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 如需 HTTPS，使用 certbot 申请免费 SSL 证书
    # certbot --nginx -d your-domain.com

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 管理员默认账号

- 用户端地址：`/`
- 管理后台地址：`/admin`
- 管理员账号：`admin`
- 管理员密码：`admin123`
- **生产环境请务必修改密码和 ADMIN_TOKEN**
