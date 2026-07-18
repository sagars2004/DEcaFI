
import { MidnightProvider } from './midnight/MidnightContext';
import { WalletConnect } from './components/WalletConnect';
import { Dashboard } from './components/Dashboard';
import { Shield } from 'lucide-react';

function AppContent() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col">
      <header className="relative z-10 border-b-4 border-slate-700 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="retro text-3xl font-bold tracking-tight text-white shadow-black drop-shadow-md">DEcaFI</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col">
        <Dashboard />
      </main>

      <footer className="relative z-10 border-t-4 border-slate-700 bg-slate-900 py-8 text-center text-slate-500 retro text-[10px]">
        <p>Built for the Midnight Hackathon. Confidential Virtual Cards.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <MidnightProvider>
      <AppContent />
    </MidnightProvider>
  );
}

export default App;
