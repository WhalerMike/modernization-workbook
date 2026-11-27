/*
 * Scheduled job (template): every 15 minutes. Clears the one-time secret the pipeline wrote for the
 * verified agent (a temporary password or Temporary Access Pass) once it is older than the limit in
 * config/request-items.json (secretClearMinutes, 120 by default), so it never stays on the ticket.
 * Illustrative; not run on a live instance.
 */
(function clearOneTimeSecrets() {
    var limitMinutes = 120;
    var gr = new GlideRecord('sc_req_item');
    gr.addQuery('u_automation_state', 'done');
    gr.addNotNullQuery('u_one_time_secret');
    gr.addQuery('sys_updated_on', '<', gs.minutesAgo(limitMinutes));
    gr.query();
    while (gr.next()) {
        gr.setValue('u_one_time_secret', '');
        gr.work_notes = 'One-time secret cleared after ' + limitMinutes + ' minutes.';
        gr.update();
    }
})();
