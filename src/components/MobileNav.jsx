// Phone navigation. Top: which screen I'm on (ScreenSwitcher, centred in the
// header). Bottom: who I am and which team (MobileMenu, a "≡ 메뉴" pill that
// opens a sheet sized to its content). Desktop uses the sidebar instead.
import React, { useState } from 'react';
import { Check, ChevronsUpDown, LogOut, Menu, Plus, UserRoundCog } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// On phones this is the page's title: an h1 at heading size whose text opens
// the screen menu.
export function ScreenSwitcher({ menu, active, label, onNavigate }) {
  // The current screen's menu icon leads the title; account settings is not in the menu.
  const Icon = menu.find(([v]) => v === active)?.[1] || UserRoundCog;
  return (
    <h1 className="min-w-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex max-w-full items-center gap-2 rounded-md px-2 py-1 text-xl font-semibold tracking-tight outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent"
          aria-label={`${label}, 화면 바꾸기`}>
          <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-48">
          {menu.map(([v, Icon, name]) => (
            <DropdownMenuItem key={v} onClick={() => onNavigate(v)} className="py-2">
              <Icon /> <span className="flex-1">{name}</span>
              {active === v && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </h1>
  );
}

// Teams are drawn as squares, people as circles.
function TeamMark({ team }) {
  return (
    <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
      {(team?.name || '?').slice(0, 1)}
    </span>
  );
}

export function MobileMenu({ user, onOpenSettings, onLogout, teams, teamId, onSelectTeam, onNewTeam }) {
  const [open, setOpen] = useState(false);
  const go = fn => () => { setOpen(false); fn(); };
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} aria-label="계정·팀 메뉴 열기"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 h-11 -translate-x-1/2 gap-2 rounded-full bg-background px-5 shadow-lg transition-transform active:scale-95 sm:hidden">
        <Menu />메뉴
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] gap-0 rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="sr-only">
            <SheetTitle>계정과 팀</SheetTitle>
            <SheetDescription>계정 설정, 로그아웃, 팀 바꾸기</SheetDescription>
          </SheetHeader>

          {/* Me */}
          <section className="grid gap-3 px-4 pt-5 pb-4" aria-label="내 계정">
            <div className="flex items-center gap-3 pr-8">
              <Avatar className="size-10">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />}
                <AvatarFallback>{(user?.name || '?').slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 leading-tight">
                <span className="truncate font-medium">{user?.name || '불러오는 중'}</span>
                <span className="truncate text-sm text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={go(onOpenSettings)}><UserRoundCog />계정 설정</Button>
          </section>

          <Separator />

          {/* Teams */}
          <section className="grid gap-1 overflow-y-auto px-2 pt-3" aria-labelledby="mobile-teams">
            <h2 id="mobile-teams" className="px-2 pb-1 text-xs font-medium text-muted-foreground">팀</h2>
            <ul className="grid gap-0.5">
              {teams.map(t => {
                const current = String(t.teamId) === String(teamId);
                return (
                  <li key={t.teamId}>
                    <button type="button" onClick={go(() => onSelectTeam(String(t.teamId)))} aria-current={current ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${current ? 'bg-accent' : 'hover:bg-accent/60'}`}>
                      <TeamMark team={t} />
                      <span className="min-w-0 flex-1 truncate text-[15px]">{t.name}</span>
                      {current && <Check className="size-4" />}
                    </button>
                  </li>
                );
              })}
              <li>
                <button type="button" onClick={go(onNewTeam)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-muted-foreground outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg border border-dashed"><Plus className="size-4" /></span>
                  <span className="text-[15px]">팀 만들기 · 참여하기</span>
                </button>
              </li>
            </ul>
          </section>

          {/* Logout last, apart from the everyday actions, like most apps' settings lists. */}
          <Separator className="mt-3" />
          <div className="px-2 pt-2">
            <button type="button" onClick={go(onLogout)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-[15px] text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50">
              <span className="inline-flex size-8 items-center justify-center"><LogOut className="size-4" /></span>
              로그아웃
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
