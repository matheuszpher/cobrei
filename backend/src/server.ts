import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import { rotas, tratarErros } from './adapters/http/rotas';

const app = express();
// Em produção o site é servido por esta mesma API, então não há acesso de outra origem.
if (process.env.NODE_ENV !== 'production') app.use(cors());
app.use(express.json());
app.get('/api/saude', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api', rotas);

const site = resolve(process.cwd(), 'public');
if (existsSync(site)) {
  app.use(express.static(site));
  app.get('/{*rota}', (req, res, next) => {
    if (req.path.startsWith('/api')) next();
    else res.sendFile('index.html', { root: site });
  });
}
app.use(tratarErros);

const porta = Number(process.env.PORT ?? 3333);
app.listen(porta, () => console.log(`Cobrei API na porta ${porta}`));
