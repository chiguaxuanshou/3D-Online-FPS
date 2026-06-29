# 3D射击游戏 - 服务器部署指南

## 前置要求
- Linux服务器（推荐Ubuntu 20.04+）
- 域名（已解析到服务器IP）
- SSH访问权限

## 步骤

### 1. 安装依赖
```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装Nginx
sudo apt-get install -y nginx

# 安装Git
sudo apt-get install -y git
```

### 2. 克隆项目
```bash
sudo mkdir -p /var/www/game
sudo chown $USER:$USER /var/www/game
git clone https://github.com/song-hao/AdWebHW2.git /var/www/game
cd /var/www/game
npm install --production
```

### 3. 配置环境变量
```bash
# 设置JWT密钥
export JWT_SECRET="your-secure-jwt-secret-change-in-production"

# 设置生产环境
export NODE_ENV="production"
```

### 4. 配置Systemd服务
```bash
sudo cp deploy/game-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable game-server
sudo systemctl start game-server
```

### 5. 配置Nginx
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/game
sudo ln -sf /etc/nginx/sites-available/game /etc/nginx/sites-enabled/
sudo nginx -t  # 验证配置
sudo systemctl restart nginx
```

### 6. 配置HTTPS
```bash
# 安装Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 管理命令

### 启动服务
```bash
sudo systemctl start game-server
```

### 停止服务
```bash
sudo systemctl stop game-server
```

### 重启服务
```bash
sudo systemctl restart game-server
```

### 查看状态
```bash
sudo systemctl status game-server
```

### 查看日志
```bash
journalctl -u game-server -f
```

## 目录结构
```
/var/www/game/
├── app.js              # 主应用文件
├── index.html          # 前端页面
├── js/                 # 前端JavaScript
├── models/             # 数据库模型
├── controllers/        # 控制器
├── routes/             # 路由
├── middleware/         # 中间件
├── deploy/             # 部署配置
│   ├── nginx.conf      # Nginx配置
│   ├── game-server.service  # Systemd配置
│   ├── deploy.sh       # 部署脚本
│   └── DEPLOYMENT.md   # 部署指南
├── database.sqlite     # SQLite数据库
└── logs/               # 日志目录
```

## 安全建议
1. 使用强密码的JWT_SECRET
2. 定期更新系统和依赖
3. 配置防火墙（UFW）
4. 禁用root SSH登录
5. 使用SSL/TLS加密

## 性能优化
1. 使用PM2进行进程管理（可选）
2. 配置Nginx缓存
3. 启用Gzip压缩
4. 配置CDN加速静态资源