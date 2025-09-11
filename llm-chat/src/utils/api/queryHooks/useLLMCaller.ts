import { experimental_streamedQuery, useQuery } from '@tanstack/react-query'

import callLLMGenerator from '@/utils/api/callLLMResponse'
import type { Message } from '@/utils/types'

const useLLMCaller = (messageListData: Message[], currentChatID: string, enabled: boolean) => {
  const { data, isError, error } = useQuery({
    queryKey: ['currentChat', messageListData],
    queryFn: experimental_streamedQuery({
      queryFn: () => callLLMGenerator(messageListData, currentChatID),
    }),
    enabled,
  })

  return { data, isError, error }
}

export default useLLMCaller
