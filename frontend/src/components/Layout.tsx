import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlarmClock, ChevronDown, History, LayoutDashboard, LogOut, Menu, ShoppingBag, Users, X } from 'lucide-react';
import { auth } from '../lib/api';
import { Logo } from './ui';

const links = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/devedores', label: 'Devedores', icon: AlarmClock },
  { to: '/vendas', label: 'Vendas', icon: ShoppingBag },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cobrancas', label: 'Cobranças', icon: History },
];

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Layout() {
  const [mobile, setMobile] = useState(false);
  const [menuUser, setMenuUser] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = auth.getUsuario();
  const nome = usuario?.nome ?? 'Usuário';

  useEffect(() => {
    setMobile(false);
    setMenuUser(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuUser) return;
    const fora = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setMenuUser(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [menuUser]);

  function sair() {
    auth.sair();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-full bg-creme">
      <header className="sticky top-0 z-30 border-b border-borda bg-creme/85 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center gap-4 px-5 sm:px-8">
          <NavLink to="/" className="shrink-0">
            <Logo />
          </NavLink>

          <nav className="mx-auto hidden items-center gap-0.5 rounded-full border border-borda bg-white p-1 lg:flex">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
                    isActive ? 'bg-floresta font-medium text-creme' : 'text-oliva hover:bg-creme hover:text-floresta'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div ref={userRef} className="relative hidden sm:block">
              <button
                onClick={() => setMenuUser((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-borda bg-white py-1 pl-1 pr-3 transition hover:border-floresta/30"
                aria-haspopup="menu"
                aria-expanded={menuUser}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-floresta font-serif text-sm text-creme">{iniciais(nome)}</span>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-floresta xl:block">{nome}</span>
                <ChevronDown className="h-4 w-4 text-oliva" />
              </button>
              {menuUser && (
                <div role="menu" className="absolute right-0 mt-2 w-60 animate-slide-in overflow-hidden rounded-2xl border border-borda bg-white shadow-pop">
                  <div className="border-b border-borda-fina px-4 py-3">
                    <p className="truncate text-sm font-medium text-floresta">{nome}</p>
                    <p className="truncate text-xs text-oliva">{usuario?.email ?? ''}</p>
                  </div>
                  <button onClick={sair} role="menuitem" className="flex w-full items-center gap-2 px-4 py-3 text-sm text-critico-fg transition hover:bg-critico-bg/60">
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setMobile((v) => !v)} className="rounded-full border border-borda bg-white p-2 text-floresta lg:hidden" aria-label={mobile ? 'Fechar menu' : 'Abrir menu'}>
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobile && (
          <div className="animate-slide-in border-t border-borda bg-creme px-5 pb-5 pt-3 lg:hidden">
            <nav className="grid gap-1 rounded-3xl border border-borda bg-white p-2">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition ${isActive ? 'bg-floresta font-medium text-creme' : 'text-floresta hover:bg-creme'}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-3 rounded-full border border-borda bg-white py-1.5 pl-1.5 pr-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-floresta font-serif text-sm text-creme">{iniciais(nome)}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-floresta">{nome}</span>
              <button onClick={sair} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-critico-fg hover:bg-critico-bg/60">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
