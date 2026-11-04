import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordEditor } from '../main.jsx';

const mockTeam = {
  teamId: 'team-1',
  name: '노클릭 팀',
  members: [
    { userId: 1, name: '희준', role: 'LEADER' },
    { userId: 2, name: '민지', role: 'MEMBER' },
    { userId: 3, name: '성우', role: 'MEMBER' }
  ]
};

const mockUser = {
  id: 1,
  name: '희준'
};

describe('RecordEditor (기여 기록 에디터) 컴포넌트 유효성 검사 및 인터랙션 테스트', () => {
  it('기본 렌더링 시 현재 사용자가 참여자로 기본 선택되어 있어야 한다', () => {
    render(
      <RecordEditor
        team={mockTeam}
        user={mockUser}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: '어떤 기여를 했나요?' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 사용자 인터뷰 질문지를 함께 정리했어요')).toBeInTheDocument();

    // 희준의 체크박스가 체크되어 있는지 확인
    const heejunCheckbox = screen.getByRole('checkbox', { name: /희준/i });
    expect(heejunCheckbox).toBeChecked();
  });

  it('참여자를 모두 해제하고 제출 시 유효성 에러를 표시해야 한다', () => {
    const handleSave = vi.fn();
    render(
      <RecordEditor
        team={mockTeam}
        user={mockUser}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // 제목 입력
    const titleInput = screen.getByPlaceholderText('예: 사용자 인터뷰 질문지를 함께 정리했어요');
    fireEvent.change(titleInput, { target: { value: '테스트 기록' } });

    // 기본 선택된 희준 체크 해제
    const heejunCheckbox = screen.getByRole('checkbox', { name: /희준/i });
    fireEvent.click(heejunCheckbox);
    expect(heejunCheckbox).not.toBeChecked();

    // 제출 클릭
    const submitBtn = screen.getByRole('button', { name: /기여 기록 남기기/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('참여자를 한 명 이상 선택해주세요.');
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('지분 직접 입력 모드에서 합계가 100%가 아니면 제출이 차단되어야 한다', () => {
    const handleSave = vi.fn();
    render(
      <RecordEditor
        team={mockTeam}
        user={mockUser}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // 제목 입력
    const titleInput = screen.getByPlaceholderText('예: 사용자 인터뷰 질문지를 함께 정리했어요');
    fireEvent.change(titleInput, { target: { value: 'HCI 와이어프레임 설계' } });

    // '지분 직접 입력' 체크
    const manualCheckbox = screen.getByRole('checkbox', { name: /지분 직접 입력/i });
    fireEvent.click(manualCheckbox);

    // 희준 지분 입력 (50%)
    const heejunShare = screen.getByRole('spinbutton', { name: '희준 지분' });
    fireEvent.change(heejunShare, { target: { value: '50' } });

    // 제출 시도 (합계 50%이므로 100% 미달)
    const submitBtn = screen.getByRole('button', { name: /기여 기록 남기기/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('선택한 참여자의 지분을 모두 입력하고 합계를 100%로 맞춰주세요.');
    expect(handleSave).not.toHaveBeenCalled();

    // 민지 추가 및 50% 부여 -> 합계 100%
    const minjiCheckbox = screen.getByRole('checkbox', { name: /민지/i });
    fireEvent.click(minjiCheckbox);

    const minjiShare = screen.getByRole('spinbutton', { name: '민지 지분' });
    fireEvent.change(minjiShare, { target: { value: '50' } });

    expect(screen.getByText(/지분 합계/)).toHaveTextContent('100 / 100%');

    // 정상 제출
    fireEvent.click(submitBtn);
    expect(handleSave).toHaveBeenCalledTimes(1);
    const [savedData] = handleSave.mock.calls[0];
    expect(savedData.title).toBe('HCI 와이어프레임 설계');
    expect(savedData.participants).toEqual([
      { userId: 1, role: '', share: 50 },
      { userId: 2, role: '', share: 50 }
    ]);
  });

  it('10MB를 초과하는 파일 첨부 시 제출이 차단되어야 한다', () => {
    const handleSave = vi.fn();
    const { container } = render(
      <RecordEditor
        team={mockTeam}
        user={mockUser}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const titleInput = screen.getByPlaceholderText('예: 사용자 인터뷰 질문지를 함께 정리했어요');
    fireEvent.change(titleInput, { target: { value: '대용량 첨부 테스트' } });

    // 11MB 파일 시뮬레이션
    const fileInput = container.querySelector('input[type="file"]');
    const largeFile = new File(['x'.repeat(1024)], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    const submitBtn = screen.getByRole('button', { name: /기여 기록 남기기/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('파일은 비어 있지 않은 10MB 이하 파일만 첨부할 수 있어요.');
    expect(handleSave).not.toHaveBeenCalled();
  });
});

