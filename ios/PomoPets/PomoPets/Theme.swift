import SwiftUI
import CoreText

// MARK: – Brand Colors
extension Color {
    static let pomoBackground  = Color(red: 0.992, green: 0.965, blue: 0.933) // #fdf6ee
    static let pomoPrimary     = Color(red: 0.235, green: 0.000, blue: 0.031) // #3C0008
    static let pomoText        = Color(red: 0.176, green: 0.176, blue: 0.176) // #2d2d2d
    static let pomoMuted       = Color(red: 0.400, green: 0.400, blue: 0.400) // #666666
    static let pomoChip        = Color(red: 0.961, green: 0.816, blue: 0.839) // #f5d0d6
    static let pomoPrimaryText = Color(red: 1.000, green: 0.957, blue: 0.902) // #fff4e6
    static let pomoCard        = Color.white
    static let pomoError       = Color(red: 0.753, green: 0.314, blue: 0.314) // #c05050
    static let pomoSuccess     = Color(red: 0.314, green: 0.502, blue: 0.314) // #508050
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
            .font(.moreSugar(size: 20))
            .foregroundColor(.pomoPrimaryText)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(configuration.isPressed ? Color.pomoPrimary.opacity(0.85) : Color.pomoPrimary)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.15), radius: 0, x: 0,
                    y: configuration.isPressed ? 1 : 4)
            .offset(y: configuration.isPressed ? 3 : 0)
            .opacity(isDisabled ? 0.6 : 1.0)
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
