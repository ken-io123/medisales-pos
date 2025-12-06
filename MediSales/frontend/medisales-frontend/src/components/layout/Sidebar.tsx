import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { NAVIGATION_ITEMS, type NavItem } from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';

const getInitials = (name?: string | null) => {
  if (!name) {
    return 'MS';
  }

  const parts = name.split(' ').filter(Boolean);
  const [first, second] = parts;
  if (first && second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }

  return first?.slice(0, 2).toUpperCase() ?? 'MS';
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? null;

  const items = useMemo(() => {
    if (!role) {
      return [] as NavItem[];
    }

    const navSet = NAVIGATION_ITEMS[role];
    return navSet ?? [];
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[45] bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-slate-200 bg-white text-slate-900 shadow-lg transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between border-b-2 border-blue-200 bg-blue-600 px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-white bg-blue-500 text-white shadow-md">
              {/* Super Visible, Large Capsule SVG Logo */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                <rect x="10" y="16" width="28" height="16" rx="8" fill="#2563eb" />
                <rect x="24" y="16" width="14" height="16" rx="7" fill="#4ade80" />
                <rect x="10" y="16" width="14" height="16" rx="7" fill="#fff" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight drop-shadow">MediSales</h1>
              <p className="text-xs font-medium text-blue-100 tracking-wide mt-1">Effortless Inventory &amp; Sales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-white hover:text-blue-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b-2 border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3 border-2 border-blue-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-blue-500 bg-blue-500 text-sm font-bold uppercase text-white">
              {getInitials(user?.fullName)}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">{user?.fullName ?? 'Guest User'}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{role ?? 'Unassigned'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto bg-white px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose()} // Close sidebar on navigation (mobile)
              end={item.to.split('/').filter(Boolean).length <= 1}
              className={({ isActive }) =>
                `flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-bold ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-transparent bg-white text-slate-600'
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {!items.length && (
            <p className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Sign in to access your MediSales workspace.
            </p>
          )}
        </nav>

        <div className="border-t-2 border-slate-200 bg-slate-50 px-6 pb-8 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
