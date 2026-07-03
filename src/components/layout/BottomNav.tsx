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
      <ul className="bottom-nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-label={item.label}
                className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}