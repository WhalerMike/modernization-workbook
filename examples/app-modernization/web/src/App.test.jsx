import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { CASES, PROPOSAL, fakeService } from './fakeService.js';

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
