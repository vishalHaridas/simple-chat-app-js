export type Message = { role: 'user' | 'assistant'; content: string }
export type Chat = { id: string; name: string; messages: Message[] }
