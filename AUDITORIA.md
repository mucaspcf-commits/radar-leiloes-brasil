# Auditoria e comparação de ferramentas — 03/10/2026

Escopo: leitura do projeto original, revisão do processo de dados, comparação de recursos públicos de três plataformas e testes da edição preparada para GitHub. Não é auditoria jurídica, pentest completo ou certificação dos anúncios.

## Achados corrigidos na edição pública

| Prioridade | Problema original | Mudança |
|---|---|---|
| Crítica | `seed_national_data.py` gerava imóveis aleatórios como anúncios ativos de bancos e tribunais. | Publicação usa registros do CSV identificado e índice parcial da página pública Mega, com origem explícita. |
| Alta | CSV nacional salvo era HTML de CAPTCHA. | Validação rejeita bloqueios, listas vazias e mudanças de estrutura sem apagar base válida. |
| Alta | Desconto com ponto decimal e áreas como `116.12` podiam ser multiplicados por 100. | Números aceitam decimal com ponto e moeda brasileira com vírgula; desconto é recalculado com preço e avaliação. |
| Alta | Valorização por estado e notas de oportunidade tinham pesos e números fixos sem evidência. | Removidas previsões e recomendações; comparação usa apenas atributos observados. |
| Alta | Favoritos estavam em banco compartilhado e servidor escutava em todas as interfaces. | Favoritos ficam no navegador; site estático; servidor local restrito a 127.0.0.1 e `static/`. |
| Alta | Conteúdo de anúncios interpolado em HTML e links externos arbitrários. | Textos escapados; links de imóveis construídos com código numérico e domínio da Caixa; política de conteúdo sem scripts externos. |
| Média | Simulação chamava resultado de líquido apesar de custos omitidos e revenda fixa. | Campos editáveis para custos, revenda e prazo; resultado rotulado hipotético; custos zerados explicitamente advertidos. |
| Média | Links para plataformas eram apresentados como integrações nacionais. | Diretório externo separado da base efetivamente importada. |
| Média | Sem publicação estática adequada e atualização confiável. | Caminhos relativos, fluxo de Pages, coleta programada e botão para recarregar a base publicada. |

## Referências de mercado consultadas

| Ferramenta | Recurso verificado na documentação pública | Aplicação ao Radar |
|---|---|---|
| [Caixa — lista completa](https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp) | Lista para download com seleção de estado. | Importação rastreável, data e cobertura reais. |
| [Zuk — como buscar imóveis](https://www.portalzuk.com.br/blog/saiba-como-buscar-imoveis-em-leilao-na-plataforma-zuk) | Busca por localização, mapa e filtro de ocupação. | Localização pesquisável agora; mapa e ocupação dependem de dados verificáveis. |
| [Superbid — imóveis](https://www.superbid.net/categorias/imoveis?isHomeCategory=true) | Categorias imobiliárias, localização e diferentes modalidades de negociação. | Tipos, modalidade e filtros combinados na edição pública. |

Comparação limitada aos recursos descritos nessas fontes, sem afirmar que alguma plataforma seja a melhor ou que todos os seus serviços sejam gratuitos. Não foi realizado cadastro nem contratado serviço.

## Melhorias entregues

Comparação de três imóveis; preço/m²; favoritos privados; CSV; cenários de custo e estresse; interface responsiva; navegação por teclado; confirmação pela fonte; tratamentos de erro e indisponibilidade; nenhum anúncio fictício na base.

## Próximas melhorias que dependem de fontes adicionais

1. Ocupação, datas de primeira/segunda praça e anexos do edital: só exibir com origem e data verificáveis; não inferir da ausência de informação.
2. Mapa: geocodificação com localização aproximada claramente marcada e limites de uso do provedor respeitados.
3. Histórico de mudanças e alertas configuráveis: armazenar versões, diferenciar retirada de anúncio de venda concluída, obter consentimento antes de notificações externas.
4. Bancos e tribunais adicionais: avaliar feeds/APIs e condições de acesso por instituição. Não contornar CAPTCHA ou apresentar raspagem incompleta como integração garantida.
5. Análise por m² entre imóveis comparáveis: controlar localização, tipologia, área e conservação; evitar ranking universal de rentabilidade.

## Validação

8 testes Python de importação, preservação e índice Mega; 7 testes JavaScript de custos, perdas, entradas inválidas e filtros, incluindo cidades homônimas e valores acima da avaliação. Na interface foram verificados filtro de Campinas (28 imóveis), comparação e simulação. Ausência de dívida ou ocupação não é validada pelo software.

## Ampliação nacional e múltiplas origens

A coleta nacional foi concluída: 17.914 registros, 1.041 combinações de cidade/UF, 27 UFs, geração em 02/10/2026. Valores anunciados acima da avaliação são preservados, sem convertê-los em descontos positivos. Os dados precisam ser confirmados no anúncio e no edital.

Foram acrescentadas consultas externas por cidade e instituição para BB, Santander, Itaú, Bradesco, Creditas, Pacaembu Construtora, Unicos Incorporadora, PGFN, Zuk, Superbid e Mega Leilões. A [lista de vendedores da Zuk](https://www.portalzuk.com.br/) identifica instituições financeiras, construtoras, incorporadoras e órgãos judiciais. O [catálogo BB](https://www.seuimovelbb.com.br/catalogo) e o [Comprei](https://comprei.pgfn.gov.br/anuncio) oferecem filtros geográficos próprios.

A primeira tentativa no BB e as consultas a Zuk e Superbid receberam HTTP 403. A consulta posterior ao catálogo BB respondeu sem anúncios no HTML. Essas fontes permanecem externas. Mega Leilões tem índice parcial de 48 anúncios da primeira página, com coleta gratuita periódica. A busca externa na web é um meio de descoberta e não uma base sincronizada ou uma garantia de cobertura integral.

