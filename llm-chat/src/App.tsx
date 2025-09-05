import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import './App.css'
import { Button } from './components/ui/button'
import { SidebarTrigger } from './components/ui/sidebar'

type ChatBarProps = { handleSendMessage: (e: string) => void }
const ChatBar = (props: ChatBarProps) => {
  const [chatInput, setChatInput] = useState<string>('')
  const handleChatSend = () => {
    props.handleSendMessage(chatInput)
    setChatInput('')
  }

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault()
        handleChatSend()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleChatSend()
        }
      }}
    >
      <div className="flex w-full flex-none justify-center p-3">
        <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-md">
          <textarea
            className="w-full resize-none rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            rows={3}
            name="message"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your message..."
          />
          <Button
            onClick={handleChatSend}
            className="float-right mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Send
          </Button>
        </div>
      </div>
    </form>
  )
}

type Message = { role: 'user' | 'assistant'; content: string }
type Chat = { id: string; name: string; messages: Message[] }

const ChatInterface = () => {
  const [stream, setStream] = useState<string | null>(null)
  const [messageList, setMessageList] = useState<Message[]>([])

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

  async function callLLMResponse() {
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

  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['currentChat'],
    queryFn: callLLMResponse,
    enabled: false,
  })

  const handleMessageSend = (sender: 'assistant' | 'user', message: string) => {
    setStream(null)
    setMessageList((prev) => [...prev, { role: sender, content: message }])
  }

  useEffect(() => {
    if (messageList.length === 0) return
    if (messageList[messageList.length - 1].role === 'assistant') return

    void refetch()
  }, [messageList])

  const ChatMessages = () => {
    return (
      // This element must be flex-1 and overflow-y-auto
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2 p-4">
          {messageList.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg p-3 text-white ${
                  msg.role === 'user' ? 'bg-blue-500' : 'bg-purple-700'
                } max-w-[80%] md:max-w-[70%]`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-gray-600 p-3 text-white md:max-w-[70%]">
                Loading...
              </div>
            </div>
          )}
          {isError && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-red-600 p-3 text-white md:max-w-[70%]">
                {`Error fetching response: ${error instanceof Error ? error.message : 'Unknown error'}`}
              </div>
            </div>
          )}
          {stream && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-gray-600 p-3 text-white md:max-w-[70%]">
                {stream}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100">
      <nav className="flex flex-none items-center justify-center border-b border-gray-200 bg-white p-4">
        <SidebarTrigger />
        <h1 className="text-xl font-bold">LLM Chat App</h1>
      </nav>

      {/* Sidebar */}
      <main className="flex min-h-0 flex-1 flex-col bg-blue-50">
        <section className="mx-0 flex min-h-0 flex-1 flex-col bg-amber-100 md:mx-20 2xl:mx-80">
          <ChatMessages />
          <ChatBar
            handleSendMessage={(value: string) => {
              handleMessageSend('user', value)
            }}
          />
        </section>
      </main>
      <footer className="flex w-full flex-none items-center justify-center border-t border-gray-200 bg-white py-2 text-center text-sm text-gray-500">
        This is a practice project
      </footer>
    </div>
  )
}

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ChatInterface />
    </QueryClientProvider>
  )
}

export default App
