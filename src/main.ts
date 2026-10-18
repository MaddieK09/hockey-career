import './style.css';
import { renderMenu } from './screens/mainMenu';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root element');
renderMenu(app);
