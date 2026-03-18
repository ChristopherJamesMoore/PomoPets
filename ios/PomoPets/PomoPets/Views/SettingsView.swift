import SwiftUI
import Supabase

// MARK: - Theme Option Model

private struct ThemeOption: Identifiable {
    let id: String
    let name: String
    let description: String
    let swatchTop: Color
    let swatchBottom: Color
}

private let themeOptions: [ThemeOption] = [
    ThemeOption(
        id: "rose",
        name: "Rose",
        description: "Warm pinks & creams",
        swatchTop: Color(red: 0.961, green: 0.816, blue: 0.839),   // #f5d0d6
        swatchBottom: Color(red: 0.992, green: 0.965, blue: 0.933)  // #fdf6ee
    ),
    ThemeOption(
        id: "snow",
        name: "Snow",
        description: "Cool whites & blues",
        swatchTop: Color(red: 0.902, green: 0.925, blue: 0.965),    // #e6ecf6
        swatchBottom: Color(red: 0.965, green: 0.973, blue: 0.984)  // #f7f8fb
    ),
]

// MARK: - SettingsView

struct SettingsView: View {
    @Bindable var authVM: AuthViewModel

    @State private var displayName = ""
    @State private var saving = false
    @State private var savingTheme = false
    @State private var saveSuccess = false
    @State private var errorMessage: String?

    private var profile: Profile? { authVM.profile }

    // MARK: - Cooldown Logic

    private var daysSinceNameChange: Int? {
        guard let changedAt = profile?.displayNameChangedAt else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: changedAt) else {
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: changedAt) else { return nil }
            return Calendar.current.dateComponents([.day], from: date, to: Date()).day
        }
        return Calendar.current.dateComponents([.day], from: date, to: Date()).day
    }

    private var isNameOnCooldown: Bool {
        guard let days = daysSinceNameChange else { return false }
        return days < 30
    }

    private var cooldownDaysLeft: Int {
        guard let days = daysSinceNameChange else { return 0 }
        return max(0, 30 - days)
    }

    private var nameIsValid: Bool {
        let trimmed = displayName.trimmingCharacters(in: .whitespaces)
        return trimmed.count >= 2 && trimmed.count <= 30
    }

    private var nameHasChanged: Bool {
        displayName.trimmingCharacters(in: .whitespaces) != (profile?.displayName ?? "")
    }

    // MARK: - Formatted Member Since

    private var memberSinceFormatted: String {
        guard let createdAt = profile?.createdAt else { return "..." }
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = isoFormatter.date(from: createdAt)
        if date == nil {
            isoFormatter.formatOptions = [.withInternetDateTime]
            date = isoFormatter.date(from: createdAt)
        }
        guard let parsed = date else { return createdAt }
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "MMMM d, yyyy"
        return displayFormatter.string(from: parsed)
    }

    // MARK: - Initials

    private var initials: String {
        let name = profile?.displayName ?? ""
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return String(parts[0].prefix(1) + parts[1].prefix(1)).uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Spacer().frame(height: 16)

                // Title
                Text("Profile & Settings")
                    .font(.moreSugar(size: 28))
                    .foregroundColor(.pomoPrimary)
                    .frame(maxWidth: .infinity, alignment: .center)

                // Stats strip
                statsStrip

                // Edit Profile card
                editProfileCard

                // Appearance card
                appearanceCard

                // Account card
                accountCard

                Spacer().frame(height: 40)
            }
            .padding(.horizontal, 20)
        }
        .background(Color.pomoBackground)
        .onAppear {
            displayName = profile?.displayName ?? ""
        }
    }

    // MARK: - Stats Strip

    private var statsStrip: some View {
        HStack(spacing: 12) {
            // Coins chip
            VStack(spacing: 4) {
                Text("\u{1FA99} \(profile?.coins ?? 0)")
                    .font(.moreSugar(size: 20))
                    .foregroundColor(.pomoText)
                Text("Coins")
                    .font(.moreSugarThin(size: 12))
                    .foregroundColor(.pomoMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .pastelCard(.cardCream, cornerRadius: 16)

            // Member Since chip
            VStack(spacing: 4) {
                Text("\u{1F4C5} \(memberSinceFormatted)")
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text("Member Since")
                    .font(.moreSugarThin(size: 12))
                    .foregroundColor(.pomoMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .pastelCard(.cardSky, cornerRadius: 16)
        }
    }

    // MARK: - Edit Profile Card

    private var editProfileCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Edit Profile")
                .font(.moreSugar(size: 20))
                .foregroundColor(.pomoPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Avatar placeholder
            HStack {
                Spacer()
                ZStack {
                    Circle()
                        .fill(Color.pomoChip)
                        .frame(width: 80, height: 80)
                    Text(initials)
                        .font(.moreSugar(size: 28))
                        .foregroundColor(.pomoPrimary)
                }
                Spacer()
            }

            // Error / success banners
            if let error = errorMessage {
                Text(error)
                    .font(.moreSugarThin(size: 13))
                    .foregroundColor(.pomoError)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color.pomoError.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            if saveSuccess {
                Text("Profile updated!")
                    .font(.moreSugarThin(size: 13))
                    .foregroundColor(.pomoSuccess)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color.pomoSuccess.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            // Display name field
            VStack(alignment: .leading, spacing: 6) {
                Text("Display Name")
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoPrimary)

                TextField("Your display name", text: $displayName)
                    .pomoPillField()
                    .disabled(isNameOnCooldown)
                    .opacity(isNameOnCooldown ? 0.6 : 1.0)
                    .onChange(of: displayName) {
                        // Enforce 30-char limit
                        if displayName.count > 30 {
                            displayName = String(displayName.prefix(30))
                        }
                    }

                HStack {
                    Text("\(displayName.trimmingCharacters(in: .whitespaces).count)/30 characters")
                        .font(.moreSugarThin(size: 11))
                        .foregroundColor(.pomoMuted)

                    Spacer()

                    if isNameOnCooldown {
                        Text("\u{1F512} \(cooldownDaysLeft) days left")
                            .font(.moreSugarThin(size: 11))
                            .foregroundColor(.pomoMuted)
                    }
                }
            }

            if isNameOnCooldown {
                Text("Display name can only be changed once every 30 days.")
                    .font(.moreSugarThin(size: 12))
                    .foregroundColor(.pomoMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Save button
            Button {
                saveProfile()
            } label: {
                Text(saving ? "Saving..." : "Save Changes")
            }
            .buttonStyle(PomoPillButtonStyle(isDisabled: saving || !nameIsValid || !nameHasChanged || isNameOnCooldown))
            .disabled(saving || !nameIsValid || !nameHasChanged || isNameOnCooldown)
        }
        .padding(24)
        .pastelCard(.cardLavender)
    }

    // MARK: - Appearance Card

    private var appearanceCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Appearance")
                .font(.moreSugar(size: 20))
                .foregroundColor(.pomoPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                ForEach(themeOptions) { theme in
                    themeButton(theme)
                }
            }
        }
        .padding(24)
        .pastelCard(.cardPeach)
    }

    private func themeButton(_ theme: ThemeOption) -> some View {
        let isActive = (profile?.theme ?? "rose") == theme.id

        return Button {
            setTheme(theme.id)
        } label: {
            VStack(spacing: 8) {
                // Color swatch (two halves)
                ZStack {
                    VStack(spacing: 0) {
                        theme.swatchTop
                        theme.swatchBottom
                    }
                }
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(isActive ? Color.pomoPrimary : Color.clear, lineWidth: 2)
                )

                Text(theme.name)
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoText)

                Text(theme.description)
                    .font(.moreSugarThin(size: 11))
                    .foregroundColor(.pomoMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .padding(.horizontal, 8)
            .background(isActive ? Color.pomoPrimary.opacity(0.06) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isActive ? Color.pomoPrimary.opacity(0.3) : Color.pomoBorder, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
        .disabled(savingTheme)
    }

    // MARK: - Account Card

    private var accountCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Account")
                .font(.moreSugar(size: 20))
                .foregroundColor(.pomoPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)

            if let email = profile?.email {
                HStack(spacing: 8) {
                    Image(systemName: "envelope.fill")
                        .font(.system(size: 14))
                        .foregroundColor(.pomoMuted)
                    Text(email)
                        .font(.moreSugarThin(size: 14))
                        .foregroundColor(.pomoText)
                }
            }

            Text("Signed in via email. To change your email or password, use the web app.")
                .font(.moreSugarThin(size: 12))
                .foregroundColor(.pomoMuted)

            Button {
                Task {
                    await authVM.signOut()
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 14))
                    Text("Sign Out")
                }
                .foregroundColor(.pomoError)
            }
            .buttonStyle(PomoOutlineButtonStyle())
        }
        .padding(24)
        .pastelCard(.cardPink)
    }

    // MARK: - Actions

    private func saveProfile() {
        guard let uid = authVM.userId else { return }
        saving = true
        errorMessage = nil
        saveSuccess = false

        Task {
            do {
                let now = ISO8601DateFormatter().string(from: Date())
                try await supabase
                    .from("profiles")
                    .update([
                        "display_name": displayName.trimmingCharacters(in: .whitespaces),
                        "display_name_changed_at": now,
                    ])
                    .eq("id", value: uid)
                    .execute()

                await authVM.refreshProfile()
                saveSuccess = true

                // Auto-dismiss success after 3 seconds
                Task {
                    try? await Task.sleep(for: .seconds(3))
                    saveSuccess = false
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            saving = false
        }
    }

    private func setTheme(_ themeId: String) {
        guard let uid = authVM.userId else { return }
        savingTheme = true

        Task {
            do {
                try await supabase
                    .from("profiles")
                    .update(["theme": themeId])
                    .eq("id", value: uid)
                    .execute()

                await authVM.refreshProfile()
            } catch {
                errorMessage = error.localizedDescription
            }
            savingTheme = false
        }
    }
}

// MARK: - Preview

#Preview {
    SettingsView(authVM: AuthViewModel())
}
