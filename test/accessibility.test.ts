import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));

function source(relativePath: string): string {
  return readFileSync(`${root}${relativePath}`, 'utf8');
}

const keyPages = [
  'src/app/page.tsx',
  'src/app/campaigns/page.tsx',
  'src/app/campaigns/[id]/page.tsx',
  'src/app/start/page.tsx',
  'src/app/verifiers/page.tsx',
  'src/app/donors/[address]/page.tsx',
  'src/app/receipts/[txHash]/page.tsx',
];

describe('automated accessibility checks', () => {
  it('includes a keyboard-accessible skip link and one document language', () => {
    const layout = source('src/app/layout.tsx');
    expect(layout).toMatch(/<html\s+lang="en"/);
    expect(layout).toMatch(/href="#main-content"/);
  });

  it.each(keyPages)('%s has a primary heading', (relativePath) => {
    expect(source(relativePath)).toMatch(/<h1\b/);
  });

  it('keeps images on key pages and components from missing alt text', () => {
    const files = [
      ...keyPages,
      'src/components/campaign/CampaignCover.tsx',
      'src/components/campaign/MilestoneLedger.tsx',
      'src/components/campaign/ReleaseFeed.tsx',
      'src/components/forms/VerifierBondPanel.tsx',
    ];

    for (const relativePath of files) {
      const content = source(relativePath);
      const imageTags = content.match(/<img\b[^>]*\/?>/g) ?? [];
      for (const tag of imageTags) {
        expect(tag, `${relativePath}: image is missing alt text`).toMatch(/\balt\s*=/);
      }
    }
  });

  it('gives icon-only and utility buttons an accessible name', () => {
    const files = [
      'src/components/layout/ThemeToggle.tsx',
      'src/components/wallet/WalletButton.tsx',
      'src/components/charts/DonationReleaseChart.tsx',
      'src/components/receipt/ShareReceipt.tsx',
      'src/app/error.tsx',
    ];

    for (const relativePath of files) {
      const content = source(relativePath);
      const buttonTags = content.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
      for (const button of buttonTags) {
        const openingTag = button.match(/^<button\b[^>]*>/)?.[0] ?? '';
        const inner = button.replace(/^<button\b[^>]*>/, '').replace(/<\/button>$/, '').trim();
        const hasAccessibleName =
          /\baria-label\s*=/.test(openingTag) ||
          /\baria-labelledby\s*=/.test(openingTag) ||
          /\btitle\s*=/.test(openingTag) ||
          inner.length > 0;
        expect(hasAccessibleName, `${relativePath}: button needs an accessible name`).toBe(true);
      }
    }
  });

  it('associates key form controls with labels or accessible names', () => {
    const files = [
      'src/app/campaigns/page.tsx',
      'src/components/i18n/LanguageSwitcher.tsx',
      'src/components/ui/CurrencyPicker.tsx',
      'src/components/forms/VerifierApplicationForm.tsx',
      'src/components/forms/VerifierBondPanel.tsx',
      'src/components/forms/CreateCampaignForm.tsx',
    ];

    for (const relativePath of files) {
      const content = source(relativePath);
      const controls = content.match(/<(input|select|textarea)\b[^>]*\/?>/g) ?? [];
      for (const control of controls) {
        if (/type=["{']hidden/.test(control) || /type="hidden"/.test(control)) continue;
        if (/type=["{']radio/.test(control) || /type="radio"/.test(control)) continue;
        const id = control.match(/\bid\s*=\s*["{]([^}"{]+)["}]/)?.[1];
        const hasAriaName =
          /\baria-label\s*=/.test(control) || /\baria-labelledby\s*=/.test(control);
        const hasLabel = id
          ? content.includes(`htmlFor="${id}"`) || content.includes(`htmlFor={'${id}'}`)
          : false;
        expect(hasAriaName || hasLabel, `${relativePath}: control is missing a label`).toBe(true);
      }
    }
  });
});
