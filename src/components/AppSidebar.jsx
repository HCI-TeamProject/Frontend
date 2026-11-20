// App sidebar. Each part has one job, the way Vercel splits it:
// - top: who I am (Moa + my name), opening account settings and logout,
// - menu: which screen I'm on.
// Which team I'm looking at lives in the header (TeamSwitcher), not here.
// The sidebar collapses to an icon rail; on phones it is a drawer.
import React from 'react';
import { ChevronsUpDown, LogOut, UserRoundCog } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrandMark } from './common.jsx';

function AccountMenu({ user, onOpenSettings, onLogout }) {
  const { isMobile, state } = useSidebar();
  // Opens downward from the expanded sidebar; to the side only on the icon rail.
  const rail = !isMobile && state === 'collapsed';
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" aria-label={`계정 메뉴, ${user?.name || ''}`}>
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <BrandMark size={18} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">모아</span>
                <span className="text-muted-foreground truncate text-xs">{user?.name || '불러오는 중'}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="start"
            side={rail ? 'right' : 'bottom'} sideOffset={4}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />}
                  <AvatarFallback>{(user?.name || '?').slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="grid text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenSettings}><UserRoundCog /> 계정 설정</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onLogout}><LogOut /> 로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ menu, view, onNavigate, reviewCount, user, onLogout }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const go = v => { onNavigate(v); if (isMobile) setOpenMobile(false); };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AccountMenu user={user} onOpenSettings={() => go('account')} onLogout={onLogout} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarMenu>
            {menu.map(([v, Icon, label]) => (
              <SidebarMenuItem key={v}>
                <SidebarMenuButton isActive={view === v} tooltip={label} onClick={() => go(v)}>
                  <Icon /> <span>{label}</span>
                </SidebarMenuButton>
                {/* Like an unread count: only what still needs someone's attention. */}
                {v === 'records' && reviewCount > 0 && (
                  <SidebarMenuBadge aria-label={`확인 필요 ${reviewCount}개`} title={`확인 필요 ${reviewCount}개`}>{reviewCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
