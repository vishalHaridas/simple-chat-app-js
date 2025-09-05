import type { Message } from '@/utils/types'

import ChatMessageComponent from './chatMessage'

const ChatMessages = (props: {
  isError: boolean
  error: Error | null
  stream: string
  messageList: Message[]
}) => {
  return (
    // This element must be flex-1 and overflow-y-auto
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2 p-4">
        {props.messageList.map((msg, i) => (
          <ChatMessageComponent key={i} message={msg} type={msg.role} />
        ))}
        {props.isError && (
          <ChatMessageComponent
            message={{
              role: 'assistant',
              content: props.error?.message ?? 'an Unknown error occurred',
            }}
            type="error"
          />
        )}
        {props.stream.trim().length !== 0 && (
          <ChatMessageComponent
            message={{ role: 'assistant', content: props.stream }}
            type="stream"
          />
        )}
      </div>
    </div>
  )
}

export default ChatMessages
