import SwiftUI

struct ProfileSetupView: View {
    @Bindable var authVM: AuthViewModel
    @State private var displayName = ""
    @State private var saving = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 60)

                Image("logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)

                Text("Welcome to PomoPets!")
                    .font(.moreSugar(size: 28))
                    .foregroundColor(.pomoPrimary)

                Text("Let's set up your profile")
                    .font(.moreSugarThin(size: 16))
                    .foregroundColor(.pomoMuted)

                VStack(spacing: 16) {
                    if let error = authVM.errorMessage {
                        Text(error)
                            .font(.moreSugarThin(size: 13))
                            .foregroundColor(.pomoError)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.pomoError.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    Text("Display Name")
                        .font(.moreSugar(size: 14))
                        .foregroundColor(.pomoPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    TextField("What should we call you?", text: $displayName)
                        .pomoPillField()

                    Text("\(displayName.trimmingCharacters(in: .whitespaces).count)/30 characters")
                        .font(.moreSugarThin(size: 11))
                        .foregroundColor(.pomoMuted)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Button {
                        saving = true
                        Task {
                            await authVM.setupProfile(displayName: displayName)
                            saving = false
                        }
                    } label: {
                        Text(saving ? "Saving..." : "Let's Go!")
                    }
                    .buttonStyle(PomoPillButtonStyle(isDisabled: saving || displayName.trimmingCharacters(in: .whitespaces).count < 2))
                    .disabled(saving || displayName.trimmingCharacters(in: .whitespaces).count < 2)
                }
                .padding(24)
                .pastelCard(.cardLavender)
                .padding(.horizontal, 20)

                Spacer()
            }
        }
        .background(Color.pomoBackground)
    }
}
