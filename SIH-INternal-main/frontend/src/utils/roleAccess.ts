import type { UserRole } from '../types';

export const workspaceTabs = [
  'dashboard',
  'problems',
  'ai-matching',
  'startups',
  'applications',
  'pilots',
  'procurement',
  'audit',
] as const;

export type WorkspaceTab = (typeof workspaceTabs)[number];

export const roleTabs: Record<UserRole, readonly WorkspaceTab[]> = {
  GOVERNMENT_OFFICER: ['dashboard', 'problems', 'startups', 'ai-matching'],
  STARTUP: ['problems'],
  EVALUATOR: ['applications', 'startups'],
  PROCUREMENT_OFFICER: ['pilots', 'startups'],
  SUPER_ADMIN: workspaceTabs,
};

export const defaultTabByRole: Record<UserRole, WorkspaceTab> = {
  GOVERNMENT_OFFICER: 'dashboard',
  STARTUP: 'problems',
  EVALUATOR: 'applications',
  PROCUREMENT_OFFICER: 'pilots',
  SUPER_ADMIN: 'dashboard',
};

const knownTabs: ReadonlySet<string> = new Set(workspaceTabs);

function isWorkspaceTab(tab: string): tab is WorkspaceTab {
  return knownTabs.has(tab);
}

export function canAccessTab(role: UserRole | null | undefined, tab: string): boolean {
  return Boolean(role && isWorkspaceTab(tab) && roleTabs[role].includes(tab));
}

export function canCreateChallenge(role: UserRole | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'GOVERNMENT_OFFICER';
}

export function canApplyToChallenge(role: UserRole | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'STARTUP';
}
