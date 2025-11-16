# 🏆 Overlay de Ranking – Node.js + Express + OBS

Este projeto é um overlay dinâmico de ranking para ser usado em transmissões (OBS, Twitch, YouTube, etc).
Ele consome uma API externa, processa os dados do jogador e exibe em tempo real:

- 🏅 Rank (com imagem PNG)
- 🔤 Nickname
- 📊 Posição no ranking

O overlay é atualizado automaticamente a cada 1 minuto e suporta múltiplos jogadores usando um simples parâmetro na URL.

---

## 🚀 Funcionalidades

- Servidor Node.js + Express
- Consumo assíncrono de API externa com fetch
- Processamento da posição do jogador no array retornado
- Cálculo automático do rank baseado na posição
- Overlay com fundo totalmente transparente (ideal para OBS)
- Front-end simples (HTML + JS)
- Atualização automática via setInterval
- Suporte a múltiplos nicks via query string
- Tratamento completo de erros:
  - Usuário não encontrado
  - API offline
  - Respostas vazias (204)
  - Respostas inválidas

---

## 🗂 Estrutura do Projeto

