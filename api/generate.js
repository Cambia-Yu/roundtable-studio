/**
 * Vercel Serverless: 代理 OpenAI / Anthropic，使用请求头中的用户 Key。
 * 服务端不落盘、不记录 Key；仅转发上游错误码与信息。
 */

const ALLOW = "POST, OPTIONS";
const HEADERS_ALLOW = "Content-Type, x-user-api-key";

const SYSTEM_PROMPT = `你是 ljg-roundtable（求真结构化圆桌）的内容生成器。根据用户给出的议题，生成一场多视角辩证讨论的模拟记录。

必须只输出**一个**合法 JSON 对象（不要 markdown 代码围栏，不要注释），结构严格如下：
{
  "topic": "完整议题字符串",
  "participants": [
    {
      "id": "slug_英文小写",
      "name": "人物全名（真实历史人物或当代人物）",
      "nick": "2-4字中文简称",
      "mbti": "四字母如INTP",
      "color": "#RRGGBB 六位hex",
      "stance": "一句话核心立场",
      "viewpoints": [
        { "round": "如：开场·统一定义", "tag": "陈述|质疑|补充|反驳|修正|综合之一", "tldr": "一句话压缩", "detail": "可选，稍展开的论证一两句" }
      ]
    }
  ],
  "chatScript": [
    { "pid": "参与者id或字符串host", "tag": "标签", "text": "发言正文", "tldr": "简言之" }
  ]
}

硬性要求：
- participants：3～5 人；覆盖明显不同的立场维度；至少 1 人来自议题核心领域之外（意外视角）。
- 每人 viewpoints 至少 2 条；chatScript 8～14 条，顺序符合对话推进；必须出现至少一条 pid 为 "host" 的主持人设综述。
- 所有 chatScript 中的 pid（除 host）必须出现在 participants 的 id 中。
- 内容紧扣议题，有交锋感，避免全员和稀泥。`;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", ALLOW);
  res.setHeader("Access-Control-Allow-Headers", HEADERS_ALLOW);
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1].trim() : t;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function openaiComplete(apiKey, model, topic, baseUrl) {
  let endpoint = "https://api.openai.com/v1/chat/completions";
  if (baseUrl) {
    endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : baseUrl.replace(/\/+$/, "") + "/chat/completions";
  }
  // 智谱 AI 兼容模式：如果模型名以 glm- 开头，自动添加 thinking 参数
  const isZhipuModel = model?.startsWith("glm-");
  const bodyPayload = {
    model: model || "gpt-4o-mini",
    temperature: 0.75,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: "议题：" + topic },
    ],
  };
  // 智谱 AI 需要 thinking 参数来获取结构化输出
  if (isZhipuModel) {
    bodyPayload.thinking = { type: "enabled" };
    bodyPayload.max_tokens = 65536;
  } else {
    bodyPayload.response_format = { type: "json_object" };
  }

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(bodyPayload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error?.message || data.message || r.statusText || "OpenAI 请求失败";
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  const content = data.choices?.[0]?.message?.content;
  const parsed = extractJson(content || "");
  if (!parsed) {
    const err = new Error("无法解析模型返回的 JSON");
    err.status = 502;
    throw err;
  }
  return parsed;
}

async function anthropicComplete(apiKey, model, topic, baseUrl) {
  let endpoint = "https://api.anthropic.com/v1/messages";
  if (baseUrl) {
    endpoint = baseUrl.endsWith("/v1/messages") ? baseUrl : baseUrl.replace(/\/+$/, "") + "/v1/messages";
  }
  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-3-5-haiku-20241022",
      max_tokens: 8192,
      temperature: 0.75,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "议题：" + topic }],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error?.message || data.message || r.statusText || "Anthropic 请求失败";
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  const blocks = data.content;
  const text = Array.isArray(blocks)
    ? blocks.map((b) => (b.type === "text" ? b.text : "")).join("")
    : "";
  const parsed = extractJson(text);
  if (!parsed) {
    const err = new Error("无法解析模型返回的 JSON");
    err.status = 502;
    throw err;
  }
  return parsed;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "请求体须为 JSON" });
    }
  }

  const topic = (body?.topic || "").trim().slice(0, 4000);
  if (!topic) {
    return res.status(400).json({ error: "缺少 topic" });
  }

  const provider = (body?.provider || "openai").toLowerCase();
  const model = (body?.model || "").trim() || undefined;
  const baseUrl = (body?.baseUrl || "").trim() || undefined;

  // 优先使用服务端环境变量，其次使用用户提供的 Key
  let apiKey = "";
  if (provider === "anthropic") {
    apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  } else if (provider === "openai") {
    apiKey = (process.env.OPENAI_API_KEY || "").trim();
  } else if (provider === "zhipu") {
    apiKey = (process.env.ZHIPU_API_KEY || "").trim();
  }

  // 如果服务端没有配置，则使用用户提供的 Key
  if (!apiKey) {
    apiKey = (req.headers["x-user-api-key"] || "").trim();
    if (!apiKey) {
      return res.status(401).json({
        error: "未配置 API Key。请联系管理员在环境变量中设置。"
      });
    }
  }

  try {
    let out;
    if (provider === "anthropic") {
      out = await anthropicComplete(apiKey, model, topic, baseUrl);
    } else if (provider === "openai" || provider === "zhipu") {
      // 智谱 AI 使用 OpenAI 兼容格式
      const zhipuBaseUrl = baseUrl || "https://open.bigmodel.cn/api/paas/v4";
      const finalBaseUrl = provider === "zhipu" && !baseUrl ? zhipuBaseUrl : baseUrl;
      out = await openaiComplete(apiKey, model || "glm-4.7-flash", topic, finalBaseUrl);
    } else {
      return res.status(400).json({ error: "provider 须为 openai、anthropic 或 zhipu" });
    }
    out.topic = out.topic || topic;
    return res.status(200).json(out);
  } catch (e) {
    const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
    return res.status(status).json({ error: e.message || "生成失败" });
  }
};
