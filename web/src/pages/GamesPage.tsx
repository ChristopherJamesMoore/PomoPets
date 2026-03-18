import { Link } from 'react-router-dom'
import './GamesPage.css'

const games = [
  {
    id: 'tic-tac-toe',
    title: 'Sun & Moon',
    description: 'Classic Tic Tac Toe — pick your side and outsmart the bot. Win to earn a coin!',
    icon: '☀️',
    path: '/games/tic-tac-toe',
  },
]

export default function GamesPage() {
  return (
    <div className="games-page">
      <div className="games-header">
        <span className="games-eyebrow">Mini Games</span>
        <h1 className="games-title">Play & Earn</h1>
        <p className="games-subtitle">Take a break from studying and earn some extra coins!</p>
      </div>

      <div className="games-grid">
        {games.map(game => (
          <Link to={game.path} key={game.id} className="game-card">
            <span className="game-card-icon">{game.icon}</span>
            <h2 className="game-card-title">{game.title}</h2>
            <p className="game-card-desc">{game.description}</p>
            <span className="game-card-reward">+1 🪙 per win</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
