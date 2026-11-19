// Login and signup: one centered card (Astryx login-card layout) over a
// backdrop of outlined MOA type streaming across the screen.
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Icon } from '@astryxdesign/core/Icon';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Link } from '@astryxdesign/core/Link';
import { Divider } from '@astryxdesign/core/Divider';
import { api, setToken } from '../lib/api.js';
import { Brand } from '../components/common.jsx';
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

export function Auth({ onLogin, notify }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const set = field => value => {
    setValues(v => ({ ...v, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };
  const status = field => errors[field] ? { type: 'error', message: errors[field] } : undefined;

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
    <VStack hAlign="center" vAlign="center" minHeight="100vh" padding={4} style={{ position: 'relative', overflow: 'hidden' }}>
      <TypeBackdrop />
      <VStack width="100%" maxWidth={420} style={{ position: 'relative', zIndex: 1 }}>
        <Card elevation="high" padding={8}>
          <VStack gap={6}>
            <Brand />
            <VStack gap={2}>
              <Heading level={2} type="display-3">{signup ? '우리의 기록을 시작해요' : '다시 만나서 반가워요'}</Heading>
              <Text color="secondary">{signup ? '이메일로 가입하고 첫 팀을 만들어보세요.' : '로그인하고 팀의 이야기를 이어가세요.'}</Text>
            </VStack>

            <form onSubmit={submit} noValidate>
              <VStack gap={4}>
                {signup && (
                  <TextInput label="이름" htmlName="name" size="lg" autoComplete="name" placeholder="팀원에게 보여줄 이름"
                    value={values.name} onChange={set('name')} status={status('name')} />
                )}
                <TextInput label="이메일" htmlName="email" type="email" size="lg" autoComplete="email" placeholder="name@example.com"
                  value={values.email} onChange={set('email')} status={status('email')} />
                <TextInput label="비밀번호" htmlName="password" type="password" size="lg"
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  placeholder={signup ? '8자 이상 입력하세요' : '비밀번호를 입력하세요'}
                  value={values.password} onChange={set('password')} status={status('password')} />
                <Button type="submit" variant="primary" size="lg" width="100%" isLoading={busy}
                  label={signup ? '가입하고 시작하기' : '로그인'} />
              </VStack>
            </form>

            <Text type="supporting" display="block" justify="center">
              {signup ? '이미 계정이 있나요? ' : '아직 모아가 처음인가요? '}
              <Link type="supporting" onClick={toggleMode}>{signup ? '로그인' : '회원가입'}</Link>
            </Text>

            {import.meta.env.VITE_ENABLE_DEMO !== 'false' && (
              <VStack gap={4}>
                <Divider label="먼저 둘러보고 싶다면" />
                <Button variant="secondary" size="lg" width="100%" isDisabled={busy} onClick={demo}
                  label="체험 팀으로 시작하기" endContent={<Icon icon={ArrowRight} />} />
                <Text type="supporting" display="block" justify="center" as="p">
                  가상의 팀과 기록으로 실제 기능을 체험해보세요. 직접 남긴 기록과 변경 사항도 저장됩니다.
                </Text>
              </VStack>
            )}
          </VStack>
        </Card>
      </VStack>
    </VStack>
  );
}
