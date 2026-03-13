import SwiftUI

struct ContentView: View {
    @Bindable var authVM: AuthViewModel

    var body: some View {
        VStack(spacing: 24) {
            Image("logo")
                .resizable()
                .scaledToFit()
                .frame(width: 72, height: 72)

            Text("Welcome to PomoPets!")
                .font(.moreSugar(size: 24))
                .foregroundColor(.pomoText)

            Text("You're signed in.")
                .font(.moreSugarThin(size: 16))
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
        .background(Color.pomoBackground)
    }
}

#Preview {
    ContentView(authVM: AuthViewModel())
}
