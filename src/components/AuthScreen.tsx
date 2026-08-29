import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchTab = (next: 'signin' | 'signup') => {
    setTab(next);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === 'signin') {
        await signIn(username, password);
      } else {
        await signUp(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <div
        className="w-full bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400 p-6"
        style={{ maxWidth: '24rem' }}
      >
        <h1 className="text-2xl text-center text-amber-900 mb-4">
          🏴‍☠️ Treasure Hunt Game 🏴‍☠️
        </h1>

        <div className="flex mb-4 rounded-lg overflow-hidden border border-amber-400">
          <button
            type="button"
            className={`flex-1 py-2 transition-colors ${
              tab === 'signin' ? 'bg-amber-600 text-white' : 'bg-amber-200/80 text-amber-800'
            }`}
            onClick={() => switchTab('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 transition-colors ${
              tab === 'signup' ? 'bg-amber-600 text-white' : 'bg-amber-200/80 text-amber-800'
            }`}
            onClick={() => switchTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="p-2 rounded-md border border-amber-400 bg-input-background text-amber-900"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={3}
            required
          />
          <input
            className="p-2 rounded-md border border-amber-400 bg-input-background text-amber-900"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {submitting ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-amber-700 underline text-sm"
            onClick={continueAsGuest}
          >
            Continue as Guest (scores won't be saved)
          </button>
        </div>
      </div>
    </div>
  );
}
