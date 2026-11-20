// App shell: data loading, sidebar, top bar, and which screen or modal is open.
import React, { useEffect, useRef, useState } from 'react';
import { Plus, NotebookPen, LayoutDashboard, BookOpen, ChartNoAxesCombined, Users, LoaderCircle } from 'lucide-react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AppSidebar } from './components/AppSidebar.jsx';
import { today } from './lib/constants.js';
import { confirmAction, api, getToken, setToken } from './lib/api.js';
import { Empty, ConfirmDialog, Toast } from './components/common.jsx';
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
  const [view,setView]=useState('overview'),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState(''),[toast,setToast]=useState(null),[unit,setUnit]=useState('WEEK'),[exclude,setExclude]=useState(false);
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
  function navigate(v){setView(v);setFilters({q:'',type:'',status:'',person:'',period:'',sort:'DESC'})}
  const evidenceCount=records.reduce((n,r)=>n+(r.evidenceCount||0),0);
  const headings={overview:['대시보드',team?`팀원 ${team.members.length}명 · 기록 ${records.length}개 · 근거 자료 ${evidenceCount}개`:''],records:['기여 기록','작은 기여도, 선명한 기록으로.'],timeline:['활동 흐름','우리의 과정이 쌓이는 모습.'],members:['팀 관리','함께하는 사람들.']};
  const menu=[['overview',LayoutDashboard,'대시보드'],['records',BookOpen,'기여 기록'],['timeline',ChartNoAxesCombined,'활동 흐름'],['members',Users,'팀 관리']];
  if(!signed)return <><Auth onLogin={()=>{setSigned(true);setLoadError('')}} notify={notify}/>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</>;
  return <SidebarProvider>
    <AppSidebar menu={menu} view={view} onNavigate={navigate} recordCount={records.length} teams={teams} teamId={teamId}
      onSelectTeam={v=>{setTeamId(v);setView('overview');setDetail(null);setModal(null)}} onNewTeam={()=>setModal('team')} user={user} onLogout={logout}/>
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
        <SidebarTrigger className="-ml-1" aria-label="메뉴 열기"/>
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4"/>
        <Breadcrumb><BreadcrumbList>
          <BreadcrumbItem className="hidden md:block text-muted-foreground">{team?.name||'팀 선택'}</BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block"/>
          <BreadcrumbItem><BreadcrumbPage>{menu.find(m=>m[0]===view)?.[2]}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>
        <span className="ml-auto text-muted-foreground text-xs">{new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</span>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 pb-24 md:p-8 md:pb-24">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{headings[view][0]}</h1>
          {headings[view][1]&&<p className="text-muted-foreground text-sm">{headings[view][1]}</p>}
        </div>
      {loading&&!team?<div className="loading"><LoaderCircle className="spin"/>팀의 기록을 모으고 있어요…</div>:loadError&&!team?<Empty title="기록을 불러오지 못했어요" text={loadError} action={<Button onClick={()=>run(async()=>{await loadTeams();await refresh()})}>다시 불러오기</Button>}/>:!team?<Empty title="함께 기록할 팀을 만들어볼까요?" text="팀을 만들거나, 팀원이 보내준 초대 코드로 참여하세요." action={<Button onClick={()=>setModal('team')}><Plus/>첫 팀 시작하기</Button>}/>:<>
      {view==='overview'&&<Dashboard team={team} user={user} records={records} navigate={navigate} setFilters={setFilters} openRecord={openRecord}/>}
      {view==='records'&&<Records team={team} stats={stats} records={records} filters={filters} setFilters={setFilters} openRecord={openRecord}/>}
      {view==='timeline'&&<Timeline timeline={timeline} stats={stats} unit={unit} setUnit={setUnit} exclude={exclude} setExclude={setExclude} openRecord={openRecord}/>}
      {view==='members'&&<Members team={team} user={user} leader={leader} busy={busy} run={run} notify={notify} refresh={refresh} loadTeams={loadTeams} openTeamEdit={()=>setModal('editTeam')}/>}
      </>}
      </div>
    </SidebarInset>
    {/* Floating action button: the main action stays in reach at the bottom right on every screen. */}
    {team&&!modal&&<Button size="icon" aria-label="기여 기록 남기기" title="기여 기록 남기기" onClick={()=>{setDetail(null);setModal('record')}}
      className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-20 size-14 rounded-full shadow-lg [&_svg:not([class*='size-'])]:size-6">
      <NotebookPen strokeWidth={1.5}/>
    </Button>}
    {modal==='team'&&<TeamModal busy={busy} onClose={()=>setModal(null)} onSubmit={async(body,join)=>{if(await run(async()=>{const t=await api(join?'/teams/join':'/teams',{method:'POST',body});await loadTeams(t.teamId);setView('overview')},join?'팀에 참여했어요. 반가워요!':'새 팀을 만들었어요.'))setModal(null)}}/>}
    {modal==='editTeam'&&<TeamModal existing={team} busy={busy} onClose={()=>setModal(null)} onSubmit={async body=>{if(await run(async()=>{await api(`/teams/${teamId}`,{method:'PUT',body});await refresh();await loadTeams()},'팀 정보를 저장했어요.'))setModal(null)}}/>}
    {modal==='record'&&<RecordEditor team={team} current={detail} user={user} busy={busy} onClose={()=>setModal(null)} onSave={async(values,files)=>{if(await run(async()=>{const evidences=[...(values.evidences||[])];for(const file of files){const form=new FormData();form.append('file',file);evidences.push(await api(`/teams/${teamId}/files`,{method:'POST',body:form}))}if(detail){await api(prefix+`/${detail.contributionId}`,{method:'PUT',body:{...values,evidences}})}else await api(prefix,{method:'POST',body:{...values,evidences}});await refresh()},detail?'기록을 수정했어요.':'새로운 기여를 기록했어요.')){setModal(null);setDetail(null)}}}/>}
    {modal==='detail'&&detail&&<RecordDetail detail={detail} busy={busy} editable={editable} removable={removable} onClose={()=>setModal(null)} onEdit={()=>setModal('record')} onDelete={async()=>{if(await confirmAction('이 기여 기록과 연결된 의견을 삭제할까요? 이 작업은 되돌릴 수 없어요.'))run(async()=>{await api(prefix+`/${detail.contributionId}`,{method:'DELETE'});setModal(null);setDetail(null);await refresh()},'기록을 삭제했어요.')}} onComment={(body)=>changeDetail('/comments','POST',body,'보완 의견을 남겼어요.')} onResolve={(id,note)=>changeDetail(`/comments/${id}/resolve`,'PATCH',{resolutionNote:note},'보완 의견을 해결했어요.')} onRemoveEvidence={async id=>{if(await confirmAction('이 기록에서 근거 자료 연결을 삭제할까요?'))changeDetail(`/evidences/${id}`,'DELETE',null,'근거 연결을 삭제했어요.')}} onAddEvidence={async(body,file)=>run(async()=>{let evidence=body;if(file){const form=new FormData();form.append('file',file);evidence=await api(`/teams/${teamId}/files`,{method:'POST',body:form})}setDetail(await api(prefix+`/${detail.contributionId}/evidences`,{method:'POST',body:evidence}));await refresh()},'근거 자료를 추가했어요.')} onDownload={e=>run(async()=>{const blob=await api(e.url.replace(/^\/api/,''),{binary:true});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=e.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}/>}
    {confirmation&&<ConfirmDialog message={confirmation.message} onAnswer={answer=>{confirmation.resolve(answer);setConfirmation(null)}}/>}{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>} {busy&&<div className="busy-line" aria-label="처리 중"/>}
  </SidebarProvider>
}
