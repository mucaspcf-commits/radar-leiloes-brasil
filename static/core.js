'use strict';
function normalizeText(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function filterProperties(rows, f, favorites = []) {
  return rows.filter(p => (!f.regiao || p.regiao === f.regiao) && (!f.uf || p.uf === f.uf)
    && (!f.cidade || `${p.cidade} / ${p.uf}` === f.cidade)
    && (!f.tipo || p.tipo === f.tipo) && (!f.modalidade || p.modalidade === f.modalidade)
    && (!f.financiamento || p.financiamento === f.financiamento)
    && (!f.favorites || favorites.includes(p.id))
    && (!f.search || normalizeText([p.id,p.cidade,p.bairro,p.endereco,p.tipo].join(' ')).includes(normalizeText(f.search)))
    && (f.min === '' || p.preco >= Number(f.min)) && (f.max === '' || p.preco <= Number(f.max))
    && (!f.desconto || p.desconto >= Number(f.desconto)));
}
function simulate(v) {
  for (const [key, value] of Object.entries(v)) if (!Number.isFinite(value) || value < 0) throw Error('Informe valores válidos, finitos e não negativos: ' + key);
  if (v.compra <= 0 || v.meses < 1 || v.meses > 120 || !Number.isInteger(v.meses)) throw Error('Compra deve ser positiva; prazo inteiro de 1 a 120 meses.');
  if (v.comissao > 100 || v.corretagem > 100) throw Error('Percentuais devem estar entre 0 e 100.');
  const investimento = v.compra * (1 + v.comissao / 100) + v.tributos + v.cartorio + v.reforma + v.juridico + v.dividas + v.financeiro + v.mensal * v.meses;
  const receita = v.venda * (1 - v.corretagem / 100) - v.imposto;
  const resultado = receita - investimento;
  return { investimento, receita, resultado, roi: resultado / investimento * 100, equilibrio: v.corretagem < 100 ? (investimento + v.imposto) / (1 - v.corretagem / 100) : null };
}
if (typeof module !== 'undefined') module.exports = { normalizeText, filterProperties, simulate };
