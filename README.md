1. 企业微信 (用于接收通知)：
👉 官网注册：https://work.weixin.qq.com/

2. 核心代码 (Cloudflare Worker)：
📥 一键复制 
(包含 AI 摘要、微信推送、邮件转发全套逻辑，直接粘贴即可) 记得修改转发邮箱

3. 关键变量配置：
部署时记得配置环境变量
在 Cloudflare Dashboard → Workers → 你的 Worker → Settings → Variables 里添加：
变量名               值
FORWARD_TO          你的真实邮箱
WECOM_WEBHOOK_URL   企业微信机器人 Webhook 地址
Workers AI 绑定变量名：AI

5. 免费发信服务 (Resend)：
👉 注册地址：https://resend.com/login

6. Gmail SMTP 设置参数：
SMTP 服务器：smtp.resend.com
端口：587 (TLS)
用户名：resend
密码：(在 Resend 后台生成的 API Key)
