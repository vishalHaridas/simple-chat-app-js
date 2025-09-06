import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './App.css'

import ChatInterface from './components/ChatInterface'
import AppSidebar from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <ChatInterface />
    </SidebarProvider>
  </QueryClientProvider>
)

export default App
