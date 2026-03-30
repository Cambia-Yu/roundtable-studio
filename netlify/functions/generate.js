// Netlify Function for API proxy
// 支持环境变量: OPENAI_API_KEY, ANTHROPIC_API_KEY, ZHIPU_API_KEY

export async function handler(event, context) {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { messages, config } = body;

    // 验证请求
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid messages format' })
      };
    }

    // 确定使用的 provider 和 API key
    const provider = config?.provider || 'openai';
    const userApiKey = config?.apiKey;

    // 优先使用环境变量中的 API key
    let apiKey = userApiKey;
    if (!apiKey) {
      switch (provider) {
        case 'anthropic':
          apiKey = process.env.ANTHROPIC_API_KEY;
          break;
        case 'zhipu':
          apiKey = process.env.ZHIPU_API_KEY;
          break;
        case 'openai':
        default:
          apiKey = process.env.OPENAI_API_KEY;
          break;
      }
    }

    if (!apiKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    // 发起 API 请求
    let apiUrl, headers, requestBody;

    if (provider === 'anthropic') {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      };
      requestBody = {
        model: config?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: config?.maxTokens || 4096,
        system: config?.system || 'You are a helpful assistant.',
        messages: messages
      };
    } else if (provider === 'zhipu') {
      apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      requestBody = {
        model: config?.model || 'glm-4.7-flash',
        messages: messages,
        max_tokens: config?.maxTokens || 65536,
        temperature: config?.temperature || 1.0
      };
    } else {
      // OpenAI / 兼容 OpenAI 的 API
      apiUrl = config?.baseUrl || 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      requestBody = {
        model: config?.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: config?.maxTokens || 4096,
        temperature: config?.temperature || 0.7
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    // 统一返回格式
    let result;
    if (provider === 'anthropic') {
      result = {
        content: data.content[0].text,
        model: data.model,
        usage: data.usage
      };
    } else {
      result = {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
