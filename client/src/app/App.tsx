import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { CalendarDays, House, Layers3, Repeat2 } from "lucide-react";
import { CardsPage } from "../pages/cards/CardsPage";
import { HomePage } from "../pages/home/HomePage";
import { TodayPage } from "../pages/today/TodayPage";

const links = [
  { to: "/", label: "Главная", icon: House },
  { to: "/today", label: "На сегодня", icon: CalendarDays },
  { to: "/cards", label: "Все карточки", icon: Layers3 }
];

export function App() {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Repetition — главная">
          <span className="brand-mark"><Repeat2 size={23} strokeWidth={1.8} /></span>
          <span>repetition<span className="brand-dot">.</span></span>
        </NavLink>
        <nav className="nav" aria-label="Основная навигация">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to={to} end={to === "/"}>
              <Icon size={17} strokeWidth={1.7} />{label}
            </NavLink>
          ))}
        </nav>
      </header>
      {pathname === "/" ? (
        <div className="page-intro">
          <span className="intro-label"><span />Практика делает знания прочнее</span>
          <h1>Запомнить. Повторить. <span>Знать.</span></h1>
          <p>Сохраните важное в карточках. К остальному вернёмся вовремя.</p>
        </div>
      ) : null}
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<CardsPage />} path="/cards" />
        <Route element={<TodayPage />} path="/today" />
      </Routes>
      <footer className="app-footer"><Repeat2 size={14} /> Repetition <span>Меньше заучивания. Больше понимания.</span></footer>
    </div>
  );
}
