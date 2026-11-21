import { useState, useEffect } from 'react';
import { User, Notification, UserRole } from './types';
import { api, getStoredUser, getStoredToken } from './services/api';
import { Header } from './components/Header';
import { DashboardView } from './pages/DashboardView';
import { ProblemsView } from './pages/ProblemsView';
import { AIMatchingView } from './pages/AIMatchingView';
import { StartupsView } from './pages/StartupsView';
import { ApplicationsView } from './pages/ApplicationsView';
import { PilotsView } from './pages/PilotsView';
import { ProcurementView } from './pages/ProcurementView';
import { AuditView } from './pages/AuditView';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { canAccessTab, canCreateChallenge, defaultTabByRole } from './utils/roleAccess';

export default function App() {
  const [appView, setAppView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(() =>
    currentUser ? defaultTabByRole[currentUser.role] : 'dashboard'
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cross-view state passing
  const [selectedProblemIdForAI, setSelectedProblemIdForAI] = useState<string | null>(null);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const [createChallengeTrigger, setCreateChallengeTrigger] = useState(0);

  useEffect(() => {
    if (appView === 'dashboard' && getStoredToken() && getStoredUser()) {
      setAuthReady(true);
    }
  }, [appView]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [authReady, currentUser]);

  if (appView === 'landing') {
    return <LandingPage onOpenAuth={() => setAppView('auth')} />;
  }

  if (appView === 'auth') {
    return (
      <AuthPage
        onBackToLanding={() => setAppView('landing')}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setActiveTab(defaultTabByRole[user.role]);
          setAuthReady(true);
          setAppView('dashboard');
        }}
      />
    );
  }

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchUser = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      SUPER_ADMIN: 'admin@innovprocure.gov.in',
      GOVERNMENT_OFFICER: 'officer@innovprocure.gov.in',
      EVALUATOR: 'evaluator@innovprocure.gov.in',
      STARTUP: 'startup@innovprocure.com',
      PROCUREMENT_OFFICER: 'procurement@innovprocure.gov.in',
    };

    try {
      const email = roleEmailMap[role];
      const demoPassword = window.prompt('Enter the configured demo password');
      if (!demoPassword) return;
      const data = await api.login(email, demoPassword);
      setCurrentUser(data.user);
      setActiveTab(defaultTabByRole[data.user.role]);
      setAuthReady(true);
      fetchNotifications();
    } catch (err: any) {
      alert('Unable to switch users. Please try again.');
    }
  };

  const canAccessAuditTrail = canAccessTab(currentUser?.role, 'audit');

  const navigateToTab = (tab: string) => {
    if (!canAccessTab(currentUser?.role, tab)) return;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateChallengeClick = () => {
    if (!canCreateChallenge(currentUser?.role)) return;
    setCreateChallengeTrigger((prev) => prev + 1);
    navigateToTab('problems');
  };

  const handleNavigateToAIWithProblem = (problemId: string) => {
    if (!canAccessTab(currentUser?.role, 'ai-matching')) return;
    setSelectedProblemIdForAI(problemId);
    navigateToTab('ai-matching');
  };

  const handleNavigateToStartup = (startupId: string) => {
    if (!canAccessTab(currentUser?.role, 'startups')) return;
    setSelectedStartupId(startupId);
    navigateToTab('startups');
  };

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    if (activeTab !== 'problems' && activeTab !== 'startups') {
      navigateToTab(canAccessTab(currentUser?.role, 'problems') ? 'problems' : 'startups');
    }
  };

  const resolvedTab = currentUser && canAccessTab(currentUser.role, activeTab)
    ? activeTab
    : currentUser ? defaultTabByRole[currentUser.role] : 'dashboard';

  return (
    <div className="app-shell min-h-screen antialiased">
      <Header
        user={currentUser}
        activeTab={resolvedTab}
        onTabChange={navigateToTab}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSwitchUser={handleSwitchUser}
        onCreateChallengeClick={handleCreateChallengeClick}
        onGlobalSearch={handleGlobalSearch}
        searchQuery={searchQuery}
        onGoToLanding={() => setAppView('landing')}
      />

      <main className="app-main">
        <div className="app-main-inner">
          <div key={resolvedTab} className="app-page-enter">
            {resolvedTab === 'dashboard' && (
              <DashboardView
                user={currentUser}
                onNavigate={navigateToTab}
                onCreateChallengeClick={handleCreateChallengeClick}
              />
            )}

            {resolvedTab === 'problems' && (
              <ProblemsView
                key={`problems-${createChallengeTrigger}`}
                user={currentUser}
                onSelectProblemForAI={handleNavigateToAIWithProblem}
              />
            )}

            {resolvedTab === 'ai-matching' && (
              <AIMatchingView
                selectedProblemId={selectedProblemIdForAI}
                onNavigateToStartup={handleNavigateToStartup}
                onNavigateToApplications={() => navigateToTab('applications')}
              />
            )}

            {resolvedTab === 'startups' && (
              <StartupsView
                initialStartupId={selectedStartupId}
              />
            )}

            {resolvedTab === 'applications' && (
              <ApplicationsView
                onNavigateToProblem={() => navigateToTab('problems')}
                onNavigateToStartup={handleNavigateToStartup}
              />
            )}

            {resolvedTab === 'pilots' && (
              <PilotsView
                user={currentUser}
                onNavigateToProcurement={() => navigateToTab('procurement')}
              />
            )}

            {resolvedTab === 'procurement' && <ProcurementView />}

            {canAccessAuditTrail && resolvedTab === 'audit' && <AuditView />}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold" style={{ color: 'var(--app-navy)' }}>InnovProcure</span>
            <span>·</span>
            <span>National Innovation Procurement Infrastructure</span>
            <span>·</span>
            <span className="app-footer-status"><span /> Platform workspace</span>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--app-muted)' }}>
            Compliant with General Financial Rules (GFR 2017) Innovation Rule 194 & Public Procurement Policy
          </div>
        </div>
      </footer>
    </div>
  );
}
