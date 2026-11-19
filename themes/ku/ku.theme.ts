// The ku theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in ku.settings.json and the generated ku.settings.ts;
// change them with `astryx experimental theme editor set ku ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {kuSettings} from './ku.settings';

export const kuTheme = defineTheme({
  extends: kuSettings,
  name: 'ku',
});
