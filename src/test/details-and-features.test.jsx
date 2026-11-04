import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RecordDetail, Timeline, Members, RecordRow } from '../main.jsx';

describe('기록 상세(RecordDetail) 및 활동 흐름(Timeline), 팀 관리(Members) 테스트', () => {
  const mockDetail = {
    contributionId: 'rec-1',
    title: 'HCI 사용자 조사 분석',
    type: 'RESEARCH',
    status: 'NEEDS_REVIEW',
    workDate: '2026-11-01',
    size: 'M',
    description: '심층 인터뷰 결과를 분류하고 어피니티 다이어그램 작성',
    createdBy: { userId: 1, name: '희준' },
    participants: [
      { userId: 1, name: '희준', role: '인터뷰 진행', share: 60 },
      { userId: 2, name: '민지', role: '녹취록 정리', share: 40 }
    ],
    evidences: [
      { evidenceId: 101, type: 'LINK', name: '피그마 다이어그램', url: 'https://figma.com/file/123' },
      { evidenceId: 102, type: 'FILE', name: '인터뷰_결과.pdf', url: '/api/teams/t1/files/f1' }
    ],
    comments: [
      {
        commentId: 201,
        author: { name: '성우' },
        commentType: 'MISSING',
        content: '인터뷰 대상자 선정 작업도 포함되어야 할 것 같아요.',
        createdAt: '2026-11-01T14:00:00',
        resolved: false
      },
      {
        commentId: 202,
        author: { name: '민지' },
        commentType: 'CORRECTION',
        content: '진행 시간 오타 수정 필요',
        createdAt: '2026-11-01T15:00:00',
        resolved: true,
        resolvedBy: { name: '희준' },
        resolutionNote: '문서 내용 수정 완료',
        resolvedAt: '2026-11-01T16:00:00'
      }
    ]
  };

  it('RecordDetail은 기록 기본 정보, 참여자, 근거자료 및 보완의견을 렌더링해야 한다', () => {
    render(
      <RecordDetail
        detail={mockDetail}
        editable={true}
        removable={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('HCI 사용자 조사 분석')).toBeInTheDocument();
    expect(screen.getByText('검토 필요')).toBeInTheDocument();
    expect(screen.getByText(/피그마 다이어그램/)).toBeInTheDocument();
    expect(screen.getByText(/인터뷰_결과.pdf/)).toBeInTheDocument();
    expect(screen.getByText('인터뷰 대상자 선정 작업도 포함되어야 할 것 같아요.')).toBeInTheDocument();
    expect(screen.getByText('해결됨')).toBeInTheDocument();
    expect(screen.getByText(/희준 · 문서 내용 수정 완료/)).toBeInTheDocument();
  });

  it('RecordDetail에서 새 보완 의견 작성 시 onComment를 올바른 인수와 함께 호출해야 한다', async () => {
    const handleComment = vi.fn().mockResolvedValue(true);
    render(
      <RecordDetail
        detail={mockDetail}
        editable={true}
        removable={true}
        onClose={vi.fn()}
        onComment={handleComment}
      />
    );

    const textarea = screen.getByPlaceholderText('예: 인터뷰 질문 정리에 저도 함께 참여했어요.');
    fireEvent.change(textarea, { target: { value: '설문지 문항도 검토 부탁드립니다.' } });

    const submitBtn = screen.getByRole('button', { name: '의견 남기기' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(handleComment).toHaveBeenCalledWith({
      commentType: 'MISSING',
      content: '설문지 문항도 검토 부탁드립니다.'
    });
  });

  it('RecordDetail에서 미해결 보완의견 해결 처리 시 onResolve를 호출해야 한다', async () => {
    const handleResolve = vi.fn().mockResolvedValue(true);
    render(
      <RecordDetail
        detail={mockDetail}
        editable={true}
        removable={true}
        onClose={vi.fn()}
        onResolve={handleResolve}
      />
    );

    // 해결 처리하기 버튼 클릭
    const resolveTriggerBtn = screen.getByRole('button', { name: /해결 처리하기/i });
    fireEvent.click(resolveTriggerBtn);

    // 해결 내용 폼 노출
    const noteInput = screen.getByPlaceholderText('어떻게 보완했는지 알려주세요');
    fireEvent.change(noteInput, { target: { value: '인터뷰 대상자 선정 과정 본문에 추가함' } });

    const resolveSubmitBtn = screen.getByRole('button', { name: '해결 처리' });
    await act(async () => {
      fireEvent.click(resolveSubmitBtn);
    });

    expect(handleResolve).toHaveBeenCalledWith(201, '인터뷰 대상자 선정 과정 본문에 추가함');
  });

  it('Timeline 컴포넌트는 단위(일/주/월) 변경 및 기여율 토글을 처리해야 한다', () => {
    const handleSetUnit = vi.fn();
    const handleSetExclude = vi.fn();

    const mockTimeline = {
      buckets: [
        { periodStart: '2026-10-25', contributionCount: 3, byType: [{ type: 'RESEARCH', count: 3 }] },
        { periodStart: '2026-11-01', contributionCount: 5, byType: [{ type: 'DEVELOPMENT', count: 5 }] }
      ]
    };

    const mockStats = {
      formula: '기여율 = 개인 가중치 합 / 팀 전체 가중치 합 * 100',
      members: [
        { userId: 1, name: '희준', contributionCount: 4, percent: 55.0, currentMember: true, items: [] },
        { userId: 2, name: '민지', contributionCount: 3, percent: 45.0, currentMember: true, items: [] }
      ]
    };

    render(
      <Timeline
        timeline={mockTimeline}
        stats={mockStats}
        unit="WEEK"
        setUnit={handleSetUnit}
        exclude={false}
        setExclude={handleSetExclude}
        openRecord={vi.fn()}
      />
    );

    expect(screen.getByText('팀의 활동 타임라인')).toBeInTheDocument();
    expect(screen.getByText('55.0%')).toBeInTheDocument();
    expect(screen.getByText('45.0%')).toBeInTheDocument();

    // '월' 단위 클릭
    const monthBtn = screen.getByRole('button', { name: '월' });
    fireEvent.click(monthBtn);
    expect(handleSetUnit).toHaveBeenCalledWith('MONTH');

    // '검토 필요 기록 제외' 체크
    const excludeCheck = screen.getByRole('checkbox', { name: /검토 필요 기록 제외/i });
    fireEvent.click(excludeCheck);
    expect(handleSetExclude).toHaveBeenCalledWith(true);
  });

  it('Members 컴포넌트는 초대 코드 복사 및 팀원 목록을 렌더링해야 한다', async () => {
    const mockTeam = {
      teamId: 't1',
      name: 'HCI 연구팀',
      description: '인간과 상호작용하는 UI 연구',
      inviteCode: 'HCI2026X',
      members: [
        { userId: 1, name: '희준', email: 'heejun@moa.local', role: 'LEADER' },
        { userId: 2, name: '민지', email: 'minji@moa.local', role: 'MEMBER' }
      ]
    };

    const notifyMock = vi.fn();
    const clipboardMock = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: { writeText: clipboardMock }
    });

    render(
      <Members
        team={mockTeam}
        user={{ id: 1, name: '희준' }}
        leader={true}
        busy={false}
        run={vi.fn()}
        notify={notifyMock}
        refresh={vi.fn()}
        loadTeams={vi.fn()}
        openTeamEdit={vi.fn()}
      />
    );

    expect(screen.getByText('HCI2026X')).toBeInTheDocument();
    // '희준 나' 노드 확인
    const memberName = screen.getByText((content, element) => {
      return element?.tagName === 'STRONG' && element.textContent?.includes('희준') && element.textContent?.includes('나');
    });
    expect(memberName).toBeInTheDocument();
    expect(screen.getByText('minji@moa.local')).toBeInTheDocument();

    // 초대 코드 복사 버튼 클릭
    const copyBtn = screen.getByRole('button', { name: /복사/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(clipboardMock).toHaveBeenCalledWith('HCI2026X');
      expect(notifyMock).toHaveBeenCalledWith('초대 코드를 복사했어요.');
    });
  });

  it('RecordRow 컴포넌트는 카드 형태로 제목, 참여자, 날짜, 근거/의견 수를 정확히 표시해야 한다', () => {
    const handleClick = vi.fn();
    const mockRow = {
      contributionId: 'rec-99',
      title: 'UI 레이아웃 그리드 테스트',
      type: 'DESIGN',
      status: 'RECORDED',
      workDate: '2026-11-02',
      evidenceCount: 2,
      openCommentCount: 1,
      participants: [{ userId: 1, name: '희준', role: '디자이너' }]
    };

    render(<RecordRow record={mockRow} onClick={handleClick} expanded />);

    expect(screen.getByText('UI 레이아웃 그리드 테스트')).toBeInTheDocument();
    expect(screen.getByText('디자인')).toBeInTheDocument();
    expect(screen.getByText('희준 · 디자이너')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // evidenceCount
    expect(screen.getByText('1')).toBeInTheDocument(); // openCommentCount

    const rowButton = screen.getByRole('button');
    fireEvent.click(rowButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
