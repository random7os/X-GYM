import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/payments', label: 'Payments Hub' },
  { to: '/admin/contracts', label: 'Contracts & Export' },
  { to: '/admin/agents', label: 'Sales Agents' },
  { to: '/admin/profile', label: 'Profile' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#05060f] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#080b14] p-6">
          <div className="mb-12 flex flex-col gap-3">
            <div className="rounded-3xl bg-[#121623] p-5 shadow-glow border border-white/10">
              <p className="text-sm uppercase tracking-[0.35em] text-vital-gold/80">X</p>
              <h1 className="mt-3 text-3xl font-black text-white">Admin Portal</h1>
              <p className="mt-2 text-sm text-white/60">Manage agents, contracts, and approval workflows from one secure control deck.</p>
            </div>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-3xl border px-5 py-4 text-sm font-semibold transition ${
                    isActive ? 'border-vital-gold bg-vital-gold/10 text-vital-gold' : 'border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40">Go</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-14 rounded-3xl border border-white/10 bg-[#0c0f17] p-5 text-sm text-white/80 shadow-glow">
            <p className="uppercase tracking-[0.3em] text-vital-gold/80">Signed in as</p>
            <p className="mt-3 text-base font-semibold text-white">{user?.full_name ?? 'Admin User'}</p>
            <p className="mt-1 text-xs text-white/50">{user?.role?.display_name ?? 'Admin'}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-3xl bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="px-6 py-8">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
