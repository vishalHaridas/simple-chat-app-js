import { useMutation, type QueryObserverResult, type RefetchOptions } from '@tanstack/react-query'

import type { Message } from '@/utils/types'

import sendUserMessageToServer from '../sendUserMessageToServer'

const useUserMessageToServerMutation = (
  refetchMessageList: (options?: RefetchOptions) => Promise<QueryObserverResult<Message[], Error>>,
) => {
  const { mutate } = useMutation({
    mutationKey: ['sendUserMessage'],
    mutationFn: (body: { message: string; currentChatID: string }) => sendUserMessageToServer(body),
    onSuccess: async () => {
      console.log('User message sent successfully, refetching message list')
      await refetchMessageList()
    },
    onError: (error) => {
      console.error('Error sending user message:', error)
    },
  })

  return { mutate }
}

export default useUserMessageToServerMutation
