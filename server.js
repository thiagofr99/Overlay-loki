const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.static("public")); // serve PNGs e HTML
/*
let estado = {
    nick: "Carregando...",
    rank: "Ferro_128",
    position: 999
};
*/

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

// Função que consome sua API
async function atualizar(nick) {
    try {
        const resp = await fetch("https://rn3xfhamppsetddkod6vwc24lu0lhcek.lambda-url.us-east-1.on.aws/loki-component-rank");
        const data = await resp.json();  // aqui você extrai o corpo JSON da resposta
        
        const respFinal = buscarPorCharname(data, nick);
        
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
