# PomoPets

A productivity game that blends Pomodoro study sessions with virtual pet care. Study, earn coins, hatch eggs, and grow a collection of pets — each with unique rarities and abilities.

Built by combining degrees in psychology and computer science to make self-care and studying feel rewarding rather than like a chore.

---

## Repository Structure

```
PomoPets/
├── web/      # React web app — game, shop, hatchery, admin panel
├── ios/      # Swift iOS app (Xcode)
└── docs/     # Database schema and design references
```

## Stack

| Layer | Tech |
|---|---|
| Web app | React 19, TypeScript, Vite, React Router v7 |
| Backend | Supabase (Postgres, Auth, Storage, RPC functions) |
| iOS | Swift, SwiftUI, Supabase Swift SDK |
| Hosting | Vercel (web) |

## Core Features

- **Pomodoro timer** — customisable work/break sessions, coin rewards for sustained focus, pause penalty
- **Egg shop & hatchery** — buy species eggs, live countdown incubation, skip time with coins, hatch to reveal a rarity
- **Rarity system** — Common · Uncommon · Rare · Legendary · Prismatic · Limited with unique sprites and stat multipliers
- **Pet collection** — nickname, set active pet, view abilities unlocked by level and rarity
- **Coin economy** — earned through study, spent on eggs, slot upgrades, and time skips
- **Waitlist & VIP** — public waitlist and token-gated VIP early access with bonus coins
- **Admin panel** — secret URL + password + Supabase auth triple gate; manage waitlist, VIP tokens, users, pets, abilities, and full audit logs

## Getting Started

See the README in each subdirectory for setup instructions.
