/*
 * Scripted REST API resource: POST .../identity_findings/finding
 *
 * Illustrative example (Pass 1). Unit-tested against stubbed Glide APIs in
 * Node, not yet proven on a live instance. Paste into a Scripted REST
 * resource (HTTP method POST) on the "identity_findings" API.
 *
 * Accepts two kinds of payload (see the README's data contract):
 *   kind = "finding"         a typed identity finding, from a SailPoint ISC
 *                            workflow or from the drift reconciliation client
 *   kind = "closure_signal"  SailPoint reported a provisioning action; this
 *                            is NOT closure: it moves matching findings to
 *                            "Awaiting verification" so a re-read can close them
 *
 * What it does with a finding:
 *   1. validates the payload (400 on failure);
 *   2. maps severity P1..P4 to priority 1..4 and a due date per the
 *      program's tempo (Book 13: P1 immediate, P2 1 h, P3 24 h, P4 72 h;
 *      program design, not a federal requirement);
 *   3. de-duplicates on (source, subject, drift class, attribute) while a
 *      record is active: a repeat adds a work note and bumps the counter;
 *   4. returns the sys_id (201 on insert, 200 on de-duplication).
 *
 * Written in ES5 so it runs in global or scoped applications.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var TABLE = 'u_identity_finding';
    var AWAITING_STATE = gs.getProperty('x_example_idkit.state.awaiting_verification', '18');
    var DRIFT_CLASSES = ['missing_identity', 'stale_access', 'orphan_account', 'attribute_drift',
        'unauthorized_write', 'credential_drift', 'schema_drift'];
    // Book 03 default severity (High/Medium) expressed on Book 13's scale (design guidance).
    var DEFAULT_SEVERITY = {
        missing_identity: 'P2', stale_access: 'P2', orphan_account: 'P2', unauthorized_write: 'P2',
        credential_drift: 'P2', attribute_drift: 'P3', schema_drift: 'P3'
    };
    var PRIORITY = { P1: '1', P2: '2', P3: '3', P4: '4' };
    var WINDOW_SECONDS = { P1: 0, P2: 3600, P3: 86400, P4: 259200 };
    var SYSTEMS = ['isc_account', 'isc_identity', 'entra_user'];
    var MAX_TEXT = 3900;

    function fail(message) {
        response.setError(new sn_ws_err.BadRequestError(message));
    }

    function text(value) {
        if (value === null || value === undefined) {
            return '';
        }
        var out = typeof value === 'string' ? value : JSON.stringify(value);
        return out.length > MAX_TEXT ? out.substring(0, MAX_TEXT) : out;
    }

    function isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }

    // Derive the intended state from a SailPoint native-change event: the
    // out-of-band write is reverted (old values back, added entitlements gone).
    function intendedFromNativeChange(body) {
        var intended = { attributes: {}, entitlements_absent: [], entitlements_present: [] };
        var i, j, change;
        var single = isArray(body.single_value_changes) ? body.single_value_changes : [];
        for (i = 0; i < single.length; i++) {
            intended.attributes[single[i].name] = single[i].oldValue;
        }
        // Multivalued non-entitlement attributes (multiValueAttributeChanges):
        // values added out of band must go, values removed must come back.
        var multi = isArray(body.multi_value_changes) ? body.multi_value_changes : [];
        for (i = 0; i < multi.length; i++) {
            change = multi[i];
            for (j = 0; change.addedValues && j < change.addedValues.length; j++) {
                intended.entitlements_absent.push({ attribute: change.name, value: change.addedValues[j] });
            }
            for (j = 0; change.removedValues && j < change.removedValues.length; j++) {
                intended.entitlements_present.push({ attribute: change.name, value: change.removedValues[j] });
            }
        }
        var ents = isArray(body.entitlement_changes) ? body.entitlement_changes : [];
        for (i = 0; i < ents.length; i++) {
            change = ents[i];
            for (j = 0; change.added && j < change.added.length; j++) {
                intended.entitlements_absent.push({ attribute: change.attributeName, value: change.added[j].value });
            }
            for (j = 0; change.removed && j < change.removed.length; j++) {
                intended.entitlements_present.push({ attribute: change.attributeName, value: change.removed[j].value });
            }
        }
        return intended;
    }

    function intendedFromAttributeChange(body) {
        var intended = { attributes: {} };
        var changes = isArray(body.changes) ? body.changes : [];
        for (var i = 0; i < changes.length; i++) {
            intended.attributes[changes[i].attribute] = changes[i].newValue;
        }
        return intended;
    }

    function normalize(body) {
        var f = {
            source: body.source,
            drift_class: body.drift_class,
            severity: body.severity || DEFAULT_SEVERITY[body.drift_class],
            system: body.system,
            account_id: body.account_id || '',
            identity_id: body.identity_id || '',
            employee_id: body.employee_id || '',
            native_identity: body.native_identity || '',
            source_id: body.source_id || '',
            source_name: body.source_name || '',
            attribute: body.attribute || '',
            expected_value: body.expected_value,
            observed_value: body.observed_value,
            intended_state: body.intended_state,
            origin: body.origin,
            detected_at: body.detected_at || '',
            object_name: body.object_name || body.identity_name || ''
        };
        if (!f.system) {
            f.system = f.account_id ? 'isc_account' : (f.identity_id ? 'isc_identity' : '');
        }
        if (!f.intended_state && body.single_value_changes !== undefined) {
            f.intended_state = intendedFromNativeChange(body);
        }
        if (!f.intended_state && isArray(body.changes)) {
            f.intended_state = intendedFromAttributeChange(body);
            var names = [];
            for (var i = 0; i < body.changes.length; i++) {
                names.push(body.changes[i].attribute);
            }
            f.attribute = f.attribute || names.join(',');
            f.observed_value = f.observed_value === undefined ? body.changes : f.observed_value;
        }
        f.subject_id = body.subject_id || f.account_id || f.identity_id || f.employee_id;
        return f;
    }

    function validateFinding(f) {
        if (!f.source) { return 'source is required'; }
        if (DRIFT_CLASSES.indexOf(f.drift_class) < 0) { return 'drift_class must be one of ' + DRIFT_CLASSES.join(', '); }
        if (!PRIORITY[f.severity]) { return 'severity must be P1, P2, P3 or P4'; }
        if (!f.subject_id) { return 'one of account_id, identity_id, subject_id or employee_id is required'; }
        if (f.system && SYSTEMS.indexOf(f.system) < 0) { return 'system must be one of ' + SYSTEMS.join(', '); }
        if (!f.origin) { return 'origin is required (the trigger id and event, or the drift finding id)'; }
        return '';
    }

    function dueDate(severity) {
        var due = new GlideDateTime();
        due.addSeconds(WINDOW_SECONDS[severity]);
        return due;
    }

    function createFinding(body) {
        var f = normalize(body);
        var problem = validateFinding(f);
        if (problem) {
            fail(problem);
            return;
        }
        // The attribute is part of the key: two attributes drifting on one
        // subject are two pieces of work, each with its own intended state.
        var key = [f.source, f.subject_id, f.drift_class].join('|') + (f.attribute ? '|' + f.attribute : '');
        var existing = new GlideRecord(TABLE);
        existing.addActiveQuery();
        existing.addQuery('u_dedupe_key', key);
        existing.setLimit(1);
        existing.query();
        if (existing.next()) {
            var count = parseInt(existing.getValue('u_occurrences') || '1', 10) + 1;
            existing.setValue('u_occurrences', count);
            existing.setValue('u_last_seen', new GlideDateTime());
            existing.work_notes = 'Seen again (' + count + '): ' + text(f.origin);
            existing.update();
            response.setStatus(200);
            response.setBody({ sys_id: existing.getUniqueValue(), number: existing.getValue('number'),
                deduplicated: true, occurrences: count });
            return;
        }
        var gr = new GlideRecord(TABLE);
        gr.initialize();
        gr.setValue('short_description', f.drift_class + ' ' + (f.object_name || f.subject_id) +
            (f.attribute ? ' (' + f.attribute + ')' : ''));
        gr.setValue('u_source', f.source);
        gr.setValue('u_drift_class', f.drift_class);
        gr.setValue('u_system', f.system);
        gr.setValue('u_subject_id', f.subject_id);
        gr.setValue('u_account_id', f.account_id);
        gr.setValue('u_identity_id', f.identity_id);
        gr.setValue('u_employee_id', f.employee_id);
        gr.setValue('u_native_identity', f.native_identity);
        gr.setValue('u_source_id', f.source_id);
        gr.setValue('u_source_name', f.source_name);
        gr.setValue('u_attribute', f.attribute);
        gr.setValue('u_expected_value', text(f.expected_value));
        gr.setValue('u_observed_value', text(f.observed_value));
        gr.setValue('u_intended_state', text(f.intended_state || {}));
        gr.setValue('u_origin', text(f.origin));
        gr.setValue('u_detected_at', f.detected_at);
        gr.setValue('u_dedupe_key', key);
        gr.setValue('u_occurrences', 1);
        gr.setValue('u_severity', f.severity);
        gr.setValue('priority', PRIORITY[f.severity]);
        gr.setValue('due_date', dueDate(f.severity));
        gr.setValue('u_raw_event', text(body.evidence || body));
        var sysId = gr.insert();
        if (!sysId) {
            response.setError(new sn_ws_err.ServiceError());
            return;
        }
        response.setStatus(201);
        response.setBody({ sys_id: sysId, number: gr.getValue('number'), deduplicated: false,
            priority: PRIORITY[f.severity], severity: f.severity });
    }

    function successful(result) {
        var r = String(result || '').toUpperCase();
        return r === 'SUCCESS' || r === 'COMMITTED';
    }

    // Provisioning Completed: a success response is not closure (Book 13,
    // clause 4). Matching findings move to Awaiting verification and wait
    // for the re-read client.
    function closureSignal(body) {
        if (!body.recipient_id || !isArray(body.account_requests)) {
            fail('closure_signal needs recipient_id and account_requests');
            return;
        }
        var moved = [];
        var noted = [];
        for (var i = 0; i < body.account_requests.length; i++) {
            var req = body.account_requests[i];
            var gr = new GlideRecord(TABLE);
            gr.addActiveQuery();
            gr.addQuery('u_identity_id', body.recipient_id);
            if (req.source && req.source.id) {
                gr.addQuery('u_source_id', req.source.id);
            }
            gr.addQuery('state', '!=', AWAITING_STATE);
            gr.query();
            while (gr.next()) {
                if (successful(req.provisioningResult)) {
                    gr.setValue('state', AWAITING_STATE);
                    gr.setValue('u_awaiting_since', new GlideDateTime());
                    gr.work_notes = 'SailPoint reported provisioning ' + req.provisioningResult + ' (tracking ' +
                        (body.tracking_number || 'n/a') + '). Awaiting a re-read before close.';
                    moved.push(gr.getUniqueValue());
                } else {
                    gr.work_notes = 'SailPoint reported provisioning ' + (req.provisioningResult || 'unknown') +
                        ' (tracking ' + (body.tracking_number || 'n/a') + '): ' + text(body.errors);
                    noted.push(gr.getUniqueValue());
                }
                gr.update();
            }
        }
        response.setStatus(200);
        response.setBody({ moved_to_awaiting_verification: moved, noted: noted });
    }

    var body = request.body ? request.body.data : null;
    if (!body || typeof body !== 'object' || isArray(body)) {
        fail('Expected a JSON object');
        return;
    }
    var kind = body.kind || 'finding';
    if (kind === 'finding') {
        createFinding(body);
    } else if (kind === 'closure_signal') {
        closureSignal(body);
    } else {
        fail('kind must be finding or closure_signal');
    }
})(request, response);
