// Runs the two ServiceNow scripts in a Node vm with stubbed Glide APIs.
// Usage: node --test tests/servicenow/servicenow_scripts.test.js
// The stubs model only what the scripts call; they are not ServiceNow.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const KIT = path.resolve(__dirname, '..', '..');
const REST = fs.readFileSync(path.join(KIT, 'servicenow', 'scripted-rest-identity-finding.js'), 'utf8');
const RULE = fs.readFileSync(path.join(KIT, 'servicenow', 'business-rule-await-verification.js'), 'utf8');
const NOW = 1_800_000_000_000;

function makeDb() {
  const rows = [];
  let seq = 0;
  class GlideRecord {
    constructor(table) { this.table = table; this.filters = []; this.cursor = -1; this.results = []; this.values = {}; }
    initialize() { this.values = {}; }
    addActiveQuery() { this.filters.push((r) => r.active !== false); }
    addQuery(field, op, value) {
      if (value === undefined) { value = op; op = '='; }
      this.filters.push((r) => (op === '!=' ? String(r[field]) !== String(value) : String(r[field]) === String(value)));
    }
    setLimit(n) { this.limit = n; }
    query() {
      this.results = rows.filter((r) => r.table === this.table && this.filters.every((f) => f(r)));
      if (this.limit) this.results = this.results.slice(0, this.limit);
    }
    next() { this.cursor += 1; if (this.cursor < this.results.length) { this.values = this.results[this.cursor]; return true; } return false; }
    getValue(f) { const v = this.values[f]; return v === undefined || v === null ? null : String(v); }
    setValue(f, v) { this.values[f] = v && v.isGdt ? v.toString() : v; }
    set work_notes(v) { this.values.work_notes = (this.values.work_notes || []).concat([v]); }
    get work_notes() { return this.values.work_notes; }
    getUniqueValue() { return this.values.sys_id; }
    insert() { seq += 1; this.values.sys_id = 'sys' + seq; this.values.number = 'IDF' + String(seq).padStart(7, '0'); this.values.table = this.table; this.values.active = true; this.values.state = this.values.state || '1'; rows.push(this.values); return this.values.sys_id; }
    update() { return this.values.sys_id; }
  }
  class GlideDateTime {
    constructor() { this.ms = NOW; this.isGdt = true; }
    addSeconds(s) { this.ms += s * 1000; }
    toString() { return new Date(this.ms).toISOString().replace('T', ' ').substring(0, 19); }
  }
  return { rows, GlideRecord, GlideDateTime };
}

function runRest(body, props = {}) {
  const db = makeDb();
  return runRestWith(db, body, props);
}

function runRestWith(db, body, props = {}) {
  const res = { status: null, body: null, error: null };
  const ctx = {
    request: { body: { data: body } },
    response: { setStatus: (s) => { res.status = s; }, setBody: (b) => { res.body = b; }, setError: (e) => { res.error = e; res.status = e.status; } },
    GlideRecord: db.GlideRecord,
    GlideDateTime: db.GlideDateTime,
    gs: { getProperty: (k, d) => (k in props ? props[k] : d) },
    sn_ws_err: {
      BadRequestError: function BadRequestError(m) { this.status = 400; this.message = m; },
      ServiceError: function ServiceError() { this.status = 500; },
    },
  };
  vm.runInNewContext(REST, ctx);
  return { res, db };
}

const NCD = {
  kind: 'finding', source: 'sailpoint-isc', drift_class: 'unauthorized_write',
  origin: { trigger_id: 'idn:native-change-account-updated' },
  account_id: 'acc1', identity_id: 'id1', source_id: 'src-ad', source_name: 'Corp AD',
  native_identity: 'CN=Ann,OU=Users,DC=contoso,DC=example',
  single_value_changes: [{ name: 'title', oldValue: 'Manager', newValue: 'Representative' }],
  entitlement_changes: [{ attributeName: 'memberOf', added: [{ value: 'CN=Payables' }], removed: [{ value: 'CN=Receivables' }] }],
};

test('creates a finding with priority and due date from severity', () => {
  const { res, db } = runRest(NCD);
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.severity, 'P2');
  const row = db.rows[0];
  assert.strictEqual(row.priority, '2');
  assert.strictEqual(row.due_date, new Date(NOW + 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19));
  assert.strictEqual(row.u_system, 'isc_account');
  assert.strictEqual(row.u_dedupe_key, 'sailpoint-isc|acc1|unauthorized_write');
  const intended = JSON.parse(row.u_intended_state);
  assert.deepStrictEqual(intended.attributes, { title: 'Manager' });
  assert.deepStrictEqual(intended.entitlements_absent, [{ attribute: 'memberOf', value: 'CN=Payables' }]);
  assert.deepStrictEqual(intended.entitlements_present, [{ attribute: 'memberOf', value: 'CN=Receivables' }]);
});

test('tempo windows: P1 immediate, P3 24h, P4 72h', () => {
  for (const [sev, secs, prio] of [['P1', 0, '1'], ['P3', 86400, '3'], ['P4', 259200, '4']]) {
    const { db } = runRest({ ...NCD, severity: sev });
    assert.strictEqual(db.rows[0].priority, prio);
    assert.strictEqual(db.rows[0].due_date, new Date(NOW + secs * 1000).toISOString().replace('T', ' ').substring(0, 19));
  }
});

test('de-duplicates an open finding on (source, subject, class)', () => {
  const db = makeDb();
  const first = runRestWith(db, NCD).res;
  const second = runRestWith(db, NCD).res;
  assert.strictEqual(first.status, 201);
  assert.strictEqual(second.status, 200);
  assert.strictEqual(second.body.deduplicated, true);
  assert.strictEqual(second.body.sys_id, first.body.sys_id);
  assert.strictEqual(db.rows.length, 1);
  assert.strictEqual(db.rows[0].u_occurrences, 2);
  db.rows[0].active = false;
  assert.strictEqual(runRestWith(db, NCD).res.status, 201);
});

test('attribute-change event becomes attribute drift on the identity', () => {
  const { res, db } = runRest({ kind: 'finding', source: 'sailpoint-isc', drift_class: 'attribute_drift',
    origin: { trigger_id: 'idn:identity-attributes-changed' }, identity_id: 'id9',
    changes: [{ attribute: 'department', oldValue: 'sales', newValue: 'marketing' }] });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(db.rows[0].u_system, 'isc_identity');
  assert.strictEqual(db.rows[0].priority, '3');
  assert.strictEqual(db.rows[0].u_attribute, 'department');
});

test('validation failures return 400', () => {
  for (const bad of [[], { ...NCD, drift_class: 'nope' }, { ...NCD, severity: 'P9' },
    { ...NCD, origin: undefined }, { ...NCD, account_id: '', identity_id: '' }, { kind: 'other' },
    { ...NCD, source: '' }, { ...NCD, system: 'mainframe' }]) {
    const { res, db } = runRest(bad);
    assert.strictEqual(res.status, 400, JSON.stringify(bad));
    assert.strictEqual(db.rows.length, 0);
  }
});

test('closure signal moves matching findings to awaiting verification, never closed', () => {
  const db = makeDb();
  runRestWith(db, NCD);
  const { res } = runRestWith(db, { kind: 'closure_signal', tracking_number: 't1', recipient_id: 'id1',
    account_requests: [{ source: { id: 'src-ad' }, provisioningResult: 'SUCCESS' }] });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.moved_to_awaiting_verification.length, 1);
  assert.strictEqual(db.rows[0].state, '18');
  assert.ok(db.rows[0].u_awaiting_since);
});

test('failed provisioning only adds a note', () => {
  const db = makeDb();
  runRestWith(db, NCD);
  const { res } = runRestWith(db, { kind: 'closure_signal', recipient_id: 'id1', errors: ['Connector AD Failed'],
    account_requests: [{ source: { id: 'src-ad' }, provisioningResult: 'FAILED' }] });
  assert.strictEqual(res.body.noted.length, 1);
  assert.strictEqual(db.rows[0].state, '1');
});

// ---------------- business rule ----------------

function runRule({ table = 'u_identity_finding', state, prevState = '18', user = 'agent.smith', evidenceChanged = false,
  evidence = '', roles = [], closeNotes = '', openedBy = '', props = {} }) {
  const db = makeDb();
  const values = { state, u_evidence_hash: evidence, close_notes: closeNotes, opened_by: openedBy };
  const notes = [];
  const info = [];
  const current = {
    getTableName: () => table,
    getValue: (f) => (values[f] === undefined ? null : values[f]),
    setValue: (f, v) => { values[f] = v && v.isGdt ? v.toString() : v; },
    isValidField: (f) => table === 'u_identity_finding' || f !== 'u_awaiting_since',
    state: { changes: () => state !== prevState },
    u_evidence_hash: { changes: () => evidenceChanged },
    set work_notes(v) { notes.push(v); },
  };
  const ctx = {
    current, previous: { state: prevState }, GlideDateTime: db.GlideDateTime,
    gs: {
      getProperty: (k, d) => (k in props ? props[k] : d),
      getUserName: () => user,
      hasRole: (r) => roles.includes(r),
      addInfoMessage: (m) => info.push(m),
    },
  };
  vm.runInNewContext(RULE, ctx);
  return { values, notes, info };
}

const VERIFIER = { 'x_example_idkit.verifier_user': 'svc.reread' };

test('a person closing a finding is redirected to awaiting verification', () => {
  const { values, notes, info } = runRule({ state: '3', prevState: '2', props: VERIFIER });
  assert.strictEqual(values.state, '18');
  assert.ok(values.u_awaiting_since);
  assert.match(notes[0], /re-read/);
  assert.strictEqual(info.length, 1);
});

test('the verifier with fresh evidence may close', () => {
  const { values } = runRule({ state: '3', user: 'svc.reread', evidence: 'abc', evidenceChanged: true, props: VERIFIER });
  assert.strictEqual(values.state, '3');
});

test('evidence alone, or the verifier alone, is not enough', () => {
  assert.strictEqual(runRule({ state: '3', user: 'agent.smith', evidence: 'abc', evidenceChanged: true, props: VERIFIER }).values.state, '18');
  assert.strictEqual(runRule({ state: '3', user: 'svc.reread', evidence: 'abc', evidenceChanged: false, props: VERIFIER }).values.state, '18');
});

test('exception approver may cancel with a close note', () => {
  const { values, notes } = runRule({ state: '7', roles: ['x_example_idkit.exception_approver'], closeNotes: 'False positive: test account', props: VERIFIER });
  assert.strictEqual(values.state, '7');
  assert.match(notes[0], /declared-exception/);
  assert.strictEqual(runRule({ state: '7', roles: ['x_example_idkit.exception_approver'], props: VERIFIER }).values.state, '18');
});

test('non-closing changes are untouched', () => {
  assert.strictEqual(runRule({ state: '2', prevState: '1' }).values.state, '2');
});

test('on incident, only SDIM-opened tickets are governed', () => {
  const props = { ...VERIFIER, 'x_example_idkit.sdim_user_sys_id': 'sdim-user' };
  assert.strictEqual(runRule({ table: 'incident', state: '6', prevState: '2', openedBy: 'someone', props }).values.state, '6');
  assert.strictEqual(runRule({ table: 'incident', state: '6', prevState: '2', openedBy: 'sdim-user', props }).values.state, '18');
});
