const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Banco de dados em memória (limpa ao reiniciar o servidor na Vercel)
// Para persistência real, use MongoDB ou Redis.
let userStates = {};
let userCommands = {};

// --- ROTAS PARA O CLIENTE C++ (PC) ---

// PC envia o estado atual das funções
app.post('/api/update/:username', (req, res) => {
    const { username } = req.params;
    userStates[username] = req.body;
    res.json({ status: 'success' });
});

// PC pergunta se o celular enviou algum comando
app.get('/api/commands/:username', (req, res) => {
    const { username } = req.params;
    const commands = userCommands[username] || [];
    // Limpa os comandos após o PC ler
    userCommands[username] = [];
    res.json(commands);
});

// --- ROTAS PARA O CELULAR (FRONTEND) ---

// Celular pede o estado atual do menu (para os switches ficarem certos)
app.get('/api/state/:username', (req, res) => {
    const { username } = req.params;
    res.json(userStates[username] || {});
});

// Celular envia uma mudança (ex: ligou GodMode)
app.post('/api/toggle', (req, res) => {
    const { username, category, feature, value } = req.body;
    if (!userCommands[username]) userCommands[username] = [];
    
    // Atualiza o estado local IMEDIATAMENTE para o celular não ver o valor antigo
    if (!userStates[username]) userStates[username] = {};
    if (!userStates[username][category]) userStates[username][category] = {};
    userStates[username][category][feature] = value;

    // Adiciona à lista de comandos pendentes que o PC vai buscar
    userCommands[username].push({ category, feature, value });
    res.json({ status: 'queued' });
});

// Rota principal do Frontend
app.get('/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});