# Fontes gratuitas: resultado e critérios de integração

Data da revisão: 03/10/2026. Objetivo: ampliar o Radar a bancos, construtoras, financiadoras, leiloeiros e órgãos públicos, aproveitando fontes gratuitas quando disponíveis.

**Não existe nesta revisão evidência de um catálogo gratuito que reúna todos os leilões brasileiros.** Consulta gratuita de uma página, acesso automatizado e permissão de republicação são condições distintas. A auditoria não afirma cobertura de todas as instituições nem que todo serviço do portal seja gratuito.

| Categoria | Fontes avaliadas | Resultado para o Radar |
|---|---|---|
| Banco público | Caixa | CSV nacional gratuito importado e validado; atualizado periodicamente quando a fonte responde. |
| Banco público | [Banco do Brasil](https://www.seuimovelbb.com.br/catalogo) | Catálogo com filtros públicos. A consulta ao catálogo respondeu HTTP 200, mas sem anúncios no HTML recebido; mantido acesso externo. |
| Bancos privados | [Itaú](https://www.itau.com.br/imoveis-itau/), [Bradesco](https://corporate.bradesco/html/classic/produtos-servicos/leiloes/index.shtm), [Santander via Zuk](https://www.portalzuk.com.br/leilao-de-imoveis/v/banco-santander) | Páginas de consulta identificadas; nenhuma API/feed gratuito com importação completa validada nesta auditoria. |
| Financeiras | [Creditas via Zuk](https://www.portalzuk.com.br/leilao-de-imoveis/v/creditas) | Categoria de vendedor confirmada na plataforma. Acesso externo; importação depende de acesso estruturado permitido. |
| Construtoras | [Pacaembu via Zuk](https://www.portalzuk.com.br/leilao-de-imoveis/v/pacaembuconstrutora) | Página de vendedor identificada. Não equivale a integração da carteira completa da construtora. |
| Incorporadoras | [Unicos via Zuk](https://www.portalzuk.com.br/leilao-de-imoveis/v/unicos-incorporadora-e-urbanismo) | Página de vendedor identificada. Catálogo pode variar e anúncios precisam ser confirmados. |
| Leiloeiros / plataformas | [Zuk](https://www.portalzuk.com.br/), [Superbid](https://www.superbid.net/categorias/imoveis?isHomeCategory=true), [Mega Leilões](https://www.megaleiloes.com.br/), [Sodré Santoro](https://www.sodresantoro.com.br/) | Consulta pública e catálogo por categoria; disponibilidade técnica registrada separadamente no relatório JSON. Não foram usados logins ou serviços pagos. |
| Órgão público | [Comprei PGFN](https://comprei.pgfn.gov.br/anuncio) | Busca pública por UF/município e vendedor. Página depende de JavaScript; API pública documentada para integração ainda não confirmada. |
| Órgão público — outros bens | [Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/leilao) | Trata mercadorias apreendidas/abandonadas. Não misturar automaticamente com o catálogo imobiliário. |

## Evidência reproduzível

`python audit_sources.py` faz uma requisição limitada por origem selecionada e salva `static/source-audit.json` com data, URL, HTTP, título e estado de integração. O resultado aparece no site e é atualizado no fluxo de publicação. Um erro de acesso é uma observação deste ambiente e momento, não prova de que o portal seja pago ou definitivamente inacessível.

O arquivo `quality-audit.ipynb` reproduz o perfil da base importada: unidade = registro de imóvel por código da Caixa; cobertura, chaves, áreas ausentes e divergências entre preço e avaliação. A data do arquivo representa geração da lista, não confirmação individual do anúncio.

## Requisitos antes de importar uma nova fonte

1. Origem identificável, link de cada anúncio e data da coleta.
2. Acesso sem pagamento e sem contornar autenticação, CAPTCHA ou limites técnicos.
3. Campos e regras de uso verificáveis; priorizar API, CSV ou feed disponibilizado pela própria fonte.
4. Identificador estável por fonte; município/UF e moeda; ausência explícita de campos desconhecidos.
5. Retiradas, encerramento, alterações de preço e falhas tratados sem criar anúncios fictícios.
6. Fonte isolada: uma falha não deve apagar dados válidos de outras instituições.

## Pendências e prioridade

Prioridade seguinte: confirmar condições de integração de BB, PGFN e plataformas com diversos vendedores. Essas fontes ampliam cobertura com menos conectores. Depois, incorporar catálogos próprios de bancos e empresas que disponibilizem feeds gratuitos. A pesquisa externa por cidade e instituição já permite alcançar portais fora da base importada, mas não substitui uma integração automática.

Nenhuma assinatura, habilitação para lance, pagamento ou contato com terceiros foi realizado.

## Integração adicional validada

Mega Leilões: primeira página de imóveis indexada, 48 anúncios na coleta inicial. Apenas título, preço, cidade/UF, modalidade, situação e link; sem imagens ou editais copiados. Cobertura parcial explícita e uma consulta por execução. Mudanças no HTML podem interromper a atualização; o último arquivo válido é preservado com sua data. Acessibilidade pública não confirma licença ampla de republicação.
