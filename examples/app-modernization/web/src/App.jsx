import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

const STATUSES = ['OPEN', 'PENDING', 'CLOSED'];

function CaseList({ status, onStatusChange, cases, error, onSelect }) {
  return (
    <section aria-labelledby="cases-heading">
      <h2 id="cases-heading">Cases</h2>
      <label htmlFor="status-filter">Status</label>{' '}
      <select id="status-filter" value={status} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="">All</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p role="alert">{error}</p>}
      <table>
        <caption className="visually-hidden">Cases, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Case number</th>
            <th scope="col">Applicant</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Opened</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.caseNumber}>
              <td>
                <button type="button" className="link" onClick={() => onSelect(c.caseNumber)}>
                  {c.caseNumber}
                </button>
              </td>
              <td>{c.applicantName}</td>
              <td>{c.caseType}</td>
              <td>{c.status}</td>
              <td>{c.openedOn}</td>
              <td className="num">{Number(c.amountClaimed).toFixed(2)}</td>
            </tr>
          ))}
          {cases.length === 0 && (
            <tr>
              <td colSpan={6}>No cases.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function CaseLookup({ onSelect }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="lookup"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSelect(value.trim());
      }}
    >
      <label htmlFor="case-lookup">Case number</label>{' '}
      <input id="case-lookup" value={value} placeholder="C-000001" onChange={(e) => setValue(e.target.value)} />{' '}
      <button type="submit">Open case</button>
    </form>
  );
}

function ProposalItem({ p }) {
  return (
    <li>
      <strong>{p.action}</strong> on {p.caseNumber}: {p.rationale}{' '}
      <span className="muted">
        ({p.status}, proposed by {p.agentId}, sponsor {p.sponsor})
      </span>
    </li>
  );
}

function CaseDetail({ caseNumber, refreshKey, onTriaged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [triage, setTriage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDetail(null);
    api
      .getCase(caseNumber)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setError(e.status === 404 ? `Case ${caseNumber} was not found.` : e.message));
    return () => {
      cancelled = true;
    };
  }, [caseNumber, refreshKey]);

  useEffect(() => setTriage(null), [caseNumber]);

  async function runTriage() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.triage(caseNumber);
      setTriage(result);
      onTriaged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="detail-heading">
      <h2 id="detail-heading">Case {caseNumber}</h2>
      {error && <p role="alert">{error}</p>}
      {detail && (
        <>
          <dl className="detail">
            <dt>Applicant</dt>
            <dd>{detail.applicantName}</dd>
            <dt>Type</dt>
            <dd>{detail.caseType}</dd>
            <dt>Status</dt>
            <dd>{detail.status}</dd>
            <dt>Opened</dt>
            <dd>{detail.openedOn}</dd>
            <dt>Closed</dt>
            <dd>{detail.closedOn || 'Not closed'}</dd>
            <dt>Amount claimed</dt>
            <dd>{Number(detail.amountClaimed).toFixed(2)}</dd>
          </dl>
          <button type="button" onClick={runTriage} disabled={busy}>
            {busy ? 'Running triage...' : 'Run triage'}
          </button>
        </>
      )}
      {triage && (
        <div aria-live="polite" className="triage">
          <h3>Agent result</h3>
          <p>{triage.answer}</p>
          {triage.proposals.length > 0 ? (
            <ul>
              {triage.proposals.map((p) => (
                <ProposalItem key={p.id} p={p} />
              ))}
            </ul>
          ) : (
            <p>No proposals.</p>
          )}
          <p className="muted">Proposals change nothing until a person approves them.</p>
        </div>
      )}
    </section>
  );
}

function PendingProposals({ proposals, error, onDecide }) {
  const [reviewer, setReviewer] = useState('');
  return (
    <section aria-labelledby="pending-heading">
      <h2 id="pending-heading">Pending proposals</h2>
      <label htmlFor="reviewer">Reviewer name</label>{' '}
      <input id="reviewer" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
      {error && <p role="alert">{error}</p>}
      {proposals.length === 0 ? (
        <p>No pending proposals.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Action</th>
              <th scope="col">Rationale</th>
              <th scope="col">Agent</th>
              <th scope="col">Decision</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <tr key={p.id}>
                <td>{p.caseNumber}</td>
                <td>{p.action}</td>
                <td>{p.rationale}</td>
                <td>{p.agentId}</td>
                <td>
                  <button
                    type="button"
                    disabled={!reviewer.trim()}
                    aria-label={`Approve proposal ${p.id}`}
                    onClick={() => onDecide(p.id, 'APPROVED', reviewer.trim())}
                  >
                    Approve
                  </button>{' '}
                  <button
                    type="button"
                    disabled={!reviewer.trim()}
                    aria-label={`Reject proposal ${p.id}`}
                    onClick={() => onDecide(p.id, 'REJECTED', reviewer.trim())}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function App() {
  const [status, setStatus] = useState('');
  const [cases, setCases] = useState([]);
  const [casesError, setCasesError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState([]);
  const [pendingError, setPendingError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCases = useCallback(() => {
    api
      .listCases(status)
      .then((list) => {
        setCases(list);
        setCasesError(null);
      })
      .catch((e) => setCasesError(e.message));
  }, [status]);

  const loadPending = useCallback(() => {
    api
      .pendingProposals()
      .then((list) => {
        setPending(list);
        setPendingError(null);
      })
      .catch((e) => setPendingError(e.message));
  }, []);

  useEffect(loadCases, [loadCases, refreshKey]);
  useEffect(loadPending, [loadPending, refreshKey]);

  async function decide(id, decision, decidedBy) {
    try {
      await api.decide(id, decision, decidedBy);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setPendingError(e.message);
    }
  }

  return (
    <main>
      <header>
        <h1>Case triage</h1>
        <p className="muted">Synthetic data. The agent proposes; a person decides.</p>
      </header>
      <CaseLookup onSelect={setSelected} />
      <div className="layout">
        <CaseList status={status} onStatusChange={setStatus} cases={cases} error={casesError} onSelect={setSelected} />
        {selected && (
          <CaseDetail caseNumber={selected} refreshKey={refreshKey} onTriaged={() => loadPending()} />
        )}
      </div>
      <PendingProposals proposals={pending} error={pendingError} onDecide={decide} />
    </main>
  );
}
