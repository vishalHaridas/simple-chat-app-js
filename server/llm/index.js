const openrouterAPI = async (payload) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'LLM Chat App',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return response;
}

const lmstudioAPI = async (payload) => {
  const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions';
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });


  return response;
}

export const providerCall =  (payload) => {
  const PROVIDER = process.env.LLM_PROVIDER || 'mock';
  switch (PROVIDER) {
    case 'openrouter':
      return openrouterAPI(payload);
    case 'lmstudio':
      return lmstudioAPI(payload);
    default:
      // return a Response-like object with ok/json/text to match server expectations
      const mockData = {
        id: "chatcmpl-mock",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: payload.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "This is a mock response."
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockData,
        text: async () => JSON.stringify(mockData)
      });
  }
};


