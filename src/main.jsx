import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.jsx';

// Tests import from main.jsx, so everything they use is re-exported here.
export { TYPES, STATES, SIZES, colors, today, dateLabel, fullDateLabel, timeLabel } from './lib/constants.js';
export { confirmAction, api } from './lib/api.js';
export { Icon, Brand, Avatar, Status, Empty, Modal, Submit, ConfirmDialog, Toast, Metric, RecordRow } from './components/common.jsx';
export { Auth } from './screens/Auth.jsx';
export { Dashboard } from './screens/Dashboard.jsx';
export { Records } from './screens/Records.jsx';
export { Timeline } from './screens/Timeline.jsx';
export { Members } from './screens/Members.jsx';
export { TeamModal } from './modals/TeamModal.jsx';
export { RecordEditor } from './modals/RecordEditor.jsx';
export { RecordDetail } from './modals/RecordDetail.jsx';
export { App } from './App.jsx';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App/>);
}
