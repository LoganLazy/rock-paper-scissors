#!/bin/bash

# 项目测试脚本

echo "========================================="
echo "Rock-Paper-Scissors 项目测试"
echo "========================================="
echo ""

# 检查 Node.js
echo "✓ 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js 未安装"
    exit 1
fi
echo "  Node.js 版本: $(node --version)"
echo ""

# 检查依赖
echo "✓ 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "  安装依赖中..."
    npm install
else
    echo "  依赖已安装"
fi
echo ""

# 构建项目
echo "✓ 构建前端..."
npm run build
if [ $? -ne 0 ]; then
    echo "✗ 构建失败"
    exit 1
fi
echo "  构建成功"
echo ""

# 检查构建产物
echo "✓ 检查构建产物..."
if [ -f "dist/index.html" ]; then
    echo "  ✓ dist/index.html"
else
    echo "  ✗ dist/index.html 不存在"
fi

if [ -f "dist/assets/index-"*.css ]; then
    echo "  ✓ CSS 文件存在"
else
    echo "  ✗ CSS 文件不存在"
fi

if [ -f "dist/assets/index-"*.js ]; then
    echo "  ✓ JS 文件存在"
else
    echo "  ✗ JS 文件不存在"
fi
echo ""

# 检查服务器文件
echo "✓ 检查服务器文件..."
if [ -f "server/index.js" ]; then
    echo "  ✓ server/index.js"
else
    echo "  ✗ server/index.js 不存在"
fi
echo ""

# 测试服务器启动
echo "✓ 测试服务器启动..."
timeout 3 node server/index.js > /tmp/server-test.log 2>&1 &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null; then
    echo "  ✓ 服务器启动成功"
    kill $SERVER_PID 2>/dev/null
else
    echo "  ✗ 服务器启动失败"
    cat /tmp/server-test.log
    exit 1
fi
echo ""

# 检查新增文件
echo "✓ 检查新增的组件和工具文件..."
NEW_FILES=(
    "src/config.js"
    "src/hooks/useWebSocket.jsx"
    "src/utils/validation.js"
    "src/utils/sounds.js"
    "src/utils/share.js"
    "src/components/ErrorBoundary.jsx"
    "src/components/ConnectionStatus.jsx"
    "src/components/Toast.jsx"
    "src/components/Lobby.jsx"
    "src/components/RoomInfo.jsx"
    "src/components/ScoreBoard.jsx"
    "src/components/GamePlay.jsx"
    "src/components/Punishment.jsx"
    "src/components/CustomPunishments.jsx"
    "src/components/RematchControl.jsx"
    "src/components/History.jsx"
    "src/components/SoundSettings.jsx"
)

MISSING_COUNT=0
for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file 不存在"
        ((MISSING_COUNT++))
    fi
done

if [ $MISSING_COUNT -eq 0 ]; then
    echo "  所有文件完整"
else
    echo "  缺少 $MISSING_COUNT 个文件"
fi
echo ""

# 统计代码行数
echo "✓ 代码统计..."
if command -v wc &> /dev/null; then
    TOTAL_LINES=$(find src -name "*.jsx" -o -name "*.js" | xargs wc -l | tail -1 | awk '{print $1}')
    echo "  前端代码行数: $TOTAL_LINES"
    SERVER_LINES=$(wc -l < server/index.js)
    echo "  后端代码行数: $SERVER_LINES"
fi
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 开发模式: npm start"
echo "2. 生产部署: pm2 start ecosystem.config.cjs"
echo "3. 查看日志: pm2 logs rock-paper-scissors"
echo ""
