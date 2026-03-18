import SwiftUI

// MARK: - Navigation Tile Model

private struct NavTile: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let subtitle: String
    let color: Color
    let destination: HomeDest
}

private enum HomeDest: Hashable {
    case study, shop, hatchery, collection, health, habits, settings
}

private let navTiles: [NavTile] = [
    NavTile(icon: "timer",           label: "Study",      subtitle: "Pomodoro timer",   color: .cardCream,    destination: .study),
    NavTile(icon: "storefront.fill", label: "Shop",       subtitle: "Buy eggs",         color: .cardPink,     destination: .shop),
    NavTile(icon: "fossil.shell.fill", label: "Hatchery", subtitle: "Watch eggs hatch", color: .cardPeach,    destination: .hatchery),
    NavTile(icon: "pawprint.fill",   label: "Collection", subtitle: "Your pets",        color: .cardSage,     destination: .collection),
    NavTile(icon: "heart.fill",      label: "Health",     subtitle: "Log your stats",   color: .cardSky,      destination: .health),
    NavTile(icon: "checkmark.seal.fill", label: "Habits", subtitle: "Daily streaks",    color: .cardLavender, destination: .habits),
    NavTile(icon: "gearshape.fill",  label: "Settings",   subtitle: "Profile & themes", color: .cardCream,    destination: .settings),
]

// MARK: - HomeView

struct HomeView: View {
    @Bindable var authVM: AuthViewModel

    @State private var activePet: UserPet?
    @State private var hasFetched = false

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    greeting
                    petHouseCard
                    navigationGrid
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 40)
            }
            .background(Color.pomoBackground)
            .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            await fetchActivePet()
        }
    }

    // MARK: - Greeting

    private var greeting: some View {
        Text("Hey, \(authVM.profile?.displayName ?? "Trainer")! \u{1F44B}")
            .font(.moreSugar(size: 28))
            .foregroundColor(.pomoPrimary)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Pet House Card

    private var petHouseCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 6) {
                Text("\u{1F3E0}")
                    .font(.system(size: 18))
                Text("Your House")
                    .font(.moreSugar(size: 18))
                    .foregroundColor(.pomoPrimary)
            }

            if !hasFetched {
                // Loading state
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(.pomoMuted)
                    Spacer()
                }
                .frame(height: 100)
            } else if let pet = activePet {
                activePetContent(pet)
            } else {
                emptyPetContent
            }
        }
        .padding(20)
        .pastelCard(.cardLavender)
    }

    // MARK: - Active Pet

    private func activePetContent(_ pet: UserPet) -> some View {
        VStack(spacing: 16) {
            // Pet display row
            HStack(spacing: 14) {
                // Sprite frame
                ZStack {
                    if pet.assetKey != nil {
                        // Placeholder for remote image
                        Image(systemName: "pawprint.fill")
                            .font(.system(size: 32))
                            .foregroundColor(pet.rarity.color)
                    } else {
                        Image(systemName: "pawprint.fill")
                            .font(.system(size: 32))
                            .foregroundColor(pet.rarity.color)
                    }
                }
                .frame(width: 72, height: 72)
                .background(pet.rarity.color.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(pet.rarity.color.opacity(0.25), lineWidth: 1.5)
                )

                // Pet info
                VStack(alignment: .leading, spacing: 4) {
                    Text(pet.nickname ?? pet.catalogPet?.name ?? "Unknown")
                        .font(.moreSugar(size: 18))
                        .foregroundColor(.pomoText)

                    Text("\(pet.catalogPet?.species ?? "Pet") \u{00B7} Lv. \(pet.level)")
                        .font(.moreSugarThin(size: 13))
                        .foregroundColor(.pomoMuted)

                    // Rarity tag
                    Text(pet.rarity.label)
                        .font(.moreSugar(size: 11))
                        .foregroundColor(pet.rarity.color)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
                        .background(pet.rarity.color.opacity(0.1))
                        .clipShape(Capsule())
                }

                Spacer()
            }

            // Stat bars
            VStack(spacing: 8) {
                StatBar(label: "Hunger", value: pet.hunger)
                StatBar(label: "Health", value: pet.health)
                StatBar(label: "Energy", value: pet.energy)
            }

            // Manage link
            NavigationLink(value: HomeDest.collection) {
                HStack(spacing: 4) {
                    Text("Manage Pets")
                        .font(.moreSugar(size: 13))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 11, weight: .semibold))
                }
                .foregroundColor(.pomoPrimary)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    // MARK: - Empty Pet State

    private var emptyPetContent: some View {
        VStack(spacing: 12) {
            Text("\u{1F95A}")
                .font(.system(size: 48))
                .padding(.top, 8)

            Text("No pet yet")
                .font(.moreSugar(size: 18))
                .foregroundColor(.pomoText)

            Text("Head to the shop to buy your first egg and start your journey!")
                .font(.moreSugarThin(size: 14))
                .foregroundColor(.pomoMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)

            NavigationLink(value: HomeDest.shop) {
                Text("Visit Shop \u{2192}")
            }
            .buttonStyle(PomoOutlineButtonStyle())
            .frame(maxWidth: 200)
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Navigation Grid

    private var navigationGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Links")
                .font(.moreSugar(size: 18))
                .foregroundColor(.pomoPrimary)

            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(navTiles) { tile in
                    NavigationLink(value: tile.destination) {
                        navTileView(tile)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func navTileView(_ tile: NavTile) -> some View {
        HStack(spacing: 12) {
            Image(systemName: tile.icon)
                .font(.system(size: 22))
                .foregroundColor(.pomoPrimary)
                .frame(width: 36, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(tile.label)
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoText)
                Text(tile.subtitle)
                    .font(.moreSugarThin(size: 11))
                    .foregroundColor(.pomoMuted)
                    .lineLimit(1)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.pomoMuted)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .pastelCard(tile.color, cornerRadius: 16)
    }

    // MARK: - Data Fetching

    private func fetchActivePet() async {
        do {
            let pet: UserPet = try await supabase
                .from("user_pets")
                .select("id, nickname, level, hunger, health, energy, rarity, asset_key, catalog_pet:catalog_pet_id(name, species)")
                .eq("is_selected", value: true)
                .single()
                .execute()
                .value
            activePet = pet
        } catch {
            // No active pet or fetch failed
            activePet = nil
        }
        hasFetched = true
    }
}

#Preview {
    HomeView(authVM: AuthViewModel())
}
