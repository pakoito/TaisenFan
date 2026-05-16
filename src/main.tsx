import './global.css';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import {App} from './App';
import {RomProvider} from './contexts/RomContext';
import {SaveProvider} from './contexts/SaveContext';

const queryClient = new QueryClient();

const container = document.querySelector('#root');
if (container) {
	const root = createRoot(container);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter basename={import.meta.env.BASE_URL}>
					<RomProvider>
						<SaveProvider>
							<App />
						</SaveProvider>
					</RomProvider>
				</BrowserRouter>
			</QueryClientProvider>
		</StrictMode>,
	);
}
