// One contribution record as its own page (#/records/:id), laid out like a
// Vercel deployment page: the title and actions on top, then a wide column for
// what was done (description, evidence, review comments) and a narrow one for
// who did it and the record's facts.
import React, { useState } from 'react';
import {
  ArrowUpRight, Check, CheckCircle2, Download, FileText, Link as LinkIcon, Loader2, Paperclip, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TYPES, STATES, SIZES, fullDateLabel, timeLabel } from '../lib/constants.js';

const isProcess = type => TYPES[type]?.[2] === 'PROCESS';
const STATUS_STYLE = {
  RECORDED: 'text-muted-foreground',
  NEEDS_REVIEW: 'border-amber-300 bg-amber-50 text-amber-800',
  RESOLVED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

function Busy({ busy, children, ...props }) {
  return <Button disabled={busy} {...props}>{busy && <Loader2 className="animate-spin" />}{children}</Button>;
}

function Person({ person, size = 'size-8' }) {
  return (
    <Avatar className={size}>
      {person?.avatarUrl && <AvatarImage src={person.avatarUrl} alt="" className="object-cover" />}
      <AvatarFallback>{(person?.name || '?').slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}

function Fact({ label, children }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function EvidenceSection({ d, busy, editable, onRemoveEvidence, onAddEvidence, onDownload }) {
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState('link');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget, fd = new FormData(form), file = fd.get('file');
    if (mode === 'file' && (!file?.size || file.size > 10 * 1024 * 1024)) { setError('비어 있지 않은 10MB 이하 파일을 선택하세요.'); return; }
    if (await onAddEvidence({ type: 'LINK', name: fd.get('name'), url: fd.get('url') }, mode === 'file' ? file : null)) {
      setAdding(false); form.reset();
    }
  }
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>근거 자료 <span className="text-muted-foreground font-normal">{d.evidences.length}</span></CardTitle>
        {editable && <CardAction><Button size="sm" variant="outline" onClick={() => setAdding(a => !a)}><Plus />근거 추가</Button></CardAction>}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2">
        {d.evidences.length ? d.evidences.map(e => (
          <div key={e.evidenceId} className="flex min-w-0 items-center gap-3 rounded-md border px-3 py-2">
            {e.type === 'FILE' ? <Paperclip className="size-4 text-muted-foreground" /> : <LinkIcon className="size-4 text-muted-foreground" />}
            {e.url.startsWith('/api/')
              ? <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium hover:underline" onClick={() => onDownload(e)}><span className="truncate">{e.name}</span><Download className="size-3.5 shrink-0" /></button>
              : <a className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium hover:underline" href={/^https?:\/\//.test(e.url) ? e.url : '#'} target="_blank" rel="noopener noreferrer"><span className="truncate">{e.name}</span><ArrowUpRight className="size-3.5 shrink-0" /></a>}
            {editable && <Button size="icon" variant="ghost" className="size-7" disabled={busy} aria-label={`${e.name} 근거 삭제`} onClick={() => onRemoveEvidence(e.evidenceId)}><X /></Button>}
          </div>
        )) : <p className="text-sm text-muted-foreground">연결된 근거가 아직 없어요.</p>}

        {adding && (
          <form onSubmit={submit} noValidate={false} className="mt-2 grid gap-3 rounded-lg border bg-muted/40 p-4">
            <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={v => v && setMode(v)} aria-label="근거 종류" className="w-fit">
              <ToggleGroupItem value="link">링크</ToggleGroupItem>
              <ToggleGroupItem value="file">파일</ToggleGroupItem>
            </ToggleGroup>
            {mode === 'file' ? (
              <div className="grid gap-2"><Label htmlFor="evidence-file">파일 선택 (최대 10MB)</Label><Input id="evidence-file" type="file" name="file" required /></div>
            ) : (
              <>
                <div className="grid gap-2"><Label htmlFor="evidence-name">자료 이름</Label><Input id="evidence-name" name="name" required maxLength={100} placeholder="자료 이름" /></div>
                <div className="grid gap-2"><Label htmlFor="evidence-url">주소</Label><Input id="evidence-url" name="url" required type="url" pattern="https?://.*" placeholder="https://" /></div>
              </>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>취소</Button>
              <Busy type="submit" size="sm" busy={busy}>근거 추가</Busy>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function CommentsSection({ d, busy, editable, onComment, onResolve }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('MISSING');
  const [resolveId, setResolveId] = useState(null);
  const [note, setNote] = useState('');
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>보완 의견 <span className="text-muted-foreground font-normal">{d.comments.length}</span></CardTitle>
        <CardDescription>누락된 기여나 수정할 내용을 함께 확인해요.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {d.comments.length ? (
          <ol className="grid gap-4">
            {d.comments.map(c => (
              <li key={c.commentId} className={`grid gap-2 ${c.resolved ? 'opacity-80' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Person person={c.author} size="size-6" />
                  <span className="font-medium">{c.author?.name}</span>
                  <Badge variant="outline">{c.commentType === 'MISSING' ? '누락' : '수정'}</Badge>
                  <span className="text-xs text-muted-foreground">{timeLabel(c.createdAt)}</span>
                  {c.resolved && <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800"><Check />해결됨</Badge>}
                </div>
                <p className="pl-8 text-sm leading-relaxed">{c.content}</p>
                {c.resolved ? (
                  <p className="ml-8 flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{c.resolvedBy?.name} · {c.resolutionNote || '보완 완료'} <span className="text-xs">{timeLabel(c.resolvedAt)}</span></span>
                  </p>
                ) : editable && (resolveId === c.commentId ? (
                  <form className="ml-8 grid gap-2" onSubmit={async e => { e.preventDefault(); if (await onResolve(c.commentId, note)) { setResolveId(null); setNote(''); } }}>
                    <Label htmlFor={`resolve-${c.commentId}`}>해결 내용</Label>
                    <Input id={`resolve-${c.commentId}`} value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder="어떻게 보완했는지 알려주세요" />
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setResolveId(null)}>취소</Button>
                      <Busy type="submit" size="sm" busy={busy}>해결 처리</Busy>
                    </div>
                  </form>
                ) : (
                  <Button size="sm" variant="ghost" className="ml-6 w-fit" onClick={() => setResolveId(c.commentId)}>해결 처리하기 <Check /></Button>
                ))}
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">아직 보완 의견이 없어요.</p>}

        <Separator />
        <form className="grid gap-3" onSubmit={async e => { e.preventDefault(); if (await onComment({ commentType: type, content })) setContent(''); }}>
          <ToggleGroup type="single" variant="outline" size="sm" value={type} onValueChange={v => v && setType(v)} aria-label="의견 종류" className="w-fit">
            <ToggleGroupItem value="MISSING">누락된 기여</ToggleGroupItem>
            <ToggleGroupItem value="CORRECTION">수정 제안</ToggleGroupItem>
          </ToggleGroup>
          <Label htmlFor="new-comment" className="sr-only">보완 의견</Label>
          <Textarea id="new-comment" required maxLength={1000} rows={3} value={content} onChange={e => setContent(e.target.value)}
            placeholder="예: 인터뷰 질문 정리에 저도 함께 참여했어요." />
          <div className="flex justify-end"><Busy type="submit" size="sm" busy={busy}>의견 남기기</Busy></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RecordDetail({ detail: d, busy, editable, removable, onEdit, onDelete, onComment, onResolve, onRemoveEvidence, onAddEvidence, onDownload }) {
  const TypeIcon = TYPES[d.type]?.[1] || FileText;
  const date = fullDateLabel(d.workDate);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <TypeIcon className={isProcess(d.type) ? 'text-primary' : 'text-muted-foreground'} />
              {TYPES[d.type]?.[0] || '기여'}
            </Badge>
            <Badge variant="outline" className={STATUS_STYLE[d.status]}>{STATES[d.status]}</Badge>
            <span className="text-sm text-muted-foreground">{date}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{d.title}</h1>
        </div>
        {(editable || removable) && (
          <div className="flex gap-2">
            {editable && <Button variant="outline" onClick={onEdit}><Pencil />기록 수정</Button>}
            {removable && <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busy} onClick={onDelete} aria-label="기록 삭제"><Trash2 />삭제</Button>}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Card className="gap-3">
            <CardHeader><CardTitle>무엇을 했나요</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-sm leading-relaxed">{d.description || '추가 설명이 없는 기록이에요.'}</p></CardContent>
          </Card>
          <EvidenceSection d={d} busy={busy} editable={editable} onRemoveEvidence={onRemoveEvidence} onAddEvidence={onAddEvidence} onDownload={onDownload} />
          <CommentsSection d={d} busy={busy} editable={editable} onComment={onComment} onResolve={onResolve} />
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6">
          <Card className="gap-4">
            <CardHeader><CardTitle>함께한 사람들 <span className="text-muted-foreground font-normal">{d.participants.length}</span></CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {d.participants.map(p => (
                <div key={p.userId} className="grid gap-1.5">
                  <div className="flex items-center gap-3">
                    <Person person={p} />
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{p.role || '역할 미기재'}</span>
                    </div>
                    <span className="text-sm tabular-nums">{p.share}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, p.share || 0)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="gap-4">
            <CardHeader><CardTitle>기록 정보</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <Fact label="작성">{d.createdBy?.name || '알 수 없음'}</Fact>
                <Fact label="작업한 날">{date}</Fact>
                <Fact label="종류">{TYPES[d.type]?.[0]} · {isProcess(d.type) ? '과정' : '결과'}</Fact>
                <Fact label="작업 규모">{SIZES[d.size] || d.size}</Fact>
                <Fact label="근거 자료">{d.evidences?.length || 0}개</Fact>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">기록을 수정할 수 있는 사람: 작성자 · 참여자 · 팀장</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
