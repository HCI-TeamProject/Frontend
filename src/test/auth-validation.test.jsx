import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Auth, authErrors } from '../screens/Auth.jsx';

describe('authErrors (로그인·회원가입 입력 검증)', () => {
  it('로그인은 빈 이메일과 비밀번호를 막는다', () => {
    expect(authErrors({ name: '', email: '', password: '' }, false)).toEqual({
      email: '이메일을 입력해주세요.',
      password: '비밀번호를 입력해주세요.',
    });
  });

  it('로그인은 서버가 허용하는 a@b 형식을 통과시킨다', () => {
    expect(authErrors({ name: '', email: 'a@b', password: 'x' }, false)).toEqual({});
  });

  it('회원가입은 이름, 도메인 점이 있는 이메일, 8자 이상 비밀번호를 요구한다', () => {
    const errors = authErrors({ name: ' ', email: 'abc@school', password: 'short' }, true);
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password']);
    expect(authErrors({ name: '모아', email: 'moa@konkuk.ac.kr', password: '12345678' }, true)).toEqual({});
  });
});

describe('Auth 입력 오류 표시', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('잘못된 값으로 제출하면 서버를 부르지 않고 칸마다 오류를 보여준다', () => {
    render(<Auth onLogin={vi.fn()} notify={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByText(/이메일 형식이 올바르지 않아요/)).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toHaveAttribute('aria-invalid', 'true');
    expect(fetch).not.toHaveBeenCalled();
  });
});
