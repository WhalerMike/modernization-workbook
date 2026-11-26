# Copilot prompts for the platform host kit

The kit ships neutral, fictional settings under `contoso`. The agency's own settings file (its host name, paths, service account and webhook receivers), the snapshots and the evidence are filled and kept at work, on agency storage, and never committed to this public repository. These prompts are for Microsoft 365 Copilot Chat in the agency's own tenant. Paste the file, then the prompt. Review every answer: Copilot drafts, a person decides.

## Fill the settings file

> Using the attached `settings.template.json`, draft a settings file for our `<test-or-production>` platform host from the attached build record. Fill only values that appear in the record; leave any value you can't find as it is in the template and list it at the end. Keep `allowSelfSigned` false and `requireArc` true unless the record says Arc isn't connected yet. The service account must be the gMSA named on the request, with the domain (`CORP\name$`) in `serviceAccount` and `serviceAccountAcl` and without it in `runUser`. Don't add any password, token or secret.

## Read a check run

> This is our platform host's `results.json` from the interface check. List every check whose status is `Finding`, with its detail, and for each say which interface in Book 10, Appendix B it belongs to (the `Interface` column). Then list the `NotChecked` rows and their reasons. Don't suggest a fix and don't call any finding acceptable.

## Compare two runs

> These are two `results.json` files from the platform host's interface check, the first from `<date>` and the second from `<date>`. List each check whose status or detail changed between them, old and new side by side. Say in one sentence whether anything new appeared that wasn't there before.

## Check the release manifest before an upgrade

> This is our platform host's `release-manifest.json` and the release notes for the new Gitea version (attached). List what the upgrade changes in the manifest: the version, the URL and where the new SHA-256 comes from. Say whether the release notes mention any change to configuration keys we set in `app.ini` (attached, secrets removed). Don't write the new hash yourself: a person copies it from the release's own `.sha256` file.
