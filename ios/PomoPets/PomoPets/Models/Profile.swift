import Foundation

struct Profile: Codable, Sendable {
    let id: String
    var displayName: String
    var email: String?
    var avatarUrl: String?
    var coins: Int
    var theme: String
    var eggSlots: Int
    let createdAt: String
    var updatedAt: String
    var displayNameChangedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case email
        case avatarUrl = "avatar_url"
        case coins
        case theme
        case eggSlots = "egg_slots"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case displayNameChangedAt = "display_name_changed_at"
    }
}
