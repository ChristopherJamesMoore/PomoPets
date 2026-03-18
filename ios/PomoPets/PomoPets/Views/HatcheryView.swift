import SwiftUI
import Supabase

// MARK: - Helpers

private let skipCost = 15

private func formatCountdown(_ remaining: TimeInterval) -> String {
    guard remaining > 0 else { return "Ready to hatch!" }
    let total = Int(remaining)
    let d = total / 86400
    let h = (total % 86400) / 3600
    let m = (total % 3600) / 60
    let s = total % 60
    if d > 0 {
        return "\(d)d \(h)h \(String(format: "%02d", m))m"
    }
    return "\(h)h \(String(format: "%02d", m))m \(String(format: "%02d", s))s"
}

private let iso8601: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
}()

private func parseDate(_ iso: String) -> Date {
    iso8601.date(from: iso) ?? Date()
}

// MARK: - Rarity Glow

private extension PetRarity {
    var glowColor: Color {
        switch self {
        case .common:    return Color.gray.opacity(0.25)
        case .uncommon:  return Color.green.opacity(0.25)
        case .rare:      return Color.blue.opacity(0.25)
        case .legendary: return Color.yellow.opacity(0.35)
        case .prismatic: return Color.purple.opacity(0.35)
        case .limited:   return Color(red: 0.482, green: 0.247, blue: 0.627).opacity(0.35)
        }
    }
}

// MARK: - HatcheryView

struct HatcheryView: View {
    @Bindable var authVM: AuthViewModel

    @State private var eggs: [PetEgg] = []
    @State private var results: [String: HatchResult] = [:]
    @State private var skippingId: String?
    @State private var hatchingId: String?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var now = Date()

    private var coins: Int { authVM.profile?.coins ?? 0 }
    private var eggSlots: Int { authVM.profile?.eggSlots ?? 3 }
    private var activeEggs: [PetEgg] { eggs.filter { results[$0.id] == nil } }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                header
                slotBar
                errorBanner
                content
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 80)
        }
        .background(Color.pomoBackground.ignoresSafeArea())
        .task { await fetchEggs() }
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { tick in
            now = tick
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Hatchery")
                    .font(.moreSugar(size: 28))
                    .foregroundColor(.pomoText)
                Text("Your eggs are incubating here")
                    .font(.moreSugarThin(size: 13))
                    .foregroundColor(.pomoMuted)
            }
            Spacer()
            coinsBadge
        }
    }

    private var coinsBadge: some View {
        HStack(spacing: 4) {
            Text("\u{1FA99}")
            Text("\(coins)")
        }
        .font(.moreSugar(size: 15))
        .foregroundColor(.pomoText)
        .padding(.horizontal, 14)
        .padding(.vertical, 5)
        .background(Color.cardCream)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.pomoBorder, lineWidth: 1.5))
    }

    // MARK: - Slot Bar

    private var slotBar: some View {
        HStack(spacing: 12) {
            HStack(spacing: 10) {
                Text("Egg Slots")
                    .font(.moreSugarThin(size: 12))
                    .foregroundColor(.pomoMuted)
                    .textCase(.uppercase)

                HStack(spacing: 5) {
                    ForEach(0..<eggSlots, id: \.self) { i in
                        Circle()
                            .fill(i < activeEggs.count ? Color.pomoText : Color.white.opacity(0.5))
                            .frame(width: 14, height: 14)
                            .overlay(
                                Circle().stroke(
                                    i < activeEggs.count ? Color.pomoText : Color.pomoBorder,
                                    lineWidth: 2
                                )
                            )
                    }
                    ForEach(0..<(5 - eggSlots), id: \.self) { _ in
                        Circle()
                            .fill(Color(.systemGray5))
                            .frame(width: 14, height: 14)
                            .overlay(Circle().stroke(Color(.systemGray4), lineWidth: 2))
                            .opacity(0.5)
                    }
                }

                Text("\(activeEggs.count)/\(eggSlots)")
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoText)
            }

            Spacer()

            if eggSlots < 5 {
                Button {
                    Task { await buySlot() }
                } label: {
                    HStack(spacing: 6) {
                        Text("+ Slot")
                        Text("100 \u{1FA99}")
                            .font(.moreSugar(size: 11))
                            .opacity(0.75)
                    }
                    .font(.moreSugar(size: 13))
                    .foregroundColor(.pomoPrimaryText)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(Color.pomoText)
                    .clipShape(Capsule())
                }
                .disabled(coins < 100)
                .opacity(coins < 100 ? 0.4 : 1)
            } else {
                Text("Max slots reached")
                    .font(.moreSugarThin(size: 12))
                    .foregroundColor(.pomoMuted)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .pastelCard(.cardSky, cornerRadius: 16)
    }

    // MARK: - Error Banner

    @ViewBuilder
    private var errorBanner: some View {
        if let msg = errorMessage {
            Text("\u{26A0}\u{FE0F} \(msg)")
                .font(.moreSugarThin(size: 13))
                .foregroundColor(.pomoError)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color.pomoError.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.pomoError.opacity(0.25), lineWidth: 1.5)
                )
        }
    }

    // MARK: - Content

    @ViewBuilder
    private var content: some View {
        if isLoading {
            loadingState
        } else if eggs.isEmpty {
            emptyState
        } else {
            eggGrid
        }
    }

    private var loadingState: some View {
        Text("\u{1F43E}")
            .font(.system(size: 48))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 60)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("\u{1F95A}")
                .font(.system(size: 64))
                .opacity(0.35)
                .grayscale(1)
            Text("No eggs yet!")
                .font(.moreSugarThin(size: 16))
                .foregroundColor(.pomoMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: - Egg Grid

    private var eggGrid: some View {
        let columns = [
            GridItem(.flexible(), spacing: 16),
            GridItem(.flexible(), spacing: 16),
        ]
        return LazyVGrid(columns: columns, spacing: 16) {
            ForEach(Array(eggs.enumerated()), id: \.element.id) { index, egg in
                if let result = results[egg.id] {
                    hatchResultCard(result: result)
                } else {
                    eggCard(egg: egg, index: index)
                }
            }
        }
    }

    // MARK: - Egg Card

    private func eggCard(egg: PetEgg, index: Int) -> some View {
        let hatchDate = parseDate(egg.hatchAt)
        let createdDate = parseDate(egg.createdAt)
        let remaining = hatchDate.timeIntervalSince(now)
        let isReady = remaining <= 0
        let totalDuration = hatchDate.timeIntervalSince(createdDate)
        let elapsed = now.timeIntervalSince(createdDate)
        let progress = totalDuration > 0
            ? min(1, max(0, elapsed / totalDuration))
            : 1.0
        let canSkip = !isReady && coins >= skipCost

        return VStack(spacing: 8) {
            // Egg emoji
            ZStack {
                if isReady {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.yellow.opacity(0.4), .clear],
                                center: .center,
                                startRadius: 0,
                                endRadius: 50
                            )
                        )
                        .frame(width: 100, height: 100)
                }
                Text("\u{1F95A}")
                    .font(.system(size: 60))
                    .rotationEffect(isReady ? .degrees(-3) : .zero)
                    .animation(
                        isReady
                            ? .easeInOut(duration: 0.4).repeatForever(autoreverses: true)
                            : .default,
                        value: isReady
                    )
            }
            .frame(width: 88, height: 88)

            // Pet name
            Text(egg.catalogPet?.name ?? "Mystery Egg")
                .font(.moreSugar(size: 17))
                .foregroundColor(.pomoText)
                .multilineTextAlignment(.center)
                .lineLimit(2)

            // Species
            Text(egg.catalogPet?.species.capitalized ?? "")
                .font(.moreSugarThin(size: 11))
                .foregroundColor(.pomoMuted)

            // Countdown
            Text(isReady ? "\u{2728} Ready to Hatch!" : formatCountdown(remaining))
                .font(.moreSugar(size: isReady ? 14 : 16))
                .foregroundColor(isReady ? Color(red: 0.753, green: 0.471, blue: 0) : .pomoText)
                .multilineTextAlignment(.center)

            // Hatch-at date
            if !isReady {
                Text("Hatches \(hatchDate.formatted(.dateTime.month(.abbreviated).day().hour().minute()))")
                    .font(.moreSugarThin(size: 10))
                    .foregroundColor(.pomoMuted)
            }

            // Progress bar
            if !isReady {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.5))
                            .frame(height: 6)
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [Color(red: 0.96, green: 0.63, blue: 0.69), .pomoText],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * progress, height: 6)
                    }
                }
                .frame(height: 6)
            }

            // Action buttons
            VStack(spacing: 6) {
                if !isReady {
                    Button {
                        Task { await skipHour(eggId: egg.id) }
                    } label: {
                        Text(skippingId == egg.id ? "\u{2026}" : "\u{2212}1h \u{00B7} \(skipCost) \u{1FA99}")
                            .font(.moreSugar(size: 12))
                            .foregroundColor(.pomoText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 7)
                            .background(Color.white.opacity(0.5))
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(Color.pomoBorder, lineWidth: 1.5))
                    }
                    .disabled(skippingId == egg.id || !canSkip)
                    .opacity(canSkip ? 1 : 0.4)
                }

                if isReady {
                    Button {
                        Task { await hatchEgg(eggId: egg.id) }
                    } label: {
                        Text(hatchingId == egg.id ? "Hatching\u{2026}" : "\u{1F95A} Hatch!")
                            .font(.moreSugar(size: 15))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                LinearGradient(
                                    colors: [
                                        Color(red: 0.96, green: 0.63, blue: 0.13),
                                        Color(red: 0.83, green: 0.44, blue: 0),
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .clipShape(Capsule())
                            .shadow(color: Color(red: 0.83, green: 0.44, blue: 0).opacity(0.35), radius: 8, y: 4)
                    }
                    .disabled(hatchingId == egg.id)
                    .opacity(hatchingId == egg.id ? 0.5 : 1)
                }
            }
            .padding(.top, 4)

            // Skipped hours note
            if egg.hoursSkipped > 0 {
                Text("\u{26A1} \(egg.hoursSkipped)h skipped")
                    .font(.moreSugarThin(size: 10))
                    .foregroundColor(.pomoMuted)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 20)
        .pastelCard(Color.pastelCard(at: index))
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(
                    isReady ? Color(red: 0.96, green: 0.75, blue: 0.25) : Color.pomoBorder,
                    lineWidth: 1.5
                )
        )
    }

    // MARK: - Hatch Result Card

    private func hatchResultCard(result: HatchResult) -> some View {
        VStack(spacing: 10) {
            // Rarity glow
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [result.rarity.glowColor, .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 60
                        )
                    )
                    .frame(width: 120, height: 120)

                Text("\u{1F43E}")
                    .font(.system(size: 64))
            }
            .frame(width: 96, height: 96)

            // Rarity badge
            Text(result.rarity.label.uppercased())
                .font(.moreSugar(size: 12))
                .tracking(0.6)
                .foregroundColor(result.rarity.color)
                .padding(.horizontal, 14)
                .padding(.vertical, 4)
                .background(result.rarity.color.opacity(0.12))
                .clipShape(Capsule())

            // Pet name
            Text(result.petName)
                .font(.moreSugar(size: 20))
                .foregroundColor(.pomoText)
                .multilineTextAlignment(.center)

            Text("A new pet has joined\nyour collection!")
                .font(.moreSugarThin(size: 12))
                .foregroundColor(.pomoMuted)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 24)
        .background(Color.pomoCard)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(result.rarity.color, lineWidth: 2)
        )
        .shadow(color: result.rarity.glowColor, radius: 16, y: 4)
        .transition(.scale.combined(with: .opacity))
    }

    // MARK: - Network

    private func fetchEggs() async {
        isLoading = true
        errorMessage = nil
        do {
            let eggData: [PetEgg] = try await supabase
                .from("pet_eggs")
                .select("*, catalog_pet:catalog_pet_id(name, species, egg_asset_key)")
                .is("hatched_at", value: nil)
                .order("created_at")
                .execute()
                .value
            eggs = eggData
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func skipHour(eggId: String) async {
        errorMessage = nil
        skippingId = eggId
        do {
            let newHatchAt: String = try await supabase
                .rpc("skip_egg_hour", params: ["p_egg_id": eggId])
                .execute()
                .value
            if let idx = eggs.firstIndex(where: { $0.id == eggId }) {
                eggs[idx] = PetEgg(
                    id: eggs[idx].id,
                    catalogPetId: eggs[idx].catalogPetId,
                    hatchAt: newHatchAt,
                    hatchedAt: eggs[idx].hatchedAt,
                    hoursSkipped: eggs[idx].hoursSkipped + 1,
                    createdAt: eggs[idx].createdAt,
                    catalogPet: eggs[idx].catalogPet
                )
            }
            await authVM.refreshProfile()
        } catch {
            errorMessage = error.localizedDescription
        }
        skippingId = nil
    }

    private func hatchEgg(eggId: String) async {
        errorMessage = nil
        hatchingId = eggId
        do {
            let result: HatchResult = try await supabase
                .rpc("hatch_egg", params: ["p_egg_id": eggId])
                .execute()
                .value
            withAnimation(.spring(response: 0.55, dampingFraction: 0.65)) {
                results[eggId] = result
            }
            await authVM.refreshProfile()
        } catch {
            errorMessage = error.localizedDescription
        }
        hatchingId = nil
    }

    private func buySlot() async {
        errorMessage = nil
        do {
            let _: Int = try await supabase
                .rpc("buy_egg_slot")
                .execute()
                .value
            await authVM.refreshProfile()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    HatcheryView(authVM: AuthViewModel())
}
