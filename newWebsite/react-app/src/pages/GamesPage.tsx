import { Link } from 'react-router-dom';
import './GamesPage.css';

export default function GamesPage() {
  return (
    <div className="games-select">
      <section>
        <span className="game-tile">
          <Link to="/games/tictactoe">
            <img src="/images/tictac-preview.png" alt="Tic Tac Toe" />
          </Link>
        </span>
        <span className="game-tile"></span>
        <span className="game-tile"></span>
      </section>
      <section>
        <span className="game-tile"></span>
        <span className="game-tile"></span>
        <span className="game-tile"></span>
      </section>
      <section>
        <span className="game-tile"></span>
        <span className="game-tile"></span>
        <span className="game-tile"></span>
      </section>
    </div>
  );
}
