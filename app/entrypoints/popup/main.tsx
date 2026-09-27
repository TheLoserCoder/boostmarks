import { createRoot } from 'react-dom/client';
import { PopupApp } from '../../features/shell/PopupApp';
import '../../features/shell/shell.css';

createRoot(document.getElementById('root')!).render(<PopupApp />);
