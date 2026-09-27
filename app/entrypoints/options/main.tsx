import { createRoot } from 'react-dom/client';
import { OptionsApp } from '../../features/shell/OptionsApp';
import '../../ui/tokens.css';
import '../../ui/controls.css';
import '../../features/shell/shell.css';

createRoot(document.getElementById('root')!).render(<OptionsApp />);
