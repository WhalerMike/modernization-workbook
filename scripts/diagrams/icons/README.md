# Microsoft product icons for the diagrams

The diagrams can show Microsoft's own product icons on their cards. A card in a
`*.flow.yaml` source names one with `icon: <name>`:

```yaml
kv: {icon: key-vault, tone: blue, width: 185, title: "Key Vault", body: ["RBAC, purge protection"]}
```

`render.py` draws the icon left of the card's title.

## Where they come from

- `azure/*.svg` are Microsoft's [Azure architecture icons](https://learn.microsoft.com/azure/architecture/icons/), copied unmodified from Microsoft's download (`Azure_Public_Service_Icons_V25.zip`, downloaded November 22, 2026) by `vendor.py`.
- `entra/*.svg` are Microsoft's [Microsoft Entra architecture icons](https://learn.microsoft.com/entra/architecture/architecture-icons) (color set), copied unmodified from `Microsoft Entra architecture icons - Oct 2023.zip` (downloaded November 22, 2026), under the same terms.
- `icons.yml` lists every icon the diagrams may use, by name and by its path in the download.
- `manifest.json` records the download, Microsoft's terms and each file's SHA-256. `scripts/tests/test_diagram_icons.py` fails if a file changes or isn't listed.

## Terms

Microsoft's terms on the icons page: "Microsoft permits the use of these icons in architectural diagrams, training materials, or documentation. You can copy, distribute, and display the icons only for the permitted use unless granted explicit permission by Microsoft. Microsoft reserves all other rights." The workbook uses them only in its diagrams, unmodified, and never as a logo for the workbook itself.

## Adding an icon

1. Find the icon in the download and add `name: folder/file.svg` to `icons.yml`.
2. Run `python scripts/diagrams/icons/vendor.py azure=<Azure zip> entra=<Entra zip>`.
3. Add `icon: <name>` to the card, and render in WSL: `python3 scripts/diagrams/render.py --dir docs/images/diagrams/<series> --only <diagram>`.

The Azure download has Entra, Azure, Arc, Intune, Monitor, Sentinel, Defender for Cloud and Key Vault icons. The Entra download adds Entra ID, ID Governance, Internet Access, Private Access, Verified ID and Workload ID. Microsoft's Microsoft 365 download (2024 content icons) holds generic concept icons, not product icons, so no Purview, Exchange or Teams icon exists to use.
