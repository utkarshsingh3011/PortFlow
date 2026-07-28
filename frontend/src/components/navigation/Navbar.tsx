import { FC, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';

export interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    localStorage.clear();
    navigate(ROUTES.LOGIN);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Side: Mobile Hamburger Button + PortFlow Brand */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none md:hidden"
            aria-label="Open mobile menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link to={ROUTES.DASHBOARD} className="text-xl font-bold tracking-tight text-brand-600">
            PortFlow
          </Link>
        </div>

        {/* Right Side: Settings & User Profile Menu */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to={ROUTES.SETTINGS}
            className="text-xs sm:text-sm font-medium text-gray-700 hover:text-brand-600 hidden sm:block"
          >
            Settings
          </Link>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 p-0.5 transition-colors"
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm border border-brand-200 shrink-0">
                {initial}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.full_name || 'User Profile'}
                  </p>
                  {user?.company_name && (
                    <p className="text-xs font-medium text-brand-600 truncate">{user.company_name}</p>
                  )}
                  {user?.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                </div>

                <Link
                  to={ROUTES.SETTINGS}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-gray-400" />
                  Profile
                </Link>

                <Link
                  to={ROUTES.SETTINGS}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-gray-400" />
                  Settings
                </Link>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
