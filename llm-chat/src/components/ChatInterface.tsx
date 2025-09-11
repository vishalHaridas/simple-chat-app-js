import {
  useQuery,
  experimental_streamedQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useAtom, useAtomValue } from 'jotai'
import { use, useEffect, useState } from 'react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import callLLMGenerator from '@/utils/api/callLLMResponse'
import type { Chat, Message } from '@/utils/types'

import ChatMessageInputBar from './ui/chatMessageInputBar'
import ChatMessages from './ui/chatMessageList'
import { currentChatIdAtom } from '@/utils/store/jotai'
import fetchMessagesByChatId from '@/utils/api/fetchMessagesByChatId'
import sendUserMessageToServer from '@/utils/api/sendUserMessageToServer'
import useMessageList from '@/utils/api/queryHooks/useMessageList'
import useUserMessageToServerMutation from '@/utils/api/queryHooks/useUserMessageToServerMutation'
import useLLMCaller from '@/utils/api/queryHooks/useLLMCaller'

const ChatInterface = () => {
  console.log('Rendering ChatInterface component')

  const currentChatID = useAtomValue(currentChatIdAtom)
  const [userMessageList, setUserMessageList] = useState<Message[]>([])
  const queryClient = useQueryClient()

  console.log('Current Chat ID:', currentChatID)

  const { messageListData, refetchMessageList } = useMessageList(currentChatID!)
  const { mutate } = useUserMessageToServerMutation(refetchMessageList)

  const hasMessages = messageListData.length > 0
  const lastMessageIsUser =
    hasMessages && messageListData[messageListData.length - 1].role === 'user'
  // Only call the LLM API when the last message is from the user
  const enableLLMQuery = hasMessages && lastMessageIsUser
  const { data, isError, error } = useLLMCaller(messageListData, currentChatID!, enableLLMQuery)

  const updateMessageListWith = (sender: 'assistant' | 'user', message: string) => {
    setUserMessageList((prev) => [...prev, { role: sender, content: message }])
  }

  useEffect(() => {
    if (userMessageList.length === 0) return
    console.log('User message list updated:', userMessageList)
    mutate({
      message: userMessageList[userMessageList.length - 1].content,
      currentChatID: currentChatID!,
    })
  }, [userMessageList])

  const unwrappedStream = data?.map((chunk) => chunk.value).join('') ?? ''
  const generationDone = data?.map((chunk) => chunk.done).find((value) => value) ?? false

  useEffect(() => {
    console.log('This should mean the genration is done!')
    console.log('Going to invalidate client!')

    queryClient.invalidateQueries()
    refetchMessageList()
  }, [generationDone])

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100">
      <nav className="flex flex-none items-center justify-center border-b border-gray-200 bg-white p-4">
        <SidebarTrigger />
        <h1 className="text-xl font-bold">LLM Chat App</h1>
      </nav>

      <main className="flex min-h-0 flex-1 flex-col">
        <section className="mx-0 flex min-h-0 flex-1 flex-col md:mx-20 2xl:mx-80">
          <ChatMessages
            messageList={messageListData ?? []}
            isError={isError}
            error={error}
            stream={unwrappedStream}
          />
          <ChatMessageInputBar
            handleSendMessage={(value: string) => {
              updateMessageListWith('user', value)
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
