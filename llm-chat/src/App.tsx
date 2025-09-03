import { useState } from 'react'

import './App.css'
import { SidebarTrigger } from './components/ui/sidebar'

type Message = { sender: 'user' | 'bot'; text: string }
type Chat = { id: string; name: string; messages: Message[] }

const useChats = (initialArr?: Message[]) => {
  const [chats, setChats] = useState<Chat[]>(
    (initialArr && [{ id: 'test', name: 'also test', messages: initialArr }]) ?? [
      { id: 'temp', name: 'Temp chat', messages: [] },
    ],
  )

  const addChat = (name: string) => {
    const newChat = { id: Date.now().toString(), name, messages: [] }
    setChats([...chats, newChat])
  }

  const deleteChat = (id: string) => {
    setChats(chats.filter((chat) => chat.id !== id))
  }

  const addMessageToChat = (chatId: string, message: { sender: 'user' | 'bot'; text: string }) => {
    setChats(
      chats.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat,
      ),
    )
  }

  return { chats, addChat, deleteChat, addMessageToChat }
}

const ChatBar = (props: { handleSendMessage: (e: string) => void }) => {
  const [chatInput, setChatInput] = useState<string>('')
  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault()
        props.handleSendMessage(chatInput)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          props.handleSendMessage(chatInput)
          setChatInput('')
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
          <button className="float-right mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Send
          </button>
        </div>
      </div>
    </form>
  )
}

function App() {
  const exampleChatMessages: Message[] = [
    { sender: 'bot', text: 'Hello! How can I assist you today?' },
    { sender: 'user', text: 'Can you tell me a joke?' },
    {
      sender: 'bot',
      text: 'Sure! Why did the scarecrow win an award? Because he was outstanding in his field!',
    },
  ]
  const [selectedChatIndex, _] = useState(0)
  const { chats, addMessageToChat } = useChats()

  const [stream, setStream] = useState<string | null>(null)

  const ChatMessages = () => {
    return (
      // This element must be flex-1 and overflow-y-auto
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2 p-4">
          {chats?.[selectedChatIndex].messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg p-3 text-white ${
                  msg.sender === 'user' ? 'bg-blue-500' : 'bg-gray-600'
                } max-w-[80%] md:max-w-[70%]`}
              >
                {msg.text}
              </div>
            </div>
          ))}
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
            handleSendMessage={(value: string) =>
              addMessageToChat(chats[0].id, { sender: 'user', text: value })
            }
          />
        </section>
      </main>
      <footer className="flex w-full flex-none items-center justify-center border-t border-gray-200 bg-white py-2 text-center text-sm text-gray-500">
        This is a practice project
      </footer>
    </div>
  )
}

export default App
