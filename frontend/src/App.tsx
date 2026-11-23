import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { auth } from './lib/api';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Painel from './pages/Painel';
import Devedores from './pages/Devedores';
import Clientes from './pages/Clientes';
import ClienteDetalhe from './pages/ClienteDetalhe';
import Produtos from './pages/Produtos';
import Vendas from './pages/Vendas';
import Cobrancas from './pages/Cobrancas';

function Protegida({ children }: { children: ReactNode }) {
  if (!auth.getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protegida>
            <Layout />
          </Protegida>
        }
      >
        <Route path="/" element={<Painel />} />
        <Route path="/devedores" element={<Devedores />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<ClienteDetalhe />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/cobrancas" element={<Cobrancas />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
