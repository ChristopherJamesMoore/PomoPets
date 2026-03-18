import SwiftUI
import Supabase

// MARK: - Shop View

struct ShopView: View {
    @Bindable var authVM: AuthViewModel

    @State private var catalog: [PetCatalogItem] = []
    @State private var variants: [String: [PetVariant]] = [:]  // keyed by catalogPetId
    @State private var activeEggCount = 0
    @State private var isLoading = true
    @State private var buyError: String?

    private var coins: Int { authVM.profile?.coins ?? 0 }
    private var eggSlots: Int { authVM.profile?.eggSlots ?? 3 }
    private var slotsLeft: Int { eggSlots - activeEggCount }

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                headerSection
                slotsIndicator

                if let error = buyError {
                    errorBanner(error)
                }

                if slotsLeft <= 0 {
                    slotFullWarning
                }

                if isLoading {
                    loadingView
                } else if catalog.isEmpty {
                    emptyView
                } else {
                    eggGrid
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(Color.pomoBackground.ignoresSafeArea())
        .task { await fetchData() }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Egg Shop")
                        .font(.moreSugar(size: 28))
                        .foregroundColor(.pomoText)

                    Text("Buy an egg, then hatch it in your hatchery!")
                        .font(.moreSugarThin(size: 14))
                        .foregroundColor(.pomoMuted)
                }

                Spacer()

                coinsBadge
            }
        }
        .padding(.top, 8)
    }

    private var coinsBadge: some View {
        HStack(spacing: 4) {
            Text("\u{1FA99}")  // coin emoji
            Text("\(coins)")
                .font(.moreSugar(size: 16))
                .foregroundColor(.pomoText)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Color.cardCream)
        .clipShape(Capsule())
    }

    // MARK: - Egg Slots Indicator

    private var slotsIndicator: some View {
        HStack(spacing: 6) {
            Text("\u{1F95A}")  // egg emoji
            Text("\(activeEggCount)/\(eggSlots) egg slots")
                .font(.moreSugarThin(size: 14))
                .foregroundColor(.pomoMuted)
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    // MARK: - Error / Warning

    private func errorBanner(_ message: String) -> some View {
        HStack(spacing: 6) {
            Text("\u{26A0}\u{FE0F}")
            Text(message)
                .font(.moreSugarThin(size: 14))
                .foregroundColor(.pomoError)
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(Color.pomoError.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var slotFullWarning: some View {
        Text("All egg slots are full. Hatch an egg to free up a slot.")
            .font(.moreSugarThin(size: 14))
            .foregroundColor(.pomoMuted)
            .multilineTextAlignment(.center)
            .padding(12)
            .frame(maxWidth: .infinity)
            .background(Color.cardPeach)
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Loading / Empty

    private var loadingView: some View {
        VStack(spacing: 12) {
            Text("\u{1F43E}")  // paw emoji
                .font(.system(size: 40))
            Text("Loading...")
                .font(.moreSugarThin(size: 16))
                .foregroundColor(.pomoMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }

    private var emptyView: some View {
        Text("No eggs available right now — check back soon!")
            .font(.moreSugarThin(size: 16))
            .foregroundColor(.pomoMuted)
            .multilineTextAlignment(.center)
            .padding(.top, 60)
    }

    // MARK: - Egg Grid

    private var eggGrid: some View {
        LazyVGrid(columns: columns, spacing: 16) {
            ForEach(Array(catalog.enumerated()), id: \.element.id) { index, pet in
                EggCardView(
                    pet: pet,
                    variants: variants[pet.id] ?? [],
                    cardColor: Color.pastelCard(at: index),
                    coins: coins,
                    slotsLeft: slotsLeft,
                    onBuy: { await buyEgg(petId: pet.id) }
                )
            }
        }
    }

    // MARK: - Data Fetching

    private func fetchData() async {
        isLoading = true
        do {
            let petData: [PetCatalogItem] = try await supabase
                .from("pet_catalog")
                .select("*")
                .eq("is_active", value: true)
                .neq("availability", value: "retired")
                .order("sort_order")
                .execute()
                .value

            let variantData: [PetVariant] = try await supabase
                .from("pet_catalog_variants")
                .select("*")
                .execute()
                .value

            struct EggId: Codable { let id: String }
            let eggData: [EggId] = try await supabase
                .from("pet_eggs")
                .select("id")
                .is("hatched_at", value: nil)
                .execute()
                .value

            // Group variants by catalog pet id
            var grouped: [String: [PetVariant]] = [:]
            for v in variantData {
                grouped[v.catalogPetId, default: []].append(v)
            }
            // Sort each group by drop weight descending
            for key in grouped.keys {
                grouped[key]?.sort { $0.dropWeight > $1.dropWeight }
            }

            catalog = petData
            variants = grouped
            activeEggCount = eggData.count
        } catch {
            buyError = "Failed to load shop: \(error.localizedDescription)"
        }
        isLoading = false
    }

    // MARK: - Buy Action

    private func buyEgg(petId: String) async {
        buyError = nil
        do {
            try await supabase
                .rpc("buy_egg", params: ["p_catalog_pet_id": petId])
                .execute()

            await authVM.refreshProfile()
            activeEggCount += 1
        } catch {
            buyError = error.localizedDescription
        }
    }
}

// MARK: - Egg Card

private struct EggCardView: View {
    let pet: PetCatalogItem
    let variants: [PetVariant]
    let cardColor: Color
    let coins: Int
    let slotsLeft: Int
    let onBuy: () async -> Void

    @State private var showOdds = false
    @State private var isBuying = false
    @State private var successMessage: String?

    private var canAfford: Bool { coins >= pet.coinCost }
    private var hasSlot: Bool { slotsLeft > 0 }
    private var isDisabled: Bool { isBuying || !canAfford || !hasSlot }

    private var hatchTimeLabel: String {
        let h = pet.hatchHours
        if h >= 24 {
            let days = h / 24
            let remainder = h % 24
            return remainder > 0 ? "\(days)d \(remainder)h" : "\(days)d"
        }
        return "\(h)h"
    }

    var body: some View {
        VStack(spacing: 10) {
            // Limited banner
            if pet.availability == .limited {
                Text("Limited")
                    .font(.moreSugar(size: 11))
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .background(PetRarity.limited.color)
                    .clipShape(Capsule())
            }

            // Egg visual
            Text("\u{1F95A}")
                .font(.system(size: 44))

            // Name & species
            Text(pet.name)
                .font(.moreSugar(size: 16))
                .foregroundColor(.pomoText)
                .multilineTextAlignment(.center)
                .lineLimit(2)

            Text(pet.species)
                .font(.moreSugarThin(size: 12))
                .foregroundColor(.pomoMuted)

            // Hatch time chip
            HStack(spacing: 4) {
                Text("\u{23F3}")  // hourglass
                Text("\(hatchTimeLabel) hatch")
                    .font(.moreSugarThin(size: 12))
                    .foregroundColor(.pomoText)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color.white.opacity(0.6))
            .clipShape(Capsule())

            // Rarity odds toggle
            if !variants.isEmpty {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showOdds.toggle()
                    }
                } label: {
                    Text(showOdds ? "Hide odds \u{25B2}" : "View odds \u{25BC}")
                        .font(.moreSugarThin(size: 12))
                        .foregroundColor(.pomoPrimary)
                }

                if showOdds {
                    rarityOddsView
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }

            Spacer(minLength: 0)

            // Cost + Buy
            VStack(spacing: 6) {
                Text("\u{1FA99} \(pet.coinCost)")
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoText)

                Button {
                    Task {
                        isBuying = true
                        await onBuy()
                        isBuying = false
                        successMessage = "Egg added!"
                        try? await Task.sleep(for: .seconds(3))
                        successMessage = nil
                    }
                } label: {
                    Text(isBuying ? "..." : "Buy Egg")
                        .font(.moreSugar(size: 13))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 36)
                        .background(isDisabled ? Color.pomoPrimary.opacity(0.4) : Color.pomoPrimary)
                        .clipShape(Capsule())
                }
                .disabled(isDisabled)

                if let msg = successMessage {
                    Text(msg)
                        .font(.moreSugarThin(size: 11))
                        .foregroundColor(.pomoSuccess)
                }

                if !canAfford && !isBuying {
                    Text("Need \(pet.coinCost - coins) more \u{1FA99}")
                        .font(.moreSugarThin(size: 11))
                        .foregroundColor(.pomoMuted)
                }

                if !hasSlot && canAfford && !isBuying {
                    Text("No egg slots available")
                        .font(.moreSugarThin(size: 11))
                        .foregroundColor(.pomoError)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .pastelCard(cardColor)
    }

    // MARK: - Rarity Odds

    private var rarityOddsView: some View {
        let eligible = variants.filter { $0.dropWeight > 0 }
        let totalWeight = eligible.reduce(0) { $0 + $1.dropWeight }

        return VStack(alignment: .leading, spacing: 4) {
            ForEach(eligible) { variant in
                let pct = totalWeight > 0
                    ? Int(round(Double(variant.dropWeight) / Double(totalWeight) * 100))
                    : 0

                HStack(spacing: 6) {
                    Circle()
                        .fill(variant.rarity.color)
                        .frame(width: 8, height: 8)

                    Text(variant.rarity.label)
                        .font(.moreSugarThin(size: 12))
                        .foregroundColor(variant.rarity.color)

                    Spacer()

                    Text("\(pct)%")
                        .font(.moreSugarThin(size: 12))
                        .foregroundColor(.pomoMuted)
                }
            }
        }
        .padding(.horizontal, 4)
    }
}

// MARK: - Preview

#Preview {
    ShopView(authVM: AuthViewModel())
}
