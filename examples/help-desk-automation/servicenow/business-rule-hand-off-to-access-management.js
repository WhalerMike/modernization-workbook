/*
 * Business rule (template): on sc_req_item, after insert, for the four help desk automation catalog items.
 * Hands the request to the agency's system access management tool, which submits it to SailPoint
 * Identity Security Cloud as a request for the task's access profile (sailpoint/access-profiles.json),
 * and records the access request id SailPoint returns. ServiceNow never approves: SailPoint does (WD-174,
 * WD-182). The pipeline on the platform host re-reads the approval from SailPoint before it acts.
 *
 * Replace x_example_hda.access_management_submit with your instance's outbound REST message to the
 * access management tool. Illustrative; not run on a live instance.
 */
(function executeRule(current, previous /* null when async */) {
    var items = ['Typed user change', 'Password reset', 'Authenticator reset',
                 'Cloud account for a partner or lab user'];
    if (items.indexOf(current.cat_item.getDisplayValue()) < 0) return;

    // A reset waits for the agent's identity verification; the agent sets these fields first.
    var needsVerification = ['Password reset', 'Authenticator reset'].indexOf(current.cat_item.getDisplayValue()) >= 0;
    if (needsVerification && (current.u_identity_verified_by.nil() || current.u_identity_verification_method.nil())) {
        current.work_notes = 'Waiting for identity verification before the request goes to SailPoint for approval.';
        current.u_automation_state = 'awaiting-approval';
        current.update();
        return;
    }

    var rm = new sn_ws.RESTMessageV2('x_example_hda.access_management_submit', 'post');
    rm.setRequestBody(JSON.stringify({
        ticket: current.getValue('number'),
        task: current.cat_item.getDisplayValue(),
        requestedFor: current.requested_for.user_name.toString(),
        requestedBy: current.opened_by.user_name.toString()
    }));
    var response = rm.execute();
    if (response.getStatusCode() !== 200 && response.getStatusCode() !== 201) {
        current.work_notes = 'The access management tool refused the hand-off (HTTP ' + response.getStatusCode() + ').';
        current.u_automation_state = 'failed';
        current.update();
        return;
    }
    var body = JSON.parse(response.getBody());
    current.u_isc_access_request_id = body.accessRequestId;   // SailPoint's id, re-read by the pipeline
    current.u_automation_state = 'ready';                     // the pipeline acts only once SailPoint approves
    current.work_notes = 'Submitted to SailPoint for approval as access request ' + body.accessRequestId + '.';
    current.update();
})(current, previous);
