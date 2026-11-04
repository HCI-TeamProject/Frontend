import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../main.jsx';

describe('API 유틸리티 및 네트워크 핸들링 테스트', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET 요청 시 정상적인 JSON 응답을 파싱하여 반환해야 한다', async () => {
    const mockData = { id: 1, name: '테스트' };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await api('/test');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'GET'
    }));
  });

  it('JSON 본문이 있는 POST 요청 시 Content-Type 헤더와 직렬화된 body를 전송해야 한다', async () => {
    const requestBody = { title: '새 기록', size: 'M' };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });

    await api('/records', { method: 'POST', body: requestBody });

    expect(fetch).toHaveBeenCalledWith('/api/records', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(requestBody)
    }));
  });

  it('FormData 전송 시 Content-Type 헤더를 직접 설정하지 않아야 한다 (브라우저 자동 설정)', async () => {
    const form = new FormData();
    form.append('file', new Blob(['test']), 'test.txt');

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ fileId: 1 })
    });

    await api('/upload', { method: 'POST', body: form });

    const calledHeaders = fetch.mock.calls[0][1].headers;
    expect(calledHeaders['Content-Type']).toBeUndefined();
  });

  it('204 No Content 응답 시 null을 반환해야 한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 204
    });

    const result = await api('/delete', { method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('서버 에러(400 등) 발생 시 에러 메시지와 필드 사유를 조합한 Error를 throw해야 한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: '입력값이 올바르지 않습니다.',
        errors: [{ field: 'title', reason: '필수 항목입니다.' }]
      })
    });

    await expect(api('/records', { method: 'POST', body: {} })).rejects.toThrow(
      '입력값이 올바르지 않습니다. · title: 필수 항목입니다.'
    );
  });

  it('401 Unauthorized 발생 시 moa-expired 이벤트를 발행하고 토큰을 만료시켜야 한다', async () => {
    const expiredHandler = vi.fn();
    window.addEventListener('moa-expired', expiredHandler);

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: '인증이 만료되었습니다.' })
    });

    await expect(api('/teams')).rejects.toThrow('인증이 만료되었습니다.');
    expect(expiredHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('moa-expired', expiredHandler);
  });
});

