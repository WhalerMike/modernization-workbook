# Inspiration PDF source

`source.html` is the print source for `../expectations-for-public-tech-leadership.pdf`. Regenerate the PDF with
headless Edge or Chrome (Letter, no header or footer):

```powershell
msedge --headless=new --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="docs\inspiration\expectations-for-public-tech-leadership.pdf" "file:///<repo>/docs/inspiration/_pdf/source.html"
```

The page `../index.md` carries the same text as HTML; keep the two in step.
