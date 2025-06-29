import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

// Create a client with optimized defaults for real-time data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests 3 times
      retry: 3,
      // Retry after 1 second, then 2 seconds, then 4 seconds
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Keep data fresh for 5 seconds
      staleTime: 5 * 1000,
      // Refetch every 10 seconds for real-time data
      refetchInterval: 10 * 1000,
      // Stop refetching when window is not focused
      refetchIntervalInBackground: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full bg-[#E9EBEB]">
        <Header />
        <main className="w-full pb-0 pt-6 space-y-6">
          <Dashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
