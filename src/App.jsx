// App shell: data loading, sidebar, top bar, and which screen or modal is open.
import React, { useEffect, useRef, useState } from 'react';
import { Plus, LayoutDashboard, BookOpen, ChartNoAxesCombined, Users, LogOut, ChevronDown, CalendarDays, Leaf, LoaderCircle, Menu } from 'lucide-react';
import { today } from './lib/constants.js';
import { confirmAction, api, getToken, setToken } from './lib/api.js';
import { Brand, Avatar, Empty, ConfirmDialog, Toast } from './components/common.jsx';
import { Auth } from './screens/Auth.jsx';
import { Dashboard } from './screens/Dashboard.jsx';
import { Records } from './screens/Records.jsx';
import { Timeline } from './screens/Timeline.jsx';
import { Members } from './screens/Members.jsx';
import { TeamModal } from './modals/TeamModal.jsx';
import { RecordEditor } from './modals/RecordEditor.jsx';
import { RecordDetail } from './modals/RecordDetail.jsx';

export function App(){
  const [signed,setSigned]=useState(()=>!!getToken()),[user,setUser]=useState(null),[teams,setTeams]=useState([]),[teamId,setTeamId]=useState(localStorage.getItem('moa.team')||''),[team,setTeam]=useState(null),[records,setRecords]=useState([]),[stats,setStats]=useState(null),[timeline,setTimeline]=useState(null);
  const [view,setView]=useState('overview'),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState(''),[toast,setToast]=useState(null),[mobile,setMobile]=useState(false),[unit,setUnit]=useState('WEEK'),[exclude,setExclude]=useState(false);
  const [filters,setFilters]=useState({q:'',type:'',status:'',person:'',period:'',sort:'DESC'});
  const requestId=useRef(0),toastTimer=useRef(null);
  const [confirmation,setConfirmation]=useState(null);
  useEffect(()=>{const handler=e=>setConfirmation(e.detail);window.addEventListener('moa-confirm',handler);return()=>window.removeEventListener('moa-confirm',handler)},[]);
  const notify=(message,error=false)=>{setToast({message,error});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),6000)};
  function logout(){setToken('');localStorage.removeItem('moa.team');setSigned(false);setUser(null);setTeams([]);setTeam(null);setTeamId('');setModal(null);setDetail(null)}
  useEffect(()=>{const expired=()=>{logout();notify('로그인이 만료됐어요. 다시 로그인해주세요.',true)};window.addEventListener('moa-expired',expired);return()=>window.removeEventListener('moa-expired',expired)},[]);
  async function loadTeams(preferred){const [u,ts]=await Promise.all([api('/users/me'),api('/teams')]);setUser(u);setTeams(ts);setTeamId(current=>{const wanted=preferred||current;return String(ts.find(t=>String(t.teamId)===String(wanted))?.teamId||ts[0]?.teamId||'')});return ts}
  useEffect(()=>{if(signed){setLoading(true);loadTeams().catch(e=>{setLoadError(e.message);notify(e.message,true)}).finally(()=>setLoading(false))}},[signed]);
  async function refresh(){if(!teamId)return;const id=++requestId.current;const [t,r,s,tl]=await Promise.all([api(`/teams/${teamId}`),api(`/teams/${teamId}/contributions`),api(`/teams/${teamId}/stats/shares?excludeNeedsReview=${exclude}`),api(`/teams/${teamId}/stats/timeline?unit=${unit}`)]);if(id===requestId.current){setTeam(t);setRecords(r);setStats(s);setTimeline(tl);setLoadError('')}}
  useEffect(()=>{if(signed&&teamId){setLoading(true);setTeam(null);localStorage.setItem('moa.team',teamId);refresh().catch(e=>{setLoadError(e.message);notify(e.message,true)}).finally(()=>setLoading(false))}else {setTeam(null);setRecords([]);setStats(null)}},[teamId,signed]);
  useEffect(()=>{if(teamId&&signed)api(`/teams/${teamId}/stats/timeline?unit=${unit}`).then(setTimeline).catch(e=>notify(e.message,true))},[unit]);
  useEffect(()=>{if(teamId&&signed)api(`/teams/${teamId}/stats/shares?excludeNeedsReview=${exclude}`).then(setStats).catch(e=>notify(e.message,true))},[exclude]);
  async function run(task,message){if(busy)return false;setBusy(true);try{await task();if(message)notify(message);return true}catch(e){notify(e.message||'처리하지 못했어요. 다시 시도해주세요.',true);return false}finally{setBusy(false)}}
  async function openRecord(id){await run(async()=>{setDetail(await api(`/teams/${teamId}/contributions/${id}`));setModal('detail')})}
  const myMember=team?.members.find(m=>m.userId===user?.id),leader=myMember?.role==='LEADER';
  const editable=detail&&(leader||detail.createdBy?.userId===user?.id||detail.participants.some(p=>p.userId===user?.id));
  const removable=detail&&(leader||detail.createdBy?.userId===user?.id);
  const prefix=`/teams/${teamId}/contributions`;
  async function changeDetail(path,method,body,message){return await run(async()=>{setDetail(await api(prefix+`/${detail.contributionId}`+path,{method,body}));await refresh()},message)}
  function navigate(v){setView(v);setMobile(false);setFilters({q:'',type:'',status:'',person:'',period:'',sort:'DESC'})}
  const headings={overview:['우리 팀의 기록','함께 만든 과정, 빠짐없이.'],records:['기여 기록','작은 기여도, 선명한 기록으로.'],timeline:['활동 흐름','우리의 과정이 쌓이는 모습.'],members:['팀 관리','함께하는 사람들.']};
  const addButton=<button className="button primary" onClick={()=>{setDetail(null);setModal('record')}}><Plus size={18}/>기여 기록 남기기</button>;
  if(!signed)return <><Auth onLogin={()=>{setSigned(true);setLoadError('')}} notify={notify}/>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</>;
  return <div className="app-shell"><button className="mobile-toggle icon-button" onClick={()=>setMobile(!mobile)} aria-label="메뉴 열기"><Menu/></button>{mobile&&<div className="sidebar-shade" onClick={()=>setMobile(false)}/>}
    <aside className={'sidebar '+(mobile?'open':'')}><Brand/><p className="brand-caption">팀의 과정을 모으다</p><div className="team-select"><label htmlFor="team-picker">WORKSPACE</label><div><select id="team-picker" value={teamId} onChange={e=>{setTeamId(e.target.value);setView('overview');setMobile(false);setDetail(null);setModal(null)}}>{!teams.length&&<option value="">나의 첫 팀</option>}{teams.map(t=><option key={t.teamId} value={t.teamId}>{t.name}</option>)}</select><ChevronDown size={16}/></div></div><nav aria-label="주 메뉴">{[['overview',LayoutDashboard,'대시보드'],['records',BookOpen,'기여 기록'],['timeline',ChartNoAxesCombined,'활동 흐름'],['members',Users,'팀 관리']].map(([v,I,label])=><button key={v} className={view===v?'active':''} onClick={()=>navigate(v)}><I size={19}/>{label}{v==='records'&&<span>{records.length}</span>}</button>)}</nav><button className="new-team" onClick={()=>setModal('team')}><Plus size={17}/> 팀 만들기 · 참여하기</button><div className="sidebar-bottom"><div className="sidebar-tip"><Leaf size={22}/><p>보이지 않던 노력도<br/><strong>우리 팀의 기여예요.</strong></p></div><div className="user-row"><Avatar name={user?.name}/><div><strong>{user?.name||'불러오는 중'}</strong><span>{user?.email}</span></div><button className="icon-button" onClick={logout} aria-label="로그아웃"><LogOut size={17}/></button></div></div></aside>
    <main className="main"><header className="topbar"><div><span>나의 워크스페이스</span><span className="slash">/</span><strong>{team?.name||'팀 선택'}</strong></div><span className="today"><CalendarDays size={15}/>{new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}</span></header>
    <div className="content"><div className="page-heading"><div><div className="eyebrow">{view==='overview'?'TEAM WORKSPACE':view==='records'?'CONTRIBUTION ARCHIVE':view==='timeline'?'OUR JOURNEY':'TOGETHER'}</div><h1>{headings[view][0]}</h1><p>{headings[view][1]}</p></div>{team&&addButton}</div>
      {loading&&!team?<div className="loading"><LoaderCircle className="spin"/>팀의 기록을 모으고 있어요…</div>:loadError&&!team?<Empty title="기록을 불러오지 못했어요" text={loadError} action={<button className="button primary" onClick={()=>run(async()=>{await loadTeams();await refresh()})}>다시 불러오기</button>}/>:!team?<Empty title="함께 기록할 팀을 만들어볼까요?" text="팀을 만들거나, 팀원이 보내준 초대 코드로 참여하세요." action={<button className="button primary" onClick={()=>setModal('team')}><Plus size={17}/>첫 팀 시작하기</button>}/>:<>
      {view==='overview'&&<Dashboard team={team} user={user} records={records} navigate={navigate} setFilters={setFilters} openRecord={openRecord}/>}
      {view==='records'&&<Records team={team} stats={stats} records={records} filters={filters} setFilters={setFilters} openRecord={openRecord}/>}
      {view==='timeline'&&<Timeline timeline={timeline} stats={stats} unit={unit} setUnit={setUnit} exclude={exclude} setExclude={setExclude} openRecord={openRecord}/>}
      {view==='members'&&<Members team={team} user={user} leader={leader} busy={busy} run={run} notify={notify} refresh={refresh} loadTeams={loadTeams} openTeamEdit={()=>setModal('editTeam')}/>}
      </>}
      <footer className="footer"><span>모아 <i>·</i> 팀의 과정을 모으다</span><span>모든 기여에는 이야기가 있어요.</span></footer>
    </div></main>
    {modal==='team'&&<TeamModal busy={busy} onClose={()=>setModal(null)} onSubmit={async(body,join)=>{if(await run(async()=>{const t=await api(join?'/teams/join':'/teams',{method:'POST',body});await loadTeams(t.teamId);setView('overview')},join?'팀에 참여했어요. 반가워요!':'새 팀을 만들었어요.'))setModal(null)}}/>}
    {modal==='editTeam'&&<TeamModal existing={team} busy={busy} onClose={()=>setModal(null)} onSubmit={async body=>{if(await run(async()=>{await api(`/teams/${teamId}`,{method:'PUT',body});await refresh();await loadTeams()},'팀 정보를 저장했어요.'))setModal(null)}}/>}
    {modal==='record'&&<RecordEditor team={team} current={detail} user={user} busy={busy} onClose={()=>setModal(null)} onSave={async(values,files)=>{if(await run(async()=>{const evidences=[...(values.evidences||[])];for(const file of files){const form=new FormData();form.append('file',file);evidences.push(await api(`/teams/${teamId}/files`,{method:'POST',body:form}))}if(detail){await api(prefix+`/${detail.contributionId}`,{method:'PUT',body:{...values,evidences}})}else await api(prefix,{method:'POST',body:{...values,evidences}});await refresh()},detail?'기록을 수정했어요.':'새로운 기여를 기록했어요.')){setModal(null);setDetail(null)}}}/>}
    {modal==='detail'&&detail&&<RecordDetail detail={detail} busy={busy} editable={editable} removable={removable} onClose={()=>setModal(null)} onEdit={()=>setModal('record')} onDelete={async()=>{if(await confirmAction('이 기여 기록과 연결된 의견을 삭제할까요? 이 작업은 되돌릴 수 없어요.'))run(async()=>{await api(prefix+`/${detail.contributionId}`,{method:'DELETE'});setModal(null);setDetail(null);await refresh()},'기록을 삭제했어요.')}} onComment={(body)=>changeDetail('/comments','POST',body,'보완 의견을 남겼어요.')} onResolve={(id,note)=>changeDetail(`/comments/${id}/resolve`,'PATCH',{resolutionNote:note},'보완 의견을 해결했어요.')} onRemoveEvidence={async id=>{if(await confirmAction('이 기록에서 근거 자료 연결을 삭제할까요?'))changeDetail(`/evidences/${id}`,'DELETE',null,'근거 연결을 삭제했어요.')}} onAddEvidence={async(body,file)=>run(async()=>{let evidence=body;if(file){const form=new FormData();form.append('file',file);evidence=await api(`/teams/${teamId}/files`,{method:'POST',body:form})}setDetail(await api(prefix+`/${detail.contributionId}/evidences`,{method:'POST',body:evidence}));await refresh()},'근거 자료를 추가했어요.')} onDownload={e=>run(async()=>{const blob=await api(e.url.replace(/^\/api/,''),{binary:true});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=e.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}/>}
    {confirmation&&<ConfirmDialog message={confirmation.message} onAnswer={answer=>{confirmation.resolve(answer);setConfirmation(null)}}/>}{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>} {busy&&<div className="busy-line" aria-label="처리 중"/>}
  </div>
}
