import { NavLink, Route, Routes } from "react-router-dom";
import { CardsPage } from "../pages/cards/CardsPage";
import { HomePage } from "../pages/home/HomePage";

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">
          Repetition
        </NavLink>
        <nav className="nav">
          <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/" end>
            Главная
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/cards">
            Все карточки
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<CardsPage />} path="/cards" />
      </Routes>
    </div>
  );
}
