import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import './App.css'
import type { Message } from '@/utils/types'

import ChatMessageComponent from './components/ui/chatMessage'
import { Button } from './components/ui/button'
import { SidebarTrigger } from './components/ui/sidebar'
import callLLMResponse from './utils/api/callLLMResponse'

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

const ChatInterface = () => {
  const [stream, setStream] = useState<string>('')
  const [messageList, setMessageList] = useState<Message[]>([])

  const { isError, error } = useQuery({
    queryKey: ['currentChat', messageList],
    queryFn: () => callLLMResponse(messageList, setStream, handleMessageSend),
    enabled: messageList.length > 0 && messageList[messageList.length - 1].role === 'user',
  })

  const handleMessageSend = (sender: 'assistant' | 'user', message: string) => {
    setStream('')
    setMessageList((prev) => [...prev, { role: sender, content: message }])
  }

  const ChatMessages = () => {
    return (
      // This element must be flex-1 and overflow-y-auto
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2 p-4">
          {messageList.map((msg, i) => (
            <ChatMessageComponent key={i} message={msg} type={msg.role} />
          ))}
          {isError && (
            <ChatMessageComponent
              message={{ role: 'assistant', content: error.message }}
              type="error"
            />
          )}
          {stream.trim().length !== 0 && (
            <ChatMessageComponent message={{ role: 'assistant', content: stream }} type="stream" />
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
