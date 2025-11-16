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
// Função que consome sua API
async function atualizar(nick) {
    try {
        const resp = await fetch("https://rn3xfhamppsetddkod6vwc24lu0lhcek.lambda-url.us-east-1.on.aws/loki-component-rank");
        const data = await resp.json();  // aqui você extrai o corpo JSON da resposta

        function buscarPorCharname(array, charname) {
            const index = array.findIndex(obj => obj.charname === charname);
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
        
        const respFinal = buscarPorCharname(data, nick);
        
        if (!respFinal) return null;

        return {
            nick: respFinal.data.charname,
            rank: calculaRank(respFinal.index),
            position: respFinal.index + 1
        };
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
    if (!estadoAtual) return res.status(404).send();
    res.json(estadoAtual);
});


//app.listen(8080, () => console.log("Servidor rodando em http://localhost:8080"));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Rodando na porta " + PORT));
