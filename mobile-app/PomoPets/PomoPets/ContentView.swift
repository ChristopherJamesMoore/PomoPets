import SwiftUI

struct ContentView: View {
    @Bindable var authVM: AuthViewModel

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "pawprint.fill")
                .font(.system(size: 48))
                .foregroundColor(.pomoPrimary)

            Text("Welcome to PomoPets!")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.pomoText)

            Text("You're signed in.")
                .foregroundColor(.pomoMuted)

            Button("Sign Out") {
                Task {
                    await authVM.signOut()
                }
            }
            .buttonStyle(PomoPillButtonStyle())
            .frame(width: 200)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white)
    }
}

#Preview {
    ContentView(authVM: AuthViewModel())
}
