import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Clock, Menu } from 'lucide-react';
import { ALL_NAV_ITEMS } from '../../constants/navigation';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';
import NotificationDropdown from '../common/NotificationDropdown';

type HeaderProps = {
  onMenuClick: () => void;
};

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const pageTitle = useMemo(() => {
    const pathname = location.pathname;
    const matched = ALL_NAV_ITEMS.find((item) => {
      if (item.to === '/admin' || item.to === '/staff') {
        return pathname === item.to;
      }
      return pathname.startsWith(item.to);
    });

    if (matched) {
      return matched.label;
    }

    if (pathname.startsWith('/admin')) {
      return 'Admin Dashboard';
    }

    if (pathname.startsWith('/staff')) {
      return 'Staff Workspace';
    }

    return 'MediSales Portal';
  }, [location.pathname]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(PH_LOCALE, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: PH_TIME_ZONE,
      }).format(now),
    [now],
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat(PH_LOCALE, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: PH_TIME_ZONE,
      }).format(now),
    [now],
  );

  return (
    <header className="sticky top-0 z-40 flex flex-col gap-4 border-b-2 border-blue-200 bg-white px-6 py-4 shadow-md md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="md:hidden -ml-2 p-2 text-slate-600 hover:text-blue-600"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-600">Currently Viewing</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <span className="font-medium text-slate-700">{formattedDate}</span>
        </div>

        {/* Real-time Notification Dropdown */}
        <NotificationDropdown />

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span className="font-semibold text-slate-700">{formattedTime}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
