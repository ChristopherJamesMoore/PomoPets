import SwiftUI
import Supabase
import Auth

@Observable
final class AuthViewModel {
    var isAuthenticated = false
    var isLoading = true
    var errorMessage: String?
    var successMessage: String?

    private var authStateTask: Task<Void, Never>?

    init() {
        // Check for existing session
        if supabase.auth.currentSession != nil {
            isAuthenticated = true
        }
        isLoading = false

        // Listen for auth state changes
        authStateTask = Task { [weak self] in
            for await (event, _) in supabase.auth.authStateChanges {
                guard let self else { return }
                switch event {
                case .signedIn:
                    self.isAuthenticated = true
                case .signedOut:
                    self.isAuthenticated = false
                default:
                    break
                }
            }
        }
    }

    deinit {
        authStateTask?.cancel()
    }

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
}
