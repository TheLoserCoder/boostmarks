import { createRoot } from 'react-dom/client';
import { createProjectionClient } from '../../features/bookmarks/adapters/projectionClient';
import { ManagerApp } from '../../features/shell/ManagerApp';
import '../../ui/tokens.css';
import '../../ui/controls.css';
import '../../ui/overlays.css';
import '../../features/shell/shell.css';
import '../../features/bookmarks/ui/explorer.css';

const client = createProjectionClient();

createRoot(document.getElementById('root')!).render(<ManagerApp client={client} />);
