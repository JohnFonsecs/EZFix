import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from 'morgan'; // Importa o logger de requisições
import { autenticar } from './middleware/auth'; // Importa seu middleware

import authRoutes from "./routes/authRoutes";
import redacaoRoutes from "./routes/redacaoRoutes";
import turmaRoutes from './routes/turmaRoutes';
import avaliacaoRoutes from './routes/avaliacaoRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use("/api/auth", authRoutes);

app.use("/api/redacoes", autenticar, redacaoRoutes);
app.use("/api/turmas", autenticar, turmaRoutes);
app.use('/api/avaliacoes', autenticar, avaliacaoRoutes);

export default app;
