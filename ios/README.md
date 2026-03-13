# PomoPets — iOS App

The native iOS application for PomoPets, built with Swift and SwiftUI.

## Tech Stack

- **Swift** + **SwiftUI**
- **Supabase Swift SDK** — auth and database
- **Xcode** — project management and build

## Project Structure

```
ios/
└── PomoPets/
    └── PomoPets/
        ├── PomoPetsApp.swift      # App entry point
        ├── ContentView.swift      # Root view
        ├── LoginView.swift        # Authentication screen
        ├── AuthViewModel.swift    # Auth state management
        ├── SupabaseClient.swift   # Supabase client initialisation
        ├── Theme.swift            # Design tokens and colours
        └── Assets.xcassets/       # Images, icons, logo
```

## Requirements

- Xcode 15+
- iOS 17+ deployment target
- A Supabase project (shared with the web app)

## Getting Started

1. Open `ios/PomoPets/PomoPets.xcodeproj` in Xcode
2. Update `SupabaseClient.swift` with your Supabase project URL and anon key
3. Select a simulator or connected device and press **Run**

## Notes

The iOS app shares the same Supabase backend as the web app. Ensure all required tables and RLS policies have been applied before running (see `docs/supabase_db_schema.md`).
