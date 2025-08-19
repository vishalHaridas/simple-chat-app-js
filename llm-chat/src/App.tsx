import { useEffect, useRef, useState, type JSX } from 'react'
import './App.css'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const model = 'qwen/qwen3-1.7b'

  //useref of the input bar
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      // // Call our server's completion endpoint
      // const response = await fetch('http://localhost:3001/api/chat/completions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     messages: [
      //       ...messages.map(msg => ({
      //         role: msg.isUser ? 'user' : 'assistant',
      //         content: msg.text
      //       })), // Include previous messages
      //       {
      //         role: 'user',
      //         content: currentInput
      //       }
      //     ],
      //     model: 'qwen/qwen3-1.7b'
      //     // model: 'openai/gpt-oss-20b:free' // You can change this to any OpenRouter model
      //   })
      // })

      // if (!response.ok) {
      //   throw new Error(`Server error: ${response.status}`)
      // }

      // const data = await response.json()

      // const llmMessage: Message = {
      //   id: Date.now() + 1,
      //   text: data.completion,
      //   isUser: false,
      //   timestamp: new Date()
      // }

      // setMessages(prev => [...prev, llmMessage])

      // Abort any inflight stream
      if(abortRef.current) {
        abortRef.current?.abort()
      };
      const controller = new AbortController()
      abortRef.current = controller

      // empty assistant message
      const assistantID = Date.now() + 1
      setMessages(prev => [...prev, {
        id: assistantID,
        text: '',
        isUser: false,
        timestamp: new Date()
      }])

      // Build chat history
      const history = [
        ...messages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })),
        {
          role: 'user',
          content: currentInput
        }
      ]

      // Call the LLM provider
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: history,
          model
        }),
        signal: controller.signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`)
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      let buffer = ''

      // Parse OpenAI style SSE:
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Split by newlines to handle SSE format
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || '' // Keep the last part in buffer

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const data = part.slice(5).trim()

          if (data === '[DONE]') {
            // End of stream - just break, don't cancel
            break
          }

          try {
            const json = JSON.parse(data)
            const delta = json.choices[0]?.delta
            const content = delta?.content

            if (content) {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantID
                    ? { ...msg, text: msg.text + content }
                    : msg
                )
              )
            }

            // Check if stream is finished
            const finishReason = json.choices[0]?.finish_reason
            if (finishReason === 'stop') {
              break
            }
          }
          catch (error) {
            console.error('Error parsing SSE data:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error getting LLM response:', error)

      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please make sure the server is running and try again.',
        isUser: false,
        timestamp: new Date()
      }

      console.error(errorMessage.text)

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h1>LLM Chat</h1>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Start a conversation with your LLM!</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.isUser ? 'user-message' : 'llm-message'}`}>
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="chat-input">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
          className="message-input"
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} className="send-button" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

    </div>
  )
}

export default App
