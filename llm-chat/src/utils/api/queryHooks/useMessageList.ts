import { useQuery } from '@tanstack/react-query'

import fetchMessagesByChatId from '../fetchMessagesByChatId'

const useMessageList = (currentChatID: string) => {
  const { data: messageListData, refetch: refetchMessageList } = useQuery({
    queryKey: ['currentChat', currentChatID],
    queryFn: () => fetchMessagesByChatId(currentChatID),
    enabled: !!currentChatID,
    select: (data) => {
      console.log('Raw data from fetchChatById:', data)
      if (Array.isArray(data)) {
        const messages = data.map((item: any) => ({
          role: item.sender === 'user' ? 'user' : 'assistant',
          content: item.text as string,
        }))
        console.log('Transformed messages:', messages)
        return messages as Message[]
      } else {
        console.warn('Unexpected data format:', data)
        return []
      }
    },
    initialData: [],
  })

  return { messageListData, refetchMessageList }
}

export default useMessageList
