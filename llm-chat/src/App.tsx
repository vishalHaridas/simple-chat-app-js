import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'

import './App.css'

import ChatInterface from './components/ChatInterface'
import AppSidebar from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Provider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <ChatInterface />
      </SidebarProvider>
    </Provider>
  </QueryClientProvider>
)

export default App
