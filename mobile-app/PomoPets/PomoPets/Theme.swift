import SwiftUI

extension Color {
    // PomoPets brand palette
    static let pomoPrimary = Color(red: 0.753, green: 0.518, blue: 0.627)    // #c084a0
    static let pomoPressed = Color(red: 0.627, green: 0.376, blue: 0.502)    // #a06080
    static let pomoText = Color(red: 0.239, green: 0.196, blue: 0.314)       // #3d3250
    static let pomoMuted = Color(red: 0.541, green: 0.478, blue: 0.604)      // #8a7a9a
    static let pomoCard = Color(red: 0.980, green: 0.961, blue: 1.0)         // #faf5ff
    static let pomoError = Color(red: 0.753, green: 0.314, blue: 0.314)      // #c05050
    static let pomoSuccess = Color(red: 0.314, green: 0.502, blue: 0.314)    // #508050
}

struct PomoPillButtonStyle: ButtonStyle {
    var backgroundColor: Color = .pomoPrimary
    var pressedColor: Color = .pomoPressed
    var foregroundColor: Color = .white
    var isDisabled: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(foregroundColor)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(configuration.isPressed ? pressedColor : backgroundColor)
            .clipShape(Capsule())
            .opacity(isDisabled ? 0.6 : 1.0)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct PomoGoogleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16))
            .foregroundColor(.pomoText)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(
                Color(.systemGray5)
                    .opacity(configuration.isPressed ? 0.8 : 0.5)
            )
            .clipShape(Capsule())
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}
