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

    const { container } = render(
      <RecordDetail
        detail={mockDetail}
        editable={true}
        removable={true}
        onClose={vi.fn()}
      />
    );

    // 상단 헤더 카드 확인
    const headerCard = container.querySelector('.detail-header-card');
    expect(headerCard).toBeInTheDocument();

    // 1) 작업 종류 확인
    const typeLabel = headerCard.querySelector('.type-label');
    expect(typeLabel).toHaveTextContent('디자인');

    // 2) 상세 작업 날짜 뱃지 확인
    const dateBadge = headerCard.querySelector('.detail-date-badge');
    expect(dateBadge).toHaveTextContent('2026년 11월 3일');

    // 3) 기록 제목 확인
    const titleEl = headerCard.querySelector('.detail-title');
    expect(titleEl).toHaveTextContent('HCI 와이어프레임 설계 및 사용성 검토');

    // 4) 상태 뱃지 확인
    expect(headerCard).toHaveTextContent('기록됨');
  });
});

