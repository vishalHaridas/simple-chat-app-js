import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './App.css'

import ChatInterface from './components/ChatInterface'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatInterface />
  </QueryClientProvider>
)

export default App
