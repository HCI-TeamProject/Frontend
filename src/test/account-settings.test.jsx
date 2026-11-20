// Account settings: client-side checks and the "server not ready" path.
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AccountSettings, nameError, emailChangeErrors, passwordChangeErrors, avatarFileError, blockingTeams, soloTeams,
} from '../screens/AccountSettings.jsx';

const user = { id: 1, name: '채희준', email: 'heejun@moa.local', avatarUrl: null };

describe('계정 설정 입력 검증', () => {
  it('이름은 비우거나 30자를 넘길 수 없다', () => {
    expect(nameError('  ')).toBe('이름을 입력해주세요.');
    expect(nameError('가'.repeat(31))).toBe('이름은 30자 이내로 입력해주세요.');
    expect(nameError('희준')).toBe('');
  });

  it('새 이메일은 형식·확인·현재 비밀번호를 모두 확인한다', () => {
    expect(emailChangeErrors({ newEmail: 'bad', confirmEmail: 'bad', currentPassword: '' }, user.email))
      .toEqual({ newEmail: '이메일 형식이 올바르지 않아요. 예: name@example.com', currentPassword: '현재 비밀번호를 입력해주세요.' });
    expect(emailChangeErrors({ newEmail: 'HeeJun@moa.local', confirmEmail: 'HeeJun@moa.local', currentPassword: 'x' }, user.email).newEmail)
      .toBe('지금 쓰는 이메일과 같아요.');
    expect(emailChangeErrors({ newEmail: 'new@moa.local', confirmEmail: 'nwe@moa.local', currentPassword: 'x' }, user.email))
      .toEqual({ confirmEmail: '새 이메일이 서로 달라요.' });
    expect(emailChangeErrors({ newEmail: 'new@moa.local', confirmEmail: 'new@moa.local', currentPassword: 'x' }, user.email)).toEqual({});
  });

  it('새 비밀번호는 8~64자이고 현재와 달라야 하며 확인이 일치해야 한다', () => {
    expect(passwordChangeErrors({ currentPassword: '', newPassword: 'short', confirmPassword: 'short' }))
      .toEqual({ currentPassword: '현재 비밀번호를 입력해주세요.', newPassword: '새 비밀번호는 8자 이상이어야 해요.' });
    expect(passwordChangeErrors({ currentPassword: 'samepass1', newPassword: 'samepass1', confirmPassword: 'samepass1' }).newPassword)
      .toBe('지금과 다른 비밀번호를 입력해주세요.');
    expect(passwordChangeErrors({ currentPassword: 'oldpass11', newPassword: 'newpass22', confirmPassword: 'newpass23' }))
      .toEqual({ confirmPassword: '새 비밀번호가 서로 달라요.' });
  });

  it('프로필 사진은 PNG·JPG·WebP·GIF 5MB 이하만 받는다', () => {
    expect(avatarFileError({ type: 'image/gif', size: 4 * 1024 * 1024 })).toBe('');
    expect(avatarFileError({ type: 'image/svg+xml', size: 100 })).toBe('PNG, JPG, WebP, GIF 이미지만 쓸 수 있어요.');
    expect(avatarFileError({ type: 'image/png', size: 6 * 1024 * 1024 })).toBe('5MB 이하 이미지만 올릴 수 있어요.');
  });

  it('다른 팀원이 있는 팀의 팀장이면 탈퇴를 막고, 혼자인 팀은 따로 알려준다', () => {
    const details = [
      { teamId: 1, name: '노클릭', myRole: 'LEADER', members: [{}, {}, {}] },
      { teamId: 2, name: '개인 메모', myRole: 'LEADER', members: [{}] },
      { teamId: 3, name: '스터디', myRole: 'MEMBER', members: [{}, {}] },
    ];
    expect(blockingTeams(details).map(t => t.name)).toEqual(['노클릭']);
    expect(soloTeams(details).map(t => t.name)).toEqual(['개인 메모']);
  });
});

describe('계정 설정 화면', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('서버에 기능이 없으면(500 INTERNAL_ERROR) 준비 중이라고 알린다', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', errors: [] }) });
    const notify = vi.fn();
    render(<AccountSettings user={user} teams={[]} notify={notify} onUserChange={vi.fn()} onWithdrawn={vi.fn()} onOpenTeam={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '희준' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith('아직 서버에 이 기능이 없어요. 백엔드 API가 준비되면 저장할 수 있어요.', true));
    expect(fetch).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({ method: 'PATCH' }));
  });

  it('현재 비밀번호가 틀리면 그 칸에 서버 메시지를 보여준다', async () => {
    fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ code: 'INVALID_CURRENT_PASSWORD', message: '현재 비밀번호가 올바르지 않습니다.', errors: [] }) });
    render(<AccountSettings user={user} teams={[]} notify={vi.fn()} onUserChange={vi.fn()} onWithdrawn={vi.fn()} onOpenTeam={vi.fn()} />);

    // The password form is folded until "변경" is pressed.
    expect(document.getElementById('current-password')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }));
    fireEvent.change(screen.getByLabelText('현재 비밀번호', { selector: '#current-password' }), { target: { value: 'oldpass11' } });
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpass22' } });
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'newpass22' } });
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    expect(await screen.findByText('현재 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    expect(document.getElementById('current-password')).toHaveAttribute('aria-invalid', 'true');
  });
});
