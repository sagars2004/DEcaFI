
import { MidnightProvider } from './midnight/MidnightContext';
import { WalletConnect } from './components/WalletConnect';
import { Dashboard } from './components/Dashboard';
import { Shield } from 'lucide-react';

function AppContent() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>

      <header className="relative z-10 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">DEcaFI</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="relative z-10 flex-grow px-4 sm:px-6 lg:px-8">
        <Dashboard />
      </main>

      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-950/80 py-8 text-center text-slate-500 text-sm">
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
