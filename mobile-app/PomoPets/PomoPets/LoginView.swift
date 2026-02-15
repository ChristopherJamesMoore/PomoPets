import SwiftUI

enum AuthFormView {
    case login, register, forgot
}

struct LoginView: View {
    @Bindable var authVM: AuthViewModel

    @State private var currentView: AuthFormView = .login
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isSubmitting = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 80)

                // App branding
                Image(systemName: "pawprint.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.pomoPrimary)
                    .padding(.bottom, 8)

                Text("PomoPets")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.pomoPrimary)
                    .padding(.bottom, 40)

                // Form card
                VStack(spacing: 16) {
                    switch currentView {
                    case .login:
                        loginForm
                    case .register:
                        registerForm
                    case .forgot:
                        forgotForm
                    }
                }
                .padding(24)
                .background(Color.pomoCard)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(color: .black.opacity(0.05), radius: 10, y: 4)
                .padding(.horizontal, 20)

                Spacer()
            }
        }
        .background(Color.white)
        .onChange(of: currentView) {
            clearForm()
        }
    }

    // Login form
    private var loginForm: some View {
        VStack(spacing: 16) {
            Text("Login")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.pomoPrimary)

            messageBanners

            TextField("Email", text: $email)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .pomoPillField()

            SecureField("Password", text: $password)
                .pomoPillField()

            HStack {
                Spacer()
                Button("Forgot Password?") {
                    currentView = .forgot
                }
                .font(.system(size: 13))
                .foregroundColor(.pomoMuted)
            }
            .padding(.bottom, 4)

            Button {
                submit {
                    await authVM.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
                }
            } label: {
                Text(isSubmitting ? "Logging in..." : "Login!")
            }
            .buttonStyle(PomoPillButtonStyle(isDisabled: isSubmitting))
            .disabled(isSubmitting)

            divider

            Button {
            // Google sign-in placeholder
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill")
                        .font(.system(size: 20))
                    Text("Continue with Google")
                }
            }
            .buttonStyle(PomoGoogleButtonStyle())

            switchLink(
                text: "Don't have an account?",
                action: "Register",
                target: .register
            )
        }
    }

    // registration form
    private var registerForm: some View {
        VStack(spacing: 16) {
            Text("Register")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.pomoPrimary)

            messageBanners

            TextField("Email", text: $email)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .pomoPillField()

            SecureField("Password", text: $password)
                .pomoPillField()

            SecureField("Confirm Password", text: $confirmPassword)
                .pomoPillField()

            Button {
                guard password == confirmPassword else {
                    authVM.errorMessage = "Passwords do not match."
                    return
                }
                submit {
                    await authVM.signUp(email: email.trimmingCharacters(in: .whitespaces), password: password)
                }
            } label: {
                Text(isSubmitting ? "Creating account..." : "Create Account")
            }
            .buttonStyle(PomoPillButtonStyle(isDisabled: isSubmitting))
            .disabled(isSubmitting)

            switchLink(
                text: "Already have an account?",
                action: "Login",
                target: .login
            )
        }
    }

    // Forgot password
    private var forgotForm: some View {
        VStack(spacing: 16) {
            Text("Reset Password")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.pomoPrimary)

            messageBanners

            TextField("Email", text: $email)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .pomoPillField()

            Button {
                submit {
                    await authVM.resetPassword(email: email.trimmingCharacters(in: .whitespaces))
                }
            } label: {
                Text(isSubmitting ? "Sending..." : "Send Reset Link")
            }
            .buttonStyle(PomoPillButtonStyle(isDisabled: isSubmitting))
            .disabled(isSubmitting)

            switchLink(
                text: "Remember your password?",
                action: "Login",
                target: .login
            )
        }
    }


    @ViewBuilder
    private var messageBanners: some View {
        if let error = authVM.errorMessage {
            messageBanner(text: error, color: .pomoError, bgColor: Color.pomoError.opacity(0.1))
        }
        if let success = authVM.successMessage {
            messageBanner(text: success, color: .pomoSuccess, bgColor: Color.pomoSuccess.opacity(0.1))
        }
    }

    private func messageBanner(text: String, color: Color, bgColor: Color) -> some View {
        Text(text)
            .font(.system(size: 13))
            .foregroundColor(color)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(bgColor)
            .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var divider: some View {
        HStack {
            Rectangle().frame(height: 1).foregroundColor(Color(.systemGray4))
            Text("or")
                .font(.system(size: 13))
                .foregroundColor(.pomoMuted)
            Rectangle().frame(height: 1).foregroundColor(Color(.systemGray4))
        }
    }

    private func switchLink(text: String, action: String, target: AuthFormView) -> some View {
        HStack(spacing: 4) {
            Text(text)
                .font(.system(size: 13))
                .foregroundColor(.pomoMuted)
            Button(action) {
                currentView = target
            }
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.pomoPrimary)
        }
        .padding(.top, 4)
    }


    private func submit(action: @escaping () async -> Void) {
        isSubmitting = true
        Task {
            await action()
            isSubmitting = false
        }
    }

    private func clearForm() {
        email = ""
        password = ""
        confirmPassword = ""
        isSubmitting = false
        authVM.clearMessages()
    }
}

extension View {
    func pomoPillField() -> some View {
        self
            .padding(.horizontal, 16)
            .frame(height: 48)
            .background(Color(.systemGray6))
            .clipShape(Capsule())
            .foregroundColor(.pomoText)
    }
}

#Preview {
    LoginView(authVM: AuthViewModel())
}
