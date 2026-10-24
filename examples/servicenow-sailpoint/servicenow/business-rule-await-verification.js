/*
 * Business rule: "Close only on a re-read" (closes Gap 1).
 *
 * Illustrative example (Pass 1). Unit-tested against stubbed Glide APIs in
 * Node, not yet proven on a live instance.
 *
 * Configure one business rule per table with these settings:
 *   Table:     u_identity_finding  (and, optionally, incident / sc_req_item
 *              for tickets SailPoint's Service Desk integration creates)
 *   When:      before      Update: checked      Order: 1000
 *   Condition: current.state.changes()
 *   Advanced:  checked, with this script
 *
 * Rule: when someone sets a closed state, the record goes to
 * "Awaiting verification" instead, unless the same update carries re-read
 * evidence (u_evidence_hash changes) AND is made by the verifier service
 * account. A ticket status is not a re-read (Book 13, clause 4). A named
 * exception approver may still cancel a record with a close note: that is
 * the declared-exception lane, and it stays on the record.
 *
 * System properties (program design; create them in your instance):
 *   x_example_idkit.state.awaiting_verification   custom state value, default 18
 *   x_example_idkit.verifier_user                 user_name of the re-read client's account
 *   x_example_idkit.exception_role                role allowed to cancel with a note
 *   x_example_idkit.sdim_user_sys_id              sys_id of the SDIM integration user
 *   x_example_idkit.closed_states.<table>         comma-separated closed state values
 *   x_example_idkit.cancel_states.<table>         comma-separated cancel state values
 *
 * Written in ES5 so it runs in global or scoped applications.
 */
(function executeRule(current, previous /*null when async*/) {
    var DEFAULT_CLOSED = { u_identity_finding: '3,4,7', incident: '6,7', sc_req_item: '3,4,7' };
    var DEFAULT_CANCEL = { u_identity_finding: '7', incident: '8', sc_req_item: '7' };

    function list(value) {
        var out = [];
        var parts = String(value || '').split(',');
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i].replace(/^\s+|\s+$/g, '');
            if (p) { out.push(p); }
        }
        return out;
    }

    var table = current.getTableName();
    var closed = list(gs.getProperty('x_example_idkit.closed_states.' + table, DEFAULT_CLOSED[table] || '3,4,7'));
    var cancel = list(gs.getProperty('x_example_idkit.cancel_states.' + table, DEFAULT_CANCEL[table] || '7'));
    var awaiting = gs.getProperty('x_example_idkit.state.awaiting_verification', '18');
    var verifier = gs.getProperty('x_example_idkit.verifier_user', '');
    var exceptionRole = gs.getProperty('x_example_idkit.exception_role', 'x_example_idkit.exception_approver');
    var sdimUser = gs.getProperty('x_example_idkit.sdim_user_sys_id', '');

    var newState = String(current.getValue('state'));
    if (!current.state.changes() || closed.indexOf(newState) < 0) {
        return;
    }
    // On ticket tables, only govern tickets SailPoint's Service Desk integration opened.
    if (table !== 'u_identity_finding') {
        if (!sdimUser || String(current.getValue('opened_by')) !== sdimUser) {
            return;
        }
    }
    var hasEvidence = current.isValidField('u_evidence_hash') && !!current.getValue('u_evidence_hash') &&
        current.u_evidence_hash.changes();
    if (hasEvidence && verifier && gs.getUserName() === verifier) {
        return; // closed by the re-read client with evidence: allowed
    }
    if (cancel.indexOf(newState) >= 0 && gs.hasRole(exceptionRole) && !!current.getValue('close_notes')) {
        current.work_notes = 'Cancelled by ' + gs.getUserName() + ' under the declared-exception lane: ' +
            current.getValue('close_notes');
        return;
    }
    current.setValue('state', awaiting);
    if (current.isValidField('u_awaiting_since')) {
        current.setValue('u_awaiting_since', new GlideDateTime());
    }
    current.work_notes = 'Close requested by ' + gs.getUserName() + ' (state ' + newState + '). ' +
        'Moved to Awaiting verification: only a re-read of the target system closes this record.';
    gs.addInfoMessage('This record closes only when a re-read of the target system confirms the change. ' +
        'It is now Awaiting verification.');
})(current, previous);
