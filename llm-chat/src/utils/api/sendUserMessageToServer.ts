const sendUserMessageToServer = async (body: { message: string; currentChatID: string }) => {
  const { message, currentChatID } = body
  if (!currentChatID) {
    console.error('No current chat ID set')
    return
  }
  const url = `http://localhost:3001/api/chats/${currentChatID}/messages`
  const request = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'user', text: message, chat_id: currentChatID }),
  })
  const response = await fetch(request)
  if (!response.ok) {
    console.error('Error sending user message to server:', response.statusText)
    throw new Error('Network response was not ok')
  }
  return response.json()
}

export default sendUserMessageToServer
