import SwiftUI

struct StatBar: View {
    let label: String
    let value: Int
    var trackColor: Color = .white.opacity(0.5)

    private var pct: CGFloat { CGFloat(max(0, min(100, value))) / 100 }
    private var fillColor: Color {
        pct > 0.6 ? Color(red: 0.353, green: 0.620, blue: 0.353) :
        pct > 0.3 ? Color(red: 0.753, green: 0.541, blue: 0.188) :
        Color(red: 0.753, green: 0.314, blue: 0.314)
    }

    var body: some View {
        HStack(spacing: 10) {
            Text(label)
                .font(.moreSugarThin(size: 12))
                .foregroundColor(.pomoMuted)
                .frame(width: 52, alignment: .leading)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(trackColor)
                        .frame(height: 8)

                    Capsule()
                        .fill(fillColor)
                        .frame(width: geo.size.width * pct, height: 8)
                }
            }
            .frame(height: 8)

            Text("\(value)")
                .font(.moreSugar(size: 12))
                .foregroundColor(.pomoMuted)
                .frame(width: 26, alignment: .trailing)
        }
    }
}
