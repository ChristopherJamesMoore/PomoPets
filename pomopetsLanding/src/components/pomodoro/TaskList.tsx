import { useState } from 'react'
import type { StudyTask } from '../../types/pomodoro'

interface TaskListProps {
  tasks:     StudyTask[]
  onAdd:     (text: string) => void
  onToggle:  (id: string, completed: boolean) => void
  onDelete:  (id: string) => void
}

export default function TaskList({ tasks, onAdd, onToggle, onDelete }: TaskListProps) {
  const [input, setInput] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  const done  = tasks.filter(t => t.completed).length
  const total = tasks.length

  return (
    <div className="task-list">
      <div className="task-list-header">
        <span className="task-list-title">Tasks</span>
        {total > 0 && (
          <span className="task-list-progress">{done}/{total}</span>
        )}
      </div>

      <form className="task-add-row" onSubmit={handleAdd}>
        <input
          className="task-input"
          type="text"
          placeholder="Add a task…"
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={120}
        />
        <button type="submit" className="task-add-btn" disabled={!input.trim()}>+</button>
      </form>

      {tasks.length === 0 && (
        <p className="task-empty">No tasks yet — add one above!</p>
      )}

      <ul className="task-items">
        {tasks.map(task => (
          <li key={task.id} className={`task-item ${task.completed ? 'task-item--done' : ''}`}>
            <button
              className="task-check"
              onClick={() => onToggle(task.id, !task.completed)}
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed ? '✓' : ''}
            </button>
            <span className="task-text">{task.text}</span>
            <button
              className="task-delete"
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
