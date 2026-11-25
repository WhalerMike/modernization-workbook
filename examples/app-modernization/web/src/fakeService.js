import { vi } from 'vitest';

/** Test data and a fake service for the component tests (App.test.jsx, a11y.test.jsx). */

export const CASES = [
  { caseNumber: 'C-000003', applicantName: 'Applicant-0002, Test', stateCode: 'XB', caseType: 'DEF', status: 'OPEN',
    openedOn: '2026-09-01', closedOn: null, amountClaimed: 250.5, updatedAt: '2026-09-01T12:00:00Z' },
  { caseNumber: 'C-000001', applicantName: 'Applicant-0001, Test', stateCode: 'XA', caseType: 'ABC', status: 'OPEN',
    openedOn: '2025-06-01', closedOn: null, amountClaimed: 100, updatedAt: '2025-06-01T12:00:00Z' },
  { caseNumber: 'C-000005', applicantName: 'Applicant-0001, Test', stateCode: 'XA', caseType: 'GHI', status: 'CLOSED',
    openedOn: '2025-01-02', closedOn: '2025-06-30', amountClaimed: 10, updatedAt: '2025-06-30T12:00:00Z' },
];

export const PROPOSAL = {
  id: 7, caseNumber: 'C-000001', agentId: 'agent-case-triage-01', sponsor: 'case-operations-owner',
  action: 'FLAG_FOR_REVIEW', rationale: 'Open more than 365 days (opened 2025-06-01) with no closing date.',
  status: 'PENDING', createdAt: '2026-10-01T00:00:00Z', decidedBy: null, decidedAt: null,
};

function reply(status, body, type = 'application/json') {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => type },
    json: () => Promise.resolve(body),
  });
}

/** A fake service: routes by method and path, records every call. */
export function fakeService({ pending = [] } = {}) {
  let pendingNow = pending;
  return vi.fn((url, options = {}) => {
    const method = options.method || 'GET';
    const u = new URL(url, 'http://localhost');
    if (method === 'GET' && u.pathname === '/api/cases') {
      const status = u.searchParams.get('status');
      return reply(200, status ? CASES.filter((c) => c.status === status) : CASES);
    }
    if (method === 'GET' && u.pathname === '/api/proposals') {
      return reply(200, pendingNow);
    }
    const one = u.pathname.match(/^\/api\/cases\/([^/]+)$/);
    if (method === 'GET' && one) {
      const c = CASES.find((x) => x.caseNumber === decodeURIComponent(one[1]));
      return c
        ? reply(200, c)
        : reply(404, { type: 'about:blank', title: 'Not found', status: 404, detail: `Case ${one[1]} not found` },
            'application/problem+json');
    }
    if (method === 'POST' && u.pathname === '/api/cases/C-000001/triage') {
      pendingNow = [PROPOSAL];
      return reply(200, { caseNumber: 'C-000001', answer: 'Proposed 1 action(s) on case C-000001 for a person to approve or reject.',
        steps: 4, stoppedByStepLimit: false, proposals: [PROPOSAL] });
    }
    if (method === 'POST' && u.pathname === '/api/proposals/7/decision') {
      const body = JSON.parse(options.body);
      pendingNow = [];
      return reply(200, { ...PROPOSAL, status: body.decision, decidedBy: body.decidedBy });
    }
    return reply(500, { title: 'unexpected call ' + method + ' ' + url });
  });
}
