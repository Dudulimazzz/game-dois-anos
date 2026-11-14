# Nossa Jornada

Jogo de plataforma 2D cooperativo em pixel art — presente de 2 anos de namoro.
Feito com HTML, CSS e JavaScript puro + [Phaser 4](https://phaser.io), sem etapa de build.

## Rodar localmente

ES modules não funcionam abrindo o arquivo direto (`file://`), então use um servidor:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

E abra `http://localhost:8000` (ou o endereço que o `serve` mostrar).

### Atalhos de teste

- `?fase=teste&modo=dois` — abre direto na fase (modo `um` ou `dois`)
- `&semajuda` — não mostra a tela de controles
- `&debug` — mostra as caixas de colisão

## Editar conteúdo sem programar

- Textos, datas e fotos: `data/memorias.json`
- Mapas das fases: `data/fases/*.json` (desenhados em texto; a legenda está dentro de cada arquivo)

Créditos de assets de terceiros em [CREDITS.md](CREDITS.md).
