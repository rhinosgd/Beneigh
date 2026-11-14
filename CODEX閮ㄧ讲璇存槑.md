# Beneigh 网站：交给 Codex 部署

## 先确定部署路线

本代码包是独立全栈网站，不是 WordPress 主题或插件。它包含：

- 前端网站
- 客户端
- 中文管理端
- 预约、留言与回复接口
- Cloudflare D1 数据库结构与迁移
- Cloudflare Workers 部署配置

推荐路线：`Cloudflare Workers + D1 + 自有域名`。如果一定要使用 Ubuntu 服务器，也可以让 Codex 改造成 Docker/Node 部署，但数据库需由 D1 改为 MySQL/PostgreSQL，这不是简单上传文件。

## 方法一：直接在 Codex 中交付

1. 新建一个 Codex 任务。
2. 上传本压缩包 `beneigh-complete-source-v19.zip`。
3. 将下面的“Codex 执行指令”完整复制给 Codex。
4. Codex 解压后先阅读本文件、`.env.example`、`.openai/hosting.json`、`package.json` 和 `drizzle/`。
5. 需要登录 Cloudflare 或修改域名 DNS 时，由你在浏览器中完成授权；不要把 Cloudflare 主密码发给 Codex。

## Codex 执行指令（可直接复制）

```text
请部署附件中的 Beneigh 完整网站代码。

目标：
1. 使用 Cloudflare Workers + D1 部署，不迁移到 WordPress。
2. 绑定我的正式域名（我会随后提供域名）。
3. 保留三个入口：
   - 前端：/
   - 客户端：/client-portal
   - 管理端：/manage-portal-7x
4. 先检查 package.json、.env.example、.openai/hosting.json、wrangler.local.jsonc、drizzle/ 和 cloudflare-deploy/，不要凭经验改写架构。
5. 安装依赖并运行 npm test、npm run build；先修复实际错误，再部署。
6. 创建并迁移 D1 数据库，确认所有迁移文件按顺序执行。
7. 配置环境变量，但不得在日志或回复中显示密码、SESSION_SECRET、API Key：
   ADMIN_USERNAME
   ADMIN_PASSWORD
   SESSION_SECRET
   STAFF_USERNAME（可选）
   STAFF_PASSWORD（可选）
   RESEND_API_KEY（邮件启用时）
   EMAIL_FROM（邮件启用时）
8. 域名接入前先给出需要我设置的 DNS 记录；没有获得域名控制权限时不要猜测或虚构已完成。
9. 部署后逐项实测：前端、客户端、管理端登录、预约提交、客户留言、管理员回复、数据库写入、手机响应式、HTTPS。
10. 最终给我：正式网址、三个入口、DNS状态、数据库迁移结果、环境变量配置状态、测试结果、仍需我提供的资料。不要在最终回复中暴露任何密码。
```

## 域名需要提供给 Codex 的资料

- 正式域名，例如 `beneigh.com`
- 域名当前由哪家管理：Cloudflare、阿里云、GoDaddy 等
- 是否需要同时启用 `www.beneigh.com`
- 现有邮箱是否使用该域名（避免误删 MX、SPF、DKIM、DMARC 记录）
- 希望主域使用裸域还是 `www`

如果域名已在 Cloudflare，通常只需在 Workers 中添加 Custom Domain；不要随意更改现有邮件记录。

## 必须自行设定的正式密钥

不要继续使用演示账号密码。正式上线前至少配置：

- `ADMIN_USERNAME`：正式管理员用户名
- `ADMIN_PASSWORD`：20位以上随机密码
- `SESSION_SECRET`：至少32字节随机字符串
- `STAFF_USERNAME` / `STAFF_PASSWORD`：需要客服子账号时配置
- `RESEND_API_KEY` / `EMAIL_FROM`：完成发信域名验证后配置

## 部署验收清单

- 首页和三个服务页正常打开
- 手机端导航、表单、客户端和管理端无横向错位
- 管理端登录失败/成功逻辑正常，30分钟过期策略正常
- 测试预约能写入数据库并在管理端显示
- 客户私密入口可查看管理员回复并继续回复
- 后台导出文件可打开
- 容量限制、关闭日期、取消后释放名额正常
- HTTPS有效，裸域与www只保留一个主版本并做301跳转
- 邮件未配置时页面不虚假提示“已发送”
- 删除测试数据后再正式开放

## 关于 WordPress

本包不能直接上传到 WordPress 的“主题”目录运行。若未来使用 WordPress，建议仅把 WordPress作为内容管理系统，通过 REST API 管理文章/新闻；预约、客户消息、容量和管理端仍由本系统处理。若要求所有数据统一进入 WordPress，需要另做插件和数据迁移。
