import { Link } from 'react-router-dom';
import { AlertTriangle, MessageCircle, MessagesSquare } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { Notificacao } from '../lib/types';
import { dataHora } from '../lib/format';
import { Avatar, Card, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function Cobrancas() {
  const { data, loading, error, reload } = useApi<Notificacao[]>('/cobrancas');

  return (
    <div>
      <PageHeader title="Histórico de cobranças" subtitle="Todas as mensagens de cobrança enviadas." />
      {error ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Erro ao carregar cobranças" description={error} action={<Button onClick={reload}>Tentar de novo</Button>} />
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<MessagesSquare className="h-6 w-6" />}
            title="Nenhuma cobrança enviada"
            description="Quando você cobrar um cliente pelo WhatsApp, a mensagem fica registrada aqui."
            action={<Link to="/devedores"><Button>Ver devedores</Button></Link>}
          />
        </Card>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
          {data.map((n) => (
            <li key={String(n.id)} className="relative">
              <span className="absolute -left-[34px] top-5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] ring-4 ring-slate-50">
                <MessageCircle className="h-3 w-3 text-white" />
              </span>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar nome={n.cliente?.nome ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/clientes/${n.clienteId}`} className="font-medium text-slate-900 hover:text-emerald-700">
                      {n.cliente?.nome}
                    </Link>
                    <p className="text-xs text-slate-500">{dataHora(n.criadaEm)}</p>
                  </div>
                  <Badge tone="green">{n.canal === 'WHATSAPP' ? 'WhatsApp' : n.canal}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-xl rounded-tl-none bg-emerald-50/70 px-4 py-3 text-sm text-slate-700">{n.mensagem}</p>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
