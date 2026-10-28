// Thin client for the case service. Errors arrive as RFC 9457 problem details.

export class ApiError extends Error {
  constructor(status, problem) {
    super(problem?.detail || problem?.title || `Request failed with status ${status}`);
    this.status = status;
    this.problem = problem;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  const type = response.headers?.get?.('Content-Type') || '';
  const body = type.includes('json') ? await response.json() : null;
  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body;
}

export const api = {
  listCases: (status) => request(status ? `/api/cases?status=${encodeURIComponent(status)}` : '/api/cases'),
  getCase: (caseNumber) => request(`/api/cases/${encodeURIComponent(caseNumber)}`),
  triage: (caseNumber) => request(`/api/cases/${encodeURIComponent(caseNumber)}/triage`, { method: 'POST' }),
  pendingProposals: () => request('/api/proposals?status=PENDING'),
  decide: (id, decision, decidedBy) =>
    request(`/api/proposals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, decidedBy }),
    }),
};
