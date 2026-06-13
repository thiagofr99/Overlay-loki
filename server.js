require('dotenv').config(); // Isso lê o arquivo .env e joga no process.env
const express = require("express");
const fetch = require("node-fetch");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const { Pool } = require('pg');

const app = express();

app.use(express.json());
app.use(cookieParser()); 
app.use(express.static("public")); // serve PNGs e HTML
/*
let estado = {
    nick: "Carregando...",
    rank: "Ferro_128",
    position: 999
};
*/

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function buscarPorCharname(array, charname, camelCase = false, novoNome) {
    var propertyName = novoNome ? novoNome : (camelCase ? 'charName' : 'charname');
    const index = array.findIndex(obj => obj[propertyName] === charname);
    if (index === -1) return null;
    return {
        index,
        data: array[index]
    };
}

function calculaRank(index) {
    if (index < 10) {
        return "Diamante_128";
    } else if (index < 60) {
        return "Platina_128";
    } else if (index < 250) {
        return "Ouro_128";
    } else if (index < 500) {
        return "Prata_128";
    } else if (index < 800) {
        return "Bronze_128";
    } else {
        return "Ferro_128";
    }
}

function calculaClasse(classe) {
    if(classe === 0) {
        return "transknight";
    } else if(classe === 1) {
        return "foema";
    } else if(classe === 2) {
        return "beastmaster";
    } else if(classe === 3) {                
        return "huntress";
    }
}

async function authMiddleware(req, res, next) {

    try {

        const token = req.cookies?.session_token;

        if (!token) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Sessão não encontrada."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                nick
            FROM user_loki
            WHERE session_token = $1
            AND token_expires_at > NOW()
            `,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Sessão expirada."
            });
        }

        req.user = {
            id: result.rows[0].id,
            nick: result.rows[0].nick
        };

        next();

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Internal Server Error"
        });

    }

}

// Função que consome sua API
async function atualizar(nick) {
    try {
        const resp = await fetch("https://rn3xfhamppsetddkod6vwc24lu0lhcek.lambda-url.us-east-1.on.aws/loki-component-rank");
        const data = await resp.json();  // aqui você extrai o corpo JSON da resposta
        
        const respFinal = buscarPorCharname(data.players, nick);
        
        if (!respFinal) return null;

        return respFinal;
    } catch (err) {
        console.log("Erro ao atualizar:", err);
        return null;
    }
}

async function atualizarRanking(nick){
    try {
        const resp = await fetch("https://rn3xfhamppsetddkod6vwc24lu0lhcek.lambda-url.us-east-1.on.aws/royal-rank?category=champion");
        const data = await resp.json();  // aqui você extrai o corpo JSON da resposta   
        const respFinal = buscarPorCharname(data, nick, true);
        
        if (!respFinal) return null;
    } catch (err) {
        console.log("Erro ao atualizar:", err);
        return null;
    }
}


async function atualizarRankingLevel(nick){
    try {

        const resp = await fetch(
            "https://rn3xfhamppsetddkod6vwc24lu0lhcek.lambda-url.us-east-1.on.aws/component-rank",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"options":{}})
            }
        );
        
        const data = await resp.json();  // aqui você extrai o corpo JSON da resposta
        const respFinal = buscarPorCharname(data, nick, false, 'name');

        if (!respFinal) return null;
        return respFinal;
    } catch (err) {
        console.log("Erro ao atualizar:", err);
        return null;
    }

}
// Atualiza imediato + a cada 60s
//atualizar();
//setInterval(atualizar, 60000);

// Endpoint JSON para o overlay
app.get("/status", async (req, res) => {
    const nick = req.query.nick;
    if (!nick) return res.status(204).send();

    const estadoAtual = await atualizar(nick);
    const retornoApi = {
        nick: estadoAtual.data.charname,
        rank: calculaRank(estadoAtual.index),
        position: estadoAtual.index + 1
    };
    if (!retornoApi) return res.status(404).send();
    res.json(retornoApi);
});

// Endpoint JSON para o overlay
app.get("/score", async (req, res) => {
    const nick = req.query.nick;
    if (!nick) return res.status(204).send();

    const estadoAtual = await atualizar(nick);
    if (!estadoAtual) return res.status(404).send();

    const retornoApi = {
        lokiscore: estadoAtual.data.totalScore,
        classe: calculaClasse(estadoAtual.data.class)
    };

    res.json(retornoApi);
});

// Endpoint JSON para o overlay
app.get("/pr", async (req, res) => {
    const nick = req.query.nick;
    if (!nick) return res.status(204).send();

    const estadoAtual = await atualizarRankingLevel(nick);
    if (!estadoAtual) return res.status(404).send();

    const retornoApi = {
        powerRating: estadoAtual.data.points,
        classe: calculaClasse(estadoAtual.data.class)
    };

    res.json(retornoApi);
});

app.get("/ranking", async (req, res) => {
    const nick = req.query.nick;
    if (!nick) return res.status(204).send();

    const estadoAtual = await atualizarRanking(nick);
    if (!estadoAtual) return res.status(404).send();

    const retornoApi = {
        position: estadoAtual.index + 1,
        points: estadoAtual.data.total    
    };
});
//app.listen(8080, () => console.log("Servidor rodando em http://localhost:8080"));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Rodando na porta " + PORT));


app.use(express.json()); // Necessário para ler o body das requisições POST

app.post("/api/login", async (req, res) => {
    const { nick, secret } = req.body;

    // 1. Validação de presença (Bad Request)
    if (!nick || !secret) {
        return res.status(400).json({ 
            error: "Bad Request", 
            message: "Nick e secret são obrigatórios." 
        });
    }

    try {

        const result = await pool.query("SELECT id, secret FROM user_loki WHERE nick = $1", [nick]);
        if (result.rows.length === 0) return res.status(401).json({ 
            error: "Unauthorized", 
            message: "Nick ou secret incorretos." 
        });

        const user = result.rows[0];
        const match = await bcrypt.compare(secret, user.secret); // Compara o que o usuário enviou com o hash do banco

        if (!match) return res.status(401).json({ 
            error: "Unauthorized", 
            message: "Nick ou secret incorretos." 
        });

        // 4. Geração de sessão e token
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        await pool.query(
            "UPDATE user_loki SET session_token = $1, token_expires_at = $2 WHERE nick = $3",
            [token, expires, nick]
        );

        // 5. Definição do Cookie e resposta de sucesso
        res.cookie('session_token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Só envia via HTTPS em produção
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 
        });

        return res.status(200).json({ message: "Login realizado com sucesso!" });

    } catch (err) {
        console.error("Value  :", process.env.DATABASE_URL);
        console.error("Erro no login:", err);
        return res.status(500).json({ 
            error: "Internal Server Error", 
            message: "Ocorreu um erro no servidor. Tente novamente mais tarde.",
            details: err.message
        });
    }
});


app.post("/api/register", async (req, res) => {
    const { nick, secret } = req.body;

    const regexSecret = /^(?=(.*[A-Za-z]){2})(?=(.*\d){4})[A-Za-z0-9]{6}$/;

    if (!regexSecret.test(secret)) {
        return res.status(400).json({ 
            message: "Formato inválido: O secret deve ter 6 caracteres (2 letras e 4 números)." 
        });
    }

    if (!nick || !secret) {
        return res.status(400).json({ message: "Nick e secret são obrigatórios." });
    }

    try {
        // 1. Verifica se o nick já existe
        const userExists = await pool.query("SELECT id FROM user_loki WHERE nick = $1", [nick]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: "Este nick já está em uso." });
        }

        // 2. Hash do secret (segurança básica padrão)
        const saltRounds = 10;
        const secretHash = await bcrypt.hash(secret, saltRounds);

        // 3. Insere no banco
        await pool.query(
            "INSERT INTO user_loki (nick, secret) VALUES ($1, $2)",
            [nick, secretHash]
        );

        return res.status(201).json({ message: "Usuário criado com sucesso!" });

    } catch (err) {
        console.error("Erro ao registrar:", err);
        return res.status(500).json({ message: "Erro interno no servidor." });
    }
});

app.get("/api/check-session", async (req, res) => {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ loggedIn: false });

    const result = await pool.query(
        "SELECT nick FROM user_loki WHERE session_token = $1 AND token_expires_at > NOW()",
        [token]
    );

    if (result.rows.length === 0) return res.status(401).json({ loggedIn: false });

    res.json({ loggedIn: true, nick: result.rows[0].nick });
});

app.get("/api/task", authMiddleware, async (req, res) => {

    try {

        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        const { taskType, date } = req.query;

        if (!taskType) {
            return res.status(400).json({
                error: "taskType is required"
            });
        }

        const taskResult = await pool.query(
            `
            SELECT json_task
            FROM user_loki_tasks
            WHERE user_id = $1
            AND task_type = $2
            AND task_date::date = $3::date
            `,
            [req.user.id, taskType, date || new Date().toISOString().slice(0, 10) ]
        );

        if (taskResult.rows.length === 0) {

            return res.json({
                taskType,
                tasks: {}
            });

        }

        return res.json({
            taskType,
            tasks: taskResult.rows[0].json_task
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Internal server error"
        });

    }

});

app.patch("/api/task", authMiddleware, async (req, res) => {

    try {

        const {
            taskType,
            task,
            completed
        } = req.body;

        if (!taskType) {
            return res.status(400).json({
                error: "Validation Error",
                message: "taskType é obrigatório."
            });
        }

        if (!task) {
            return res.status(400).json({
                error: "Validation Error",
                message: "task é obrigatória."
            });
        }

        if (typeof completed !== "boolean") {
            return res.status(400).json({
                error: "Validation Error",
                message: "completed deve ser boolean."
            });
        }

        const userId = req.user.id;

        // Busca a task atual
        const taskResult = await pool.query(
        `
        SELECT json_task
        FROM user_loki_tasks
        WHERE user_id = $1
        AND task_type = $2
        AND task_date = CURRENT_DATE
        `,
        [
            userId,
            taskType
        ]
        );

        let jsonTask = {};

        if (taskResult.rows.length > 0) {
            jsonTask = taskResult.rows[0].json_task || {};
        }

        // Atualiza somente a chave recebida
        jsonTask[task] = completed;

        // UPSERT
        await pool.query(`
            INSERT INTO user_loki_tasks (
                user_id,
                task_type,
                json_task,
                task_date
            )
            VALUES (
                $1,
                $2,
                $3::jsonb,
                CURRENT_DATE
            )
            ON CONFLICT ON CONSTRAINT user_loki_tasks_unique_daily
            DO UPDATE SET
                json_task = EXCLUDED.json_task,
                updated_at = NOW()
            `,
            [
                userId,
                taskType,
                JSON.stringify(jsonTask)
            ]
        );

        return res.json({
            success: true,
            taskType,
            task,
            completed
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Internal Server Error"
        });

    }

});