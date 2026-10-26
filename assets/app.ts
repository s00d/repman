import './styles/app.css';
import { initClipboard } from './controllers/clipboard';
import { initConfirm } from './controllers/confirm';
import { initDropdowns } from './controllers/dropdown';
import { initNavigate } from './controllers/navigate';
import { initRevealToken } from './controllers/revealToken';
import { mountVueIslands } from './islands';

initConfirm();
initDropdowns();
initClipboard();
initRevealToken();
initNavigate();
void mountVueIslands();
