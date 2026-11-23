import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, Star } from 'lucide-react';
import { api, auth, erroMsg, Usuario } from '../lib/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/ui';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@fiado.com');
  const [senha, setSenha] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  if (auth.getToken()) return <Navigate to="/" replace />;

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const r = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { email, senha });
      auth.salvar(r.token, r.usuario);
      navigate('/', { replace: true });
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-creme lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-floresta p-12 text-creme lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-creme/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full border border-creme/10" />
        <div className="relative">
          <Logo light size="lg" />
          <p className="mt-3 text-sm text-creme/60">Cobrar fiado sem constrangimento</p>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-creme/15 bg-white/5 py-1.5 pl-2 pr-4 text-xs text-creme/80">
            <span className="flex gap-0.5 text-limao">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </span>
            Cobrança no WhatsApp em 1 clique
          </div>
          <h2 className="font-serif text-5xl font-light leading-[1.05] tracking-tight xl:text-6xl">
            O caderninho do fiado, agora em <em className="font-light italic text-limao">ordem.</em>
          </h2>
          <p className="mt-6 max-w-md text-base text-creme/60">Para mercadinhos, padarias e o comércio do bairro venderem fiado e receberem em dia, sem planilha e sem climão.</p>

          <div className="mt-12 grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-3xl bg-creme p-5 text-floresta">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-oliva">Recebido no mês</p>
              <p className="mt-3 font-serif text-5xl font-light leading-none tracking-tight">
                <span className="mr-1 align-[0.35em] text-lg text-verde">R$</span>623
              </p>
              <p className="mt-3 text-xs text-verde">▲ 18% vs. mês passado</p>
            </div>
            <div className="flex flex-col justify-between rounded-3xl border border-creme/15 bg-white/5 p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-creme/50">Em dia</p>
              <p className="font-serif text-5xl font-light leading-none tracking-tight">
                92<span className="text-2xl text-limao">%</span>
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-limao" />
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-creme/40">© {new Date().getFullYear()} Cobrei · Cobrar fiado sem constrangimento</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo size="lg" />
            <p className="mt-2 text-sm text-oliva">Cobrar fiado sem constrangimento</p>
          </div>
          <h1 className="font-serif text-4xl font-light tracking-tight text-floresta">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-oliva">Entre para ver quem está devendo hoje.</p>
          <form onSubmit={entrar} className="mt-10 space-y-5">
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="h-4 w-4" />} required autoFocus />
            <Input label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} icon={<Lock className="h-4 w-4" />} required />
            {erro && (
              <div className="flex items-center gap-2 rounded-2xl bg-critico-bg px-4 py-3 text-sm text-critico-fg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {erro}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
              Entrar
            </Button>
          </form>
          <div className="mt-8 flex items-center gap-2 rounded-full border border-borda bg-white px-4 py-2.5 text-xs text-oliva">
            <span className="h-1.5 w-1.5 rounded-full bg-limao-500" />
            Demonstração: <strong className="font-medium text-floresta">admin@fiado.com</strong> / 123456
          </div>
        </div>
      </div>
    </div>
  );
}
