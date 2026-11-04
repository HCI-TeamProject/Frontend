import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Auth } from '../main.jsx';

describe('Auth (인증 및 로그인/회원가입) 컴포넌트 테스트', () => {
  let notifyMock;
  let loginMock;

  beforeEach(() => {
    notifyMock = vi.fn();
    loginMock = vi.fn();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('기본적으로 로그인 모드로 렌더링되며 로그인에 필요한 필드를 제공해야 한다', () => {
    render(<Auth onLogin={loginMock} notify={notifyMock} />);

    expect(screen.getByRole('heading', { name: '다시 만나서 반가워요' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('팀원에게 보여줄 이름')).not.toBeInTheDocument();
  });

  it('회원가입 토글 버튼 클릭 시 이름 필드가 나타나고 제출 버튼 텍스트가 변경되어야 한다', () => {
    render(<Auth onLogin={loginMock} notify={notifyMock} />);

    const switchBtn = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(switchBtn);

    expect(screen.getByRole('heading', { name: '우리의 기록을 시작해요' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('팀원에게 보여줄 이름')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('8자 이상 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /가입하고 시작하기/i })).toBeInTheDocument();

    // 다시 로그인으로 전환
    const loginSwitchBtn = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(loginSwitchBtn);
    expect(screen.queryByPlaceholderText('팀원에게 보여줄 이름')).not.toBeInTheDocument();
  });

  it('체험 팀으로 시작하기 버튼 클릭 시 데모 계정으로 로그인을 시도하고 onLogin을 호출해야 한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'demo-jwt-token' })
    });

    render(<Auth onLogin={loginMock} notify={notifyMock} />);

    const demoBtn = screen.getByRole('button', { name: /체험 팀으로 시작하기/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'noclick.heejun@moa.local',
          password: 'DemoTeam!2026'
        })
      }));
      expect(localStorage.getItem('moa.token')).toBe('demo-jwt-token');
      expect(loginMock).toHaveBeenCalledTimes(1);
    });
  });

  it('로그인 실패 시 notify로 에러 메시지를 표시해야 한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    });

    render(<Auth onLogin={loginMock} notify={notifyMock} />);

    const demoBtn = screen.getByRole('button', { name: /체험 팀으로 시작하기/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('체험 계정을 불러오지 못했어요. 새 계정으로 가입하거나 실행 상태를 확인해주세요.', true);
      expect(loginMock).not.toHaveBeenCalled();
    });
  });
});

