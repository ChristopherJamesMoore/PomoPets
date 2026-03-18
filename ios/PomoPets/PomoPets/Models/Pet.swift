import Foundation

enum PetRarity: String, Codable, CaseIterable, Sendable {
    case common, uncommon, rare, legendary, prismatic, limited
}

enum PetAvailability: String, Codable, Sendable {
    case standard, limited, retired
}

struct PetCatalogItem: Codable, Identifiable, Sendable {
    let id: String
    let name: String
    let description: String?
    let species: String
    let coinCost: Int
    let availability: PetAvailability
    let eggAssetKey: String?
    let hatchHours: Int
    let isActive: Bool
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, name, description, species, availability
        case coinCost = "coin_cost"
        case eggAssetKey = "egg_asset_key"
        case hatchHours = "hatch_hours"
        case isActive = "is_active"
        case sortOrder = "sort_order"
    }
}

struct PetVariant: Codable, Identifiable, Sendable {
    let id: String
    let catalogPetId: String
    let rarity: PetRarity
    let assetKey: String
    let dropWeight: Int

    enum CodingKeys: String, CodingKey {
        case id, rarity
        case catalogPetId = "catalog_pet_id"
        case assetKey = "asset_key"
        case dropWeight = "drop_weight"
    }
}

struct UserPet: Codable, Identifiable, Sendable {
    let id: String
    let userId: String
    var nickname: String?
    var isSelected: Bool
    var level: Int
    var xp: Int
    var hunger: Int
    var health: Int
    var energy: Int
    let rarity: PetRarity
    let assetKey: String?
    let acquiredAt: String
    var catalogPet: CatalogPetRef?

    enum CodingKeys: String, CodingKey {
        case id, nickname, level, xp, hunger, health, energy, rarity
        case userId = "user_id"
        case isSelected = "is_selected"
        case assetKey = "asset_key"
        case acquiredAt = "acquired_at"
        case catalogPet = "catalog_pet"
    }

    struct CatalogPetRef: Codable, Sendable {
        let name: String
        let species: String
        let description: String?
    }
}

struct PetEgg: Codable, Identifiable, Sendable {
    let id: String
    let catalogPetId: String
    let hatchAt: String
    var hatchedAt: String?
    var hoursSkipped: Int
    let createdAt: String
    var catalogPet: EggCatalogRef?

    enum CodingKeys: String, CodingKey {
        case id
        case catalogPetId = "catalog_pet_id"
        case hatchAt = "hatch_at"
        case hatchedAt = "hatched_at"
        case hoursSkipped = "hours_skipped"
        case createdAt = "created_at"
        case catalogPet = "catalog_pet"
    }

    struct EggCatalogRef: Codable, Sendable {
        let name: String
        let species: String
        let eggAssetKey: String?

        enum CodingKeys: String, CodingKey {
            case name, species
            case eggAssetKey = "egg_asset_key"
        }
    }
}

struct HatchResult: Codable, Sendable {
    let petId: String
    let rarity: PetRarity
    let assetKey: String
    let petName: String

    enum CodingKeys: String, CodingKey {
        case rarity
        case petId = "pet_id"
        case assetKey = "asset_key"
        case petName = "pet_name"
    }
}

struct PetAbility: Codable, Identifiable, Sendable {
    let id: String
    let name: String
    let description: String
    let unlockLevel: Int
    let minRarity: PetRarity
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, description
        case unlockLevel = "unlock_level"
        case minRarity = "min_rarity"
        case isActive = "is_active"
    }
}
