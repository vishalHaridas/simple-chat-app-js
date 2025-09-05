import type { Message } from '@/utils/types'

const ChatMessageComponent = (props: {
  message: Message
  type: 'user' | 'assistant' | 'stream' | 'error'
}) => (
  <div className={`flex ${props.message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`rounded-lg p-3 text-white ${
        props.type === 'user'
          ? 'bg-blue-500'
          : props.type === 'assistant'
            ? 'bg-purple-700'
            : props.type === 'error'
              ? 'bg-red-700'
              : 'bg-gray-700'
      } max-w-[80%] md:max-w-[70%]`}
    >
      {props.message.content}
    </div>
  </div>
)

export default ChatMessageComponent
