import express from 'express';
import cors from 'cors';
import { rotas, tratarErros } from './adapters/http/rotas';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', rotas);
app.use(tratarErros);

const porta = Number(process.env.PORT ?? 3333);
app.listen(porta, () => console.log(`Cobrei API em http://localhost:${porta}/api`));
