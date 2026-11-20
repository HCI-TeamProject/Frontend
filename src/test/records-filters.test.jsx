import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Records } from '../screens/Records.jsx';

const base = { q: '', type: '', status: '', person: '', period: '', sort: 'DESC' };
const team = { members: [{ userId: 1, name: '희준' }] };
const record = (id, title, type, extra = {}) => ({
  contributionId: id, title, type, status: 'RECORDED', workDate: '2026-11-0' + id,
  participants: [{ userId: 1, name: '희준', share: 100 }], evidenceCount: 0, openCommentCount: 0, ...extra,
});
const records = [
  record(1, '회의 기록', 'MEETING'),
  record(2, '화면 개발', 'DEVELOPMENT', { status: 'NEEDS_REVIEW' }),
  record(3, '자료 조사', 'RESEARCH', { openCommentCount: 2 }),
];
const show = filters => render(<Records team={team} records={records} filters={{ ...base, ...filters }} setFilters={() => {}} openRecord={() => {}} />);

describe('기록 화면의 대시보드 연결 필터', () => {
  it('과정 전체(@PROCESS)는 과정 유형 기록만 보여준다', () => {
    show({ type: '@PROCESS' });
    expect(screen.getByText('회의 기록')).toBeInTheDocument();
    expect(screen.getByText('자료 조사')).toBeInTheDocument();
    expect(screen.queryByText('화면 개발')).not.toBeInTheDocument();
  });

  it('확인 필요(ATTENTION)는 검토 필요이거나 남은 의견이 있는 기록만 보여준다', () => {
    show({ status: 'ATTENTION' });
    expect(screen.getByText('화면 개발')).toBeInTheDocument();
    expect(screen.getByText('자료 조사')).toBeInTheDocument();
    expect(screen.queryByText('회의 기록')).not.toBeInTheDocument();
  });
});
