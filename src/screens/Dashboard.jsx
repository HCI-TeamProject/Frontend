// Dashboard, adapted from shadcn/ui's dashboard-01 block: four section cards,
// an interactive area chart of weekly contributions, and tabs over a table of
// records. Moa's idea that process counts as much as results shows up as the
// process card, the process/result split in the chart, and the table tabs.
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { TrendingUp, CircleCheck, CircleAlert, Paperclip, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TYPES, STATES, dateLabel } from '../lib/constants.js';

const DAY = 864e5;
const isProcess = r => (TYPES[r.type]?.[2] || r.category) === 'PROCESS';
const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const workDay = r => new Date(`${r.workDate}T12:00:00`);
const people = list => (list.length > 2 ? `${list[0].name} 외 ${list.length - 1}명` : list.map(p => p.name).join(', '));

const chartConfig = {
  process: { label: '과정', color: 'var(--chart-1)' },
  result: { label: '결과', color: 'var(--chart-2)' },
};

// Monday 00:00 of the current week.
function thisMonday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Weekly process/result counts for the last `weeks` weeks, oldest first.
function weeklySeries(records, weeks) {
  const monday = thisMonday();
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(monday.getTime() - (weeks - 1 - i) * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    const inWeek = records.filter(r => { const d = workDay(r); return d >= start && d < end; });
    const process = inWeek.filter(isProcess).length;
    return { week: `${start.getMonth() + 1}/${start.getDate()}`, process, result: inWeek.length - process };
  });
}

function SectionCard({ label, value, badge, icon: Icon = TrendingUp, line, sub }) {
  return (
    <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
        <CardAction><Badge variant="outline"><Icon />{badge}</Badge></CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">{line}</div>
        <div className="text-muted-foreground">{sub}</div>
      </CardFooter>
    </Card>
  );
}

function ContributionChart({ records }) {
  const [range, setRange] = useState('8');
  const total = records.length;
  const oldest = records.length ? Math.ceil((thisMonday() - workDay(records.at(-1))) / (7 * DAY)) + 1 : 8;
  const weeks = range === 'all' ? Math.max(oldest, 4) : Number(range);
  const data = useMemo(() => weeklySeries(records, weeks), [records, weeks]);
  return (
    <Card className="@container/card shadow-xs">
      <CardHeader>
        <CardTitle>주별 기여</CardTitle>
        <CardDescription>과정과 결과로 나눠 본 주별 기록 수 · 전체 {total}개</CardDescription>
        <CardAction>
          <ToggleGroup type="single" value={range} onValueChange={v => v && setRange(v)} variant="outline" size="sm" aria-label="기간">
            <ToggleGroupItem value="4">4주</ToggleGroupItem>
            <ToggleGroupItem value="8">8주</ToggleGroupItem>
            <ToggleGroupItem value="all">전체</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
          <AreaChart data={data} margin={{ left: 4, right: 4 }}>
            <defs>
              {Object.keys(chartConfig).map(key => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" labelFormatter={v => `${v} 주`} />} />
            <Area dataKey="result" type="monotone" fill="url(#fill-result)" stroke="var(--color-result)" stackId="a" />
            <Area dataKey="process" type="monotone" fill="url(#fill-process)" stroke="var(--color-process)" stackId="a" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RecordsTable({ rows, onOpen }) {
  if (!rows.length) return <p className="text-muted-foreground rounded-lg border p-8 text-center text-sm">아직 기록이 없어요.</p>;
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>기록</TableHead>
            <TableHead>종류</TableHead>
            <TableHead className="hidden md:table-cell">참여</TableHead>
            <TableHead className="hidden sm:table-cell">근거</TableHead>
            <TableHead className="text-right">날짜</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.contributionId} className="cursor-pointer" onClick={() => onOpen(r.contributionId)}>
              <TableCell className="max-w-0 w-1/2">
                <button type="button" className="block w-full truncate text-left font-medium hover:underline" onClick={e => { e.stopPropagation(); onOpen(r.contributionId); }}>
                  {r.title}
                </button>
                {(r.status === 'NEEDS_REVIEW' || r.openCommentCount > 0) && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                    <MessageCircle className="size-3" />{r.openCommentCount > 0 ? `의견 ${r.openCommentCount}개` : STATES[r.status]}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground gap-1.5 px-1.5">
                  <span className={`size-1.5 rounded-full ${isProcess(r) ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  {TYPES[r.type]?.[0] || '기타'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">{people(r.participants)}</TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {r.evidenceCount > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5" />{r.evidenceCount}</span>}
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">{dateLabel(r.workDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function Dashboard({ user, records, navigate, setFilters, openRecord }) {
  const showRecords = filter => { navigate('records'); if (filter) setFilters(f => ({ ...f, ...filter })); };
  const attention = records.filter(r => r.status === 'NEEDS_REVIEW' || r.openCommentCount > 0);
  const process = records.filter(isProcess);
  const result = records.filter(r => !isProcess(r));
  const mine = records.filter(r => r.participants.some(p => p.userId === user?.id));
  const fourWeeksAgo = new Date(thisMonday().getTime() - 3 * 7 * DAY);
  const recent = records.filter(r => workDay(r) >= fourWeeksAgo).length;
  const tabs = [['recent', '최근 기록', records], ['process', '과정', process], ['result', '결과', result], ['mine', '나의 기록', mine]];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SectionCard label="기여 기록" value={records.length} badge={`최근 4주 +${recent}`}
          line="팀이 모은 모든 기여" sub="결과물과 그 과정을 함께 셉니다" />
        <SectionCard label="과정 기록" value={process.length} badge={`${percent(process.length, records.length)}%`}
          line={`결과 ${result.length}개 뒤의 과정 ${process.length}개`} sub="자료조사 · 아이디어 · 회의 · 피드백" />
        <SectionCard label="나의 기여" value={mine.length} badge={`팀의 ${percent(mine.length, records.length)}%`}
          line={`과정 ${mine.filter(isProcess).length} · 결과 ${mine.filter(r => !isProcess(r)).length}`} sub="내가 참여한 기록" />
        <SectionCard label="확인 필요" value={attention.length} icon={attention.length ? CircleAlert : CircleCheck}
          badge={attention.length ? '확인하기' : '정리됨'}
          line={attention.length ? '검토나 의견이 남은 기록' : '모두 정리됐어요'} sub="검토 필요 · 남은 의견" />
      </div>

      <ContributionChart records={records} />

      <Tabs defaultValue="recent" className="gap-4">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            {tabs.map(([key, label, rows]) => (
              <TabsTrigger key={key} value={key}>
                {label}{key !== 'recent' && <Badge variant="secondary" className="ml-1 rounded-full px-1.5">{rows.length}</Badge>}
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
