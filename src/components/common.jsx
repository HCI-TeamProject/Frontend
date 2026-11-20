// Small pieces shared across screens: brand, avatar, status, modal, toast, record row.
import React, { useEffect, useRef } from 'react';
import { ArrowUpRight, BookOpen, X, Paperclip, Check, MessageCircle, LoaderCircle, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { TYPES, STATES, colors, dateLabel } from '../lib/constants.js';

export const Icon = ({type,size=18}) => { const I=TYPES[type]?.[1]||FileText;return <I size={size}/>; };
// The M-shaped mark on its own, drawn in the current text color.
export function BrandMark({size=22}){return <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 28V14l13 10 13-10v14M7 14l13-8 13 8"/></svg>}
export function Brand(){return <div className="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 28V14l13 10 13-10v14M7 14l13-8 13 8"/></svg><strong>모아<span>moa</span></strong></div>}
export function Avatar({name,index=0,small=false}){return <span className={'avatar '+(small?'small':'')} style={{background:colors[index%colors.length]}}>{(name||'?').slice(0,1)}</span>}
export function Status({status}){return <span className={'status '+status}><i/>{STATES[status]}</span>}
export function Empty({title='아직 기록이 없어요',text='작은 아이디어도 팀의 소중한 기여예요. 첫 기록을 남겨보세요.',action}){return <div className="empty"><div className="empty-icon"><BookOpen size={28}/></div><h3>{title}</h3><p>{text}</p>{action}</div>}
export function Modal({title,subtitle,onClose,children,wide=false}){
  const ref=useRef(null);
  useEffect(()=>{const previous=document.activeElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.focus();const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=[...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]')];const first=els[0],last=els.at(-1);if(e.shiftKey && (document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);previous?.focus()}},[]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section ref={ref} tabIndex={-1} className={'modal '+(wide?'wide':'')} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="닫기"><X/></button></header>{children}</section></div>
}
export function Submit({busy,children='저장하기'}){return <button className="button primary" type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<Check size={17}/>} {busy?'처리 중…':children}</button>}

export function ConfirmDialog({message,onAnswer}){
  const cancel=useRef(null),accept=useRef(null);
  useEffect(()=>{const prior=document.activeElement;cancel.current?.focus();return()=>prior?.focus()},[]);
  return <div className="modal-backdrop confirmation-backdrop"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-label="작업 확인" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onAnswer(false);if(e.key==='Tab'){e.preventDefault();(document.activeElement===cancel.current?accept:cancel).current?.focus()}}}><AlertCircle size={28}/><h2>한 번 더 확인해주세요</h2><p>{message}</p><div className="form-actions"><button ref={cancel} className="button outline" onClick={()=>onAnswer(false)}>취소</button><button ref={accept} className="button primary" onClick={()=>onAnswer(true)}>확인</button></div></section></div>
}
export function Toast({toast,onClose}){return <div className={'toast '+(toast.error?'error':'')} role={toast.error?'alert':'status'}>{toast.error?<AlertCircle size={20}/>:<CheckCircle2 size={20}/>}<span>{toast.message}</span><button className="icon-button" onClick={onClose} aria-label="알림 닫기"><X size={16}/></button></div>}
export function Metric({icon:I,label,value,unit,detail,onClick}){const Tag=onClick?'button':'div';return <Tag className="metric" onClick={onClick}><div><span>{label}</span><I size={18}/></div><strong>{value}<small>{unit}</small></strong><p>{detail}</p></Tag>}
export function RecordRow({record:r,onClick,expanded}){return <button className={'record-row '+(expanded?'expanded':'')} onClick={onClick}><span className={'type-icon '+r.type}><Icon type={r.type}/></span><div className="record-main"><div className="record-title"><strong>{r.title}</strong><Status status={r.status}/></div><div className="record-meta"><span>{TYPES[r.type]?.[0]}</span><i>·</i><span>{r.participants.map(p=>p.name).join(', ')}</span><i>·</i><span>{dateLabel(r.workDate)}</span></div>{expanded&&<div className="record-roles">{r.participants.filter(p=>p.role).map(p=><span key={p.userId}>{p.name} · {p.role}</span>)}</div>}</div><div className="record-extras">{r.evidenceCount>0&&<span><Paperclip size={14}/>{r.evidenceCount}</span>}{r.openCommentCount>0&&<span className="amber"><MessageCircle size={14}/>{r.openCommentCount}</span>}<ArrowUpRight size={17}/></div></button>}
