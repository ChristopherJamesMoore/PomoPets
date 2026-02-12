import GameTile from '../components/GameTile';
import './GamesPage.css';

export default function GamesPage() {
  return (
    <div className="games-select">
      <section>
        <GameTile to="/games/tictactoe" image="/images/tictac-preview.png" alt="Tic Tac Toe" />
        <GameTile />
        <GameTile />
      </section>
      <section>
        <GameTile />
        <GameTile />
        <GameTile />
      </section>
      <section>
        <GameTile />
        <GameTile />
        <GameTile />
      </section>
    </div>
  );
}
