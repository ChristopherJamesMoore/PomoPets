import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import './TicTacToePage.css';

type CellValue = '' | 'X' | 'O';
type GamePhase = 'select' | 'playing' | 'result';

interface GameState {
  board: CellValue[];
  playerChoice: 'X' | 'O';
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  phase: GamePhase;
  botThinking: boolean;
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const initialState: GameState = {
  board: Array(9).fill(''),
  playerChoice: 'X',
  currentTurn: 'X',
  winner: null,
  phase: 'select',
  botThinking: false,
};

function checkWinner(board: CellValue[]): 'X' | 'O' | 'draw' | null {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as 'X' | 'O';
    }
  }
  if (board.every(cell => cell !== '')) return 'draw';
  return null;
}

export default function TicTacToePage() {
  const [game, setGame] = useState<GameState>(initialState);
  const botTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  const handleSelectSide = (choice: 'X' | 'O') => {
    const newState: GameState = {
      ...initialState,
      playerChoice: choice,
      currentTurn: 'X',
      phase: 'playing',
      botThinking: false,
    };
    setGame(newState);

    if (choice === 'O') {
      const delay = Math.floor(Math.random() * 1000) + 200;
      botTimerRef.current = window.setTimeout(() => {
        setGame(prev => {
          const available = prev.board.map((v, i) => (v === '' ? i : -1)).filter(i => i !== -1);
          if (available.length === 0) return prev;
          const pick = available[Math.floor(Math.random() * available.length)];
          const newBoard = [...prev.board];
          newBoard[pick] = 'X';
          return { ...prev, board: newBoard, currentTurn: 'O', botThinking: false };
        });
      }, delay);
      setGame(prev => ({ ...prev, botThinking: true }));
    }
  };

  const handleCellClick = useCallback((index: number) => {
    setGame(prev => {
      if (prev.board[index] !== '' || prev.winner || prev.phase !== 'playing' || prev.botThinking) {
        return prev;
      }

      const playerSign = prev.playerChoice;
      const botSign: CellValue = playerSign === 'X' ? 'O' : 'X';

      const boardAfterPlayer = [...prev.board];
      boardAfterPlayer[index] = playerSign;

      const winner = checkWinner(boardAfterPlayer);
      if (winner) {
        botTimerRef.current = window.setTimeout(() => {
          setGame(g => ({ ...g, phase: 'result' }));
        }, 700);
        return { ...prev, board: boardAfterPlayer, winner, botThinking: false };
      }

      const delay = Math.floor(Math.random() * 1000) + 200;
      botTimerRef.current = window.setTimeout(() => {
        setGame(g => {
          const available = g.board.map((v, i) => (v === '' ? i : -1)).filter(i => i !== -1);
          if (available.length === 0) return { ...g, botThinking: false };
          const pick = available[Math.floor(Math.random() * available.length)];
          const newBoard = [...g.board];
          newBoard[pick] = botSign;
          const botWinner = checkWinner(newBoard);
          if (botWinner) {
            botTimerRef.current = window.setTimeout(() => {
              setGame(gg => ({ ...gg, phase: 'result' }));
            }, 700);
            return { ...g, board: newBoard, winner: botWinner, currentTurn: playerSign, botThinking: false };
          }
          return { ...g, board: newBoard, currentTurn: playerSign, botThinking: false };
        });
      }, delay);

      return {
        ...prev,
        board: boardAfterPlayer,
        currentTurn: botSign,
        botThinking: true,
      };
    });
  }, []);

  const handleReplay = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setGame(initialState);
  };

  const renderIcon = (value: CellValue) => {
    if (value === 'X') return <Icon name="sun" />;
    if (value === 'O') return <Icon name="moon" />;
    return null;
  };

  return (
    <>
      {/* Side selection */}
      <div className={`select-box ${game.phase !== 'select' ? 'hide' : ''}`}>
        <header>Sun & Moon</header>
        <div className="content">
          <div className="title">Choose Your Side:</div>
          <div className="options">
            <button className="playerX" onClick={() => handleSelectSide('X')}>
              <Icon name="sun" style={{ color: '#d4a017', fontSize: 24 }} />
            </button>
            <button className="playerO" onClick={() => handleSelectSide('O')}>
              <Icon name="moon" style={{ color: '#7a6ea0', fontSize: 24 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Game board */}
      <div className={`play-board ${game.phase === 'playing' ? 'show' : ''}`}>
        <div className="details">
          <div className={`players ${game.currentTurn === 'O' ? 'active' : ''}`}>
            <span className="Xturn"><Icon name="sun" /> Turn</span>
            <span className="Oturn"><Icon name="moon" /> Turn</span>
            <div className="slider" />
          </div>
        </div>
        <div className="play-area">
          {[0, 1, 2].map(row => (
            <section key={row}>
              {[0, 1, 2].map(col => {
                const idx = row * 3 + col;
                return (
                  <span
                    key={idx}
                    className={`box${idx + 1}`}
                    onClick={() => handleCellClick(idx)}
                    style={{
                      pointerEvents: game.board[idx] || game.botThinking ? 'none' : 'auto',
                      cursor: game.board[idx] || game.botThinking ? 'default' : 'pointer',
                    }}
                  >
                    {renderIcon(game.board[idx])}
                  </span>
                );
              })}
            </section>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className={`result-box ${game.phase === 'result' ? 'show' : ''}`}>
        <div className="won-text">
          {game.winner === 'X' && (
            <p><Icon name="sun" style={{ color: '#d4a017' }} /><br />Wins!</p>
          )}
          {game.winner === 'O' && (
            <p><Icon name="moon" style={{ color: '#7a6ea0' }} /><br />Wins!</p>
          )}
          {game.winner === 'draw' && <p>Draw!</p>}
        </div>
        <div className="btn">
          <button onClick={handleReplay}>Replay</button>
        </div>
      </div>

      <Link to="/games" className="home-button">Back to Games</Link>
    </>
  );
}
