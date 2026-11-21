import { useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileCheck2,
  FileText,
  Layers,
  LockKeyhole,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { User, Notification, UserRole } from '../types';
import { api } from '../services/api';
import { canAccessTab, canCreateChallenge } from '../utils/roleAccess';

interface HeaderProps {
  user: User | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSwitchUser: (role: UserRole) => void;
  onCreateChallengeClick: () => void;
  onGlobalSearch: (query: string) => void;
  searchQuery: string;
  onGoToLanding: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Executive dashboard', icon: Activity, group: 'Workspace' },
  { id: 'problems', label: 'Government challenges', icon: Building2, group: 'Workspace' },
  { id: 'ai-matching', label: 'AI Match Studio', icon: Sparkles, group: 'Workspace' },
  { id: 'startups', label: 'Startup directory', icon: Cpu, group: 'Workspace' },
  { id: 'applications', label: 'Screening & review', icon: FileCheck2, group: 'Delivery' },
  { id: 'pilots', label: 'Pilots & KPIs', icon: Layers, group: 'Delivery' },
  { id: 'procurement', label: 'Procurement pipeline', icon: FileText, group: 'Delivery' },
  { id: 'audit', label: 'Audit trail', icon: Shield, group: 'Administration' },
];

const roleOptions: Array<{ role: UserRole; name: string; detail: string }> = [
  { role: 'SUPER_ADMIN', name: 'Dr. Rajeshwar Sharma, IAS', detail: 'Super Admin · Mission Director' },
  { role: 'GOVERNMENT_OFFICER', name: 'Priyanka Verma', detail: 'Government Innovation Officer' },
  { role: 'EVALUATOR', name: 'Prof. Anirudh Sen', detail: 'Technical Evaluation Chair' },
  { role: 'STARTUP', name: 'Vikram Malhotra', detail: 'Startup Founder' },
  { role: 'PROCUREMENT_OFFICER', name: 'Sunita Krishnan', detail: 'Procurement Controller' },
];

const roleNames: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  GOVERNMENT_OFFICER: 'Government Officer',
  EVALUATOR: 'Evaluator',
  STARTUP: 'Startup',
  PROCUREMENT_OFFICER: 'Procurement Officer',
};

export function Header({
  user,
  activeTab,
  onTabChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSwitchUser,
  onCreateChallengeClick,
  onGlobalSearch,
  searchQuery,
  onGoToLanding,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const navigate = (tab: string) => {
    onTabChange(tab);
    setMobileNavOpen(false);
  };

  return (
    <>
      {mobileNavOpen && <button className="app-sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <aside className={`app-sidebar${mobileNavOpen ? ' is-open' : ''}`}>
        <button className="app-brand" onClick={onGoToLanding} aria-label="Open InnovProcure landing page">
          <span className="app-brand-mark"><Shield size={20} /></span>
          <span><strong>InnovProcure</strong><small>Innovation for Maharashtra</small></span>
        </button>

        <div className="app-sidebar-context">
          <span className="app-context-indicator" />
          <span>Government of Maharashtra · Live workspace</span>
        </div>

        <nav className="app-nav" aria-label="Main navigation">
          {['Workspace', 'Delivery', 'Administration'].map((group) => {
            const groupItems = navItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div className="app-nav-group" key={group}>
                <p className="app-nav-label">{group}</p>
                {groupItems.map(({ id, label, icon: Icon }) => {
                  const isAvailable = canAccessTab(user?.role, id);
                  return (
                    <button
                      key={id}
                      className={`app-nav-item${activeTab === id ? ' is-active' : ''}${isAvailable ? '' : ' is-restricted'}`}
                      onClick={() => { if (isAvailable) navigate(id); }}
                      aria-current={activeTab === id ? 'page' : undefined}
                      aria-disabled={!isAvailable}
                      aria-label={isAvailable ? label : `${label}, unavailable for this role`}
                      title={isAvailable ? undefined : 'This module is unavailable for your role'}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                      <span>{label}</span>
                      {!isAvailable && <LockKeyhole size={13} className="app-nav-lock" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-compliance-mark"><Shield size={16} /><span><strong>GFR 2017</strong><small>Innovation procurement</small></span></div>
          <span className="app-sidebar-version">National Innovation Procurement Infrastructure</span>
        </div>
      </aside>

      <header className="app-topbar">
        <div className="app-topbar-leading">
          <button className="app-mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="app-search">
            <Search size={17} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onGlobalSearch(event.target.value)}
              placeholder="Search challenges, startups..."
              aria-label="Search challenges and startups"
            />
          </div>
        </div>
        <div className="app-topbar-actions">
          {canCreateChallenge(user?.role) && (
            <button className="app-create-button" onClick={onCreateChallengeClick}><Plus size={16} /><span>New challenge</span></button>
          )}
          <div className="app-popover-anchor">
            <button
              className="app-icon-button"
              onClick={() => setShowNotifications((open) => !open)}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifications}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="app-notification-count">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <section className="app-popover app-notifications">
                <div className="app-popover-heading">
                  <div><strong>Notifications</strong><span>{unreadCount} unread</span></div>
                  {unreadCount > 0 && <button onClick={onMarkAllNotificationsRead}><Check size={14} /> Mark all read</button>}
                </div>
                <div className="app-notification-list">
                  {notifications.length === 0 ? <p className="app-empty-note">You’re all caught up. No notifications yet.</p> : notifications.slice(0, 8).map((notification) => (
                    <button
                      key={notification.id}
                      className={`app-notification${notification.is_read ? '' : ' is-unread'}`}
                      onClick={() => onMarkNotificationRead(notification.id)}
                    >
                      <span className="app-notification-dot" />
                      <span><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Date(notification.created_at).toLocaleString()}</time></span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="app-popover-anchor">
            <button
              className="app-profile-button"
              onClick={() => setShowUserMenu((open) => !open)}
              aria-expanded={showUserMenu}
              aria-label="Open account menu"
            >
              <span className="app-avatar">{user?.name?.charAt(0) || 'U'}</span>
              <span className="app-profile-copy"><strong>{user?.name || 'Authorized user'}</strong><small>{user ? roleNames[user.role] : ''}</small></span>
              <ChevronDown size={15} />
            </button>
            {showUserMenu && (
              <section className="app-popover app-account-menu">
                <div className="app-account-heading"><strong>{user?.name || 'Authorized user'}</strong><span>{user?.email}</span></div>
                <p className="app-menu-label">Switch demo persona</p>
                {roleOptions.map(({ role, name, detail }) => (
                  <button key={role} className="app-persona-option" onClick={() => { onSwitchUser(role); setShowUserMenu(false); }}>
                    <span><strong>{name}</strong><small>{detail}</small></span>
                    {user?.role === role && <CheckCircle2 size={16} />}
                  </button>
                ))}
                <button
                  className="app-reset-demo"
                  onClick={async () => {
                    if (!confirm('Reset database to clean, curated demo dataset?')) return;
                    try {
                      await api.resetDemoData();
                      window.location.reload();
                    } catch (error) {
                      alert('Unable to reset the demo. Please try again.');
                    }
                  }}
                >
                  <RotateCcw size={14} /> Reset demo data
                </button>
              </section>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
