import './global.css';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import {App} from './App';

const queryClient = new QueryClient();

const container = document.querySelector('#root');
if (container) {
	const root = createRoot(container);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter basename={import.meta.env.BASE_URL}>
					<App />
				</BrowserRouter>
			</QueryClientProvider>
		</StrictMode>,
	);
}
