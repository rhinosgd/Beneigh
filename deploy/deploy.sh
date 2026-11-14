#!/usr/bin/env bash
#
# Beneigh 生产环境「一键更新」脚本
# 在阿里云 ECS 服务器上，以 root 或具 sudo 权限的用户运行。
#
# 安全原则（务必遵守）：
#   1. 绝不覆盖线上 data/ 与 .env（含预约/询问/消息/管理员凭据/邮件 Key）。
#   2. 更新前自动全量备份 data/ 与 .env 到 /root。
#   3. 先停服务 → 同步源码 → 还原受保护文件 → 装依赖 → 构建 → 启服务。
#
# 用法：
#   bash deploy.sh [新源码目录]            # 默认 /root/beneigh-new
# 或前置环境变量：
#   APP_DIR=/var/www/beneigh APP_PORT=3100 SERVICE_NAME=beneigh bash deploy.sh /root/beneigh-new
#
set -euo pipefail

# ---------------- 可配置变量（按服务器实际情况修改） ----------------
APP_DIR="${APP_DIR:-/var/www/beneigh}"            # 线上应用根目录
SRC_DIR="${1:-/root/beneigh-new}"                 # 新源码解压目录
APP_PORT="${APP_PORT:-3100}"                      # Next.js 监听端口（须与 nginx 反代一致）
SERVICE_NAME="${SERVICE_NAME:-beneigh}"           # systemd 服务名；用 pm2 时可同名
# -------------------------------------------------------------------

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/root/beneigh-backup-${TS}"

echo "==> [0] 环境检查"
command -v node >/dev/null 2>&1 && echo "node: $(node -v)" || { echo "未检测到 node，请先安装 Node >= 22.13.0"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "未检测到 npm"; exit 1; }
node -e 'const v=process.versions.node.split(".").map(Number); if(v[0]<22||(v[0]===22&&v[1]<13)){console.error("Node 版本过低，需要 >=22.13.0，当前 "+process.version);process.exit(1)}' || exit 1
if [[ ! -d "$SRC_DIR" ]]; then echo "错误：新源码目录不存在: $SRC_DIR"; exit 2; fi
if [[ ! -d "$APP_DIR" ]]; then echo "警告：线上应用目录 $APP_DIR 不存在，将创建。"; mkdir -p "$APP_DIR"; fi

# 服务管理辅助函数（优先 systemd，其次 pm2）
svc_stop() {
  if systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE_NAME}.service"; then
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 stop "$SERVICE_NAME" 2>/dev/null || true
  fi
}
svc_start() {
  if systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE_NAME}.service"; then
    systemctl restart "$SERVICE_NAME" && systemctl status "$SERVICE_NAME" --no-pager -l
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 restart "$SERVICE_NAME" 2>/dev/null || pm2 start npm --name "$SERVICE_NAME" -- start
    pm2 save 2>/dev/null || true
  else
    echo "未找到 systemd 服务或 pm2，请手动启动应用（监听 0.0.0.0:${APP_PORT}）。"
  fi
}

echo "==> [1] 停止线上应用（避免文件占用）"
svc_stop
sleep 2

echo "==> [2] 备份线上 data/ 与 .env（关键：保留全部业务数据）"
mkdir -p "$BACKUP_DIR"
if [[ -d "$APP_DIR/data" ]]; then cp -a "$APP_DIR/data" "$BACKUP_DIR/data"; echo "    已备份 data/ -> $BACKUP_DIR/data"; fi
if [[ -f "$APP_DIR/.env"  ]]; then cp -a "$APP_DIR/.env"  "$BACKUP_DIR/.env";  echo "    已备份 .env  -> $BACKUP_DIR/.env";  fi

echo "==> [3] 同步新源码（排除 node_modules/.next/data/.env/.git/.sites-runtime/备份目录）"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude data --exclude .env \
  --exclude .git --exclude .sites-runtime --exclude '_backup_pre_*' \
  --exclude tsconfig.tsbuildinfo --exclude deploy \
  "$SRC_DIR/" "$APP_DIR/"

echo "==> [4] 还原受保护的线上文件"
[[ -d "$BACKUP_DIR/data" ]] && cp -a "$BACKUP_DIR/data/." "$APP_DIR/data/"
[[ -f "$BACKUP_DIR/.env"  ]] && cp -a "$BACKUP_DIR/.env"  "$APP_DIR/.env"

echo "==> [5] 安装依赖（better-sqlite3 为原生模块，服务器现场编译；用 npm ci 可复现）"
cd "$APP_DIR"
# 若服务器无法访问 npm 官方源，取消下一行注释改用国内镜像：
# npm config set registry https://registry.npmmirror.com
npm ci

echo "==> [6] 生产构建"
npm run build

echo "==> [7] 启动应用"
svc_start

echo "==> [8] 本地校验"
sleep 3
curl -sS -o /dev/null -w "本地 HTTP 状态: %{http_code}\n" "http://127.0.0.1:${APP_PORT}/" || true

echo ""
echo "==> 更新完成。回滚方法："
echo "    cp -a $BACKUP_DIR/data/. $APP_DIR/data/ && cp -a $BACKUP_DIR/.env $APP_DIR/.env"
echo "    然后重新执行本脚本的旧版本，或 systemctl restart $SERVICE_NAME"
echo "    备份位置：$BACKUP_DIR"
