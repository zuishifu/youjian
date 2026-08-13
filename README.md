CF域名邮箱邮件转发 AI提取邮件内容转发企业微信 电报
1. 企业微信 (用于接收通知)：
👉 官网注册：https://work.weixin.qq.com/

2. 核心代码 (Cloudflare Worker)：
📥 一键复制 
(包含 AI 摘要、微信推送、邮件转发全套逻辑，直接粘贴即可) 记得修改转发邮箱

3. 关键变量配置：  
  ⑴ FORWARD_TO ：              你的真实邮箱                   
  ⑵ WECOM_WEBHOOK_URL ：       企业微信机器人Webhook          
  ⑶ TELEGRAM_BOT_TOKEN ：      Telegram 机器人Token    
  ⑷ TELEGRAM_CHAT_ID ：        Telegram Chat ID 或群 ID    
不配置某个推送渠道的变量，对应推送会自动跳过，互不影响。

4. 绑定Workers AI 绑定变量名：AI
