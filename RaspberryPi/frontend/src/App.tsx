import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full bg-[#E9EBEB]">
        <Header />
        <main className="w-full pb-0 pt-6">
          <Dashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
