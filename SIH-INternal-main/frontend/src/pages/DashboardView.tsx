import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Clock3,
  Cpu,
  FileCheck,
  FileText,
  Flame,
  IndianRupee,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Application, AuditLog, DashboardAnalytics, User } from '../types';
import { api } from '../services/api';
import { canAccessTab, canCreateChallenge } from '../utils/roleAccess';

interface DashboardViewProps {
  user: User | null;
  onNavigate: (tab: string, filter?: any) => void;
  onCreateChallengeClick: () => void;
}

const SECTOR_COLORS = ['#062d49', '#0b496d', '#159b9a', '#e8a04a', '#0f7a79', '#1a6f8c', '#3d7a8c', '#b77820'];

const funnelStages = [
  { label: 'Public Challenges', key: 'problems', tab: 'problems', description: 'Published needs' },
  { label: 'Startup Proposals', key: 'applications', tab: 'applications', description: 'Submitted solutions' },
  { label: 'AI Matched', key: 'ai_matches', tab: 'ai-matching', description: 'Compatibility identified' },
  { label: 'Shortlisted', key: 'shortlisted', tab: 'applications', description: 'Evaluation approved' },
  { label: 'Active Pilots', key: 'pilots', tab: 'pilots', description: 'Field verification' },
  { label: 'Scale Approved', key: 'scale_ready', tab: 'pilots', description: 'Ready to procure' },
  { label: 'Procurement', key: 'procurement', tab: 'procurement', description: 'Procurement initiated' },
  { label: 'Contracts', key: 'contracts', tab: 'procurement', description: 'Awarded & executed' },
] as const;

function AnimatedValue({ value }: { value: number | string }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value;
  const valueMatch = formattedValue.match(/^([^0-9]*)([\d,]+(?:\.\d+)?)(.*)$/);
  const numericTarget = valueMatch ? Number(valueMatch[2].replace(/,/g, '')) : null;
  const previousValue = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState(formattedValue);

  useEffect(() => {
    if (!valueMatch || numericTarget === null || !Number.isFinite(numericTarget)) {
      setDisplayValue(formattedValue);
      return;
    }

    const [prefix, , suffix] = valueMatch;
    const decimalPlaces = (valueMatch[2].split('.')[1] || '').length;
    const startValue = previousValue.current ?? 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    previousValue.current = numericTarget;

    if (prefersReducedMotion || startValue === numericTarget) {
      setDisplayValue(formattedValue);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 650;
    setDisplayValue(`${prefix}${startValue.toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}${suffix}`);

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = startValue + (numericTarget - startValue) * eased;
      setDisplayValue(`${prefix}${current.toLocaleString('en-IN', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}${suffix}`);
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [formattedValue, numericTarget]);

  return <>{displayValue}</>;
}

function formatINR(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DashboardView({ user, onNavigate, onCreateChallengeClick }: DashboardViewProps) {
  const canAccessApplications = canAccessTab(user?.role, 'applications');
  const canAccessAIMatching = canAccessTab(user?.role, 'ai-matching');
  const canAccessProcurement = canAccessTab(user?.role, 'procurement');
  const canPublishChallenges = canCreateChallenge(user?.role);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityError, setActivityError] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    const [analyticsResult, applicationsResult, logsResult] = await Promise.allSettled([
      api.getDashboardAnalytics(),
      canAccessApplications ? api.getApplications() : Promise.resolve({ applications: [] as Application[] }),
      user?.role === 'SUPER_ADMIN' ? api.getAuditLogs() : Promise.resolve({ logs: [] }),
    ]);

    if (analyticsResult.status === 'fulfilled') {
      setAnalytics(analyticsResult.value);
    } else {
      setError(analyticsResult.reason instanceof Error ? analyticsResult.reason.message : 'Dashboard metrics could not be loaded.');
    }

    if (applicationsResult.status === 'fulfilled') {
      setPendingReviews(
        applicationsResult.value.applications
          .filter((application) => ['SUBMITTED', 'SCREENING', 'EVALUATION'].includes(application.status))
          .sort((first, second) => new Date(second.submitted_at).getTime() - new Date(first.submitted_at).getTime())
          .slice(0, 3),
      );
      setReviewsError(false);
    } else {
      setPendingReviews([]);
      setReviewsError(true);
      console.error('Failed to load pending reviews:', applicationsResult.reason);
    }

    if (logsResult.status === 'fulfilled') {
      setRecentLogs(logsResult.value.logs.slice(0, 6));
      setActivityError(false);
    } else {
      setRecentLogs([]);
      setActivityError(true);
      console.error('Failed to load governance activity:', logsResult.reason);
    }
    setLoading(false);
  }, [canAccessApplications, user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const dashboard = dashboardRef.current;
    if (!dashboard) return;

    const sections = Array.from(dashboard.children);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    sections.forEach((section) => {
      section.classList.add('executive-reveal');
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, [analytics]);

  if (loading) {
    return (
      <div className="executive-loading" role="status">
        <span className="executive-spinner" />
        <span>Loading live procurement data…</span>
        <span className="executive-loading-skeleton" aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <section className="executive-error" role="alert">
        <div><h2>Dashboard data unavailable</h2><p>{error || 'We could not retrieve the latest dashboard data.'}</p></div>
        <button onClick={() => void loadDashboard()}><RefreshCw size={15} /> Try again</button>
      </section>
    );
  }

  const { kpis, charts } = analytics;
  const metrics = [
    { label: 'Total Challenges', value: kpis.totalProblems, detail: `${kpis.activeProblems} active`, icon: Building2, color: 'indigo', tab: 'problems' },
    { label: 'Active Challenges', value: kpis.activeProblems, detail: 'Across departments', icon: FileText, color: 'blue', tab: 'problems' },
    { label: 'Registered Startups', value: kpis.registeredStartups, detail: 'In the directory', icon: Cpu, color: 'violet', tab: 'startups' },
    { label: 'AI Matches', value: kpis.aiMatches, detail: 'Compatibility scored', icon: Sparkles, color: 'amber', tab: 'ai-matching' },
    { label: 'Shortlisted Proposals', value: kpis.shortlistedStartups, detail: 'Approved for next stage', icon: Award, color: 'blue', tab: 'applications' },
    { label: 'Active Pilots', value: kpis.activePilots, detail: 'Field validation', icon: Layers, color: 'green', tab: 'pilots' },
    { label: 'Procurement Value', value: formatINR(kpis.procurementValue), detail: 'Approved commitments', icon: IndianRupee, color: 'green', tab: 'procurement' },
    { label: 'Scaled Deployments', value: kpis.successfulInnovations, detail: 'Contracts awarded', icon: CheckCircle2, color: 'cyan', tab: 'procurement' },
  ] as const;

  return (
    <div className="executive-dashboard" ref={dashboardRef}>
      <section className="executive-welcome">
        <div className="executive-welcome-copy">
          <span className="executive-eyebrow"><ShieldCheck size={15} /> INNOVPROCURE · GOVERNMENT WORKSPACE</span>
          <h1>Welcome back, {user?.name || 'Administrator'}</h1>
          <p>Track public-sector challenges, startup proposals and the journey from pilot to procurement.</p>
          <div className="executive-welcome-actions">
            {canPublishChallenges && <button className="executive-button-primary" onClick={onCreateChallengeClick}><Building2 size={15} /> Publish New Challenge</button>}
            {canAccessAIMatching && <button className="executive-button-secondary" onClick={() => onNavigate('ai-matching')}>Launch AI Matching</button>}
            {canAccessProcurement && <button className="executive-button-secondary" onClick={() => onNavigate('procurement')}><FileText size={15} /> View Procurement</button>}
          </div>
        </div>
      </section>

      <section className="executive-section">
        <div className="executive-section-heading">
          <div><h2><TrendingUp size={16} /> National Innovation Procurement Indicators</h2><p>Current platform-wide metrics</p></div>
          <span className="executive-live-indicator"><span /> Live data</span>
        </div>
        <div className="executive-metrics-grid">
          {metrics.map(({ label, value, detail, icon: Icon, color, tab }) => {
            const canOpenModule = canAccessTab(user?.role, tab);
            return (
            <button
              className={`executive-metric-card${canOpenModule ? '' : ' is-restricted'}`}
              key={label}
              onClick={() => onNavigate(tab)}
              disabled={!canOpenModule}
              aria-label={canOpenModule ? label : `${label}, details unavailable for your role`}
            >
              <span className={`executive-metric-icon ${color}`}><Icon size={17} /></span>
              <span className="executive-metric-label">{label}</span>
              <strong><AnimatedValue value={value} /></strong>
              <small>{detail}</small>
            </button>
            );
          })}
        </div>
      </section>

      <section className="executive-panel executive-funnel">
        <div className="executive-section-heading">
          <div><h2><Flame size={16} /> National Innovation Procurement Funnel</h2><p>Live progression from public challenges to contracts and scaled delivery.</p></div>
        </div>
        <div className="executive-funnel-grid">
          {funnelStages.map(({ label, key, tab, description }, index) => {
            const canOpenModule = canAccessTab(user?.role, tab);
            return (
            <button
              className="executive-funnel-stage"
              key={key}
              onClick={() => onNavigate(tab)}
              disabled={!canOpenModule}
              aria-label={canOpenModule ? label : `${label}, details unavailable for your role`}
            >
              <span className="executive-funnel-step">STEP 0{index + 1}</span>
              <strong><AnimatedValue value={charts.pipelineFunnel[key]} /></strong>
              <span className="executive-funnel-label">{label}</span>
              <small>{description}</small>
            </button>
            );
          })}
        </div>
      </section>

      <section className="executive-charts-grid">
        <div className="executive-panel executive-chart-panel">
          <div className="executive-section-heading"><div><h2>Challenges by Sector</h2><p>Active public-sector problem statements</p></div></div>
          {charts.problemsBySector.length === 0 ? <p className="executive-empty">No sector data available.</p> : (
            <div className="executive-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.problemsBySector} margin={{ top: 10, right: 12, bottom: 4, left: -18 }}>
                  <CartesianGrid vertical={false} stroke="#e4eef1" />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: '#5a7380' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#7a919c' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ border: '1px solid #d5e4ea', borderRadius: 10, fontSize: 11, boxShadow: '0 8px 24px rgba(6,45,73,.1)' }} />
                  <Bar dataKey="count" name="Challenges" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={!reducedMotion} animationDuration={650} animationEasing="ease-out">
                    {charts.problemsBySector.map((_entry, index) => <Cell key={`sector-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="executive-panel executive-chart-panel">
          <div className="executive-section-heading"><div><h2>Procurement Commitments by Department</h2><p>Approved value across departments</p></div></div>
          {charts.procurementByDepartment.length === 0 ? <p className="executive-empty">No department commitments available.</p> : (
            <div className="executive-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.procurementByDepartment} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e4eef1" />
                  <XAxis dataKey="department_code" tick={{ fontSize: 10, fill: '#5a7380' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7a919c' }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `₹${(value / 10000000).toFixed(0)}Cr`} />
                  <Tooltip contentStyle={{ border: '1px solid #d5e4ea', borderRadius: 10, fontSize: 11, boxShadow: '0 8px 24px rgba(6,45,73,.1)' }} formatter={(value) => [formatINR(Number(value)), 'Approved value']} />
                  <Bar dataKey="total_value" name="Approved value" fill="#159b9a" radius={[4, 4, 0, 0]} maxBarSize={38} isAnimationActive={!reducedMotion} animationDuration={700} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="executive-bottom-grid">
        <div className="executive-panel executive-audit">
          <div className="executive-section-heading">
            <div><h2><ShieldCheck size={16} /> Live Governance &amp; Audit Trail</h2><p>Latest recorded procurement and evaluation actions.</p></div>
            {user?.role === 'SUPER_ADMIN' && <button className="executive-text-link" onClick={() => onNavigate('audit')}>Full log <ArrowRight size={14} /></button>}
          </div>
          {user?.role !== 'SUPER_ADMIN' ? (
            <p className="executive-empty">Governance activity is available to administrators.</p>
          ) : activityError ? (
            <p className="executive-empty">Governance activity could not be loaded.</p>
          ) : recentLogs.length === 0 ? (
            <p className="executive-empty">No recent activity to display.</p>
          ) : (
            <div className="executive-activity-list">
              {recentLogs.map((log) => (
                <div className="executive-activity-row" key={log.id}>
                  <span className="executive-activity-icon">{log.action.slice(0, 3)}</span>
                  <div><strong>{statusLabel(log.action)} <span>on {log.entity}</span></strong><small>{log.user_email || 'System'}{log.ip_address ? ` · ${log.ip_address}` : ''}</small></div>
                  <time>{new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="executive-info-column">
          <section className="executive-panel executive-framework">
            <div className="executive-framework-title"><Award size={16} /><span>GFR 2017 INNOVATION FRAMEWORK</span></div>
            <h3>Transparent innovation procurement</h3>
            <p>Stage-based evaluation and field validation help departments advance eligible innovations through a clear procurement pathway.</p>
            <div className="executive-framework-footer"><span>Scale assessment threshold</span><strong>Score ≥ 80%</strong></div>
          </section>

          {canAccessApplications && <section className="executive-panel executive-next-action">
            <h3><Clock3 size={15} /> Next Pending Action</h3>
            {reviewsError ? <p>Pending review records are unavailable.</p> : pendingReviews.length === 0 ? (
              <p>No proposals are currently awaiting screening or evaluation.</p>
            ) : (
              <>
                <p><strong>{pendingReviews[0].proposal_title}</strong>{pendingReviews[0].company_name ? ` — ${pendingReviews[0].company_name}` : ''} is awaiting {statusLabel(pendingReviews[0].status).toLowerCase()}.</p>
                <button onClick={() => onNavigate('applications')}>Review proposal <ArrowRight size={14} /></button>
              </>
            )}
          </section>}
        </aside>
      </section>
    </div>
  );
}
