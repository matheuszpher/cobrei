import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, Store, User } from 'lucide-react';
import { api, auth, erroMsg, Usuario } from '../lib/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/ui';

export default function Cadastro() {
  const navigate = useNavigate();
  const [nomeLoja, setNomeLoja] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  if (auth.getToken()) return <Navigate to="/" replace />;

  async function cadastrar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const r = await api.post<{ token: string; usuario: Usuario }>('/auth/cadastro', { nomeLoja, nome, email, senha });
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
      <div className="hidden flex-col justify-between bg-floresta p-12 text-creme lg:flex xl:p-16">
        <Logo light size="lg" />
        <h2 className="max-w-xl font-serif text-5xl font-light leading-[1.05] tracking-tight xl:text-6xl">
          Sua loja, seu caderninho, <em className="font-light italic text-limao">em ordem.</em>
        </h2>
        <p className="text-xs text-creme/40">© {new Date().getFullYear()} Cobrei · Cobrar fiado sem constrangimento</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo size="lg" /></div>
          <h1 className="font-serif text-4xl font-light tracking-tight text-floresta">Criar conta</h1>
          <p className="mt-2 text-sm text-oliva">Comece a organizar o fiado da sua loja.</p>
          <form onSubmit={cadastrar} className="mt-8 space-y-4">
            <Input label="Nome da loja" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} icon={<Store className="h-4 w-4" />} required minLength={2} maxLength={80} autoFocus />
            <Input label="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} icon={<User className="h-4 w-4" />} required minLength={2} maxLength={80} autoComplete="name" />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="h-4 w-4" />} required autoComplete="email" />
            <Input label="Senha (mínimo de 8 caracteres)" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} icon={<Lock className="h-4 w-4" />} required minLength={8} maxLength={72} autoComplete="new-password" />
            {erro && (
              <div role="alert" className="flex items-center gap-2 rounded-2xl bg-critico-bg px-4 py-3 text-sm text-critico-fg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {erro}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
              Criar conta
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-oliva">
            Já tem conta? <Link to="/login" className="font-medium text-floresta underline underline-offset-4">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
