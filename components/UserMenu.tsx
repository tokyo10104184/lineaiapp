import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

interface UserMenuProps {
  onLoginClick: () => void;
}

const UserMenu = ({ onLoginClick }: UserMenuProps) => {
  const { user, profile, logout } = useAuth();

  if (user && profile) {
    return (
      <div className="flex items-center gap-4 p-2">
        <span className="text-white font-medium">Welcome, {profile.username}!</span>
        <Button onClick={logout} variant="destructive" size="sm">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Button onClick={onLoginClick} variant="outline" size="sm">
        Login / Sign Up
      </Button>
    </div>
  );
};

export default UserMenu;
