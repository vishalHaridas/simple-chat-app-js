import { useQuery, experimental_streamedQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import callLLMGenerator from '@/utils/api/callLLMResponse'
import type { Message } from '@/utils/types'

import ChatMessageInputBar from './ui/chatMessageInputBar'
import ChatMessages from './ui/chatMessageList'

const ChatInterface = () => {
  const [messageList, setMessageList] = useState<Message[]>([])

  const hasMessages = messageList.length > 0
  const lastMessageIsUser = hasMessages && messageList[messageList.length - 1].role === 'user'
  // Only call the LLM API when the last message is from the user
  const { data, isError, error } = useQuery({
    queryKey: ['currentChat', messageList],
    queryFn: experimental_streamedQuery({
      queryFn: () => callLLMGenerator(messageList),
    }),
    enabled: hasMessages && lastMessageIsUser,
  })

  const handleMessageSend = (sender: 'assistant' | 'user', message: string) =>
    setMessageList((prev) => [...prev, { role: sender, content: message }])

  const unwrappedStream = data?.map((chunk) => chunk.value).join('') ?? ''
  const lastChunk = data?.[data?.length - 1]
  if (lastChunk && lastChunk.done) {
    const fullResponse = unwrappedStream
    handleMessageSend('assistant', fullResponse)
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100">
      <nav className="flex flex-none items-center justify-center border-b border-gray-200 bg-white p-4">
        <SidebarTrigger />
        <h1 className="text-xl font-bold">LLM Chat App</h1>
      </nav>

      <main className="flex min-h-0 flex-1 flex-col bg-blue-50">
        <section className="mx-0 flex min-h-0 flex-1 flex-col bg-amber-100 md:mx-20 2xl:mx-80">
          <ChatMessages
            messageList={messageList}
            isError={isError}
            error={error}
            stream={unwrappedStream}
          />
          <ChatMessageInputBar
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

export default ChatInterface
