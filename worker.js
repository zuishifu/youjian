export default {
  async email(message, env, ctx) {
    // 1. 配置
    const FORWARD_TO = "your_real_email@gmail.com";

    // 2. 基础信息
    const subject = message.headers.get("subject") || "无主题";
    const from = message.from;

    // 3. 获取并“清洗”数据
    const rawText = await streamToString(message.raw);
    const cleanBody = cleanEmailBody(rawText);

    // 4. AI 处理 
    let summary = "";
    try {
      const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: "system",
            content: `你是由于 Cloudflare Workers 运行的顶级邮件安全审计与摘要专家。请用【简体中文】回答。

            执行两条指令：
            1. 内容摘要：是谁发的信？什么事？(如：服务器报警、账单待付)。
            2. ⚡️抓取关键数据：如果文中包含【验证码】、【OTP】、【金额】、【截止日期】，必须单独列出！无数据则不写。`
          },
          {
            role: "user",
            content: `邮件内容:\n${cleanBody.substring(0, 4000)}`
          }
        ]
      });
      summary = aiResponse.response;
    } catch (e) {
      summary = `AI 休息了: ${e.message}`;
    }

    // 5. 推送 & 转发
    ctx.waitUntil(sendToWeComBot(env, from, subject, summary));
    await message.forward(FORWARD_TO);
  }
};

// =========================================================
// 邮件解码与清洗核心函数 (Fix: 解决乱码/Base64问题)
// =========================================================

function cleanEmailBody(raw) {
  try {
    // 1. 分离头部和主体
    const { headers, body } = splitHeadersBody(raw);
    const contentType = getHeader(headers, "content-type");
    const transferEncoding = getHeader(headers, "content-transfer-encoding");

    // 2. 处理 Multipart 邮件
    if (contentType && contentType.toLowerCase().includes("multipart")) {
      const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = body.split("--" + boundary);

        // 优先寻找 text/plain，其次 text/html
        let bestPart = null;
        for (const part of parts) {
          if (part.trim() === "--" || part.trim() === "") continue;

          const p = splitHeadersBody(part);
          const pType = getHeader(p.headers, "content-type") || "";

          if (pType.includes("text/plain")) {
            bestPart = p;
            break; // 找到纯文本，直接用
          }
          if (pType.includes("text/html") && !bestPart) {
            bestPart = p; // 暂存 HTML，如果没有纯文本就用这个
          }
        }

        if (bestPart) {
          const pEncoding = getHeader(bestPart.headers, "content-transfer-encoding");
          return decodeContent(bestPart.body, pEncoding);
        }
      }
    }

    // 3. 处理普通邮件 (非 Multipart 或 解析失败降级)
    return decodeContent(body, transferEncoding);

  } catch (e) {
    console.error("Parse error:", e);
    // 兜底：如果解析挂了，返回原始截断文本，至少比空着强
    return raw.length > 2000 ? raw.substring(0, 2000) : raw;
  }
}

// === 解码辅助函数 ===

function splitHeadersBody(text) {
  // 查找第一个双换行
  let idx = text.indexOf("\r\n\r\n");
  if (idx === -1) idx = text.indexOf("\n\n");

  if (idx !== -1) {
    return {
      headers: text.substring(0, idx),
      body: text.substring(idx + (text[idx] === '\r' ? 4 : 2))
    };
  }
  return { headers: "", body: text };
}

function getHeader(headerText, key) {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, "im");
  const match = headerText.match(regex);
  return match ? match[1].trim() : null;
}

function decodeContent(content, encoding) {
  if (!content) return "";
  const enc = (encoding || "").toLowerCase();

  if (enc === "base64") {
    try {
      // 移除换行符再解码
      const clean = content.replace(/\s/g, "");
      // UTF-8 兼容解码
      return decodeURIComponent(escape(atob(clean)));
    } catch (e) { return content; } // 解码失败返回原文
  }

  if (enc === "quoted-printable") {
    try {
      // 简单 QP 解码
      return content.replace(/=[\r\n]+/g, "").replace(/=([0-9A-F]{2})/gi, (m, c) =>
        String.fromCharCode(parseInt(c, 16))
      );
      // 注意：标准 QP 解码对 UTF-8 字节处理较麻烦，这里做简化处理。
      // 如果遇到复杂中文 QP，可能需要更完善的解码器，但在 Worker 环境尽量轻量。
      // 对于纯中文邮件通常也是 Base64 居多。
    } catch (e) { return content; }
  }

  return content;
}

// === Stream 工具 ===

async function streamToString(stream) {
  const chunks = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const decoder = new TextDecoder("utf-8");
  let result = "";
  for (const chunk of chunks) {
    result += decoder.decode(chunk, { stream: true });
  }
  result += decoder.decode();
  return result;
}

async function sendToWeComBot(env, from, subject, summary) {
  const webhookUrl = env.WECOM_WEBHOOK_URL;
  if (!webhookUrl) return;

  // 优化：基于关键词智能匹配图标
  const iconMap = [
    { icon: "🚨", keywords: ["报警", "紧急", "错误", "失败", "Alert", "Error"] },
    { icon: "💰", keywords: ["金额", "账单", "支付", "Payment", "Bill"] },
    { icon: "🔐", keywords: ["验证码", "OTP", "Code", "登录"] },
    { icon: "📦", keywords: ["快递", "发货", "Delivery"] }
  ];

  let icon = "📧"; // 默认图标
  for (const item of iconMap) {
    if (item.keywords.some(k => summary.includes(k))) {
      icon = item.icon;
      break;
    }
  }

  const textContent = `${icon} 新邮件到达
--------------------
发件人: ${from}
主　题: ${subject}
--------------------
${summary}
`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "msgtype": "text",
        "text": { "content": textContent }
      })
    });
  } catch (err) { console.error(err); }
}
