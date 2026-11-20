import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordDetail, fullDateLabel, App } from '../main.jsx';

describe('목록 및 상세화면 개선사항 검증 테스트', () => {
  it('fullDateLabel 유틸리티는 연/월/일/요일을 올바르게 포맷팅해야 한다', () => {
    const formatted = fullDateLabel('2026-11-01');
    expect(formatted).toContain('2026년');
    expect(formatted).toContain('11월');
    expect(formatted).toContain('1일');
  });

  it('RecordDetail 상단 헤더에 작업 종류, 상세 작업 날짜, 제목이 명확히 표시되어야 한다', () => {
    const mockDetail = {
      contributionId: 'rec-1',
      title: 'HCI 와이어프레임 설계 및 사용성 검토',
      type: 'DESIGN',
      status: 'RECORDED',
      workDate: '2026-11-03',
      size: 'L',
      description: '피그마를 활용한 화면 흐름도 및 컴포넌트 구조화',
      createdBy: { userId: 1, name: '희준' },
      participants: [{ userId: 1, name: '희준', role: 'UI 디자인', share: 100 }],
      evidences: [],
      comments: []
    };

    render(
      <RecordDetail
        detail={mockDetail}
        editable={true}
        removable={true}
        onClose={vi.fn()}
      />
    );

    // 제목은 페이지의 h1
    expect(screen.getByRole('heading', { level: 1, name: 'HCI 와이어프레임 설계 및 사용성 검토' })).toBeInTheDocument();
    // 작업 종류, 상세 작업 날짜, 상태가 제목 위에 보인다
    const header = screen.getByRole('heading', { level: 1 }).closest('header');
    expect(header).toHaveTextContent('디자인');
    expect(header).toHaveTextContent('2026년 11월 3일');
    expect(header).toHaveTextContent('기록됨');
  });
});

