import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Navbar() {
  const { user, profile } = useAuth();
  
  function getInitials(name?: string | null): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  return (
    <header className="bg-background border-b sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl inline-block text-foreground">StockViz</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {/* Add additional navbar links here as needed */}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile">
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'User'} />
                  ) : null}
                  <AvatarFallback className="text-sm">
                    {getInitials(profile?.full_name || profile?.username || user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="outline" size="sm" className="text-foreground border-foreground hover:bg-secondary">
                  Log in
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/80">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
