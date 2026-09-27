import { createRoot } from 'react-dom/client';
import { createProjectionClient } from '../../features/bookmarks/adapters/projectionClient';
import { ManagerApp } from '../../features/shell/ManagerApp';
import '../../features/bookmarks/ui/explorer.css';
import '../../features/shell/shell.css';

const client = createProjectionClient();

createRoot(document.getElementById('root')!).render(<ManagerApp client={client} />);
