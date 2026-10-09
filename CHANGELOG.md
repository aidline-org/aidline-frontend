# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Sitemap with every campaign page, regenerated hourly, and robots.txt
- Installable app with an offline fallback page (#23, @Feyisara2108)
- Lighthouse checks in CI (#24, @Feyisara2108)
- Banner when the wallet is on the wrong network (#25, @Feyisara2108)
- Approximate local currency next to XLM amounts (#26, @Feyisara2108)
- Admin page to register verifiers on chain (#27, @infimum90)
- Chart of donations and releases over time on the home page (#28, @infimum90)
- Storybook for design system components (#29, @infimum90)
- Embeddable donate widget for association websites (#30, @infimum90)

### Fixed

- Home page crash caused by the chart reading the wrong stats history fields; the chart now shows only real figures
- Local currency estimates were ten million times too high
- Build failure from JSX in `.ts` files, plus admin page, embed widget and wallet fixes
- The Stellar SDK no longer ships on every page, raising Lighthouse performance on the home page from 55 to 85

## [0.1.0] - 2026-10-04

First public testnet release.

### Added

- Home page with live ledger figures and a feed of verified releases
- Campaign list with filters and campaign pages with funding bar and milestone ledger
- Connect any Stellar wallet through Stellar Wallets Kit, with live balance in the header
- Donate, reclaim refunds, release milestones as a verifier, cancel as a creator and create campaigns
- Verifier directory and application form, donor giving history, how it works page
- Editorial design system documented in DESIGN.md, self hosted fonts, logo and favicon
- Unit tests and CI
