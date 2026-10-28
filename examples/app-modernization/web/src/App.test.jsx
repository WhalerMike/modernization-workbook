import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

const CASES = [
  { caseNumber: 'C-000003', applicantName: 'Applicant-0002, Test', stateCode: 'XB', caseType: 'DEF', status: 'OPEN',
    openedOn: '2026-09-01', closedOn: null, amountClaimed: 250.5, updatedAt: '2026-09-01T12:00:00Z' },
  { caseNumber: 'C-000001', applicantName: 'Applicant-0001, Test', stateCode: 'XA', caseType: 'ABC', status: 'OPEN',
    openedOn: '2025-06-01', closedOn: null, amountClaimed: 100, updatedAt: '2025-06-01T12:00:00Z' },
  { caseNumber: 'C-000005', applicantName: 'Applicant-0001, Test', stateCode: 'XA', caseType: 'GHI', status: 'CLOSED',
    openedOn: '2025-01-02', closedOn: '2025-06-30', amountClaimed: 10, updatedAt: '2025-06-30T12:00:00Z' },
];

const PROPOSAL = {
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
function fakeService({ pending = [] } = {}) {
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

describe('App', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the case list with table headers', async () => {
    vi.stubGlobal('fetch', fakeService());
    render(<App />);

    const table = (await screen.findByText('C-000003')).closest('table');
    expect(within(table).getByRole('columnheader', { name: 'Case number' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(1 + CASES.length);
  });

  it('filters by status', async () => {
    const fetch = fakeService();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await screen.findByText('C-000003');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'CLOSED');

    await waitFor(() => expect(screen.queryByText('C-000003')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'C-000005' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/cases?status=CLOSED', expect.anything());
  });

  it('shows a not-found message for a missing case', async () => {
    vi.stubGlobal('fetch', fakeService());
    render(<App />);

    await userEvent.type(screen.getByLabelText('Case number'), 'C-999999');
    await userEvent.click(screen.getByRole('button', { name: 'Open case' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Case C-999999 was not found.');
  });

  it('runs triage and shows the proposal', async () => {
    vi.stubGlobal('fetch', fakeService());
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'C-000001' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Run triage' }));

    expect(await screen.findByText(/Proposed 1 action/)).toBeInTheDocument();
    const result = screen.getByRole('heading', { name: 'Agent result' }).parentElement;
    expect(within(result).getByText('FLAG_FOR_REVIEW')).toBeInTheDocument();
    expect(within(result).getByText(/Open more than 365 days/)).toBeInTheDocument();
    // The pending panel refreshes too.
    expect(await screen.findByRole('button', { name: 'Approve proposal 7' })).toBeInTheDocument();
  });

  it('approve posts the decision with the reviewer name', async () => {
    const fetch = fakeService({ pending: [PROPOSAL] });
    vi.stubGlobal('fetch', fetch);
    render(<App />);

    const approve = await screen.findByRole('button', { name: 'Approve proposal 7' });
    expect(approve).toBeDisabled(); // a person must name themselves first
    await userEvent.type(screen.getByLabelText('Reviewer name'), 'reviewer-01');
    await userEvent.click(approve);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/proposals/7/decision', expect.objectContaining({ method: 'POST' })),
    );
    const call = fetch.mock.calls.find(([url]) => url === '/api/proposals/7/decision');
    expect(JSON.parse(call[1].body)).toEqual({ decision: 'APPROVED', decidedBy: 'reviewer-01' });
    expect(call[1].headers['Content-Type']).toBe('application/json');
    expect(await screen.findByText('No pending proposals.')).toBeInTheDocument();
  });

  it('reject posts a REJECTED decision', async () => {
    const fetch = fakeService({ pending: [PROPOSAL] });
    vi.stubGlobal('fetch', fetch);
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Reviewer name'), 'reviewer-02');
    await userEvent.click(await screen.findByRole('button', { name: 'Reject proposal 7' }));

    await waitFor(() => {
      const call = fetch.mock.calls.find(([url]) => url === '/api/proposals/7/decision');
      expect(JSON.parse(call[1].body)).toEqual({ decision: 'REJECTED', decidedBy: 'reviewer-02' });
    });
  });
});
