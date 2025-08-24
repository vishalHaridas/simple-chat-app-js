import express from 'express';


export const createConversationsRouter = (providerService, parserService, userId) => {
  const router = express.Router();

  app.post('/api/chat/completions', async (req, res) => {
    try {
      console.log('Received request:', req.body);
      const { messages, model = 'qwen/qwen3-1.7b' } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const last = messages[messages.length - 1]?.content?.trim();

      const isMemoryCommand = last && (last.startsWith('/remember') 
        || last.startsWith('/forget') 
        || last.startsWith('/list'));

      if (isMemoryCommand) {
        const command = last.split(' ')[0].slice(1); // remove leading slash
        const payload = last.slice(command.length + 2).trim(); // remove command and space

        const responseText = handleMemoryCommand(command, payload);
        return res.json({ completion: responseText, model, usage: {} });
      }

      const kv = listKV(USER_ID);
      const epi = recentEpisodes(USER_ID, 5);

      const memoryContext = [
        'You know these persistent facts about the user:',
        ...kv.slice(0, 12).map(({key, value}) => `- ${key}: ${value}`),
        epi.length ? 'Recent notes:' : '',
        ...epi.map(({text}) => `- ${text}`)
      ].filter(Boolean).join('\n');

      const CURRENT_TIME = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const CURRENT_DATE = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const CURRENT_DATETIME = `${CURRENT_TIME} of ${CURRENT_DATE}`;

      const MEMORY_PROMPT =  `[Memory]\nYou know these persistent facts about the user:\n${memoryContext}\n\nOnly use this information when asked, or relevant. DO NOT restate!`
      const SYSTEM_PROMPT = `/nothink\n\n The current time is: ${CURRENT_DATETIME}\n\n. You are a helpful assistant. ${MEMORY_PROMPT}`;

      const response = await providerCall({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(msg => ({
            role: msg.role || 'user', 
            content: msg.content || msg.text 
          })),
        ],
        max_tokens: -1,
        temperature: 0.7,
        stream: true,
      });


      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenRouter API error:', errorData);
        return res.status(response.status).json({ 
          error: 'Failed to get completion from OpenRouter',
          details: errorData 
        });
      }

      const data = await response.json();
      
      // Extract the completion text
      const completion = data.choices?.[0]?.message?.content || 'No response generated';
      
      res.json({ 
        completion,
        model: data.model,
        usage: data.usage
      });

    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });

  return router;
};