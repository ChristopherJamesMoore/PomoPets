import SwiftUI

@main
struct PomoPetsApp: App {
    @State private var authVM = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if authVM.isLoading {
                    ProgressView()
                        .tint(.pomoPrimary)
                } else if authVM.isAuthenticated {
                    ContentView(authVM: authVM)
                } else {
                    LoginView(authVM: authVM)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: authVM.isAuthenticated)
        }
    }
}
