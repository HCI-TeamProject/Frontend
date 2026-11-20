// Account settings, laid out like Supabase's: a centred column of groups
// (프로필, 로그인, then leaving Moa), each a card of label-left, control-right
// rows. Email and password stay folded to one line until you change them. The backend endpoints are specified in the
// "프로필 변경 API 요청" page; until they exist, saving explains that the
// server isn't ready instead of failing silently.
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, Trash2, TriangleAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '../lib/api.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const AVATAR_MAX = 5 * 1024 * 1024;
export const WITHDRAW_PHRASE = '탈퇴합니다';

// ---- Validation (exported for tests) ----
export function nameError(name) {
  if (!name.trim()) return '이름을 입력해주세요.';
  if (name.trim().length > 30) return '이름은 30자 이내로 입력해주세요.';
  return '';
}
export function emailChangeErrors({ newEmail, confirmEmail, currentPassword }, currentEmail) {
  const e = {};
  const next = newEmail.trim();
  if (!next) e.newEmail = '새 이메일을 입력해주세요.';
  else if (!EMAIL.test(next)) e.newEmail = '이메일 형식이 올바르지 않아요. 예: name@example.com';
  else if (next.length > 100) e.newEmail = '이메일은 100자 이내로 입력해주세요.';
  else if (next.toLowerCase() === (currentEmail || '').toLowerCase()) e.newEmail = '지금 쓰는 이메일과 같아요.';
  if (!e.newEmail && confirmEmail.trim() !== next) e.confirmEmail = '새 이메일이 서로 달라요.';
  if (!currentPassword) e.currentPassword = '현재 비밀번호를 입력해주세요.';
  return e;
}
export function passwordChangeErrors({ currentPassword, newPassword, confirmPassword }) {
  const e = {};
  if (!currentPassword) e.currentPassword = '현재 비밀번호를 입력해주세요.';
  if (newPassword.length < 8) e.newPassword = '새 비밀번호는 8자 이상이어야 해요.';
  else if (newPassword.length > 64) e.newPassword = '새 비밀번호는 64자 이내로 입력해주세요.';
  else if (newPassword === currentPassword) e.newPassword = '지금과 다른 비밀번호를 입력해주세요.';
  if (!e.newPassword && confirmPassword !== newPassword) e.confirmPassword = '새 비밀번호가 서로 달라요.';
  return e;
}
export function avatarFileError(file) {
  if (!file) return '';
  if (!AVATAR_TYPES.includes(file.type)) return 'PNG, JPG, WebP, GIF 이미지만 쓸 수 있어요.';
  if (file.size === 0 || file.size > AVATAR_MAX) return '5MB 이하 이미지만 올릴 수 있어요.';
  return '';
}
// Teams that block withdrawal: ones I lead that still have other members.
export const blockingTeams = details => details.filter(t => t.myRole === 'LEADER' && t.members.length > 1);
export const soloTeams = details => details.filter(t => t.members.length === 1);

// The backend answers unknown routes with 500 INTERNAL_ERROR, so treat that
// (and the usual "no such route" statuses) as "not built yet".
const notReady = err => [404, 405, 501].includes(err.status) || (err.status === 500 && err.code === 'INTERNAL_ERROR');
const NOT_READY = '아직 서버에 이 기능이 없어요. 백엔드 API가 준비되면 저장할 수 있어요.';

function Field({ id, label, error, hint, hideLabel, ...input }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>{label}</Label>
      <Input id={id} name={id} aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...input} />
      {error ? <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>
        : hint ? <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// Settings laid out like Supabase's: a few groups, each a card of rows. A row
// has the name and a short description on the left and the controls on the
// right (stacked when the card is narrow), and its own action under them.
function Group({ title, danger, children }) {
  return (
    <section className="grid gap-3" aria-label={title}>
      {title && <h2 className="text-base font-semibold">{title}</h2>}
      <Card className={`gap-0 divide-y overflow-hidden py-0 ${danger ? 'border-destructive/40' : ''}`}>{children}</Card>
    </section>
  );
}

function Section({ title, description, hint, action, danger, children, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate className="@container/row">
      <div className="grid gap-4 px-6 py-5 @xl/row:grid-cols-[15rem_minmax(0,1fr)] @xl/row:gap-8">
        <div className="grid content-start gap-1">
          <h3 className={`text-sm font-medium ${danger ? 'text-destructive' : ''}`}>{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="grid min-w-0 content-start gap-4">
          {children}
          {(hint || action) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{hint}</p>
              {action}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

// A setting that is rarely changed: one line with the current value and a
// "변경" button; the form opens only when asked.
function Collapsed({ value, label, onOpen }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-sm font-medium">{value}</span>
      <Button type="button" size="sm" variant="outline" aria-label={label} onClick={onOpen}>변경</Button>
    </div>
  );
}

function SaveButton({ busy, disabled, children, variant }) {
  return (
    <Button type="submit" size="sm" variant={variant} disabled={busy || disabled}>
      {busy && <Loader2 className="animate-spin" />}{children}
    </Button>
  );
}

// Run a save: map server errors onto fields, explain a missing backend, toast success.
function useSave(notify) {
  const [busy, setBusy] = useState('');
  async function save(key, task, { success, fieldFor = {}, setErrors } = {}) {
    setBusy(key);
    try {
      await task();
      if (success) notify(success);
      return true;
    } catch (err) {
      if (notReady(err)) notify(NOT_READY, true);
      else if (fieldFor[err.code] && setErrors) setErrors(e => ({ ...e, [fieldFor[err.code]]: err.message }));
      else notify(err.message || '저장하지 못했어요. 다시 시도해주세요.', true);
      return false;
    } finally {
      setBusy('');
    }
  }
  return [busy, save];
}

function AvatarSection({ user, onUserChange, notify }) {
  const [busy, save] = useSave(notify);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const input = useRef(null);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pick(e) {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    const problem = avatarFileError(chosen);
    setError(problem);
    if (!chosen || problem) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen)); // a GIF keeps animating in the preview
  }
  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    if (await save('upload', async () => onUserChange(await api('/users/me/avatar', { method: 'PUT', body: form })), { success: '프로필 사진을 바꿨어요.' })) {
      setFile(null); setPreview('');
    }
  }
  async function remove() {
    await save('remove', async () => { await api('/users/me/avatar', { method: 'DELETE' }); onUserChange({ ...user, avatarUrl: null }); }, { success: '프로필 사진을 지웠어요.' });
  }

  const shown = preview || user?.avatarUrl || '';
  return (
    <Section title="프로필 사진" description="팀원 목록과 기록에 보여요. GIF는 움직이는 그대로 보여요."
      hint="PNG, JPG, WebP, GIF · 5MB 이하" onSubmit={upload}
      action={file
        ? <div className="flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => { setFile(null); setPreview(''); }}>취소</Button><SaveButton busy={busy === 'upload'}>사진 저장</SaveButton></div>
        : null}>
      <div className="flex items-center gap-5">
        <Avatar className="size-20 text-2xl">
          {shown && <AvatarImage src={shown} alt="" className="object-cover" />}
          <AvatarFallback>{(user?.name || '?').slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <input ref={input} id="avatar-file" type="file" accept={AVATAR_TYPES.join(',')} className="sr-only" onChange={pick} />
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}><Upload />사진 올리기</Button>
          {user?.avatarUrl && !file && (
            <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" disabled={busy === 'remove'} onClick={remove}><Trash2 />삭제</Button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </Section>
  );
}

function NameSection({ user, onUserChange, notify }) {
  const [busy, save] = useSave(notify);
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  useEffect(() => setName(user?.name || ''), [user?.name]);
  async function submit(e) {
    e.preventDefault();
    const problem = nameError(name);
    setError(problem);
    if (problem) return;
    await save('name', async () => onUserChange(await api('/users/me', { method: 'PATCH', body: { name: name.trim() } })), { success: '이름을 바꿨어요.' });
  }
  return (
    <Section title="이름" description="모든 팀과 기록에 보이는 이름이에요."
      hint="30자 이내" onSubmit={submit}
      action={<SaveButton busy={busy === 'name'} disabled={name.trim() === (user?.name || '')}>저장</SaveButton>}>
      <Field id="profile-name" label="이름" hideLabel value={name} maxLength={30} autoComplete="name"
        onChange={e => { setName(e.target.value); setError(''); }} error={error} />
    </Section>
  );
}

function EmailSection({ user, onUserChange, notify }) {
  const [busy, save] = useSave(notify);
  const blank = { newEmail: '', confirmEmail: '', currentPassword: '' };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const set = key => e => { const v = e.target.value; setValues(s => ({ ...s, [key]: v })); setErrors(s => ({ ...s, [key]: undefined })); };
  const close = () => { setOpen(false); setValues(blank); setErrors({}); };
  async function submit(e) {
    e.preventDefault();
    const found = emailChangeErrors(values, user?.email);
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await save('email', async () => onUserChange(await api('/users/me/email', { method: 'PATCH', body: { newEmail: values.newEmail.trim(), currentPassword: values.currentPassword } })),
      { success: '이메일을 바꿨어요. 다음 로그인부터 새 이메일을 써요.', setErrors, fieldFor: { INVALID_CURRENT_PASSWORD: 'currentPassword', DUPLICATE_EMAIL: 'newEmail', SAME_EMAIL: 'newEmail' } });
    if (ok) close();
  }
  return (
    <Section title="이메일" description="로그인할 때 쓰는 이메일이에요."
      hint={open && '다음 로그인부터 새 이메일을 써요.'} onSubmit={submit}
      action={open && <div className="flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={close}>취소</Button><SaveButton busy={busy === 'email'}>이메일 변경</SaveButton></div>}>
      {!open ? <Collapsed value={user?.email} label="이메일 변경하기" onOpen={() => setOpen(true)} /> : <>
        <Field id="new-email" label="새 이메일" type="email" autoComplete="email" placeholder="name@example.com" autoFocus
          value={values.newEmail} onChange={set('newEmail')} error={errors.newEmail} />
        <Field id="confirm-email" label="새 이메일 확인" type="email" autoComplete="off" placeholder="한 번 더 입력하세요"
          value={values.confirmEmail} onChange={set('confirmEmail')} error={errors.confirmEmail} />
        <Field id="email-current-password" label="현재 비밀번호" type="password" autoComplete="current-password"
          value={values.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
      </>}
    </Section>
  );
}

function PasswordSection({ notify }) {
  const [busy, save] = useSave(notify);
  const blank = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const set = key => e => { const v = e.target.value; setValues(s => ({ ...s, [key]: v })); setErrors(s => ({ ...s, [key]: undefined })); };
  const close = () => { setOpen(false); setValues(blank); setErrors({}); };
  async function submit(e) {
    e.preventDefault();
    const found = passwordChangeErrors(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await save('password', () => api('/users/me/password', { method: 'PATCH', body: { currentPassword: values.currentPassword, newPassword: values.newPassword } }),
      { success: '비밀번호를 바꿨어요.', setErrors, fieldFor: { INVALID_CURRENT_PASSWORD: 'currentPassword', SAME_PASSWORD: 'newPassword' } });
    if (ok) close();
  }
  return (
    <Section title="비밀번호" hint={open && '8자 이상 64자 이하'} onSubmit={submit}
      action={open && <div className="flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={close}>취소</Button><SaveButton busy={busy === 'password'}>비밀번호 변경</SaveButton></div>}>
      {!open ? <Collapsed value={<span aria-label="비밀번호 숨김" className="tracking-widest">••••••••</span>} label="비밀번호 변경하기" onOpen={() => setOpen(true)} /> : <>
        <Field id="current-password" label="현재 비밀번호" type="password" autoComplete="current-password" autoFocus
          value={values.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
        <Field id="new-password" label="새 비밀번호" type="password" autoComplete="new-password"
          value={values.newPassword} onChange={set('newPassword')} error={errors.newPassword} />
        <Field id="confirm-password" label="새 비밀번호 확인" type="password" autoComplete="new-password"
          value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
      </>}
    </Section>
  );
}

function WithdrawSection({ teams, notify, onWithdrawn, onOpenTeam }) {
  const [busy, save] = useSave(notify);
  const [details, setDetails] = useState(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');

  // Member counts aren't in the team list, so load each team I lead.
  useEffect(() => {
    let live = true;
    Promise.all(teams.map(async t => t.myRole === 'LEADER'
      ? { ...t, members: (await api(`/teams/${t.teamId}`)).members }
      : { ...t, members: [null, null] }))
      .then(d => live && setDetails(d)).catch(() => live && setDetails([]));
    return () => { live = false; };
  }, [teams]);

  const blockers = details ? blockingTeams(details) : [];
  const solo = details ? soloTeams(details) : [];
  async function withdraw(e) {
    e.preventDefault();
    // The dialog is portalled out of the card's form in the DOM but not in React's tree,
    // so its submit would bubble to the card and reopen the dialog.
    e.stopPropagation();
    if (!password) { setError('현재 비밀번호를 입력해주세요.'); return; }
    const ok = await save('withdraw', () => api('/users/me', { method: 'DELETE', body: { currentPassword: password } }),
      { setErrors: updater => setError(updater({}).currentPassword || ''), fieldFor: { INVALID_CURRENT_PASSWORD: 'currentPassword' } });
    if (ok) { setOpen(false); onWithdrawn(); }
  }

  return (
    <Section danger title="회원 탈퇴" onSubmit={e => { e.preventDefault(); setOpen(true); }}
      description="계정과 개인정보를 지워요. 남긴 기록은 팀에 '탈퇴한 사용자'로 남아요."
      hint={blockers.length ? '팀장을 넘긴 뒤 탈퇴할 수 있어요.' : '탈퇴하면 되돌릴 수 없어요.'}
      action={<Button type="submit" size="sm" variant="destructive" disabled={!details || blockers.length > 0}>회원 탈퇴</Button>}>
      {!details ? <p className="text-sm text-muted-foreground">팀 정보를 확인하고 있어요…</p> : (
        <>
          {blockers.length > 0 && (
            <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium"><TriangleAlert className="size-4 text-destructive" />팀장을 먼저 넘겨주세요</p>
              <p className="text-muted-foreground">아래 팀은 다른 팀원이 있어요. 팀 관리에서 팀장을 넘긴 뒤 탈퇴할 수 있어요.</p>
              <ul className="grid gap-1">
                {blockers.map(t => (
                  <li key={t.teamId} className="flex items-center justify-between gap-2">
                    <span className="truncate">{t.name} <span className="text-muted-foreground">· 팀원 {t.members.length}명</span></span>
                    <Button type="button" size="sm" variant="outline" onClick={() => onOpenTeam(String(t.teamId))}>팀 관리로</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {solo.length > 0 && <p className="text-sm text-muted-foreground">혼자인 팀 {solo.length}개({solo.map(t => t.name).join(', ')})는 기록과 함께 삭제돼요.</p>}
        </>
      )}

      <AlertDialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setPassword(''); setPhrase(''); setError(''); } }}>
        <AlertDialogContent>
          <form onSubmit={withdraw} noValidate className="grid gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴할까요?</AlertDialogTitle>
              <AlertDialogDescription>계정과 개인정보가 지워지고 되돌릴 수 없어요. 남긴 기록은 팀에 &lsquo;탈퇴한 사용자&rsquo;로 남아요.</AlertDialogDescription>
            </AlertDialogHeader>
            <Field id="withdraw-password" label="현재 비밀번호" type="password" autoComplete="current-password"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }} error={error} />
            <Field id="withdraw-phrase" label={<>확인을 위해 <span className="font-semibold">{WITHDRAW_PHRASE}</span>를 입력하세요</>} autoComplete="off"
              value={phrase} onChange={e => setPhrase(e.target.value)} />
            <AlertDialogFooter>
              <AlertDialogCancel type="button">취소</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={phrase !== WITHDRAW_PHRASE || busy === 'withdraw'}>
                {busy === 'withdraw' && <Loader2 className="animate-spin" />}탈퇴하기
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

export function AccountSettings({ user, teams, onUserChange, notify, onWithdrawn, onOpenTeam }) {
  return (
    <div className="mx-auto grid w-full max-w-[45rem] gap-8">
      <h1 className="hidden text-2xl font-semibold tracking-tight sm:block">계정 설정</h1>
      <Group title="프로필">
        <AvatarSection user={user} onUserChange={onUserChange} notify={notify} />
        <NameSection user={user} onUserChange={onUserChange} notify={notify} />
      </Group>
      <Group title="로그인">
        <EmailSection user={user} onUserChange={onUserChange} notify={notify} />
        <PasswordSection notify={notify} />
      </Group>
      <Group danger>
        <WithdrawSection teams={teams} notify={notify} onWithdrawn={onWithdrawn} onOpenTeam={onOpenTeam} />
      </Group>
    </div>
  );
}
