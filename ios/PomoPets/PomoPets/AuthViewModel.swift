import SwiftUI
import Supabase
import Auth

@Observable
final class AuthViewModel {
    var isAuthenticated = false
    var isLoading = true
    var errorMessage: String?
    var successMessage: String?
    var profile: Profile?
    var userId: String?

    var isProfileComplete: Bool {
        guard let name = profile?.displayName.trimmingCharacters(in: .whitespaces) else { return false }
        return !name.isEmpty
    }

    private var authStateTask: Task<Void, Never>?

    init() {
        if let session = supabase.auth.currentSession {
            isAuthenticated = true
            userId = session.user.id.uuidString
            Task { await fetchProfile(userId: session.user.id.uuidString) }
        }
        isLoading = false

        authStateTask = Task { [weak self] in
            for await (event, session) in supabase.auth.authStateChanges {
                guard let self else { return }
                switch event {
                case .signedIn:
                    let uid = session?.user.id.uuidString
                    self.userId = uid
                    self.isAuthenticated = true
                    if let uid { await self.fetchProfile(userId: uid) }
                case .signedOut:
                    self.isAuthenticated = false
                    self.userId = nil
                    self.profile = nil
                default:
                    break
                }
            }
        }
    }

    deinit { authStateTask?.cancel() }

    // MARK: – Profile

    func fetchProfile(userId: String) async {
        do {
            let response: Profile = try await supabase
                .from("profiles")
                .select("id, display_name, email, avatar_url, coins, theme, egg_slots, created_at, updated_at, display_name_changed_at")
                .eq("id", value: userId)
                .single()
                .execute()
                .value
            self.profile = response
        } catch {
            // Profile may not exist yet (new signup)
            self.profile = nil
        }
    }

    func refreshProfile() async {
        if let uid = userId {
            await fetchProfile(userId: uid)
        }
    }

    // MARK: – Auth

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            try await supabase.auth.signIn(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signUp(email: String, password: String) async {
        errorMessage = nil
        successMessage = nil
        do {
            let response = try await supabase.auth.signUp(email: email, password: password)
            if response.session == nil {
                successMessage = "Check your email to confirm your account!"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func resetPassword(email: String) async {
        errorMessage = nil
        successMessage = nil
        do {
            try await supabase.auth.resetPasswordForEmail(email)
            successMessage = "If that email exists, a reset link has been sent."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        do {
            try await supabase.auth.signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func clearMessages() {
        errorMessage = nil
        successMessage = nil
    }

    // MARK: – Profile Setup

    func setupProfile(displayName: String) async {
        guard let uid = userId else { return }
        errorMessage = nil
        do {
            try await supabase
                .from("profiles")
                .update(["display_name": displayName.trimmingCharacters(in: .whitespaces)])
                .eq("id", value: uid)
                .execute()
            await fetchProfile(userId: uid)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
