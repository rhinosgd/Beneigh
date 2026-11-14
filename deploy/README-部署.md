# Beneigh 站点部署 / 更新指南（beneigh.com · 阿里云 ECS）

目标实例：`5870ffe51a264bcc9dec0b4b2b224fbb`（IP 178.104.252.216）
技术栈：Next.js 16 (vinext) + React 19 + Tailwind 4 + better-sqlite3（本地 SQLite，WAL 模式）

---

## 〇、最重要的两条红线（必须遵守）

1. **绝不覆盖线上 `data/` 与 `.env`**
   - `data/beneigh.sqlite`（及 `-wal`/`-shm`）保存全部预约、询问、消息、管理员凭据、站点内容。
   - `.env` 保存 `ADMIN_USERNAME/PASSWORD`、`SESSION_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM` 等。
   - 本目录的 `deploy.sh` 已自动备份并还原这两个东西，请勿手动删除线上这两个文件。
2. **不要用 `npm run install:ci`**
   - `install:ci` 是 WorkBuddy 沙箱专用（依赖 `.sites-runtime`、flock/timeout/curl 等），在普通服务器上会失败。
   - 服务器上请用 `npm ci`（或 `npm install`）。

---

## 一、我（AI）当前无法直连服务器的原因（已核实）

- `~/.ssh` 无私钥；`ssh root@178.104.252.216` 返回 `Permission denied (publickey,password)` → 没有可用凭据。
- 本机无阿里云 CLI（aliyun / ossutil），无法用 OpenAPI 下发命令或重置密码。
- 我只能接管“自带远程调试端口”的 Chrome；你日常打开阿里云控制台的浏览器窗口我无法操作，因此无法替你点控制台里的 Workbench。
- WorkBuddy 的“发布为应用”工具（sites_deploy）不支持带数据库（SQLite/MySQL 等）的项目，且只生成 workbuddy 子域，不能接管你的自有域名 beneigh.com。

**→ 部署需要你先提供一种服务器访问方式（见下方二）。**

---

## 二、请你选择一种访问方式（推荐方式 A）

### 方式 A（推荐）：在阿里云控制台重置实例密码，然后把密码给我
1. 你已在浏览器打开阿里云控制台 → ECS → 实例 `5870ffe51a264bcc9dec0b4b2b224fbb`。
2. 右侧「更多」→「密码 / 密钥」→「重置实例密码」，设置 root 密码（若提示需重启实例，按提示操作）。
3. 把新密码发给我。我立刻：`ssh root@178.104.252.216` → 上传源码包 → 跑 `deploy.sh` → 校验。
   - 该密码仅用于本次部署，部署完成后你可再重置一次，安全无忧。

### 方式 B：提供现有的 SSH 私钥
- 如果该实例绑定了密钥对，把对应的私钥（或把公钥已绑定的那把私钥）安全发给我，我直接 `ssh -i key root@178.104.252.216`。

### 方式 C：用控制台「远程连接 / Workbench」手动执行
- 你在控制台点「远程连接」打开浏览器终端，我把 `deploy.sh` 内容给你，你粘贴执行即可（我已把脚本写成“上传源码目录 → 一键更新”，复制粘贴即可跑）。
- 缺点：需要你手动传文件 / 执行，我无法替你点。

---

## 三、部署步骤（方式 A/B 下由我执行；方式 C 下你执行）

1. **传源码包到服务器**
   ```bash
   # 本机（已生成）：beneigh-source-20261026.tar.gz
   scp beneigh-source-20261026.tar.gz root@178.104.252.216:/root/
   ssh root@178.104.252.216
   mkdir -p /root/beneigh-new && tar -xzf /root/beneigh-source-20261026.tar.gz -C /root/beneigh-new
   ```
2. **检查/安装 Node ≥ 22.13.0**（better-sqlite3 需要原生编译工具链 gcc/g++/make/python3）。
3. **首次部署才需要**：创建 systemd 服务与 nginx 反代
   ```bash
   cp deploy/beneigh.service /etc/systemd/system/beneigh.service
   systemctl daemon-reload && systemctl enable beneigh
   cp deploy/beneigh.nginx.conf /etc/nginx/sites-available/beneigh.conf
   ln -sf /etc/nginx/sites-available/beneigh.conf /etc/nginx/sites-enabled/beneigh.conf
   nginx -t && systemctl reload nginx
   ```
4. **执行一键更新（保留 data/.env）**
   ```bash
   bash deploy/deploy.sh /root/beneigh-new
   ```
5. **校验**：浏览器访问 https://beneigh.com ，确认中英文首页、预约表单、联系表单、管理后台 `/manage-portal-7x`、客户端门户 `/client-portal` 均正常。

---

## 四、回滚
`deploy.sh` 每次都会把 `data/` 与 `.env` 备份到 `/root/beneigh-backup-<时间戳>`。
若新版异常：
```bash
cp -a /root/beneigh-backup-<时间戳>/data/. /var/www/beneigh/data/
cp -a /root/beneigh-backup-<时间戳>/.env /var/www/beneigh/.env
systemctl restart beneigh
```

---

## 五、文件清单（本 deploy/ 目录）
- `deploy.sh`：一键更新脚本（停服→备份→同步→还原→装依赖→构建→启服→校验）。
- `beneigh.nginx.conf`：nginx 反代 + HTTPS 模板（certbot 证书路径需按实际修改）。
- `beneigh.service`：systemd 单元（注意 Node 路径/PATH 与运行用户权限）。
- `README-部署.md`：本文件。
- `beneigh-source-20261026.tar.gz`：已打包的源码（已排除 node_modules/.next/data/.env）。
