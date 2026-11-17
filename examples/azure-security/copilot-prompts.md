# Prompts for Microsoft 365 Copilot Chat

Use these at work, in Microsoft 365 Copilot Chat, with your own settings file, register and findings. Never paste them into a public tool, and never commit what they produce to a public or personal repository.

## Fill the settings file

> Here is `deploy/settings.template.json` from the Azure security kit, and a list of our management groups, subscriptions, the platform Log Analytics workspace and the hub virtual network. Fill every `<placeholder>` for our test stage. Use only the IDs I gave you; where I didn't give a value, leave the placeholder and tell me which one is missing. Don't add any secret.

## Read the findings with an owner in mind

> Here is `findings.csv` from one area of the Azure security kit. Group the rows by owner (the `owner` column of the register I've also attached), and for each owner list the Finding rows first, then the Warn rows, each with the rule, the resource name and the detail in one line. Don't invent remediation steps; for each rule, quote the guide step it names.

## Draft an exemption request

> Here is one finding from the Azure security kit and our decision record template. Draft a decision record for an Azure Policy exemption: the category (Mitigated if the intent is met another way, Waiver if non-compliance is accepted for a time), an expiry date no more than 90 days out, the compensating control and its evidence. Mark every value I didn't give you as "to confirm".

## Review the drift report

> Here is `drift.md` from two weekly runs of the Azure security kit. Summarize what was fixed, what is new and which owners the new rows belong to, in five bullet points for the weekly review. Don't change any number.
