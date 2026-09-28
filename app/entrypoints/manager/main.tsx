import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { createProjectionClient } from '../../features/bookmarks/adapters/projectionClient';
import { createBookmarkCommandsClient } from '../../features/bookmarks/adapters/bookmarkCommandsClient';
import { AppRoot } from '../../features/shell/AppRoot';
import { ManagerApp } from '../../features/shell/ManagerApp';
import { applyStoredTheme } from '../../features/preferences/theme';
import '../../ui/tokens.css';
import '../../ui/controls.css';
import '../../ui/overlays.css';
import '../../features/shell/shell.css';
import '../../features/bookmarks/ui/explorer.css';
import '../../features/bookmarks/ui/content.css';

const client = createProjectionClient();
const commands = createBookmarkCommandsClient(message => browser.runtime.sendMessage(message));

applyStoredTheme();

createRoot(document.getElementById('root')!).render(
  <AppRoot>
    <ManagerApp client={client} commands={commands} />
  </AppRoot>,
);
