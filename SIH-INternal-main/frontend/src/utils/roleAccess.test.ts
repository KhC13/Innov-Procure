import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canAccessTab,
  canApplyToChallenge,
  canCreateChallenge,
  defaultTabByRole,
  roleTabs,
} from './roleAccess';
import type { UserRole } from '../types';

describe('workspace role access', () => {
  const expectedTabs: Record<UserRole, readonly string[]> = {
    GOVERNMENT_OFFICER: ['dashboard', 'problems', 'startups', 'ai-matching'],
    STARTUP: ['problems'],
    EVALUATOR: ['applications', 'startups'],
    PROCUREMENT_OFFICER: ['pilots', 'startups'],
    SUPER_ADMIN: ['dashboard', 'problems', 'ai-matching', 'startups', 'applications', 'pilots', 'procurement', 'audit'],
  };

  it('matches the requested module list for every role', () => {
    for (const role of Object.keys(expectedTabs) as UserRole[]) {
      assert.deepEqual(roleTabs[role], expectedTabs[role]);
    }
  });

  it('starts each role at an allowed module', () => {
    for (const role of Object.keys(defaultTabByRole) as UserRole[]) {
      assert.ok(canAccessTab(role, defaultTabByRole[role]));
    }
  });

  it('rejects unknown modules and roles without access', () => {
    assert.equal(canAccessTab('STARTUP', 'ai-matching'), false);
    assert.equal(canAccessTab('EVALUATOR', 'dashboard'), false);
    assert.equal(canAccessTab('PROCUREMENT_OFFICER', 'audit'), false);
    assert.equal(canAccessTab('GOVERNMENT_OFFICER', 'unknown'), false);
    assert.equal(canAccessTab(null, 'problems'), false);
  });

  it('limits challenge actions to the roles that use them', () => {
    assert.equal(canCreateChallenge('GOVERNMENT_OFFICER'), true);
    assert.equal(canCreateChallenge('SUPER_ADMIN'), true);
    assert.equal(canCreateChallenge('STARTUP'), false);
    assert.equal(canApplyToChallenge('STARTUP'), true);
    assert.equal(canApplyToChallenge('SUPER_ADMIN'), true);
    assert.equal(canApplyToChallenge('GOVERNMENT_OFFICER'), false);
  });
});
