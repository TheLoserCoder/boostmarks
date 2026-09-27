import { createRoot } from 'react-dom/client';
import { ManagerApp } from '../../features/shell/ManagerApp';
import '../../features/shell/shell.css';

createRoot(document.getElementById('root')!).render(<ManagerApp />);
