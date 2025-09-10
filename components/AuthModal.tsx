import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginView) {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">{isLoginView ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-6 bg-pink-600 hover:bg-pink-700">
            {loading ? 'Loading...' : (isLoginView ? 'Login' : 'Sign Up')}
          </Button>
        </form>
        <div className="text-center mt-4">
          <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm text-pink-400 hover:underline">
            {isLoginView ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
      </div>
    </div>
  );
};

export default AuthModal;
