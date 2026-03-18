import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './TicTacToePage.css'

type CellValue = 'X' | 'O' | null
type GamePhase = 'select' | 'playing' | 'result'

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function checkWinner(board: CellValue[]): CellValue {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]
    }
  }
  return null
}

function isDraw(board: CellValue[]): boolean {
  return board.every(cell => cell !== null)
}

export default function TicTacToePage() {
  const { user, profile, refreshProfile } = useAuth()

  const [phase, setPhase]           = useState<GamePhase>('select')
  const [playerSign, setPlayerSign] = useState<'X' | 'O'>('X')
  const [board, setBoard]           = useState<CellValue[]>(Array(9).fill(null))
  const [currentTurn, setCurrentTurn] = useState<'X' | 'O'>('X')
  const [winner, setWinner]         = useState<CellValue>(null)
  const [draw, setDraw]             = useState(false)
  const [coinAwarded, setCoinAwarded] = useState(false)
  const [botThinking, setBotThinking] = useState(false)

  const botSign = playerSign === 'X' ? 'O' : 'X'

  const handleResult = useCallback(async (newBoard: CellValue[]) => {
    const w = checkWinner(newBoard)
    if (w) {
      setWinner(w)
      setPhase('result')
      // Award coin if player won
      if (w === playerSign && user && profile) {
        const { error } = await supabase
          .from('profiles')
          .update({ coins: profile.coins + 1 })
          .eq('id', user.id)
        if (!error) {
          setCoinAwarded(true)
          await refreshProfile()
        }
      }
      return true
    }
    if (isDraw(newBoard)) {
      setDraw(true)
      setPhase('result')
      return true
    }
    return false
  }, [playerSign, user, profile, refreshProfile])

  const botMove = useCallback((newBoard: CellValue[], nextTurn: 'X' | 'O') => {
    setBotThinking(true)
    const delay = Math.floor(Math.random() * 600) + 300
    setTimeout(async () => {
      const available = newBoard.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
      if (available.length === 0) { setBotThinking(false); return }
      const pick = available[Math.floor(Math.random() * available.length)]
      const updated = [...newBoard]
      updated[pick] = botSign
      setBoard(updated)
      setCurrentTurn(nextTurn === 'X' ? 'O' : 'X')
      const ended = await handleResult(updated)
      setBotThinking(false)
      if (ended) return
    }, delay)
  }, [botSign, handleResult])

  const handleCellClick = async (index: number) => {
    if (board[index] || phase !== 'playing' || botThinking) return
    if (currentTurn !== playerSign) return

    const newBoard = [...board]
    newBoard[index] = playerSign
    setBoard(newBoard)
    setCurrentTurn(botSign)

    const ended = await handleResult(newBoard)
    if (!ended) {
      botMove(newBoard, botSign)
    }
  }

  const selectSide = (sign: 'X' | 'O') => {
    setPlayerSign(sign)
    setBoard(Array(9).fill(null))
    setCurrentTurn('X')
    setWinner(null)
    setDraw(false)
    setCoinAwarded(false)
    setPhase('playing')

    // If player chose O, bot (X) goes first
    if (sign === 'O') {
      const emptyBoard: CellValue[] = Array(9).fill(null)
      setBotThinking(true)
      setTimeout(() => {
        const pick = Math.floor(Math.random() * 9)
        const updated = [...emptyBoard]
        updated[pick] = 'X'
        setBoard(updated)
        setCurrentTurn('O')
        setBotThinking(false)
      }, 500)
    }
  }

  const replay = () => {
    setPhase('select')
    setBoard(Array(9).fill(null))
    setWinner(null)
    setDraw(false)
    setCoinAwarded(false)
    setBotThinking(false)
  }

  const renderIcon = (sign: CellValue) => {
    if (sign === 'X') return <span className="ttt-sun">☀️</span>
    if (sign === 'O') return <span className="ttt-moon">🌙</span>
    return null
  }

  const playerWon = winner === playerSign
  const botWon = winner === botSign

  return (
    <div className="ttt-page">
      <div className="ttt-back-row">
        <Link to="/games" className="ttt-back">← Back to Games</Link>
      </div>

      {/* ── Side Selection ── */}
      {phase === 'select' && (
        <div className="ttt-select-card">
          <h2 className="ttt-select-title">Sun & Moon</h2>
          <p className="ttt-select-sub">Choose Your Side</p>
          <div className="ttt-select-options">
            <button className="ttt-select-btn ttt-select-sun" onClick={() => selectSide('X')}>
              ☀️ <span>Sun</span>
            </button>
            <button className="ttt-select-btn ttt-select-moon" onClick={() => selectSide('O')}>
              🌙 <span>Moon</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Game Board ── */}
      {phase === 'playing' && (
        <div className="ttt-board-card">
          <div className="ttt-turn-bar">
            <span className={`ttt-turn-label ${currentTurn === 'X' ? 'ttt-turn-active' : ''}`}>
              ☀️ Sun
            </span>
            <span className={`ttt-turn-label ${currentTurn === 'O' ? 'ttt-turn-active' : ''}`}>
              🌙 Moon
            </span>
            <div className={`ttt-turn-slider ${currentTurn === 'O' ? 'ttt-turn-slider--right' : ''}`} />
          </div>

          <div className="ttt-grid">
            {board.map((cell, i) => (
              <button
                key={i}
                className={`ttt-cell ${cell ? 'ttt-cell--filled' : ''}`}
                onClick={() => handleCellClick(i)}
                disabled={!!cell || botThinking || currentTurn !== playerSign}
              >
                {renderIcon(cell)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {phase === 'result' && (
        <div className="ttt-result-card">
          {draw ? (
            <h2 className="ttt-result-text">It's a Draw!</h2>
          ) : playerWon ? (
            <>
              <div className="ttt-result-icon">{renderIcon(playerSign)}</div>
              <h2 className="ttt-result-text">You Win!</h2>
              {coinAwarded && (
                <p className="ttt-coin-reward">+1 🪙</p>
              )}
            </>
          ) : botWon ? (
            <>
              <div className="ttt-result-icon">{renderIcon(botSign)}</div>
              <h2 className="ttt-result-text">Bot Wins!</h2>
              <p className="ttt-result-sub">Better luck next time</p>
            </>
          ) : null}
          <button className="ttt-replay-btn" onClick={replay}>Play Again</button>
        </div>
      )}
    </div>
  )
}
