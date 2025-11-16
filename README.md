# 🏆 Overlay de Ranking – Node.js + Express + OBS

Este projeto é um overlay dinâmico de ranking para transmissões (OBS, Twitch, YouTube, etc). Ele consome uma API externa, processa os dados do jogador e exibe em tempo real: rank (com imagem PNG), nickname e posição no ranking. O overlay é atualizado automaticamente a cada 1 minuto e suporta múltiplos jogadores usando um parâmetro na URL.

## Funcionalidades
- Servidor Node.js + Express
- Consumo assíncrono de API externa com fetch
- Processamento da posição do jogador no array retornado
- Cálculo automático do rank baseado na posição
- Overlay com fundo transparente (ideal para OBS)
- Front-end simples (HTML + JS)
- Atualização automática via setInterval
- Suporte a múltiplos nicks via query string
- Tratamento completo de erros: usuário não encontrado, API offline, respostas vazias (204), respostas inválidas

## Estrutura do Projeto
/
├── public/
│   ├── index.html
│   └── asset/
│       ├── Ferro_128.png
│       ├── Bronze_128.png
│       ├── Prata_128.png
│       ├── Ouro_128.png
│       ├── Platina_128.png
│       └── Diamante_128.png
├── server.js
├── package.json
└── README.md

## Como funciona
O servidor expõe o endpoint `/status?nick=ALGUM_NICK`. Ele consulta a API externa, procura o personagem pelo campo `charname`, identifica a posição no array, calcula o rank conforme o índice e retorna um JSON no formato:
{
  "nick": "Jogador",
  "rank": "Ouro_128",
  "position": 42
}
O `index.html` consome esse endpoint e atualiza o overlay exibido no OBS.

## Executar localmente
Instale as dependências:
npm install
Execute o servidor:
node server.js
Abra o overlay no navegador:
http://localhost:8080/index.html?nick=SeuNick

## Usar no OBS
1. Adicione uma nova fonte Browser Source
2. Defina a URL: http://SEU-SERVIDOR/index.html?nick=SeuNick
3. Ajuste a resolução conforme desejar
4. Habilite fundo transparente (se necessário)
O overlay será atualizado automaticamente a cada 60 segundos.

## Deploy
Este projeto funciona em diversos serviços de hospedagem gratuitos ou freemium: Render (plano gratuito recomendado), Railway, Vercel (para APIs pequenas), Fly.io ou VPS própria.

## Personalização
Você pode personalizar facilmente: PNGs de ranking, fontes e cores, layout do overlay, intervalo de atualização e lógica de classificação.

## Contribuições
Pull requests são bem-vindos!

## Licença
MIT License
