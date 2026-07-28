import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Workflow, Settings, X } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Customers', path: ROUTES.CUSTOMERS, icon: Users },
    { label: 'Onboarding Flows', path: ROUTES.ONBOARDING, icon: Workflow },
    { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings },
  ];

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Mobile Header in Drawer */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
        <span className="text-lg font-bold text-brand-600">PortFlow Navigation</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0 text-current" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent on >= 768px) */}
      <aside className="hidden md:block w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)] p-4 shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-current" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer (Collapsible on < 768px) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Semi-transparent Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Slide-Over Panel */}
          <div className="relative flex-1 w-full max-w-xs bg-white shadow-xl flex flex-col z-50">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
