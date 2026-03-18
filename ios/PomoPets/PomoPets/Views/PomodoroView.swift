import SwiftUI
import Combine

// MARK: - Timer State

private enum TimerStatus: String {
    case idle, running, paused
}

private enum TimerPhase: String {
    case work = "Work"
    case `break` = "Break"
}

// MARK: - PomodoroView

struct PomodoroView: View {
    @Bindable var authVM: AuthViewModel

    // Session setup
    @State private var sessionTitle = ""
    @State private var workMinutes = 25
    @State private var breakMinutes = 5

    // Active session
    @State private var activeSession: StudySession?
    @State private var status: TimerStatus = .idle
    @State private var phase: TimerPhase = .work
    @State private var remainingSeconds = 0
    @State private var totalWorkSeconds = 0
    @State private var roundsCompleted = 0
    @State private var coinsEarned = 0
    @State private var roundNumber = 1
    @State private var lastCoinThreshold = 0

    // Tasks
    @State private var tasks: [StudyTask] = []
    @State private var newTaskText = ""

    // History
    @State private var pastSessions: [StudySession] = []

    // Timer
    @State private var timerCancellable: AnyCancellable?

    // Loading
    @State private var isCreating = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Title
                Text("Study Timer")
                    .font(.moreSugar(size: 28))
                    .foregroundColor(.pomoPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if activeSession == nil {
                    setupCard
                } else {
                    sessionHeader
                    timerCard
                    taskListCard
                }

                historySection
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 40)
        }
        .background(Color.pomoBackground)
        .task {
            await loadActiveSession()
            await loadPastSessions()
        }
    }

    // MARK: - Session Setup Card

    private var setupCard: some View {
        VStack(spacing: 16) {
            HStack(spacing: 6) {
                Image(systemName: "timer")
                    .font(.system(size: 16))
                    .foregroundColor(.pomoPrimary)
                Text("New Session")
                    .font(.moreSugar(size: 18))
                    .foregroundColor(.pomoPrimary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            TextField("Session title (e.g. Math Homework)", text: $sessionTitle)
                .pomoPillField()

            // Work duration stepper
            HStack {
                Text("Work Duration")
                    .font(.moreSugarThin(size: 14))
                    .foregroundColor(.pomoText)
                Spacer()
                HStack(spacing: 12) {
                    Button {
                        if workMinutes > 5 { workMinutes -= 5 }
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.pomoPrimary)
                    }
                    Text("\(workMinutes) min")
                        .font(.moreSugar(size: 16))
                        .foregroundColor(.pomoText)
                        .frame(width: 64)
                    Button {
                        if workMinutes < 120 { workMinutes += 5 }
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.pomoPrimary)
                    }
                }
            }

            // Break duration stepper
            HStack {
                Text("Break Duration")
                    .font(.moreSugarThin(size: 14))
                    .foregroundColor(.pomoText)
                Spacer()
                HStack(spacing: 12) {
                    Button {
                        if breakMinutes > 1 { breakMinutes -= 1 }
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.pomoPrimary)
                    }
                    Text("\(breakMinutes) min")
                        .font(.moreSugar(size: 16))
                        .foregroundColor(.pomoText)
                        .frame(width: 64)
                    Button {
                        if breakMinutes < 30 { breakMinutes += 1 }
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.pomoPrimary)
                    }
                }
            }

            // Coin hint
            HStack(spacing: 6) {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 14))
                    .foregroundColor(.pomoMuted)
                Text("Earn 2 coins every 30 min")
                    .font(.moreSugarThin(size: 13))
                    .foregroundColor(.pomoMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                Task { await createSession() }
            } label: {
                Text(isCreating ? "Starting..." : "Start Session")
            }
            .buttonStyle(PomoPillButtonStyle(isDisabled: isCreating || sessionTitle.trimmingCharacters(in: .whitespaces).isEmpty))
            .disabled(isCreating || sessionTitle.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(20)
        .pastelCard(.cardLavender)
    }

    // MARK: - Session Header

    private var sessionHeader: some View {
        VStack(spacing: 12) {
            Text(activeSession?.title ?? "Session")
                .font(.moreSugar(size: 20))
                .foregroundColor(.pomoPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                // Coins badge
                HStack(spacing: 4) {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.system(size: 14))
                    Text("\(coinsEarned) coins")
                        .font(.moreSugar(size: 13))
                }
                .foregroundColor(.pomoPrimary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.cardPink)
                .clipShape(Capsule())

                // Rounds badge
                HStack(spacing: 4) {
                    Image(systemName: "arrow.trianglehead.2.clockwise")
                        .font(.system(size: 14))
                    Text("\(roundsCompleted) rounds")
                        .font(.moreSugar(size: 13))
                }
                .foregroundColor(.pomoPrimary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.cardSky)
                .clipShape(Capsule())

                Spacer()
            }
        }
    }

    // MARK: - Timer Card

    private var timerCard: some View {
        VStack(spacing: 20) {
            // Phase pill
            Text(phase.rawValue)
                .font(.moreSugar(size: 14))
                .foregroundColor(.pomoPrimary)
                .padding(.horizontal, 20)
                .padding(.vertical, 6)
                .background(phase == .work ? Color.cardPink : Color.cardSage)
                .clipShape(Capsule())

            // Timer ring
            ZStack {
                // Background ring
                Circle()
                    .stroke(Color.pomoBorder, lineWidth: 8)
                    .frame(width: 200, height: 200)

                // Progress ring
                Circle()
                    .trim(from: 0, to: timerProgress)
                    .stroke(
                        phase == .work ? Color.pomoPrimary : Color.pomoSuccess,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 200, height: 200)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.3), value: timerProgress)

                // Time display
                VStack(spacing: 4) {
                    Text(formattedTime)
                        .font(.moreSugar(size: 44))
                        .foregroundColor(.pomoPrimary)
                        .monospacedDigit()

                    Text("Round \(roundNumber)")
                        .font(.moreSugarThin(size: 13))
                        .foregroundColor(.pomoMuted)
                }
            }

            // Controls
            HStack(spacing: 12) {
                switch status {
                case .idle:
                    Button {
                        startTimer()
                    } label: {
                        Text("Start")
                    }
                    .buttonStyle(PomoPillButtonStyle())

                case .running:
                    Button {
                        pauseTimer()
                    } label: {
                        Text("Pause")
                    }
                    .buttonStyle(PomoOutlineButtonStyle())

                    Button {
                        skipPhase()
                    } label: {
                        Text("Skip")
                    }
                    .buttonStyle(PomoOutlineButtonStyle())

                case .paused:
                    Button {
                        resumeTimer()
                    } label: {
                        Text("Resume")
                    }
                    .buttonStyle(PomoPillButtonStyle())

                    Button {
                        skipPhase()
                    } label: {
                        Text("Skip")
                    }
                    .buttonStyle(PomoOutlineButtonStyle())
                }

                Button {
                    Task { await finishSession() }
                } label: {
                    Text("Finish")
                }
                .buttonStyle(PomoOutlineButtonStyle())
            }
        }
        .padding(20)
        .pastelCard(.cardCream)
    }

    // MARK: - Task List Card

    private var taskListCard: some View {
        VStack(spacing: 16) {
            HStack(spacing: 6) {
                Image(systemName: "checklist")
                    .font(.system(size: 16))
                    .foregroundColor(.pomoPrimary)
                Text("Tasks")
                    .font(.moreSugar(size: 18))
                    .foregroundColor(.pomoPrimary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Add task input
            HStack(spacing: 8) {
                TextField("Add a task...", text: $newTaskText)
                    .pomoPillField()

                Button {
                    Task { await addTask() }
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.pomoPrimary)
                }
                .disabled(newTaskText.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity(newTaskText.trimmingCharacters(in: .whitespaces).isEmpty ? 0.4 : 1.0)
            }

            // Task items
            if tasks.isEmpty {
                Text("No tasks yet. Add one above!")
                    .font(.moreSugarThin(size: 13))
                    .foregroundColor(.pomoMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            } else {
                VStack(spacing: 8) {
                    ForEach(tasks) { task in
                        taskRow(task)
                    }
                }
            }
        }
        .padding(20)
        .pastelCard(.cardSage)
    }

    private func taskRow(_ task: StudyTask) -> some View {
        HStack(spacing: 12) {
            // Checkmark toggle
            Button {
                Task { await toggleTask(task) }
            } label: {
                Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundColor(task.completed ? .pomoSuccess : .pomoMuted)
            }

            Text(task.text)
                .font(.moreSugarThin(size: 14))
                .foregroundColor(task.completed ? .pomoMuted : .pomoText)
                .strikethrough(task.completed)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Delete button
            Button {
                Task { await deleteTask(task) }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundColor(.pomoMuted)
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - History Section

    private var historySection: some View {
        VStack(spacing: 12) {
            if !pastSessions.isEmpty {
                Text("Past Sessions")
                    .font(.moreSugar(size: 18))
                    .foregroundColor(.pomoPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                ForEach(Array(pastSessions.enumerated()), id: \.element.id) { index, session in
                    historyRow(session, index: index)
                }
            }
        }
    }

    private func historyRow(_ session: StudySession, index: Int) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(session.title)
                    .font(.moreSugar(size: 14))
                    .foregroundColor(.pomoText)

                HStack(spacing: 8) {
                    Label("\(session.roundsCompleted) rounds", systemImage: "arrow.trianglehead.2.clockwise")
                    Label("\(session.coinsEarned) coins", systemImage: "dollarsign.circle")
                    Label(formatTotalTime(session.totalWorkSeconds), systemImage: "clock")
                }
                .font(.moreSugarThin(size: 11))
                .foregroundColor(.pomoMuted)
            }

            Spacer()

            if let finished = session.finishedAt {
                Text(formatDate(finished))
                    .font(.moreSugarThin(size: 11))
                    .foregroundColor(.pomoMuted)
            }
        }
        .padding(14)
        .pastelCard(index % 2 == 0 ? .cardPink : .cardSky, cornerRadius: 16)
    }

    // MARK: - Timer Logic

    private var timerProgress: CGFloat {
        let totalSeconds: Int
        if phase == .work {
            totalSeconds = (activeSession?.workDuration ?? workMinutes) * 60
        } else {
            totalSeconds = (activeSession?.breakDuration ?? breakMinutes) * 60
        }
        guard totalSeconds > 0 else { return 0 }
        return CGFloat(totalSeconds - remainingSeconds) / CGFloat(totalSeconds)
    }

    private var formattedTime: String {
        let minutes = remainingSeconds / 60
        let seconds = remainingSeconds % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    private func startTimer() {
        guard let session = activeSession else { return }
        status = .running
        phase = .work
        remainingSeconds = session.workDuration * 60
        startCounting()
    }

    private func pauseTimer() {
        status = .paused
        timerCancellable?.cancel()
        timerCancellable = nil
    }

    private func resumeTimer() {
        status = .running
        startCounting()
    }

    private func skipPhase() {
        timerCancellable?.cancel()
        timerCancellable = nil
        handlePhaseComplete()
    }

    private func startCounting() {
        timerCancellable?.cancel()
        timerCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { _ in
                guard status == .running else { return }

                if remainingSeconds > 0 {
                    remainingSeconds -= 1

                    // Track total work seconds
                    if phase == .work {
                        totalWorkSeconds += 1
                        checkCoinReward()
                    }
                } else {
                    handlePhaseComplete()
                }
            }
    }

    private func handlePhaseComplete() {
        timerCancellable?.cancel()
        timerCancellable = nil

        if phase == .work {
            // Work phase completed -> switch to break
            roundsCompleted += 1
            phase = .break
            remainingSeconds = (activeSession?.breakDuration ?? breakMinutes) * 60
            updateSessionInDB()
            startCounting()
        } else {
            // Break phase completed -> switch to work
            roundNumber += 1
            phase = .work
            remainingSeconds = (activeSession?.workDuration ?? workMinutes) * 60
            startCounting()
        }

        status = .running
    }

    private func checkCoinReward() {
        let currentThreshold = totalWorkSeconds / 1800
        if currentThreshold > lastCoinThreshold {
            lastCoinThreshold = currentThreshold
            coinsEarned += 2
            Task { await awardCoins() }
        }
    }

    // MARK: - Supabase Operations

    private func createSession() async {
        guard let userId = authVM.userId else { return }
        let title = sessionTitle.trimmingCharacters(in: .whitespaces)
        guard !title.isEmpty else { return }

        isCreating = true
        defer { isCreating = false }

        let id = UUID().uuidString
        let now = ISO8601DateFormatter().string(from: Date())

        let params: [String: AnyJSON] = [
            "id": .string(id),
            "user_id": .string(userId),
            "title": .string(title),
            "status": .string("active"),
            "work_duration": .integer(workMinutes),
            "break_duration": .integer(breakMinutes),
            "coins_earned": .integer(0),
            "rounds_completed": .integer(0),
            "total_work_seconds": .integer(0),
            "started_at": .string(now)
        ]

        do {
            let session: StudySession = try await supabase
                .from("study_sessions")
                .insert(params)
                .select()
                .single()
                .execute()
                .value
            activeSession = session
            status = .idle
            phase = .work
            remainingSeconds = session.workDuration * 60
            totalWorkSeconds = 0
            roundsCompleted = 0
            coinsEarned = 0
            roundNumber = 1
            lastCoinThreshold = 0
            tasks = []
            await loadTasks()
        } catch {
            // Session creation failed silently
        }
    }

    private func finishSession() async {
        guard let session = activeSession else { return }

        timerCancellable?.cancel()
        timerCancellable = nil
        status = .idle

        let now = ISO8601DateFormatter().string(from: Date())
        let params: [String: AnyJSON] = [
            "status": .string("finished"),
            "coins_earned": .integer(coinsEarned),
            "rounds_completed": .integer(roundsCompleted),
            "total_work_seconds": .integer(totalWorkSeconds),
            "finished_at": .string(now)
        ]

        do {
            try await supabase
                .from("study_sessions")
                .update(params)
                .eq("id", value: session.id)
                .execute()

            activeSession = nil
            sessionTitle = ""
            await authVM.refreshProfile()
            await loadPastSessions()
        } catch {
            // Update failed silently
        }
    }

    private func updateSessionInDB() {
        guard let session = activeSession else { return }
        let params: [String: AnyJSON] = [
            "coins_earned": .integer(coinsEarned),
            "rounds_completed": .integer(roundsCompleted),
            "total_work_seconds": .integer(totalWorkSeconds)
        ]
        Task {
            try? await supabase
                .from("study_sessions")
                .update(params)
                .eq("id", value: session.id)
                .execute()
        }
    }

    private func awardCoins() async {
        guard let userId = authVM.userId else { return }
        let params: [String: AnyJSON] = [
            "p_user_id": .string(userId),
            "p_amount": .integer(2),
            "p_type": .string("pomodoro_complete")
        ]
        do {
            try await supabase.rpc("earn_coins", params: params).execute()
            await authVM.refreshProfile()
        } catch {
            // Coin award failed silently
        }
    }

    private func loadActiveSession() async {
        guard let userId = authVM.userId else { return }
        do {
            let session: StudySession = try await supabase
                .from("study_sessions")
                .select()
                .eq("user_id", value: userId)
                .eq("status", value: "active")
                .order("started_at", ascending: false)
                .limit(1)
                .single()
                .execute()
                .value
            activeSession = session
            totalWorkSeconds = session.totalWorkSeconds
            roundsCompleted = session.roundsCompleted
            coinsEarned = session.coinsEarned
            lastCoinThreshold = session.totalWorkSeconds / 1800
            remainingSeconds = session.workDuration * 60
            status = .idle
            phase = .work
            roundNumber = roundsCompleted + 1
            await loadTasks()
        } catch {
            activeSession = nil
        }
    }

    private func loadPastSessions() async {
        guard let userId = authVM.userId else { return }
        do {
            let sessions: [StudySession] = try await supabase
                .from("study_sessions")
                .select()
                .eq("user_id", value: userId)
                .eq("status", value: "finished")
                .order("finished_at", ascending: false)
                .limit(10)
                .execute()
                .value
            pastSessions = sessions
        } catch {
            pastSessions = []
        }
    }

    private func loadTasks() async {
        guard let session = activeSession else { return }
        do {
            let loaded: [StudyTask] = try await supabase
                .from("study_tasks")
                .select()
                .eq("session_id", value: session.id)
                .order("created_at", ascending: true)
                .execute()
                .value
            tasks = loaded
        } catch {
            tasks = []
        }
    }

    private func addTask() async {
        guard let session = activeSession,
              let userId = authVM.userId else { return }
        let text = newTaskText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }

        let id = UUID().uuidString
        let now = ISO8601DateFormatter().string(from: Date())

        let params: [String: AnyJSON] = [
            "id": .string(id),
            "session_id": .string(session.id),
            "user_id": .string(userId),
            "text": .string(text),
            "completed": .bool(false),
            "created_at": .string(now)
        ]

        do {
            let task: StudyTask = try await supabase
                .from("study_tasks")
                .insert(params)
                .select()
                .single()
                .execute()
                .value
            tasks.append(task)
            newTaskText = ""
        } catch {
            // Task creation failed silently
        }
    }

    private func toggleTask(_ task: StudyTask) async {
        let newValue = !task.completed
        do {
            try await supabase
                .from("study_tasks")
                .update(["completed": AnyJSON.bool(newValue)])
                .eq("id", value: task.id)
                .execute()

            if let index = tasks.firstIndex(where: { $0.id == task.id }) {
                tasks[index].completed = newValue
            }
        } catch {
            // Toggle failed silently
        }
    }

    private func deleteTask(_ task: StudyTask) async {
        do {
            try await supabase
                .from("study_tasks")
                .delete()
                .eq("id", value: task.id)
                .execute()
            tasks.removeAll { $0.id == task.id }
        } catch {
            // Delete failed silently
        }
    }

    // MARK: - Formatting Helpers

    private func formatTotalTime(_ seconds: Int) -> String {
        let h = seconds / 3600
        let m = (seconds % 3600) / 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m"
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else { return dateString }
        let display = DateFormatter()
        display.dateStyle = .short
        display.timeStyle = .short
        return display.string(from: date)
    }
}

#Preview {
    PomodoroView(authVM: AuthViewModel())
}
