# Aidline Design

Aidline asks people to trust it with money meant for people in crisis. The design has one job: make that trust easy to check. Every screen should feel like a well edited field report, not a fundraising ad and not a crypto dashboard.

Read this before opening a pull request that changes anything visual. When this file and a mockup disagree, this file wins until it is updated.

## Principles

1. **Show the evidence, not the adjectives.** A photo of delivered water tanks next to the payout it unlocked beats any headline about impact.
2. **Numbers are the hero.** Raised, held in escrow and released are always visible, always exact, never rounded into vagueness.
3. **Calm under urgency.** Emergency campaigns are urgent, but the interface stays steady. No flashing, no countdown pressure, no guilt copy.
4. **The chain is plumbing.** Donors see "Verified by Red Relief Network on 3 Oct", with the transaction link one click away. They never need to know what a ledger is.
5. **Institutional credibility, independent voice.** Serious like a newspaper, warm like a letter. Never corporate, never hype.

## Color

A paper and ink base with exactly two signal colors. Signals mark campaign type and nothing else.

| Token            | Light     | Dark      | Use                           |
| ---------------- | --------- | --------- | ----------------------------- |
| `--paper`        | `#F6F1E7` | `#14130F` | Page background               |
| `--paper-raised` | `#FBF8F1` | `#1C1B16` | Panels, cards                 |
| `--paper-sunk`   | `#EDE5D6` | `#0E0D0A` | Insets, input backgrounds     |
| `--ink`          | `#1B1A17` | `#F1EBDD` | Primary text, primary buttons |
| `--ink-soft`     | `#4A463F` | `#C9C1B0` | Body copy                     |
| `--ink-muted`    | `#7A7468` | `#8F8878` | Captions, metadata            |
| `--rule`         | `#D9CFBD` | `#2E2C25` | Hairlines and borders         |
| `--relief`       | `#C4471D` | `#E2653A` | Emergency campaigns           |
| `--relief-wash`  | `#F6DED2` | `#3A1F14` | Emergency backgrounds         |
| `--climate`      | `#1F5C3F` | `#5FA57F` | Climate campaigns             |
| `--climate-wash` | `#DCE8DF` | `#16291F` | Climate backgrounds           |
| `--danger`       | `#9F1D1D` | `#E26D6D` | Errors only                   |

Rules:

- Body text must meet WCAG AA against its background. Check both themes.
- Never use relief or climate for buttons, links or decoration that is not tied to a campaign type.
- Success is shown with words and ink ("Released"), not green. Green already means climate.
- No gradients. No glow. No colored shadows.

## Type

| Role                       | Family                 | Notes                                                      |
| -------------------------- | ---------------------- | ---------------------------------------------------------- |
| Display and headlines      | **Newsreader** (serif) | Weights 500 and 600. Tight tracking (`-0.01em`) above 32px |
| Interface and body         | **IBM Plex Sans**      | 400 for body, 500 for labels and buttons                   |
| Figures, addresses, hashes | **IBM Plex Mono**      | Always `font-variant-numeric: tabular-nums`                |

Scale (rem): `0.75, 0.875, 1, 1.125, 1.375, 1.75, 2.25, 3, 4`. Body is 1rem with a 1.6 line height. Keep reading width at or under 68ch.

Rules:

- Every amount, percentage, date in a table, wallet address and transaction hash uses Plex Mono.
- Small caps style labels (`0.75rem`, uppercase, `0.08em` tracking, Plex Sans 500) introduce sections, like a newspaper kicker.
- Sentence case everywhere. No title case headlines, no all caps sentences.

## Layout

- 12 column grid, max width 1200px, 24px gutters, 16px side padding on phones.
- Separate sections with 1px `--rule` hairlines and whitespace, not with boxes and shadows.
- Corner radius is `2px` for everything. Pills and fully rounded cards are not part of this system.
- Shadows: none, except a single `0 1px 0 var(--rule)` for sticky headers.
- Spacing scale (px): `4, 8, 12, 16, 24, 32, 48, 64, 96`.

## Signature components

These are what make Aidline recognisable. Build new screens out of them before inventing new ones.

### Funding bar

One horizontal bar, three segments, always in this order:

```
[■■■■■■■■■■■■|▨▨▨▨▨▨▨▨|              ]
  released      in escrow   still needed
```

- Released: solid campaign color.
- In escrow: diagonal hatch in campaign color. Money that is safe but not yet paid out.
- Still needed: empty with a hairline border.
- Always labelled with exact figures underneath in Plex Mono. Never show a percentage alone.

### Milestone ledger

A vertical timeline, one row per milestone. Each released row shows amount, date, verifier name and the proof (thumbnail plus note), with "View transaction" as a quiet text link. Pending rows show the amount and "Awaiting verification". The next milestone to be released is marked; nothing else is highlighted.

### Verification stamp

A small rectangular mark with a 1px border: `VERIFIED · RED RELIEF NETWORK · 03 OCT 2026`. Plex Mono, uppercase, `0.6875rem`. Used on proofs and released milestones. It should look like a rubber stamp on a document, not a badge in an app.

### Campaign card

Image (or typographic cover), kicker with type and location, serif title, one line summary, funding bar, and figures. No buttons inside the card; the whole card is the link.

### Typographic cover

When a campaign has no photo, render a cover from its data: the campaign color wash, location in large Newsreader, and the type kicker. Never use stock photos, illustrations of hands holding hearts, or AI generated images.

## Imagery

- Real photographs from the field, supplied by campaigns and verifiers.
- Show the work and the place: supplies, sites, people working. Avoid distress imagery used to provoke guilt.
- Crop to 3:2 for cards and 16:9 for campaign headers.

## Motion

- 150ms ease out for hover and focus. Nothing longer than 250ms.
- Funding bars may animate their width once on first view. Numbers do not count up.
- Respect `prefers-reduced-motion` by turning all motion off.

## Voice

Write like a careful reporter.

| Do                                                             | Avoid                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| "120 XLM held in escrow until the next delivery is verified"   | "Your donation is making a difference!"                   |
| "Released to Lokoja Water Committee on 3 Oct"                  | "Funds deployed to the community"                         |
| "This campaign ended before its goal. You can reclaim 42 XLM." | "Oops! Something went wrong with this campaign"           |
| "Connect wallet"                                               | "Connect your Web3 wallet to get started on your journey" |

No exclamation marks in interface copy. No emoji. Do not say empower, revolutionize, seamless, Web3 or blockchain powered.

## Things that are not Aidline

If a pull request adds any of these, it will be asked to remove them:

- Purple, blue to pink, or any other gradient
- Glassmorphism, blurred translucent panels, glowing borders
- Rounded `2xl` cards with drop shadows floating on a gray background
- Emoji or icon soup in headings and buttons
- Generic hero illustrations, 3D blobs, or stock photos of smiling volunteers
- Inter, Poppins or Space Grotesk as the main typeface
- Count up animations, confetti, or celebration modals after donating
- Percentages without the underlying amounts

## Accessibility

- Every interactive element has a visible focus style: a 2px `--ink` outline with a 2px offset.
- Color is never the only signal. Campaign type is always written as well as colored.
- Funding bars expose their values with `role="img"` and an `aria-label` that reads the figures.
- All images need meaningful `alt` text, which campaigns provide when uploading.
- Test at 200% zoom and at 360px width.
