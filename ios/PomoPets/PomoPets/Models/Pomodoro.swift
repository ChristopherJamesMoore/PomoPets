import Foundation

struct StudySession: Codable, Identifiable, Sendable {
    let id: String
    let userId: String
    let title: String
    var status: String
    let workDuration: Int
    let breakDuration: Int
    var coinsEarned: Int
    var roundsCompleted: Int
    var totalWorkSeconds: Int
    let startedAt: String
    var finishedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, status
        case userId = "user_id"
        case workDuration = "work_duration"
        case breakDuration = "break_duration"
        case coinsEarned = "coins_earned"
        case roundsCompleted = "rounds_completed"
        case totalWorkSeconds = "total_work_seconds"
        case startedAt = "started_at"
        case finishedAt = "finished_at"
    }
}

struct StudyTask: Codable, Identifiable, Sendable {
    let id: String
    let sessionId: String
    let userId: String
    let text: String
    var completed: Bool
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, text, completed
        case sessionId = "session_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
