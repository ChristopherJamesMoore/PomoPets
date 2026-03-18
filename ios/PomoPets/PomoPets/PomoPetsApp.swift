import SwiftUI

@main
struct PomoPetsApp: App {
    @State private var authVM = AuthViewModel()

    init() {
        registerPomoPetsFonts()
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if authVM.isLoading {
                    loadingView
                } else if !authVM.isAuthenticated {
                    LoginView(authVM: authVM)
                } else if !authVM.isProfileComplete {
                    ProfileSetupView(authVM: authVM)
                } else {
                    MainTabView(authVM: authVM)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: authVM.isAuthenticated)
            .animation(.easeInOut(duration: 0.3), value: authVM.isProfileComplete)
        }
    }

    private var loadingView: some View {
        VStack {
            Text("🐾")
                .font(.system(size: 48))
                .symbolEffect(.pulse)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.pomoBackground)
    }
}
