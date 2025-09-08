import { useAtom, type SetStateAction } from 'jotai'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx'
import { currentChatIdAtom } from '@/utils/store/jotai'
import { Button } from './ui/button'
import { useQuery } from '@tanstack/react-query'

// Menu items.
const items = [
  {
    title: 'New Chat',
    url: '#',
    action: (fn: any) => fn,
  },
]

const mockChatList = [
  { id: '1', title: 'Chat 1' },
  { id: '2', title: 'Chat 2' },
  { id: '3', title: 'Chat 3' },
]

export const AppSidebar = () => {
  const [_, setCurrentChatId] = useAtom(currentChatIdAtom)

  const fetchChatList = async (): Promise<{ id: string; title: string }[]> => {
    const request = new Request('http://localhost:3001/api/chats/', { method: 'GET' })
    const response = await fetch(request)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }

  const { data, isError, error } = useQuery({
    queryKey: ['chatList'],
    queryFn: fetchChatList,
    select: (data) => data.map((chat: any) => ({ id: chat.id, title: chat.title })),
  })

  const SideBarMenuChildrenChats = (props: { chatList: { id: string; title: string }[] }) => {
    const [_, setCurrentChatId] = useAtom(currentChatIdAtom)

    if (!props.chatList || props.chatList.length === 0) {
      return (
        <SidebarMenuItem>
          <p>No previous chats</p>
        </SidebarMenuItem>
      )
    }

    return (
      <>
        {props.chatList.map((chat) => (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton asChild>
              <Button variant="link" onClick={() => setCurrentChatId(chat.id)}>
                {chat.title}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </>
    )
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button variant={'ghost'} onClick={() => item.action(setCurrentChatId(null))}>
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarMenuChildrenChats chatList={data ?? []} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
