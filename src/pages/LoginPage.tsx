import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function getErrorMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };

  // Server returned a structured error
  if (e.response) {
    const detail = e.response.data?.detail;
    switch (e.response.status) {
      case 401:
        return detail ?? 'Incorrect username or password. Please try again.';
      case 403:
        return 'Your account does not have access to this dashboard.';
      case 422:
        return 'Please enter both username and password.';
      case 500:
      case 502:
      case 503:
        return 'The server is currently unavailable. Please try again in a moment.';
      default:
        return detail ?? 'Login failed. Please try again.';
    }
  }

  // Network / timeout (no response at all)
  if (e.message?.toLowerCase().includes('network') || e.message?.toLowerCase().includes('timeout')) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-lg px-4 py-3 animate-shake">
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Login failed</p>
        <p className="text-sm text-red-700 mt-0.5">{message}</p>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
        aria-label="Dismiss error"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function LoginPage() {
  const { login, isAdmin, isOwner, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect once auth state is confirmed — admin and owner only
  useEffect(() => {
    if (isLoading) return;
    if (!token) return;
    if (isAdmin) { navigate('/admin', { replace: true }); return; }
    if (isOwner) { navigate('/owner', { replace: true }); return; }
    // Token valid but role has no dashboard access (customer / mechanic)
    setError('This account does not have access to the admin dashboard. Please use a shop owner or admin account.');
    setHasError(true);
  }, [token, isAdmin, isOwner, isLoading, navigate]);

  const clearError = () => {
    setError('');
    setHasError(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Garage Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); if (hasError) clearError(); }}
            className={hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
            required
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (hasError) clearError(); }}
            className={hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
            required
          />

          {/* Error alert */}
          {error && <ErrorAlert message={error} onDismiss={clearError} />}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sign In
          </Button>
        </form>

        {/* Test accounts hint */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-2">Test accounts</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Admin:</span> admin / admin123</p>
            <p><span className="font-medium">Owner:</span> owner1 / owner123</p>
            <p><span className="font-medium">Mechanic:</span> mechanic1 / mechanic123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
