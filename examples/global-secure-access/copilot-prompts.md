# Copilot prompts for the Global Secure Access kit

The kit ships neutral templates. The agency's own records (decision records, the architecture record, the exception register, the TLS record and the ring record) are filled at work, kept on agency storage, and never committed to this public repository. These prompts are for Microsoft 365 Copilot Chat in the agency's own tenant. Paste the template, then the prompt. Review every answer: Copilot drafts, a person decides.

## Draft a decision record

> Using the attached template `decision-record.template.json`, draft one decision record for the `<function>` function of Global Secure Access. Use only facts from the attached license export (`gsa-01-licenses.csv`) and the attached excerpt of Microsoft Learn's "Known limitations for Global Secure Access" page, quoting its GCC sentence exactly with the date it was read. Leave the approver and approval date as placeholders. If the decision is retain-current or defer, list the compensating controls already in place from the attached architecture notes; don't invent controls.

## Check the exception register

> Here is our exception register (`exceptions.csv`). List every row with no owner, no approver, or an expiry date before `<date>`. For each `custom-bypass` row, say whether the target looks like a certificate-pinned application, a privacy category, or neither. Don't change the file; give me the list.

## Fill the architecture record

> From the attached connector group export and our site list, fill `architecture.template.json`. Each connector group needs at least two hosts; flag any group with fewer. Add our Active Directory forest name to `privateDnsSuffixes`. Leave `cisaTelemetry` empty unless the attached TIC delegate notes give an agreement date.

## Explain a finding

> This finding came from the Global Secure Access kit: `<paste one line of findings.csv>`. In two sentences, say what it means for our rollout and which step of our implementation guide fixes it. Don't recommend enabling any preview feature.
