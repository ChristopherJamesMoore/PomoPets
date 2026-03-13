import { Outlet } from 'react-router-dom'
import GameNav from './GameNav'

export default function GameLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf6ee' }}>
      <GameNav />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
