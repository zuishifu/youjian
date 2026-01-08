1. 企业微信 (用于接收通知)：
👉 官网注册：https://work.weixin.qq.com/

2. 核心代码 (Cloudflare Worker)：
📥 一键复制 
(包含 AI 摘要、微信推送、邮件转发全套逻辑，直接粘贴即可)

3. 关键变量配置：
Cloudflare 变量名称：WECOM_WEBHOOK_URL
Workers AI 绑定变量名：AI

4. 免费发信服务 (Resend)：
👉 注册地址：https://resend.com/login

5. Gmail SMTP 设置参数：
SMTP 服务器：smtp.resend.com
端口：587 (TLS)
用户名：resend
密码：(在 Resend 后台生成的 API Key)
