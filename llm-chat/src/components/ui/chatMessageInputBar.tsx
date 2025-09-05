import { useState } from 'react'

import { Button } from './button'

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

export default ChatBar
