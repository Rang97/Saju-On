import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Logo from "../assets/logo.png";

const navItems = [
  { label: "홈", to: "/" },
  { label: "게시판", to: "/board" },
  { label: "파티 모집", to: "/party" },
  { label: "마이페이지", to: "/mypage" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = () => {
    useAuthStore.getState().clearSession();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
      style={{
        background: "rgba(6,4,15,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(58,154,255,0.1)",
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-3 font-bold text-2xl tracking-widest"
        style={{ fontFamily: "'Rajdhani', sans-serif", color: "#f0f0fa" }}
      >
        <span
          className="w-10 h-10 rounded-sm flex items-center justify-center text-sm font-black p-1.5"
          style={{ background: "linear-gradient(135deg, #261CC1, #3A9AFF)" }}
        >
          <img src={Logo} alt="Logo" />
        </span>
        SAJU-ON
      </button>

      {/* Desktop nav */}
      <ul className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  isActive ? "" : "hover:text-[#c0d4ff]"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "rgba(58,154,255,0.12)", color: "#3A9AFF" }
                  : { color: "rgba(240,240,250,0.45)" }
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Right actions */}
      <div className="hidden md:flex items-center gap-3">
        <button
          className="text-sm px-4 py-2 rounded font-medium transition-colors"
          style={{ color: "rgba(240,240,250,0.45)" }}
          onClick={() => navigate(user ? "/mypage" : "/login")}
        >
          {user ? user.nickname : "로그인"}
        </button>
        <button
          className="text-sm px-5 py-2 rounded font-semibold transition-all hover:brightness-110"
          style={{ background: "#F1FF5E", color: "#06040f" }}
          onClick={user ? logout : () => navigate("/signup")}
        >
          {user ? "로그아웃" : "회원가입"}
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-5 h-0.5"
            style={{ background: "rgba(240,240,250,0.5)" }}
          />
        ))}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="absolute top-16 left-0 right-0 flex flex-col p-4 gap-1 md:hidden"
          style={{
            background: "#100e25",
            borderBottom: "1px solid rgba(58,154,255,0.1)",
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded text-sm font-medium"
              style={({ isActive }) =>
                isActive
                  ? { background: "rgba(58,154,255,0.12)", color: "#3A9AFF" }
                  : { color: "rgba(240,240,250,0.45)" }
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div
            className="flex gap-2 mt-2 pt-2"
            style={{ borderTop: "1px solid rgba(58,154,255,0.1)" }}
          >
            <button
              className="flex-1 py-2 rounded text-sm"
              style={{
                color: "rgba(240,240,250,0.45)",
                background: "rgba(255,255,255,0.04)",
              }}
              onClick={() => {
                setMenuOpen(false);
                navigate(user ? "/mypage" : "/login");
              }}
            >
              {user ? user.nickname : "로그인"}
            </button>
            <button
              className="flex-1 py-2 rounded text-sm font-semibold"
              style={{ background: "#F1FF5E", color: "#06040f" }}
              onClick={() => {
                setMenuOpen(false);
                if (user) logout();
                else navigate("/signup");
              }}
            >
              {user ? "로그아웃" : "회원가입"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
