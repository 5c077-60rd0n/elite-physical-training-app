import { ChartColumn, Grid3x3, House, Timer, Waypoints } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: House },
  { to: '/today', label: 'Today', icon: Timer },
  { to: '/schedule', label: 'Week', icon: Waypoints },
  { to: '/progress', label: 'Progress', icon: ChartColumn },
  { to: '/more', label: 'More', icon: Grid3x3 },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}