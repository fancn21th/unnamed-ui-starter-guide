#!/bin/bash

# 部署配置
SERVER_USER="root"
SERVER_HOST="10.0.5.68"
SERVER_PATH="/var/www/unnamed-ui-starter-guide"
APP_NAME="unnamed-ui-starter-guide"

echo "🚀 开始部署 ${APP_NAME}..."

# 1. 本地构建
echo "📦 正在构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建完成"

# 2. 在服务器上创建目录
echo "📂 在服务器上创建目录..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}"

# 3. 上传构建文件到服务器
echo "📤 上传文件到服务器..."
rsync -avz --delete \
    dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

if [ $? -ne 0 ]; then
    echo "❌ 文件上传失败"
    exit 1
fi

echo "✅ 文件上传完成"

# 4. 设置文件权限
echo "🔐 设置文件权限..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    chmod -R 755 ${SERVER_PATH}
    chown -R www-data:www-data ${SERVER_PATH} 2>/dev/null || chown -R nginx:nginx ${SERVER_PATH} 2>/dev/null || true
EOF

echo ""
echo "✨ 部署完成！"
echo "📍 服务器地址: ${SERVER_HOST}"
echo "📍 部署路径: ${SERVER_PATH}"
echo ""
echo "⚠️  请确保 nginx 已配置并重新加载："
echo "  sudo nginx -t"
echo "  sudo nginx -s reload"
echo ""
