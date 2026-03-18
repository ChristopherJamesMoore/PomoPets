import SwiftUI

struct MainTabView: View {
    @Bindable var authVM: AuthViewModel

    var body: some View {
        TabView {
            Tab("Home", systemImage: "house.fill") {
                HomeView(authVM: authVM)
            }

            Tab("Shop", systemImage: "storefront.fill") {
                ShopView(authVM: authVM)
            }

            Tab("Study", systemImage: "timer") {
                PomodoroView(authVM: authVM)
            }

            Tab("Pets", systemImage: "pawprint.fill") {
                PetsView(authVM: authVM)
            }

            Tab("Settings", systemImage: "gearshape.fill") {
                SettingsView(authVM: authVM)
            }
        }
        .tint(.pomoPrimary)
    }
}
