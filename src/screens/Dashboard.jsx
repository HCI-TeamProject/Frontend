// Dashboard, adapted from shadcn/ui's dashboard-01 block: a strip of headline numbers,
// a GitHub-style grid of daily contributions beside each member's share of the
// records, and tabs over a table of records.
// Moa's idea that process counts as much as results shows up as the process
// card, the process/result split in each day's tooltip, and the table tabs.
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Paperclip, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TYPES, STATES, dateLabel } from '../lib/constants.js';
import { ATTENTION, needsAttention } from './Records.jsx';

const DAY = 864e5;
const isProcess = r => (TYPES[r.type]?.[2] || r.category) === 'PROCESS';
const workDay = r => new Date(`${r.workDate}T12:00:00`);

// Monday 00:00 of the current week.
function thisMonday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// The headline numbers as one flat, bordered strip (like Vercel's usage rows):
// name on the left, number on the right. Each cell opens the matching records.
function StatStrip({ items }) {
  return (
    <div className="grid divide-y overflow-hidden rounded-xl border bg-card shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map(({ label, value, meta, alert, onClick }) => (
        <button key={label} type="button" onClick={onClick}
          className="group flex items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{label}</span>
            <span className="block truncate text-xs text-muted-foreground">{meta}</span>
          </span>
          <span className={`text-2xl font-semibold tabular-nums ${alert ? 'text-amber-600' : ''}`}>{value}</span>
          <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
}

// GitHub-style contribution grid: one column per week (Monday first), one
// square per day, darker for more records that day.
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const LEVELS = ['bg-muted', 'bg-primary/30', 'bg-primary/55', 'bg-primary/80', 'bg-primary'];
// Shades are relative to the busiest day, like GitHub's, so a team that logs
// one record a day still sees a clear pattern.
const level = (n, max) => (n ? Math.ceil((n / max) * (LEVELS.length - 1)) : 0);
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shortDate = d => d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

// How long since the team last logged work: the grid shows when, this says
// whether the team has gone quiet lately.
function sinceLast(records) {
  if (!records.length) return '아직 기록이 없어요';
  const last = records.reduce((max, r) => (r.workDate > max ? r.workDate : max), '');
  const today = new Date();
  const days = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(`${last}T00:00:00`)) / DAY);
  if (days <= 0) return '오늘 기록했어요';
  return days === 1 ? '마지막 기록 어제' : `마지막 기록 ${days}일 전`;
}

// Weeks of history the grid always shows: back to the first record, at least 12.
function pastWeeks(records) {
  const monday = thisMonday();
  const oldest = records.reduce((min, r) => Math.min(min, workDay(r).getTime()), monday.getTime());
  return Math.max(12, Math.ceil((monday - oldest) / (7 * DAY)) + 1);
}

// Grid geometry in px, used to work out whether the grid and member cards fit
// side by side and how many future weeks fill a row the grid has to itself.
const CELL = 16, GAP = 3, LABEL = 20, CARD_X = 48 + 2, MEMBER_MIN = 352, ROW_GAP = 24;
const gridCardWidth = weeks => CARD_X + LABEL + weeks * (CELL + GAP);

function ContributionGrid({ records, extraWeeks = 0 }) {
  const { weeks, max, activeDays, past } = useMemo(() => {
    const byDay = {};
    for (const r of records) {
      const day = (byDay[r.workDate] ||= { process: 0, result: 0 });
      day[isProcess(r) ? 'process' : 'result'] += 1;
    }
    const monday = thisMonday();
    const past = pastWeeks(records);
    const today = new Date();
    // Past weeks up to this one, then empty future weeks that only fill space.
    const weeks = Array.from({ length: past + extraWeeks }, (_, w) => {
      const start = new Date(monday.getTime() - (past - 1 - w) * 7 * DAY);
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const c = byDay[dayKey(date)] || { process: 0, result: 0 };
        return { date, future: date > today, ...c, total: c.process + c.result };
      });
    });
    const max = Math.max(1, ...weeks.flat().map(d => d.total));
    return { weeks, max, activeDays: Object.keys(byDay).length, past };
  }, [records, extraWeeks]);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>날짜별 기여</CardTitle>
        <CardDescription>{sinceLast(records)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-x-auto">
        <TooltipProvider delayDuration={0}>
          <div role="img" aria-label={`최근 ${past}주 동안 ${activeDays}일 기록했어요`}
            className="inline-grid text-[11px] leading-none text-muted-foreground"
            style={{ gridTemplateColumns: `${LABEL}px repeat(${weeks.length}, ${CELL}px)`, gridAutoRows: `${CELL}px`, gap: GAP }}>
            {/* Month labels over the first week of each month, skipping one
                that would crowd the next (as GitHub does at the left edge). */}
            <span />
            {weeks.map((days, w) => {
              const m = days[0].date.getMonth();
              const starts = i => i === 0 || weeks[i - 1][0].date.getMonth() !== weeks[i][0].date.getMonth();
              const crowded = [1, 2].some(i => weeks[w + i] && starts(w + i));
              return <span key={w} className="self-end whitespace-nowrap">{starts(w) && !crowded ? `${m + 1}월` : ''}</span>;
            })}
            {WEEKDAYS.map((name, d) => (
              <React.Fragment key={name}>
                <span className="self-center">{d % 2 === 0 ? name : ''}</span>
                {weeks.map((days, w) => {
                  const day = days[d];
                  // Days still to come: a dashed outline, no tooltip.
                  if (day.future) return <span key={w} className="rounded-[3px] border border-dashed border-muted-foreground/15" />;
                  return (
                    <Tooltip key={w}>
                      <TooltipTrigger asChild>
                        <span className={`rounded-[3px] ${LEVELS[level(day.total, max)]}`} />
                      </TooltipTrigger>
                      <TooltipContent>
                        {shortDate(day.date)} · {day.total ? `과정 ${day.process} · 결과 ${day.result}` : '기록 없음'}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </TooltipProvider>
        {/* Pinned to the bottom so a card stretched to the member card's height
            keeps its legend near the edge rather than floating mid-card. */}
        <div className="mt-auto flex items-center gap-1 pt-3 text-[11px] text-muted-foreground" aria-hidden="true">
          적음{LEVELS.map(c => <span key={c} className={`size-3.5 rounded-[3px] ${c}`} />)}많음
        </div>
      </CardContent>
    </Card>
  );
}

// How many records each member took part in, split into process and result.
// Members with no records still show, so a quiet teammate is visible too.
function MemberContributions({ members, records, userId, onOpen, onInvite }) {
  const rows = members.map(m => {
    const theirs = records.filter(r => r.participants.some(p => p.userId === m.userId));
    const process = theirs.filter(isProcess).length;
    return { ...m, process, result: theirs.length - process, total: theirs.length };
  }).sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...rows.map(r => r.total));
  // How evenly the team takes part: a member with no records comes first,
  // otherwise the gap between the most and least active member.
  const idle = rows.filter(r => r.total === 0).length;
  const gap = rows.length ? rows[0].total - rows.at(-1).total : 0;
  const balance = idle ? `기록이 없는 팀원 ${idle}명` : `참여 차이 최대 ${gap}건`;
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>팀원별 기여</CardTitle>
        <CardDescription className={idle ? 'text-amber-600' : ''}>{balance}</CardDescription>
        {/* The colour key sits apart from the caption, top right like a chart legend. */}
        <CardAction className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />과정</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-primary/35" />결과</span>
          {/* Invite as a quiet icon in the corner, so the card stays as short as its list. */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="-my-1 size-8" aria-label="팀원 초대하기" onClick={onInvite}><UserPlus /></Button>
              </TooltipTrigger>
              <TooltipContent>팀원 초대하기</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1">
          {rows.map(m => (
            <li key={m.userId}>
              <button type="button" onClick={() => onOpen(m.userId)}
                aria-label={`${m.name}${m.role === 'LEADER' ? '(팀장)' : ''}${m.userId === userId ? '(나)' : ''}: 과정 ${m.process}건, 결과 ${m.result}건. 참여한 기록 보기`}
                className="-mx-2 grid w-[calc(100%+1rem)] grid-cols-[auto_7rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50">
              <Avatar className="size-7"><AvatarFallback className="text-xs">{m.name.slice(0, 1)}</AvatarFallback></Avatar>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{m.name}</span>
                {(m.role === 'LEADER' || m.userId === userId) && (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {[m.role === 'LEADER' && '팀장', m.userId === userId && '나'].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
              <span className="bg-muted flex h-2 overflow-hidden rounded-full" aria-hidden="true">
                <span className="bg-primary h-full" style={{ width: `${(m.process / max) * 100}%` }} />
                <span className="bg-primary/35 h-full" style={{ width: `${(m.result / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums">{m.total}건</span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Participants as overlapping initials (people are circles), at most three,
// then "+N". The full list is in the accessible name and the hover title.
function People({ list }) {
  const names = list.map(p => p.name).join(', ');
  const shown = list.slice(0, 3);
  return (
    <span className="flex items-center" title={names}>
      <span className="sr-only">{names}</span>
      <span className="flex -space-x-1.5" aria-hidden="true">
        {shown.map(p => (
          <Avatar key={p.userId} className="size-6 ring-2 ring-card">
            <AvatarFallback className="text-[11px]">{p.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        ))}
        {list.length > shown.length && (
          <span className="bg-muted text-muted-foreground relative inline-flex size-6 items-center justify-center rounded-full text-[11px] ring-2 ring-card">
            +{list.length - shown.length}
          </span>
        )}
      </span>
    </span>
  );
}

// The type's icon and name. The icon colour says process or result with the
// same greens as the member card: full green for process, light for result.
function TypeLabel({ record: r }) {
  const [name, Icon] = TYPES[r.type] || ['기타', null];
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
      {Icon && <Icon aria-hidden="true" className={`size-4 shrink-0 ${isProcess(r) ? 'text-primary' : 'text-primary/45'}`} strokeWidth={1.75} />}
      {name}
    </span>
  );
}

// Same frame as the cards above (rounded-xl, border, light shadow); the header
// is small grey text with no band. The title column takes all spare width, so
// the other columns sit at their content width with equal gaps between them. On phones each row becomes two lines, the
// title in full and "type · date" under it, instead of squeezing columns.
function RecordsTable({ rows, onOpen }) {
  if (!rows.length) return <p className="text-muted-foreground rounded-xl border bg-card p-8 text-center text-sm shadow-xs">아직 기록이 없어요.</p>;
  const head = 'h-9 text-xs font-normal text-muted-foreground';
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table className="[&_td]:px-3 [&_th]:px-3 [&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${head} w-full`}>기록</TableHead>
            <TableHead className={`${head} hidden sm:table-cell`}>종류</TableHead>
            <TableHead className={`${head} hidden md:table-cell`}>참여</TableHead>
            <TableHead className={`${head} hidden sm:table-cell`}>근거</TableHead>
            <TableHead className={`${head} hidden text-right sm:table-cell`}>날짜</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.contributionId} className="cursor-pointer" onClick={() => onOpen(r.contributionId)}>
              <TableCell className="w-full max-w-0 py-2.5">
                <button type="button" className="block w-full truncate text-left font-medium hover:underline" onClick={e => { e.stopPropagation(); onOpen(r.contributionId); }}>
                  {r.title}
                </button>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                  <span className="text-muted-foreground sm:hidden">{TYPES[r.type]?.[0] || '기타'} · {dateLabel(r.workDate)}</span>
                  {(r.status === 'NEEDS_REVIEW' || r.openCommentCount > 0) && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <MessageCircle className="size-3" />{r.openCommentCount > 0 ? `의견 ${r.openCommentCount}개` : STATES[r.status]}
                    </span>
                  )}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell"><TypeLabel record={r} /></TableCell>
              <TableCell className="hidden md:table-cell"><People list={r.participants} /></TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {r.evidenceCount > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5" />{r.evidenceCount}</span>}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">{dateLabel(r.workDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function Dashboard({ team, user, records, navigate, setFilters, openRecord }) {
  const showRecords = filter => { navigate('records'); if (filter) setFilters(f => ({ ...f, ...filter })); };
  const attention = records.filter(needsAttention);
  const process = records.filter(isProcess);
  const result = records.filter(r => !isProcess(r));
  const mine = records.filter(r => r.participants.some(p => p.userId === user?.id));
  const fourWeeksAgo = new Date(thisMonday().getTime() - 3 * 7 * DAY);
  const recent = records.filter(r => workDay(r) >= fourWeeksAgo).length;
  const rowRef = useRef(null);
  const [rowWidth, setRowWidth] = useState(0);
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    // Measure before the first paint so the layout never flashes stacked.
    setRowWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setRowWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const baseWidth = gridCardWidth(pastWeeks(records));
  const sideBySide = Boolean(team) && rowWidth >= baseWidth + ROW_GAP + MEMBER_MIN;
  const extraWeeks = sideBySide ? 0 : Math.max(0, Math.floor((rowWidth - baseWidth) / (CELL + GAP)));
  const tabs = [['recent', '최근 기록', records], ['process', '과정', process], ['result', '결과', result], ['mine', '나의 기록', mine]];

  return (
    <div className="flex flex-col gap-6">
      <StatStrip items={[
        { label: '전체 기록', value: records.length, meta: `최근 4주 +${recent}`, onClick: () => showRecords() },
        { label: '과정 기록', value: process.length, meta: `결과 기록 ${result.length}개`, onClick: () => showRecords({ type: '@PROCESS' }) },
        { label: '확인 필요', value: attention.length, alert: attention.length > 0,
          meta: '검토 필요 · 남은 의견', onClick: () => showRecords({ status: ATTENTION }) },
      ]} />

      {/* Side by side while both fit; otherwise two rows, and the grid fills
          its own row with dashed future weeks instead of leaving it empty. */}
      <div ref={rowRef} className="grid gap-6" style={{ gridTemplateColumns: sideBySide ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
        <ContributionGrid records={records} extraWeeks={extraWeeks} />
        {team && <MemberContributions members={team.members} records={records} userId={user?.id}
          onOpen={id => showRecords({ person: String(id) })} onInvite={() => navigate('members')} />}
      </div>

      <Tabs defaultValue="recent" className="gap-4">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            {tabs.map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <button type="button" className="text-muted-foreground hidden text-sm hover:text-foreground sm:block" onClick={() => showRecords()}>
            전체 기록 보기
          </button>
        </div>
        {tabs.map(([key, , rows]) => (
          <TabsContent key={key} value={key}>
            <RecordsTable rows={rows.slice(0, 8)} onOpen={openRecord} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
