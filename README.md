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

4.绑定Workers AI 绑定变量名：AI
