import { useAtom } from 'jotai'

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

// Menu items.
const items = [
  {
    title: 'New Chat',
    url: '#',
  },
]

export const AppSidebar = () => {
  const [_, setCurrentChatId] = useAtom(currentChatIdAtom)

  setCurrentChatId('123') // Example of setting the current chat ID

  //can be an empty array
  const SideBarMenuChildrenChats = (props: { chatList: { id: string; title: string }[] }) => {
    console.log('Chat List len:', props.chatList.length)

    if (props.chatList.length === 0) {
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
              <a href={`#chat/${chat.id}`}>{chat.title}</a>
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
                    <a href={item.url}>
                      <span>{item.title}</span>
                    </a>
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
              <SideBarMenuChildrenChats chatList={[]} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
