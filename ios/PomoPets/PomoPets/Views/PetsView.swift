import SwiftUI

// MARK: - Sort & Filter

private enum PetSortOption: String, CaseIterable {
    case rarity = "Rarity"
    case level = "Level"
    case newest = "Newest"
    case name = "Name"
}

// MARK: - PetsView

struct PetsView: View {
    @Bindable var authVM: AuthViewModel

    @State private var pets: [UserPet] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    @State private var searchText = ""
    @State private var selectedRarity: PetRarity?
    @State private var sortOption: PetSortOption = .newest

    @State private var selectedPet: UserPet?

    private var filteredPets: [UserPet] {
        var result = pets

        // Search filter
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            result = result.filter { pet in
                let petName = pet.catalogPet?.name.lowercased() ?? ""
                let species = pet.catalogPet?.species.lowercased() ?? ""
                let nickname = pet.nickname?.lowercased() ?? ""
                return petName.contains(query) || species.contains(query) || nickname.contains(query)
            }
        }

        // Rarity filter
        if let rarity = selectedRarity {
            result = result.filter { $0.rarity == rarity }
        }

        // Sort
        switch sortOption {
        case .rarity:
            let order: [PetRarity] = [.prismatic, .legendary, .limited, .rare, .uncommon, .common]
            result.sort { a, b in
                let ai = order.firstIndex(of: a.rarity) ?? order.count
                let bi = order.firstIndex(of: b.rarity) ?? order.count
                return ai < bi
            }
        case .level:
            result.sort { $0.level > $1.level }
        case .newest:
            result.sort { $0.acquiredAt > $1.acquiredAt }
        case .name:
            result.sort {
                let aName = $0.nickname ?? $0.catalogPet?.name ?? ""
                let bName = $1.nickname ?? $1.catalogPet?.name ?? ""
                return aName.localizedCaseInsensitiveCompare(bName) == .orderedAscending
            }
        }

        return result
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    headerSection
                    searchAndFilters
                    petGrid
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
            .background(Color.pomoBackground)
            .navigationBarTitleDisplayMode(.inline)
            .sheet(item: $selectedPet) { pet in
                PetDetailSheet(
                    pet: pet,
                    authVM: authVM,
                    onDismiss: { refreshedPet in
                        // Update local state after edits
                        if let refreshedPet, let idx = pets.firstIndex(where: { $0.id == refreshedPet.id }) {
                            pets[idx] = refreshedPet
                        }
                        selectedPet = nil
                    },
                    onSetActive: { petId in
                        Task { await setActivePet(petId: petId) }
                    }
                )
                .presentationDragIndicator(.visible)
            }
            .task { await loadPets() }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                Text("My Collection")
                    .font(.moreSugar(size: 28))
                    .foregroundColor(.pomoPrimary)

                Text("\(pets.count) pet\(pets.count == 1 ? "" : "s")")
                    .font(.moreSugarThin(size: 14))
                    .foregroundColor(.pomoMuted)
            }

            Spacer()

            NavigationLink {
                // Navigate to the egg shop / get eggs view
                Text("Get Eggs") // Placeholder destination
                    .font(.moreSugar(size: 20))
                    .foregroundColor(.pomoText)
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "gift.fill")
                    Text("Get Eggs")
                        .font(.moreSugar(size: 14))
                }
                .foregroundColor(.pomoPrimary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.pomoChip)
                .clipShape(Capsule())
            }
        }
        .padding(.top, 16)
    }

    // MARK: - Search & Filters

    private var searchAndFilters: some View {
        VStack(spacing: 12) {
            // Search bar
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.pomoMuted)

                TextField("Search pets...", text: $searchText)
                    .font(.moreSugarThin(size: 15))
                    .foregroundColor(.pomoText)

                if !searchText.isEmpty {
                    Button {
                        searchText = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.pomoMuted)
                    }
                }
            }
            .padding(12)
            .background(Color.white)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color.pomoBorder, lineWidth: 1))

            // Rarity filter pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    rarityPill(label: "All", rarity: nil)
                    ForEach(PetRarity.allCases, id: \.self) { rarity in
                        rarityPill(label: rarity.label, rarity: rarity)
                    }
                }
            }

            // Sort picker
            HStack {
                Text("Sort by")
                    .font(.moreSugarThin(size: 13))
                    .foregroundColor(.pomoMuted)

                Picker("Sort", selection: $sortOption) {
                    ForEach(PetSortOption.allCases, id: \.self) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.menu)
                .tint(.pomoPrimary)

                Spacer()
            }
        }
    }

    private func rarityPill(label: String, rarity: PetRarity?) -> some View {
        let isSelected = selectedRarity == rarity
        return Button {
            selectedRarity = rarity
        } label: {
            Text(label)
                .font(.moreSugar(size: 12))
                .foregroundColor(isSelected ? .white : (rarity?.color ?? .pomoText))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(isSelected ? (rarity?.color ?? Color.pomoPrimary) : Color.white)
                .clipShape(Capsule())
                .overlay(
                    Capsule().stroke(rarity?.color ?? Color.pomoBorder, lineWidth: 1)
                )
        }
    }

    // MARK: - Grid

    private var petGrid: some View {
        Group {
            if isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                        .tint(.pomoPrimary)
                    Text("Loading pets...")
                        .font(.moreSugarThin(size: 14))
                        .foregroundColor(.pomoMuted)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
            } else if let error = errorMessage {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 32))
                        .foregroundColor(.pomoError)
                    Text(error)
                        .font(.moreSugarThin(size: 14))
                        .foregroundColor(.pomoError)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await loadPets() }
                    }
                    .buttonStyle(PomoOutlineButtonStyle())
                    .frame(width: 120)
                }
                .padding(.top, 40)
            } else if filteredPets.isEmpty {
                VStack(spacing: 12) {
                    Text("No pets found")
                        .font(.moreSugar(size: 18))
                        .foregroundColor(.pomoMuted)
                    if !searchText.isEmpty || selectedRarity != nil {
                        Text("Try adjusting your filters")
                            .font(.moreSugarThin(size: 14))
                            .foregroundColor(.pomoMuted)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
            } else {
                let columns = [
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12)
                ]

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(Array(filteredPets.enumerated()), id: \.element.id) { index, pet in
                        PetCard(pet: pet, index: index)
                            .onTapGesture { selectedPet = pet }
                    }
                }
            }
        }
    }

    // MARK: - Data Loading

    private func loadPets() async {
        guard let uid = authVM.userId else {
            errorMessage = "Not signed in"
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let petData: [UserPet] = try await supabase
                .from("user_pets")
                .select("*, catalog_pet:catalog_pet_id(name, species, description)")
                .eq("user_id", value: uid)
                .order("acquired_at", ascending: false)
                .execute()
                .value
            pets = petData
        } catch {
            errorMessage = "Failed to load pets: \(error.localizedDescription)"
        }

        isLoading = false
    }

    private func setActivePet(petId: String) async {
        guard let uid = authVM.userId else { return }

        do {
            // Unset all currently active pets
            try await supabase
                .from("user_pets")
                .update(["is_selected": false])
                .eq("user_id", value: uid)
                .eq("is_selected", value: true)
                .execute()

            // Set the new active pet
            try await supabase
                .from("user_pets")
                .update(["is_selected": true])
                .eq("id", value: petId)
                .execute()

            // Update local state
            for i in pets.indices {
                pets[i].isSelected = (pets[i].id == petId)
            }

            // Refresh the selected pet in the detail sheet
            if let idx = pets.firstIndex(where: { $0.id == petId }) {
                selectedPet = pets[idx]
            }
        } catch {
            errorMessage = "Failed to set active pet"
        }
    }
}

// MARK: - Pet Card

private struct PetCard: View {
    let pet: UserPet
    let index: Int

    private var displayName: String {
        pet.nickname ?? pet.catalogPet?.name ?? "Unknown Pet"
    }

    var body: some View {
        VStack(spacing: 8) {
            // Pet sprite placeholder
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.6))
                    .frame(width: 56, height: 56)

                Text("🐾")
                    .font(.system(size: 28))
            }
            .padding(.top, 4)

            // Active indicator
            if pet.isSelected {
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 8))
                    Text("Active")
                        .font(.moreSugar(size: 9))
                }
                .foregroundColor(.pomoPrimary)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(Color.pomoChip)
                .clipShape(Capsule())
            }

            // Name
            Text(displayName)
                .font(.moreSugar(size: 13))
                .foregroundColor(.pomoPrimary)
                .lineLimit(1)
                .truncationMode(.tail)

            // Species
            if let species = pet.catalogPet?.species {
                Text(species)
                    .font(.moreSugarThin(size: 11))
                    .foregroundColor(.pomoMuted)
                    .lineLimit(1)
            }

            // Rarity badge
            Text(pet.rarity.label)
                .font(.moreSugar(size: 10))
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 3)
                .background(pet.rarity.color)
                .clipShape(Capsule())

            // Level
            Text("Lv. \(pet.level)")
                .font(.moreSugarThin(size: 11))
                .foregroundColor(.pomoText)

            // Mini stat bars
            VStack(spacing: 4) {
                MiniStatBar(label: "HP", value: pet.health, color: .pomoSuccess)
                MiniStatBar(label: "HN", value: pet.hunger, color: Color(red: 0.753, green: 0.541, blue: 0.188))
                MiniStatBar(label: "EN", value: pet.energy, color: Color(red: 0.400, green: 0.533, blue: 0.800))
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .frame(maxWidth: .infinity)
        .pastelCard(.pastelCard(at: index))
    }
}

// MARK: - Mini Stat Bar (compact version for cards)

private struct MiniStatBar: View {
    let label: String
    let value: Int
    let color: Color

    private var pct: CGFloat { CGFloat(max(0, min(100, value))) / 100 }

    var body: some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.moreSugarThin(size: 9))
                .foregroundColor(.pomoMuted)
                .frame(width: 18, alignment: .leading)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.5))
                        .frame(height: 4)

                    Capsule()
                        .fill(color)
                        .frame(width: geo.size.width * pct, height: 4)
                }
            }
            .frame(height: 4)
        }
    }
}

// MARK: - Pet Detail Sheet

private struct PetDetailSheet: View {
    let pet: UserPet
    @Bindable var authVM: AuthViewModel

    var onDismiss: (UserPet?) -> Void
    var onSetActive: (String) -> Void

    @State private var nickname: String = ""
    @State private var isSavingNickname = false
    @State private var isSettingActive = false
    @State private var nicknameSaved = false
    @State private var localPet: UserPet

    @Environment(\.dismiss) private var dismiss

    init(pet: UserPet, authVM: AuthViewModel, onDismiss: @escaping (UserPet?) -> Void, onSetActive: @escaping (String) -> Void) {
        self.pet = pet
        self.authVM = authVM
        self.onDismiss = onDismiss
        self.onSetActive = onSetActive
        _nickname = State(initialValue: pet.nickname ?? "")
        _localPet = State(initialValue: pet)
    }

    private var displayName: String {
        localPet.nickname ?? localPet.catalogPet?.name ?? "Unknown Pet"
    }

    private var acquiredDate: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: localPet.acquiredAt) {
            let display = DateFormatter()
            display.dateStyle = .medium
            display.timeStyle = .none
            return display.string(from: date)
        }
        // Fallback: try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: localPet.acquiredAt) {
            let display = DateFormatter()
            display.dateStyle = .medium
            display.timeStyle = .none
            return display.string(from: date)
        }
        return localPet.acquiredAt
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Pet sprite
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.6))
                            .frame(width: 100, height: 100)

                        Text("🐾")
                            .font(.system(size: 52))
                    }
                    .padding(.top, 8)

                    // Name & species
                    VStack(spacing: 4) {
                        Text(displayName)
                            .font(.moreSugar(size: 24))
                            .foregroundColor(.pomoPrimary)

                        if let species = localPet.catalogPet?.species {
                            Text(species)
                                .font(.moreSugarThin(size: 15))
                                .foregroundColor(.pomoMuted)
                        }
                    }

                    // Rarity badge
                    Text(localPet.rarity.label)
                        .font(.moreSugar(size: 13))
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(localPet.rarity.color)
                        .clipShape(Capsule())

                    // Active indicator
                    if localPet.isSelected {
                        HStack(spacing: 6) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 12))
                            Text("Active Pet")
                                .font(.moreSugar(size: 13))
                        }
                        .foregroundColor(.pomoPrimary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(Color.pomoChip)
                        .clipShape(Capsule())
                    }

                    // Level & XP
                    VStack(spacing: 8) {
                        HStack {
                            Text("Level \(localPet.level)")
                                .font(.moreSugar(size: 16))
                                .foregroundColor(.pomoPrimary)

                            Spacer()

                            Text("\(localPet.xp) XP")
                                .font(.moreSugarThin(size: 13))
                                .foregroundColor(.pomoMuted)
                        }

                        // XP bar
                        GeometryReader { geo in
                            let xpForLevel = 100 // XP needed per level
                            let progress = CGFloat(localPet.xp % xpForLevel) / CGFloat(xpForLevel)
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.white.opacity(0.5))
                                    .frame(height: 10)

                                Capsule()
                                    .fill(Color.pomoPrimary.opacity(0.7))
                                    .frame(width: geo.size.width * progress, height: 10)
                            }
                        }
                        .frame(height: 10)
                    }
                    .padding(16)
                    .pastelCard(.cardCream)

                    // Stat bars
                    VStack(spacing: 10) {
                        Text("Stats")
                            .font(.moreSugar(size: 16))
                            .foregroundColor(.pomoPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        StatBar(label: "Health", value: localPet.health)
                        StatBar(label: "Hunger", value: localPet.hunger)
                        StatBar(label: "Energy", value: localPet.energy)
                    }
                    .padding(16)
                    .pastelCard(.cardSage)

                    // Description
                    if let description = localPet.catalogPet?.description, !description.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("About")
                                .font(.moreSugar(size: 16))
                                .foregroundColor(.pomoPrimary)

                            Text(description)
                                .font(.moreSugarThin(size: 14))
                                .foregroundColor(.pomoText)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(16)
                        .pastelCard(.cardLavender)
                    }

                    // Nickname form
                    VStack(spacing: 12) {
                        Text("Nickname")
                            .font(.moreSugar(size: 16))
                            .foregroundColor(.pomoPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        HStack(spacing: 10) {
                            TextField("Give your pet a nickname", text: $nickname)
                                .font(.moreSugarThin(size: 14))
                                .foregroundColor(.pomoText)
                                .padding(12)
                                .background(Color.white)
                                .clipShape(Capsule())
                                .overlay(Capsule().stroke(Color.pomoBorder, lineWidth: 1))

                            Button {
                                Task { await saveNickname() }
                            } label: {
                                Group {
                                    if isSavingNickname {
                                        ProgressView()
                                            .tint(.white)
                                    } else if nicknameSaved {
                                        Image(systemName: "checkmark")
                                    } else {
                                        Text("Save")
                                            .font(.moreSugar(size: 13))
                                    }
                                }
                                .foregroundColor(.pomoPrimaryText)
                                .frame(width: 56, height: 42)
                                .background(Color.pomoPrimary)
                                .clipShape(Capsule())
                            }
                            .disabled(isSavingNickname)
                        }
                    }
                    .padding(16)
                    .pastelCard(.cardPink)

                    // Set as active pet button
                    if !localPet.isSelected {
                        Button {
                            isSettingActive = true
                            onSetActive(localPet.id)
                            // Update local state optimistically
                            localPet.isSelected = true
                            isSettingActive = false
                        } label: {
                            HStack(spacing: 8) {
                                if isSettingActive {
                                    ProgressView()
                                        .tint(.pomoPrimaryText)
                                } else {
                                    Image(systemName: "star.fill")
                                    Text("Set as Active Pet")
                                }
                            }
                        }
                        .buttonStyle(PomoPillButtonStyle(isDisabled: isSettingActive))
                        .disabled(isSettingActive)
                        .padding(.horizontal, 4)
                    }

                    // Acquired date
                    HStack(spacing: 6) {
                        Image(systemName: "calendar")
                            .foregroundColor(.pomoMuted)
                            .font(.system(size: 13))
                        Text("Acquired \(acquiredDate)")
                            .font(.moreSugarThin(size: 13))
                            .foregroundColor(.pomoMuted)
                    }
                    .padding(.top, 4)
                    .padding(.bottom, 24)
                }
                .padding(.horizontal, 20)
            }
            .background(Color.pomoBackground)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        onDismiss(localPet)
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.pomoMuted)
                            .font(.system(size: 22))
                    }
                }
            }
        }
    }

    private func saveNickname() async {
        let trimmed = nickname.trimmingCharacters(in: .whitespaces)
        isSavingNickname = true
        nicknameSaved = false

        do {
            let value: String? = trimmed.isEmpty ? nil : trimmed
            try await supabase
                .from("user_pets")
                .update(["nickname": value as Any])
                .eq("id", value: localPet.id)
                .execute()

            localPet.nickname = value
            nicknameSaved = true

            // Reset checkmark after a delay
            try? await Task.sleep(for: .seconds(2))
            nicknameSaved = false
        } catch {
            // Silently fail; user can retry
        }

        isSavingNickname = false
    }
}

// MARK: - Preview

#Preview {
    PetsView(authVM: AuthViewModel())
}
