import { createRoot } from 'react-dom/client';
import { PopupApp } from '../../features/shell/PopupApp';
import '../../ui/tokens.css';
import '../../ui/controls.css';
import '../../features/shell/shell.css';

createRoot(document.getElementById('root')!).render(<PopupApp />);
