import type { Message } from '@/utils/types'

/**
 * Example chunk of data (with <think></think)
 * data: {"choices":[{"delta":{"content":"<think>"},"finish_reason":null}]}
 * data: {"choices":[{"delta":{"content":"\n\n"},"finish_reason":null}]}
 * data: {"choices":[{"delta":{"content":"</think>"},"finish_reason":null}]}
 * data: {"choices":[{"delta":{"content":"\n\n"},"finish_reason":null}]}
 * data: {"choices":[{"delta":{"content":"Boy"},"finish_reason":null}]}
 * data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
 * data: [DONE]
 * data: end
 */

const parseStreamedChunk = (chunk: string): string => {
  //return Ok({value: string, status: "err" | "done" | "continue"})

  type CompletionsObj = { choices: { delta: { content: string }; finish_reason: string }[] }

  try {
    if (chunk === '[DONE]' || chunk === 'end') return ''

    const lines = chunk.split('\n').filter((line) => line.trim() !== '')
    let parsedText = ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.replace('data: ', '').trim()
        if (jsonStr === '[DONE]') {
          return ''
        }
        const data: CompletionsObj = JSON.parse(jsonStr) as CompletionsObj
        const content = data.choices[0].delta.content
        const finishReason = data.choices[0].finish_reason

        if (content) {
          parsedText += content
        }

        if (finishReason === 'stop') {
          return parsedText
        }
      }
    }

    // partial line
    return parsedText
  } catch (err) {
    console.error('Error parsing chunk:', err)
  }
  return ''
}

export default (messageList: Message[], chatId: string) => {
  return {
    async *[Symbol.asyncIterator]() {
      const requestBody = { messages: messageList, chat_id: chatId }
      console.log('Calling Generator LLM with messages:', requestBody)

      const request = new Request('http://localhost:3001/api/completions/stream', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      })
      const streamResp = await fetch(request)
      console.log('Fetch response:', streamResp)

      if (!streamResp.ok) throw new Error('Network response was not ok')
      if (!streamResp.body) throw new Error('No response body')

      const reader = streamResp.body.getReader()

      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)
        // const parsedChunk = parseStreamedChunk(chunkValue)
        const parsedChunk = chunkValue
        if (parsedChunk) {
          yield { done: false, value: parsedChunk }
        }
        if (done) {
          yield { done: true, value: '' }
        }
      }
    },
  }
}

/**
 * @deprecated Use callLLMGenerator instead
 */
export const callLLMResponse = async (
  messageList: Message[],
  setStream: React.Dispatch<React.SetStateAction<string>>,
  handleMessageSend: (sender: 'assistant' | 'user', message: string) => void,
) => {
  const requestBody = { messages: messageList }
  console.log('Calling LLM with messages:', requestBody)

  const request = new Request('http://localhost:3001/api/completions/stream', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
  })
  const streamResp = await fetch(request)
  console.log('Fetch response:', streamResp)

  if (!streamResp.ok) throw new Error('Network response was not ok')
  if (!streamResp.body) throw new Error('No response body')

  const reader = streamResp.body.getReader()

  const decoder = new TextDecoder('utf-8')
  let done = false
  let result = ''

  while (!done) {
    const { value, done: doneReading } = await reader.read()
    done = doneReading
    const chunkValue = decoder.decode(value)
    const parsedChunk = parseStreamedChunk(chunkValue)
    if (parsedChunk) {
      setStream((prev) => (prev ? prev + parsedChunk : parsedChunk))
    }
    result += parsedChunk
  }

  handleMessageSend('assistant', result)

  return result
}
