import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, MessageCircle, PartyPopper, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi } from '../lib/useApi';
import { useCobrar } from '../lib/useCobrar';
import { Dashboard } from '../lib/types';
import { mesCurto, moeda } from '../lib/format';
import { Avatar, Card, EmptyState, PageHeader, Skeleton, Valor } from '../components/ui';
import { Button } from '../components/Button';
import { NivelBadge } from '../components/Badge';

const FLORESTA = '#1F3D2B';
const LIMAO = '#B5D96A';
const coresFaixa: Record<string, string> = {
  'Em dia': '#9CC255',
  '1-30 dias': '#E9C46A',
  '31-60 dias': '#E07A3F',
  '60+ dias': '#9A3324',
};
const eixo = { fill: '#6B6A5E', fontSize: 12 };
const tooltipStyle = { borderRadius: 16, border: '1px solid #E7E3D8', background: '#FFFFFF', boxShadow: 'none', fontSize: 13 };
const tooltipMoeda = (v: number | string) => moeda(Number(v));

function Kpi({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe?: string; destaque?: boolean }) {
  return (
    <div className={`flex flex-col justify-between rounded-3xl p-6 ${destaque ? 'bg-floresta text-creme' : 'border border-borda bg-white text-floresta'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-medium uppercase tracking-[0.12em] ${destaque ? 'text-creme/60' : 'text-oliva'}`}>{titulo}</p>
        <span className={`h-1.5 w-1.5 rounded-full ${destaque ? 'bg-limao' : 'bg-limao-500'}`} />
      </div>
      <p className={`mt-6 font-serif text-[44px] font-light leading-none tracking-tight ${destaque ? 'text-white' : ''}`}>
        <Valor v={valor} simbolo={destaque ? 'text-limao' : 'text-limao-500'} />
      </p>
      {detalhe && <p className={`mt-3 text-xs ${destaque ? 'text-creme/60' : 'text-oliva'}`}>{detalhe}</p>}
    </div>
  );
}

export default function Painel() {
  const { data, loading, error, reload } = useApi<Dashboard>('/dashboard');
  const { cobrar, cobrando } = useCobrar(reload);

  if (error)
    return (
      <Card>
        <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Não foi possível carregar o painel" description={error} action={<Button onClick={reload}>Tentar de novo</Button>} />
      </Card>
    );

  const meses = (data?.ultimos6Meses ?? []).map((m) => ({ ...m, mes: mesCurto(m.mes) }));
  const faixas = data?.faixasAtraso ?? [];
  const totalFaixas = faixas.reduce((a, f) => a + f.valor, 0);

  return (
    <div>
      <PageHeader
        title="Painel"
        subtitle="Resumo do seu fiado hoje."
        actions={
          <Link to="/vendas?nova=1">
            <Button icon={<Plus className="h-4 w-4" />}>Nova venda fiado</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[176px] rounded-3xl" />)
        ) : (
          <>
            <Kpi titulo="Vencido" valor={moeda(data.totalVencido)} detalhe="Já passou do vencimento" destaque />
            <Kpi titulo="Total em aberto" valor={moeda(data.totalEmAberto)} detalhe={`Vendido no mês: ${moeda(data.vendidoNoMes)}`} />
            <Kpi titulo="Clientes devendo" valor={String(data.clientesDevendo)} detalhe="Com saldo em aberto" />
            <Kpi titulo="Recebido no mês" valor={moeda(data.recebidoNoMes)} detalhe="Pagamentos registrados" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-light text-floresta">Vendido x recebido</h2>
              <p className="mt-1 text-sm text-oliva">Últimos 6 meses</p>
            </div>
            <div className="flex gap-4 text-xs text-oliva">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-floresta" /> Vendido</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-limao" /> Recebido</span>
            </div>
          </div>
          <div className="mt-6 h-72">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meses} barGap={6}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EEEAE0" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                  <YAxis tickLine={false} axisLine={false} tick={eixo} tickFormatter={(v) => `R$${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : v}`} width={60} />
                  <Tooltip formatter={tooltipMoeda} cursor={{ fill: '#F3F1EA' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="vendido" name="Vendido" fill={FLORESTA} radius={[10, 10, 10, 10]} maxBarSize={22} />
                  <Bar dataKey="recebido" name="Recebido" fill={LIMAO} radius={[10, 10, 10, 10]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-serif text-2xl font-light text-floresta">Faixas de atraso</h2>
          <p className="mt-1 text-sm text-oliva">Quanto está parado em cada faixa</p>
          <div className="mt-6 h-52">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faixas} layout="vertical" margin={{ left: 4 }}>
                  <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="#EEEAE0" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={eixo} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="faixa" tickLine={false} axisLine={false} tick={{ ...eixo, fill: '#3F3E35' }} width={78} />
                  <Tooltip formatter={tooltipMoeda} cursor={{ fill: '#F3F1EA' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="valor" name="Valor" radius={[10, 10, 10, 10]} maxBarSize={22}>
                    {faixas.map((f) => (
                      <Cell key={f.faixa} fill={coresFaixa[f.faixa] ?? '#9A988A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {!loading && totalFaixas > 0 && (
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-creme-escuro">
              {faixas.map((f) => (
                <div key={f.faixa} style={{ width: `${(f.valor / totalFaixas) * 100}%`, background: coresFaixa[f.faixa] ?? '#9A988A' }} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-end justify-between px-6 pb-4 pt-6">
          <div>
            <h2 className="font-serif text-2xl font-light text-floresta">Quem deve há mais tempo</h2>
            <p className="mt-1 text-sm text-oliva">Os 5 atrasos mais antigos</p>
          </div>
          <Link to="/devedores" className="inline-flex items-center gap-1 rounded-full border border-borda px-3.5 py-1.5 text-sm font-medium text-floresta transition hover:border-floresta/40">
            Ver todos <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3 px-6 pb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data?.topDevedores?.length ? (
          <EmptyState icon={<PartyPopper className="h-6 w-6" />} title="Ninguém devendo!" description="Todos os clientes estão em dia. Bom trabalho." />
        ) : (
          <ul className="divide-y divide-borda-fina border-t border-borda-fina">
            {data.topDevedores.map((d) => (
              <li key={String(d.cliente.id)} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <Avatar nome={d.cliente.nome} />
                <div className="min-w-0 flex-1">
                  <Link to={`/clientes/${d.cliente.id}`} className="font-medium text-floresta hover:underline">
                    {d.cliente.nome}
                  </Link>
                  <p className="text-xs text-oliva">{d.diasAtraso > 0 ? `${d.diasAtraso} dias de atraso` : 'Sem atraso'}</p>
                </div>
                <NivelBadge nivel={d.nivel} />
                <span className="w-32 text-right font-serif text-xl font-light text-floresta">
                  <Valor v={moeda(d.saldo)} simbolo="text-verde" />
                </span>
                <Button size="sm" variant="whatsapp" icon={<MessageCircle className="h-3.5 w-3.5" />} loading={cobrando === d.cliente.id} onClick={() => cobrar(d.cliente.id, d.cliente.nome)}>
                  Cobrar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
