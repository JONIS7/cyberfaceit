// Salve este arquivo como 'server.js' em uma pasta no seu computador.
// Instale as dependências abrindo o terminal na pasta e rodando:
// npm install express cors node-fetch

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3001;

// --- SUA CHAVE FACEIT AQUI ---
const FACEIT_API_KEY = "7c72e289-6cc6-4b5b-899e-d06a4f2a293a";

// Habilita CORS para aceitar requisições do seu site React
app.use(cors());

// Rota Genérica USANDO REGEX (Funciona em TODAS as versões do Express)
// Captura qualquer coisa que vier depois de /faceit/
app.get(/^\/faceit\/(.*)$/, async (req, res) => {
    // O parâmetro capturado pela regex fica em req.params[0]
    const endpoint = req.params[0];
    const queryString = new URLSearchParams(req.query).toString();

    // Reconstrói a URL para a API da Faceit
    const faceitUrl = `https://open.faceit.com/data/v4/${endpoint}${queryString ? '?' + queryString : ''}`;

    console.log(`[Proxy] Repassando requisição para: ${faceitUrl}`);

    try {
        const response = await fetch(faceitUrl, {
            headers: {
                'Authorization': `Bearer ${FACEIT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`[Proxy Error] Faceit respondeu com status ${response.status}`);
            return res.status(response.status).json({ error: `Faceit API Error: ${response.statusText}` });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error(`[Server Error]`, error);
        res.status(500).json({ error: "Falha interna no servidor proxy" });
    }
});

app.listen(PORT, () => {
    console.log(`
    🚀 SERVER TÁTICO ONLINE!
    📡 Rodando em: http://localhost:${PORT}
    
    Agora seu painel React pode buscar dados reais sem erros de CORS.
    `);
});