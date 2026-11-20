// Login and signup: one centered shadcn card over a backdrop of outlined type
// streaming across the screen.
import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { api, setToken } from '../lib/api.js';
import { BrandMark } from '../components/common.jsx';
import { TypeBackdrop } from '../components/TypeBackdrop.jsx';

const DEMO = { email: 'noclick.heejun@moa.local', password: 'DemoTeam!2026' };
// The server accepts addresses like a@b at login, so only signup asks for a domain dot.
const LOGIN_EMAIL = /^[^\s@]+@[^\s@]+$/;
const SIGNUP_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns {field: message} for every field that would be rejected.
export function authErrors({ name, email, password }, signup) {
  const errors = {};
  if (signup && !name.trim()) errors.name = '이름을 입력해주세요.';
  else if (signup && name.trim().length > 30) errors.name = '이름은 30자 이내로 입력해주세요.';
  if (!email.trim()) errors.email = '이메일을 입력해주세요.';
  else if (!(signup ? SIGNUP_EMAIL : LOGIN_EMAIL).test(email.trim())) errors.email = '이메일 형식이 올바르지 않아요. 예: name@example.com';
  else if (email.trim().length > 100) errors.email = '이메일은 100자 이내로 입력해주세요.';
  if (!password) errors.password = '비밀번호를 입력해주세요.';
  else if (signup && password.length < 8) errors.password = '비밀번호는 8자 이상이어야 해요.';
  else if (password.length > 64) errors.password = '비밀번호는 64자 이내로 입력해주세요.';
  return errors;
}

// Label, input and its inline error, wired together for screen readers.
function Field({ id, label, error, ...input }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-10" aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined} {...input} />
      {error && <p id={`${id}-error`} className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export function Auth({ onLogin, notify }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const set = field => e => {
    const value = e.target.value;
    setValues(v => ({ ...v, [field]: value }));
    setErrors(er => ({ ...er, [field]: undefined }));
  };

  async function login(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(result.accessToken);
    onLogin();
  }

  async function submit(e) {
    e.preventDefault();
    const found = authErrors(values, signup);
    setErrors(found);
    if (Object.keys(found).length) return;
    const email = values.email.trim();
    setBusy(true);
    try {
      if (signup) await api('/auth/signup', { method: 'POST', body: { name: values.name.trim(), email, password: values.password } });
      await login(email, values.password);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    try {
      await login(DEMO.email, DEMO.password);
    } catch {
      notify('체험 계정을 불러오지 못했어요. 새 계정으로 가입하거나 실행 상태를 확인해주세요.', true);
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setSignup(s => !s);
    setErrors({});
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4">
      <TypeBackdrop />
      <Card className="relative z-10 w-full max-w-sm gap-6 shadow-xl">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2 text-primary">
            <BrandMark />
            <span className="text-base font-semibold text-foreground">모아</span>
          </div>
          {/* CardTitle is a div, so the page heading goes inside it. */}
          <CardTitle><h1 className="text-2xl tracking-tight">{signup ? '우리의 기록을 시작해요' : '다시 만나서 반가워요'}</h1></CardTitle>
          <CardDescription>{signup ? '이메일로 가입하고 첫 팀을 만들어보세요.' : '로그인하고 팀의 이야기를 이어가세요.'}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} noValidate className="grid gap-4">
            {signup && <Field id="name" label="이름" autoComplete="name" placeholder="팀원에게 보여줄 이름"
              value={values.name} onChange={set('name')} error={errors.name} />}
            <Field id="email" label="이메일" type="email" autoComplete="email" placeholder="name@example.com"
              value={values.email} onChange={set('email')} error={errors.email} />
            <Field id="password" label="비밀번호" type="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              placeholder={signup ? '8자 이상 입력하세요' : '비밀번호를 입력하세요'}
              value={values.password} onChange={set('password')} error={errors.password} />
            <Button type="submit" size="lg" className="w-full" disabled={busy} aria-busy={busy || undefined}>
              {busy && <Loader2 className="animate-spin" />}
              {signup ? '가입하고 시작하기' : '로그인'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            {signup ? '이미 계정이 있나요? ' : '아직 모아가 처음인가요? '}
            <button type="button" onClick={toggleMode} className="text-foreground font-medium underline underline-offset-4">
              {signup ? '로그인' : '회원가입'}
            </button>
          </p>

          {import.meta.env.VITE_ENABLE_DEMO !== 'false' && (
            <>
              <div className="flex w-full items-center gap-3 text-muted-foreground text-xs">
                <Separator className="flex-1" />먼저 둘러보고 싶다면<Separator className="flex-1" />
              </div>
              <Button variant="outline" size="lg" className="w-full" disabled={busy} onClick={demo}>
                체험 팀으로 시작하기 <ArrowRight />
              </Button>
              <p className="text-muted-foreground text-center text-xs leading-relaxed">
                가상의 팀과 기록으로 실제 기능을 체험해보세요. 직접 남긴 기록과 변경 사항도 저장됩니다.
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
