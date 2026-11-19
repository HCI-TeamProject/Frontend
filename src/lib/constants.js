// Record types, states, sizes, avatar colors and date formatting.
import { Users, FileText, Lightbulb, Palette, Code2, MessagesSquare, FolderSearch } from 'lucide-react';

export const TYPES = { DEVELOPMENT:['개발',Code2,'OUTPUT'], DESIGN:['디자인',Palette,'OUTPUT'], DOCUMENT:['문서·발표',FileText,'OUTPUT'], RESEARCH:['자료조사',FolderSearch,'PROCESS'], IDEA:['아이디어·기획',Lightbulb,'PROCESS'], MEETING:['회의',Users,'PROCESS'], FEEDBACK:['피드백',MessagesSquare,'PROCESS'] };
export const STATES = { RECORDED:'기록됨', NEEDS_REVIEW:'검토 필요', RESOLVED:'보완 완료' };
export const SIZES = {S:'작음 · 1', M:'보통 · 3', L:'큼 · 5'};
export const colors = ['#2d7969','#c48550','#7186b0','#ac7794','#8e9c5e','#5d9ba4'];
export const today = () => new Date().toLocaleDateString('sv-SE');
export const dateLabel = d => new Date(d+'T12:00:00').toLocaleDateString('ko-KR',{month:'long',day:'numeric'});
export const fullDateLabel = d => d ? new Date(d+'T12:00:00').toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}) : '';
export const timeLabel = d => d ? new Date(d).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
