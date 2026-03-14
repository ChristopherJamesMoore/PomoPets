import { Outlet } from 'react-router-dom'
import GameNav from './GameNav'

export default function GameLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <GameNav />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
