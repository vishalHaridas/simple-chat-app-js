import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './App.css'

import ChatInterface from './components/ChatInterface'

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ChatInterface />
    </QueryClientProvider>
  )
}

export default App
