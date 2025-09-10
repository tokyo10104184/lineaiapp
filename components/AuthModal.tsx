import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
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

  const handleAuthError = (err: any): string => {
    if (err.message.includes('Invalid login credentials')) {
      return 'ユーザー名またはパスワードが間違っています。';
    }
    if (err.message.includes('User already registered')) {
      return 'このユーザー名は既に使用されています。';
    }
    if (err.message.includes('Password should be at least 6 characters')) {
      return 'パスワードは6文字以上で設定してください。';
    }
    return '予期せぬエラーが発生しました。';
  }

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
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
        onClick={onClose} // Add backdrop click to close
    >
      <div
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-white"
        onClick={(e) => e.stopPropagation()} // Prevent modal click from closing
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{isLoginView ? 'ログイン' : '新規登録'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
            <Input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-6 bg-pink-600 hover:bg-pink-700">
            {loading ? '処理中...' : (isLoginView ? 'ログイン' : '新規登録')}
          </Button>
        </form>
        <div className="text-center mt-4">
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="text-sm text-pink-400 hover:underline">
            {isLoginView ? "アカウントをお持ちでないですか？ 新規登録" : 'すでにアカウントをお持ちですか？ ログイン'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
