import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { TreasureGame } from './components/TreasureGame';

function AppShell() {
  const { mode } = useAuth();

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <p className="text-amber-800">Loading...</p>
      </div>
    );
  }

  if (mode === 'signed-out') {
    return <AuthScreen />;
  }

  return <TreasureGame />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
