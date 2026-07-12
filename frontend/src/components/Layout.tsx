import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { to: "/events", label: "이벤트", icon: "🎉" },
  { to: "/scan", label: "QR 스캔", icon: "📷" },
  { to: "/settings", label: "설정", icon: "⚙️" },
];

export function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-lg">🎁</span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">GIFTLINK</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <span>🚪</span> 로그아웃
        </button>
      </aside>

      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
