import { LMStudioClient, Chat } from "@lmstudio/sdk";

const openrouterAPI = async (payload, { signal = {} }) => {
  return new Response("Not implemented yet", { status: 501 });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
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

const lmstudioAPI = async (payload, {signal} = {}) => {
  console.log(`Provider layer is making API Call`);

  const client = new LMStudioClient();
  const model = await client.llm.model(payload.model);
  const chat = Chat.from(payload.messages);
  
// OpenAI-style SSE envelope creator expected by your top-level reader
  const asOpenAIChunk = (text) => ({
    choices: [{ delta: { content: text }, finish_reason: null }]
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const prediction = model.respond(chat, {
          maxTokens: payload.max_tokens > 0 ? payload.max_tokens : undefined,
          temperature: payload.temperature ?? 0.7,
        });

        for await (const chunk of prediction) {
          if (signal?.aborted) break;

          // LM Studio chunks can be strings or objects; normalize to text
          const piece =
            typeof chunk === "string" ? chunk :
            typeof chunk?.content === "string" ? chunk.content :
            typeof chunk?.delta?.content === "string" ? chunk.delta.content :
            typeof chunk?.text === "string" ? chunk.text : "";

          if (!piece) continue;

          const line = `data: ${JSON.stringify(asOpenAIChunk(piece))}\n\n`;
          controller.enqueue(new TextEncoder().encode(line));
        }

        // send final markers
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`
        ));
        controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      // optional: close model stream if SDK supports it
    }
  });

  return new Response(stream, { status: 200 });
};

const mockAPI = async (_payload, { signal } = {}) => {
  const words = ["Hello", "there", "friend!"];
  const stream = new ReadableStream({
    start(controller) {
      let i = 0;
      const send = () => {
        if (signal?.aborted) return controller.close();
        if (i < words.length) {
          const chunk = { choices: [{ delta: { content: words[i++] + " " }, finish_reason: null }] };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
          setTimeout(send, 250);
        } else {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`
          ));
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        }
      };
      send();
    }
  });
  return new Response(stream, { status: 200, statusText: "OK" });
};

export const providerCall = async (payload, opts = {}) => {
  // console.log(`Provider Call:, payload = ${JSON.stringify(payload, null, 2)}, opts = ${JSON.stringify(opts, null, 2)}`);
  const PROVIDER = process.env.LLM_PROVIDER || 'mock';
  switch (PROVIDER) {
    case 'openrouter':
      return openrouterAPI(payload, opts);
    case 'lmstudio':
      return await lmstudioAPI(payload, opts);
    default:
      return await mockAPI(payload, opts);
  }
};


