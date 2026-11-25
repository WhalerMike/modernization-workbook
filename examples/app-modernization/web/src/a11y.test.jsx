import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import App from './App.jsx';
import { PROPOSAL, fakeService } from './fakeService.js';

/*
 * An automated accessibility check of each screen state, with axe-core's WCAG 2.0 Level A and AA rules:
 * the level the Revised 508 Standards require. It writes out/a11y-report.json for the evidence record
 * (or a11y-report.json in the folder the A11Y_REPORT_DIR environment variable names).
 *
 * What it can't do: decide conformance. Automated rules find some failures; keyboard-only use, a screen
 * reader, magnification and the error paths still need a trained tester (Book 18, Chapter 06).
 * jsdom doesn't lay out or paint, so color contrast is checked in a browser, not here.
 */
const TAGS = ['wcag2a', 'wcag2aa'];
const OFF = { 'color-contrast': 'jsdom has no layout or paint; check contrast in a browser' };
const report = { standard: 'WCAG 2.0 Level A and AA (axe-core tags wcag2a, wcag2aa)', engine: `axe-core ${axe.version}`, rulesOff: OFF, states: [] };

async function check(state) {
  const result = await axe.run(document.body, {
    runOnly: { type: 'tag', values: TAGS },
    rules: Object.fromEntries(Object.keys(OFF).map((r) => [r, { enabled: false }])),
    resultTypes: ['violations'],
  });
  report.states.push({
    state,
    violations: result.violations.map((v) => ({ rule: v.id, impact: v.impact, wcag: v.tags.filter((t) => /^wcag\d{3,}$/.test(t)), nodes: v.nodes.length })),
  });
  return result.violations;
}

describe('Accessibility (automated rules only)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  afterAll(() => {
    const dir = process.env.A11Y_REPORT_DIR || 'out';
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a11y-report.json'), JSON.stringify(report, null, 2) + '\n');
  });

  it('the case list has no WCAG 2.0 A or AA rule violations', async () => {
    vi.stubGlobal('fetch', fakeService());
    render(<App />);
    await screen.findByText('C-000003');
    expect(await check('case list')).toEqual([]);
  });

  it('a case with the agent result and a pending proposal has none', async () => {
    vi.stubGlobal('fetch', fakeService());
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'C-000001' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Run triage' }));
    await screen.findByRole('button', { name: 'Approve proposal 7' });
    expect(await check('case detail, agent result and pending proposal')).toEqual([]);
  });

  it('the not-found message has none', async () => {
    vi.stubGlobal('fetch', fakeService({ pending: [PROPOSAL] }));
    render(<App />);
    await userEvent.type(screen.getByLabelText('Case number'), 'C-999999');
    await userEvent.click(screen.getByRole('button', { name: 'Open case' }));
    await screen.findByRole('alert');
    expect(await check('case not found')).toEqual([]);
  });

  it('catches a control with no name, so a clean result means something', async () => {
    document.body.innerHTML = '<main><h1>Probe</h1><button type="button"></button><input type="text"></main>';
    const violations = await check('probe: unnamed button and unlabeled input (expected to fail)');
    expect(violations.map((v) => v.id)).toEqual(expect.arrayContaining(['button-name', 'label']));
    document.body.innerHTML = '';
  });
});
