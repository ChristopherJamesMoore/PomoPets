import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ShopPage from './pages/ShopPage';
import StudyPage from './pages/StudyPage';
import PetsPage from './pages/PetsPage';
import GamesPage from './pages/GamesPage';
import TicTacToePage from './pages/TicTacToePage';
import HelpPage from './pages/HelpPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute onlyIncomplete />}>
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/tictactoe" element={<TicTacToePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
