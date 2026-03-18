import SwiftUI
import CoreText

// MARK: – Brand Colors (Rose theme)
extension Color {
    static let pomoBackground  = Color(red: 0.992, green: 0.965, blue: 0.933) // #fdf6ee
    static let pomoPrimary     = Color(red: 0.235, green: 0.000, blue: 0.031) // #3C0008
    static let pomoText        = Color(red: 0.176, green: 0.176, blue: 0.176) // #2d2d2d
    static let pomoMuted       = Color(red: 0.627, green: 0.502, blue: 0.565) // #a08090
    static let pomoChip        = Color(red: 0.961, green: 0.816, blue: 0.839) // #f5d0d6
    static let pomoPrimaryText = Color(red: 1.000, green: 0.957, blue: 0.902) // #fff4e6
    static let pomoCard        = Color.white
    static let pomoBorder      = Color(red: 0.941, green: 0.847, blue: 0.855) // #f0d8da
    static let pomoError       = Color(red: 0.753, green: 0.314, blue: 0.314) // #c05050
    static let pomoSuccess     = Color(red: 0.314, green: 0.502, blue: 0.314) // #508050

    // Pastel accent card colors
    static let cardLavender = Color(red: 0.941, green: 0.902, blue: 0.965) // #f0e6f6
    static let cardCream    = Color(red: 0.992, green: 0.961, blue: 0.902) // #fdf5e6
    static let cardPink     = Color(red: 0.992, green: 0.910, blue: 0.925) // #fde8ec
    static let cardSage     = Color(red: 0.902, green: 0.941, blue: 0.910) // #e6f0e8
    static let cardSky      = Color(red: 0.902, green: 0.925, blue: 0.965) // #e6ecf6
    static let cardPeach    = Color(red: 0.992, green: 0.933, blue: 0.902) // #fdeee6
}

// MARK: – Pastel Color Array
extension Color {
    static let pastelCards: [Color] = [
        .cardLavender, .cardCream, .cardPink, .cardSage, .cardSky, .cardPeach
    ]

    static func pastelCard(at index: Int) -> Color {
        pastelCards[index % pastelCards.count]
    }
}

// MARK: – Rarity Colors
extension PetRarity {
    var color: Color {
        switch self {
        case .common:    return Color(red: 0.533, green: 0.533, blue: 0.533) // #888
        case .uncommon:  return Color(red: 0.165, green: 0.616, blue: 0.165) // #2a9d2a
        case .rare:      return Color(red: 0.133, green: 0.400, blue: 0.800) // #2266cc
        case .legendary: return Color(red: 0.831, green: 0.627, blue: 0.090) // #d4a017
        case .prismatic: return Color(red: 0.784, green: 0.224, blue: 0.784) // #c839c8
        case .limited:   return Color(red: 0.482, green: 0.247, blue: 0.627) // #7b3fa0
        }
    }

    var label: String {
        rawValue.capitalized
    }
}

// MARK: – Brand Fonts
extension Font {
    static func moreSugar(size: CGFloat) -> Font {
        Font.custom("More Sugar", size: size)
    }
    static func moreSugarThin(size: CGFloat) -> Font {
        Font.custom("More Sugar Thin", size: size)
    }
}

// MARK: – Font Registration
func registerPomoPetsFonts() {
    ["MoreSugar-Regular", "MoreSugar-Thin"].forEach { name in
        guard let url = Bundle.main.url(forResource: name, withExtension: "otf") else { return }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }
}

// MARK: – Primary Button (filled dark maroon)
struct PomoPillButtonStyle: ButtonStyle {
    var isDisabled: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.moreSugar(size: 18))
            .foregroundColor(.pomoPrimaryText)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(configuration.isPressed ? Color.pomoPrimary.opacity(0.85) : Color.pomoPrimary)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.15), radius: 0, x: 0,
                    y: configuration.isPressed ? 1 : 4)
            .offset(y: configuration.isPressed ? 3 : 0)
            .opacity(isDisabled ? 0.6 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: – Secondary Button (outline)
struct PomoOutlineButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.moreSugar(size: 14))
            .foregroundColor(.pomoPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(configuration.isPressed ? Color.pomoChip.opacity(0.5) : Color.clear)
            .overlay(Capsule().stroke(Color.pomoBorder, lineWidth: 1.5))
            .clipShape(Capsule())
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: – Google / Secondary Button
struct PomoGoogleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.moreSugarThin(size: 16))
            .foregroundColor(.pomoText)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color(.systemGray5).opacity(configuration.isPressed ? 0.8 : 0.5))
            .clipShape(Capsule())
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: – Pastel Card Modifier
struct PastelCardStyle: ViewModifier {
    let color: Color
    let cornerRadius: CGFloat

    init(_ color: Color, cornerRadius: CGFloat = 24) {
        self.color = color
        self.cornerRadius = cornerRadius
    }

    func body(content: Content) -> some View {
        content
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .shadow(color: Color.black.opacity(0.06), radius: 8, y: 4)
    }
}

extension View {
    func pastelCard(_ color: Color, cornerRadius: CGFloat = 24) -> some View {
        modifier(PastelCardStyle(color, cornerRadius: cornerRadius))
    }
}
