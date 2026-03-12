# PomoPets Mobile Style Reference

This document captures the current landing-page styling so the mobile app can match it.

## Brand Fonts

### Font files (self-hosted)
- `public/fonts/MoreSugar-Regular.otf`
- `public/fonts/MoreSugar-Regular.ttf`
- `public/fonts/MoreSugar-Thin.otf`
- `public/fonts/MoreSugar-Thin.ttf`

### Font roles
- Display font (titles + navbar): `More Sugar`
- Body/supporting font: `More Sugar Thin`

### CSS font tokens
- `--font-display: 'More Sugar', 'Comic Sans MS', cursive, sans-serif`
- `--font-body: 'More Sugar Thin', 'More Sugar', 'Comic Sans MS', cursive, sans-serif`

## Color System

### Core palette
- App background: `#fdf6ee`
- Primary dark accent (buttons, highlights): `#3C0008`
- Main text: `#2d2d2d`
- Secondary text: `#666`
- Nav text: `#4a4a4a`
- Eyebrow chip background: `#f5d0d6`
- Primary button text: `#fff4e6`

### Interactive states
- Nav hover: `#3C0008`
- Outline button hover background: `#f5d0d6`
- Button shadow:
  - default `0 6px 0 rgba(0, 0, 0, 0.15)`
  - hover `0 3px 0 rgba(0, 0, 0, 0.15)`
  - active `0 1px 0 rgba(0, 0, 0, 0.15)`

## Typography Scale

### Hero
- Eyebrow:
  - size `14px`
  - weight `700`
  - uppercase
  - letter spacing `0.1em`
- Title:
  - font `var(--font-display)`
  - size `clamp(2.4rem, 5.5vw, 4rem)`
  - weight `900`
  - line height `1.15`
  - letter spacing `0.01em`
- Subtitle:
  - size `clamp(1rem, 2vw, 1.2rem)`
  - line height `1.7`
  - max width `520px`

### Navbar
- Link size `20px` desktop, `16px` mobile
- Link weight `600`
- Logo label:
  - size `13px`
  - weight `800`
  - letter spacing `0.1em`
  - uppercase

### Buttons
- Size: `280px x 82px` (both CTAs equal)
- Font size: `28px`
- Weight: `700`
- Border radius: `40px`

## Layout & Spacing

### First fold structure
- `fold` section fills one viewport: `height: 100vh`
- Grid rows: `auto 1fr`
- Hero vertical offset: `padding: 8px 24px 184px`

### Navbar spacing
- Desktop padding: `24px 72px`
- Mobile padding: `20px 32px`
- Nav link gap:
  - Desktop: `40px`
  - Mobile: `24px`

### Banner behavior
- Banner height token:
  - Desktop: `clamp(165px, 23vh, 270px)`
  - Mobile (`<=768px`): `clamp(135px, 25vh, 220px)`
- Positioning:
  - Anchored at bottom of first fold
  - Bottom edge flush to fold line
  - Centered horizontally
- Width:
  - Desktop: `min(1040px, 104vw)`
  - Mobile: `120vw`

### Below-fold spacing
- Top padding: `24px`

## Component Specs

### Primary CTA (`Get Started`)
- Fill: `#3C0008`
- Text: `#fff4e6`
- Border: none
- Radius: `40px`

### Secondary CTA (`See How It Works`)
- Fill: transparent
- Text: `#3C0008`
- Border: `3px solid #3C0008`
- Radius: `40px`

### Hero eyebrow pill
- Background: `#f5d0d6`
- Text: `#3C0008`
- Padding: `8px 18px`
- Radius: `100px`

## Current Content Labels

### Navbar
- Left: `Features`, `How It Works`, `Blog`
- Right: `Download`, `Pricing`, `Contact`

### Hero
- Eyebrow: `Pomodoro + Virtual Pets`
- Title: `Study Smarter, Grow Your Pets`
- Subtitle: `PomoPets turns your study sessions into adventures...`
- CTAs: `Get Started`, `See How It Works`

## Assets
- Logo: `public/logo.png`
- Hero/banner image: `public/banner.png`

## Implementation Notes For Mobile App
- Use the same two-font hierarchy:
  - Display screens/elements: `More Sugar`
  - Body/supporting copy: `More Sugar Thin`
- Preserve rounded UI language:
  - large pill radii
  - soft shadows
  - warm cream background + dark maroon accent
- Keep CTA sizes visually equal.
- Keep the banner as a visual divider at the first-screen boundary.
