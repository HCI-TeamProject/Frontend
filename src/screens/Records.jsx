// Contribution archive: search, filters and the full record list.
import React from 'react';
import { Search, X } from 'lucide-react';
import { TYPES, STATES } from '../lib/constants.js';
import { Empty, RecordRow } from '../components/common.jsx';

// Besides single types, the type filter takes a whole category ('@PROCESS',
// '@OUTPUT'), and the status filter takes 'ATTENTION': records waiting for
// review or with open comments. The dashboard cards link to these.
export const CATEGORY_FILTERS = {'@PROCESS':'과정 전체','@OUTPUT':'결과 전체'};
export const ATTENTION = 'ATTENTION';
const categoryOf = r => TYPES[r.type]?.[2] || r.category;
export const needsAttention = r => r.status==='NEEDS_REVIEW' || r.openCommentCount>0;

export function Records({team,stats,records,filters,setFilters,openRecord}){
  function withinPeriod(workDate, period) {
    if (!period || !workDate) return true;
    const target = new Date(workDate + 'T00:00:00').getTime();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    if (period === '7D') return target >= todayStart - 7 * dayMs;
    if (period === '30D') return target >= todayStart - 30 * dayMs;
    if (period === 'MONTH') {
      const d = new Date(workDate + 'T00:00:00');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  }
  const filtered=records.filter(r=>{
    const searchTargets=[r.title,r.description,...r.participants.map(p=>p.name),...r.participants.map(p=>p.role||'')].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery=!filters.q||searchTargets.includes(filters.q.toLowerCase());
    const matchesType=!filters.type||(filters.type.startsWith('@')?categoryOf(r)===filters.type.slice(1):r.type===filters.type);
    const matchesStatus=!filters.status||(filters.status===ATTENTION?needsAttention(r):r.status===filters.status);
    const matchesPerson=!filters.person||r.participants.some(p=>String(p.userId)===filters.person);
    const matchesPeriod=withinPeriod(r.workDate,filters.period);
    return matchesQuery&&matchesType&&matchesStatus&&matchesPerson&&matchesPeriod;
  }).sort((a,b)=>{
    const dateA=a.workDate||'';
    const dateB=b.workDate||'';
    return filters.sort==='ASC'?dateA.localeCompare(dateB):dateB.localeCompare(dateA);
  });
  return <><div className="filterbar"><div className="search-input"><Search size={18}/><input aria-label="기록 검색" placeholder="제목, 내용, 참여자, 역할로 검색" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>{filters.q&&<button className="search-clear-btn" onClick={()=>setFilters({...filters,q:''})} aria-label="검색어 지우기"><X size={15}/></button>}</div><select aria-label="유형 필터" value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}><option value="">모든 유형</option>{Object.entries(CATEGORY_FILTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v[0]}</option>)}</select><select aria-label="상태 필터" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">모든 상태</option><option value={ATTENTION}>확인 필요 (검토·의견)</option>{Object.entries(STATES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select aria-label="참여자 필터" value={filters.person} onChange={e=>setFilters({...filters,person:e.target.value})}><option value="">모든 참여자</option>{(stats?.members||team.members).map(m=><option key={m.userId} value={m.userId}>{m.name}</option>)}</select><select aria-label="기간 필터" value={filters.period} onChange={e=>setFilters({...filters,period:e.target.value})}><option value="">모든 기간</option><option value="7D">최근 7일</option><option value="30D">최근 30일</option><option value="MONTH">이번 달</option></select><select aria-label="정렬 필터" value={filters.sort} onChange={e=>setFilters({...filters,sort:e.target.value})}><option value="DESC">작업일 최신순</option><option value="ASC">작업일 과거순</option></select>{Object.entries(filters).some(([k,v])=>k!=='sort'&&Boolean(v))&&<button className="text-button" onClick={()=>setFilters({q:'',type:'',status:'',person:'',period:'',sort:'DESC'})}>초기화</button>}</div><section className="panel"><div className="section-heading"><h2>기록 모아보기 <span className="count">{filtered.length}{filtered.length!==records.length&&` / 전체 ${records.length}`}</span></h2><span className="muted small-text">{filters.sort==='ASC'?'작업일 과거순':'작업일 최신순'}</span></div>{filtered.length?filtered.map(r=><RecordRow key={r.contributionId} record={r} onClick={()=>openRecord(r.contributionId)} expanded/>):<Empty title={records.length?'조건에 맞는 기록이 없어요':'첫 기여를 남겨보세요'} text={records.length?'검색어나 필터를 바꿔보세요.':'자료를 찾아본 일, 회의에서 나눈 생각부터 시작해도 좋아요.'} action={records.length>0&&Object.entries(filters).some(([k,v])=>k!=='sort'&&Boolean(v))?<button className="button outline" onClick={()=>setFilters({q:'',type:'',status:'',person:'',period:'',sort:'DESC'})}>필터 초기화</button>:undefined}/>}</section></>
}
