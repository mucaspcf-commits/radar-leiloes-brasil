# Radar Leilões Brasil

Pesquisa independente de imóveis da lista pública da Caixa, comparação e simulação de custos. Edição estática, sem cadastro, bibliotecas externas ou serviços pagos.

## O que funciona

- Filtros por região, UF, tipo, modalidade, financiamento, texto, preço e desconto.
- Comparação de até três imóveis e preço por m² quando a área privativa está informada.
- Favoritos locais no navegador; exportação CSV dos resultados filtrados.
- Simulação com despesas editáveis, prejuízo possível, ponto de equilíbrio e cenário de estresse.
- Fonte, data de geração e cobertura explicitadas; não há anúncios sintéticos nem taxas de valorização inventadas.
- Importador da lista oficial com validação de cabeçalho, data, valores e resposta HTML/bloqueio. Falhas preservam o arquivo anterior.
- GitHub Actions tenta atualizar a fonte a cada 6 horas. A página recarrega a base publicada a cada 15 minutos enquanto visível e pelo botão **Atualizar lista**.

O botão consulta a última base publicada, não aciona uma consulta autenticada ao GitHub nem contorna bloqueios da Caixa. O proprietário pode iniciar a importação em **Actions → Atualizar dados e publicar → Run workflow**. Agendamentos do GitHub podem sofrer atraso ou ser desativados por inatividade; acompanhe o histórico de execuções.

## Cobertura e limites

A base publicada inicialmente tem **17.914 registros nacionais**, da lista oficial da Caixa com geração em **02/10/2026**, cobrindo os 26 estados e o Distrito Federal. A busca e o seletor de cidades alcançam todos os municípios presentes nessa lista. Sua presença não confirma disponibilidade atual. O arquivo nacional encontrado no projeto original continha uma página de CAPTCHA; uma nova consulta oficial válida permitiu substituir a base local de São Paulo.

A Mega Leilões tem um índice gratuito **parcial da primeira página** do catálogo público de imóveis (48 anúncios na coleta inicial), atualizado pelo mesmo fluxo. Não representa todo o catálogo nem confirma disponibilidade individual. O título pode não identificar o banco vendedor.

O diretório inclui BB, Santander, Itaú, Bradesco, Creditas, Pacaembu, Unicos, PGFN, Zuk, Superbid e Mega, com filtros por categoria e busca externa por qualquer cidade/instituição. Os demais catálogos ainda não têm anúncios importados. BB respondeu sem anúncios no HTML; algumas outras fontes bloquearam a coleta. Nenhuma proteção foi contornada. Veja [a auditoria de fontes](AUDITORIA-FONTES.md).

Ocupação e datas de leilão ficam como não informadas quando ausentes no CSV. Avaliação não equivale a preço de mercado ou de revenda. Não há recomendação de investimento ou garantia de retorno.

## Executar e testar

Requer Python 3.11+. Para testes JavaScript, Node.js 22+.

```sh
python app.py
python -m unittest discover -s tests
node --test tests/core.test.cjs
```

Abra http://127.0.0.1:8000. O servidor local publica apenas `static/` e escuta somente neste computador.

Para atualizar: `python data_sync.py`. Para importar manualmente uma lista válida de São Paulo: `python data_sync.py --input caminho/Lista_imoveis_SP.csv`. A importação manual não altera a data de geração da fonte. O CSV original não é versionado; o JSON contém apenas os campos públicos necessários e o hash SHA-256 do arquivo de origem.

## Publicação

Configure GitHub Pages para **GitHub Actions**. O fluxo em `.github/workflows/publish.yml` testa, tenta atualizar e publica `static/`. A última coleta válida é preservada no cache do Actions; se o cache expirar, a base versionada serve de contingência e sua data continua visível. O código não usa tokens de serviços financeiros, anúncios, telemetria ou pagamentos.

O banco SQLite original, favoritos e simulações pessoais não fazem parte desta edição. Consulte [AUDITORIA.md](AUDITORIA.md) para os problemas encontrados, referências de mercado e próximos passos.
