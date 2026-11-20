// Backend calls and the signed-in token.
let token = localStorage.getItem('moa.token') || '';
export const getToken = () => token;
export function setToken(value){token=value||'';if(token)localStorage.setItem('moa.token',token);else localStorage.removeItem('moa.token')}
export function confirmAction(message){return new Promise(resolve=>window.dispatchEvent(new CustomEvent('moa-confirm',{detail:{message,resolve}})))}
export async function api(path, {method='GET', body, binary=false}={}) {
  const form = body instanceof FormData;
  const response = await fetch('/api'+path, {method, headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(!form && body ? {'Content-Type':'application/json'} : {})},body:body ? (form?body:JSON.stringify(body)):undefined});
  if (!response.ok) {
    const data = await response.json().catch(()=>({message:'서버에 연결할 수 없습니다.'}));
    if (response.status===401 && !path.startsWith('/auth/')) { token='';localStorage.removeItem('moa.token');window.dispatchEvent(new Event('moa-expired')); }
    throw new Error([data.message,...(data.errors||[]).map(e=>`${e.field}: ${e.reason}`)].filter(Boolean).join(' · '));
  }
  if (response.status===204) return null;
  return binary ? response.blob() : response.json();
}
