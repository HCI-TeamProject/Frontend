// Header team switcher: shows the team I'm looking at and is the only place
// to change it (Vercel keeps its project switcher in the same spot). Record
// details open as a dialog, so there is no deeper path to show beside it.
import React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TeamSwitcher({ teams, teamId, team, onSelectTeam, onNewTeam }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex min-w-0 max-w-[60vw] items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent sm:max-w-sm"
        aria-label={`팀 바꾸기, 지금 팀: ${team?.name || '없음'}`}>
        <span className="truncate">{team?.name || '팀 선택'}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">내 팀</DropdownMenuLabel>
        {teams.map(t => (
          <DropdownMenuItem key={t.teamId} onClick={() => onSelectTeam(String(t.teamId))}>
            <span className="flex-1 truncate">{t.name}</span>
            {String(t.teamId) === String(teamId) && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNewTeam}><Plus /> 팀 만들기 · 참여하기</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
