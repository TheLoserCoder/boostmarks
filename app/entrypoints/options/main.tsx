import { createRoot } from 'react-dom/client';
import { AppRoot } from '../../features/shell/AppRoot';
import { OptionsApp } from '../../features/shell/OptionsApp';
import { applyStoredTheme } from '../../features/preferences/theme';
import '../../ui/tokens.css';
import '../../ui/controls.css';
import '../../features/shell/shell.css';

applyStoredTheme();

createRoot(document.getElementById('root')!).render(
  <AppRoot>
    <OptionsApp />
  </AppRoot>,
);
