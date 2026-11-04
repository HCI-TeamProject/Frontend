import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ConfirmDialog, Toast, Status, Avatar, Brand } from '../main.jsx';

describe('HCI 및 접근성 - 모달 & 대화상자 인터랙션 테스트', () => {
  it('Modal은 role="dialog"와 aria-modal="true"를 갖추어야 하며 body 스크롤을 방지해야 한다', () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <Modal title="테스트 모달" subtitle="모달 부제목" onClose={handleClose}>
        <button>내부 버튼 1</button>
        <button>내부 버튼 2</button>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: '테스트 모달' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('Modal은 닫기 버튼 클릭 및 Escape 키 입력 시 onClose를 호출해야 한다', async () => {
    const handleClose = vi.fn();
    render(
      <Modal title="테스트 모달" onClose={handleClose}>
        <p>내용</p>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: '닫기' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('Modal 배경(backdrop) 클릭 시 닫히되, 모달 내부 클릭 시에는 닫히지 않아야 한다', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal title="테스트 모달" onClose={handleClose}>
        <p data-testid="modal-content">모달 본문</p>
      </Modal>
    );

    const backdrop = container.querySelector('.modal-backdrop');
    const content = screen.getByTestId('modal-content');

    // 모달 내부 클릭 -> onClose 호출 안 됨
    fireEvent.mouseDown(content);
    expect(handleClose).not.toHaveBeenCalled();

    // 배경 클릭 -> onClose 호출 됨
    fireEvent.mouseDown(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Modal 내부에서 Tab 및 Shift+Tab 키 입력 시 포커스가 모달 내부에서만 순환해야 한다', () => {
    const handleClose = vi.fn();
    render(
      <Modal title="포커스 트랩 테스트" onClose={handleClose}>
        <button data-testid="btn-first">첫번째 버튼</button>
        <button data-testid="btn-second">두번째 버튼</button>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: '닫기' });
    const firstBtn = screen.getByTestId('btn-first');
    const secondBtn = screen.getByTestId('btn-second');

    // 마지막 포커서블 요소(secondBtn)에서 Tab 누르면 첫번째 요소(closeBtn)로 이동
    secondBtn.focus();
    expect(document.activeElement).toBe(secondBtn);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // 첫번째 포커서블 요소(closeBtn)에서 Shift+Tab 누르면 마지막 요소(secondBtn)로 이동
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(secondBtn);
  });

  it('ConfirmDialog는 alertdialog 역할을 가지며 기본 포커스가 취소 버튼에 가야 한다', () => {
    const handleAnswer = vi.fn();
    render(<ConfirmDialog message="정말 삭제하시겠습니까?" onAnswer={handleAnswer} />);

    const dialog = screen.getByRole('alertdialog', { name: '작업 확인' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: '취소' });
    const confirmBtn = screen.getByRole('button', { name: '확인' });

    // 초기 포커스는 안전을 위해 취소 버튼
    expect(document.activeElement).toBe(cancelBtn);

    // 확인 클릭 시 onAnswer(true)
    fireEvent.click(confirmBtn);
    expect(handleAnswer).toHaveBeenCalledWith(true);

    // 취소 클릭 시 onAnswer(false)
    fireEvent.click(cancelBtn);
    expect(handleAnswer).toHaveBeenCalledWith(false);

    // Escape 입력 시 onAnswer(false)
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(handleAnswer).toHaveBeenCalledWith(false);
  });

  it('ConfirmDialog 내부에서 Tab 키 입력 시 취소와 확인 버튼 사이에서 포커스가 순환해야 한다', () => {
    const handleAnswer = vi.fn();
    render(<ConfirmDialog message="확인 질문" onAnswer={handleAnswer} />);

    const dialog = screen.getByRole('alertdialog');
    const cancelBtn = screen.getByRole('button', { name: '취소' });
    const confirmBtn = screen.getByRole('button', { name: '확인' });

    cancelBtn.focus();
    expect(document.activeElement).toBe(cancelBtn);

    // cancelBtn에서 Tab 누르면 confirmBtn으로 포커스
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(confirmBtn);

    // confirmBtn에서 Tab 누르면 cancelBtn으로 다시 순환
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(cancelBtn);
  });

  it('Toast 컴포넌트는 에러 상태에 따라 적절한 role(alert/status)을 가져야 한다', () => {
    const handleClose = vi.fn();
    const { rerender } = render(<Toast toast={{ message: '성공 알림', error: false }} onClose={handleClose} />);

    let toastEl = screen.getByRole('status');
    expect(toastEl).toHaveTextContent('성공 알림');

    rerender(<Toast toast={{ message: '에러 발생', error: true }} onClose={handleClose} />);
    toastEl = screen.getByRole('alert');
    expect(toastEl).toHaveTextContent('에러 발생');

    const closeBtn = screen.getByRole('button', { name: '알림 닫기' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

