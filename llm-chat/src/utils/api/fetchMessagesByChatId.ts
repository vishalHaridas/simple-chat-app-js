const fetchMessagesByChatId = async (chatId: string) => {
  const url = `http://localhost:3001/api/chats/${chatId}`
  const request = new Request(`http://localhost:3001/api/chats/${chatId}`, { method: 'GET' })
  const response = await fetch(request)
  if (!response.ok) {
    console.error('Error fetching chat by ID:', response.statusText)
    throw new Error('Network response was not ok')
  }
  return await response.json()
}

export default fetchMessagesByChatId
