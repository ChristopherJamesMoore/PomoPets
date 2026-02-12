import { Link } from 'react-router-dom';

interface GameTileProps {
  to?: string;
  image?: string;
  alt?: string;
}

export default function GameTile({ to, image, alt }: GameTileProps) {
  return (
    <span className="game-tile">
      {to ? (
        <Link to={to}>
          {image && <img src={image} alt={alt ?? ''} />}
        </Link>
      ) : null}
    </span>
  );
}
