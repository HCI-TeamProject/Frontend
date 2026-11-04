import { describe, it, expect } from 'vitest';
import { TYPES, STATES, SIZES, colors, today, dateLabel, timeLabel } from '../main.jsx';

describe('유틸리티 및 도메인 상수 검증', () => {
  it('기여 유형(TYPES) 7종이 올바르게 정의되어 있어야 한다', () => {
    const keys = Object.keys(TYPES);
    expect(keys).toEqual([
      'DEVELOPMENT',
      'DESIGN',
      'DOCUMENT',
      'RESEARCH',
      'IDEA',
      'MEETING',
      'FEEDBACK'
    ]);

    // 카테고리(OUTPUT, PROCESS) 분류 확인
    expect(TYPES.DEVELOPMENT[2]).toBe('OUTPUT');
    expect(TYPES.DESIGN[2]).toBe('OUTPUT');
    expect(TYPES.DOCUMENT[2]).toBe('OUTPUT');
    expect(TYPES.RESEARCH[2]).toBe('PROCESS');
    expect(TYPES.IDEA[2]).toBe('PROCESS');
    expect(TYPES.MEETING[2]).toBe('PROCESS');
    expect(TYPES.FEEDBACK[2]).toBe('PROCESS');

    // 한글 라벨 확인
    expect(TYPES.DEVELOPMENT[0]).toBe('개발');
    expect(TYPES.RESEARCH[0]).toBe('자료조사');
    expect(TYPES.FEEDBACK[0]).toBe('피드백');
  });

  it('기록 상태(STATES)와 작업 규모(SIZES)가 올바르게 매핑되어 있어야 한다', () => {
    expect(STATES).toEqual({
      RECORDED: '기록됨',
      NEEDS_REVIEW: '검토 필요',
      RESOLVED: '보완 완료'
    });

    expect(SIZES).toEqual({
      S: '작음 · 1',
      M: '보통 · 3',
      L: '큼 · 5'
    });
  });

  it('아바타 색상 팔레트(colors)가 6종 정의되어 있어야 한다', () => {
    expect(colors).toHaveLength(6);
    colors.forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('today() 함수는 YYYY-MM-DD 형식의 문자열을 반환해야 한다', () => {
    const dateStr = today();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dateLabel() 함수는 날짜 문자열을 한국어 월/일 포맷으로 변환해야 한다', () => {
    const formatted = dateLabel('2026-11-03');
    expect(formatted).toContain('11월');
    expect(formatted).toContain('3일');
  });

  it('timeLabel() 함수는 날짜가 없을 경우 빈 문자열을, 있을 경우 한국어 시각을 반환해야 한다', () => {
    expect(timeLabel(null)).toBe('');
    expect(timeLabel(undefined)).toBe('');

    const formatted = timeLabel('2026-11-03T19:45:00');
    expect(formatted).toContain('11월');
    expect(formatted).toContain('3일');
  });
});

