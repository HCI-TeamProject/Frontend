// App sidebar, after shadcn's sidebar-07 block: team switcher at the top, the
// main menu, and the signed-in user at the bottom. Collapses to an icon rail.
import React from 'react';
import { ChevronsUpDown, Plus, LogOut, Check } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BrandMark } from './common.jsx';

function TeamSwitcher({ teams, teamId, onSelect, onNewTeam }) {
  const { isMobile } = useSidebar();
  const current = teams.find(t => String(t.teamId) === String(teamId));
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <BrandMark size={18} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">모아</span>
                <span className="text-muted-foreground truncate text-xs">{current?.name || '팀을 선택하세요'}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="start"
            side={isMobile ? 'bottom' : 'right'} sideOffset={4}>
            <DropdownMenuLabel className="text-muted-foreground text-xs">내 팀</DropdownMenuLabel>
            {teams.map(t => (
              <DropdownMenuItem key={t.teamId} onClick={() => onSelect(String(t.teamId))} className="gap-2 p-2">
                <span className="flex-1 truncate">{t.name}</span>
                {String(t.teamId) === String(teamId) && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewTeam} className="gap-2 p-2">
              <Plus className="size-4" /> 팀 만들기 · 참여하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavUser({ user, onLogout }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{(user?.name || '?').slice(0, 1)}</AvatarFallback></Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name || '불러오는 중'}</span>
                <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}>
            <DropdownMenuLabel className="font-normal">
              <div className="grid text-sm leading-tight"><span className="font-medium">{user?.name}</span><span className="text-muted-foreground text-xs">{user?.email}</span></div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}><LogOut /> 로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ menu, view, onNavigate, recordCount, teams, teamId, onSelectTeam, onNewTeam, user, onLogout }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const go = v => { onNavigate(v); if (isMobile) setOpenMobile(false); };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher teams={teams} teamId={teamId} onSelect={v => { onSelectTeam(v); if (isMobile) setOpenMobile(false); }} onNewTeam={onNewTeam} />
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
                {v === 'records' && recordCount > 0 && <SidebarMenuBadge>{recordCount}</SidebarMenuBadge>}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
