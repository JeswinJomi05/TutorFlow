import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, LogOut } from 'lucide-react';
import authService from '../services/authService';
import './TutorLayout.css';

export default function TutorLayout({ children }) {
  const navigate = useNavigate();
  const user = authService.getUser() || {};
  const initials = (user.name || 'Tutor').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const logout = async () => { await authService.logout(); navigate('/login'); };

  return <div className="tutor-shell">
    <aside className="tutor-sidebar">
      <div className="tutor-brand"><span className="tutor-logo">TF</span><strong>TutorFlow</strong></div>
      <nav className="tutor-nav">
        <NavLink to="/tutor/dashboard"><LayoutDashboard size={18} />Dashboard</NavLink>
        <NavLink to="/tutor/students"><Users size={18} />Students</NavLink>
        <NavLink to="/tutor/sessions"><CalendarDays size={18} />Sessions</NavLink>
      </nav>
      <button className="tutor-logout" onClick={logout}><LogOut size={17} />Sign out</button>
    </aside>
    <div className="tutor-content">
      <header className="tutor-topbar"><span className="mobile-brand">TutorFlow</span><div className="tutor-user"><span className="tutor-avatar">{initials}</span><span>{user.name || 'Tutor'}</span></div></header>
      <main className="tutor-main">{children}</main>
    </div>
  </div>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function Button({ children, variant = 'primary', ...props }) { return <button className={`tf-button ${variant}`} {...props}>{children}</button>; }
export function Loading({ label = 'Loading...' }) { return <div className="state-panel">{label}</div>; }
export function ErrorState({ message = 'Unable to load this page.' }) { return <div className="state-panel error-state">{message}</div>; }
export function EmptyState({ title, text, action }) { return <div className="state-panel"><strong>{title}</strong><span>{text}</span>{action}</div>; }
export function StatusBadge({ status }) { return <span className={`status-badge ${status}`}>{status.replace('_', ' ')}</span>; }
