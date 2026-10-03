'use strict';
// Diretório verificado em 03/10/2026. Consulta externa não é integração de anúncios.
const sources = [
 ['Banco do Brasil','Bancos','https://www.seuimovelbb.com.br/catalogo','seuimovelbb.com.br'],
 ['Santander via Zuk','Bancos','https://www.portalzuk.com.br/leilao-de-imoveis/v/banco-santander','portalzuk.com.br'],
 ['Itaú Imóveis','Bancos','https://www.itau.com.br/imoveis-itau/','itau.com.br/imoveis-itau'],
 ['Bradesco — vitrine de leilões','Bancos','https://corporate.bradesco/html/classic/produtos-servicos/leiloes/index.shtm','bradesco.com.br'],
 ['Creditas via Zuk','Financeiras e consórcios','https://www.portalzuk.com.br/leilao-de-imoveis/v/creditas','portalzuk.com.br'],
 ['Pacaembu Construtora via Zuk','Construtoras e incorporadoras','https://www.portalzuk.com.br/leilao-de-imoveis/v/pacaembuconstrutora','portalzuk.com.br'],
 ['Unicos Incorporadora via Zuk','Construtoras e incorporadoras','https://www.portalzuk.com.br/leilao-de-imoveis/v/unicos-incorporadora-e-urbanismo','portalzuk.com.br'],
 ['Comprei PGFN','Órgãos públicos e judiciais','https://comprei.pgfn.gov.br/anuncio','comprei.pgfn.gov.br'],
 ['Zuk — múltiplos vendedores','Leiloeiros e plataformas','https://www.portalzuk.com.br/','portalzuk.com.br'],
 ['Superbid Exchange','Leiloeiros e plataformas','https://www.superbid.net/categorias/imoveis?isHomeCategory=true','superbid.net'],
 ['Mega Leilões','Leiloeiros e plataformas','https://www.megaleiloes.com.br/','megaleiloes.com.br']
];
function renderSources() {
 const category=document.getElementById('source-category').value;
 const city=document.getElementById('external-city').value.trim();
 const entity=document.getElementById('external-entity').value.trim();
 const grid=document.getElementById('external-sources');
 grid.replaceChildren();
 for(const [name,kind,url,domain] of sources.filter(s=>!category||s[1]===category)) {
  const article=document.createElement('article'), title=document.createElement('h3'), tag=document.createElement('p'), link=document.createElement('a');
  title.textContent=name;tag.textContent=kind+' · Consulta externa';link.textContent='Abrir catálogo ↗';link.href=url;link.target='_blank';link.rel='noopener noreferrer';article.append(title,tag,link);
  if(city||entity) {const search=document.createElement('a');search.textContent='Buscar cidade / instituição na web ↗';search.href='https://www.google.com/search?q='+encodeURIComponent(`site:${domain} "${city.replaceAll('"','')}" ${entity} imóvel leilão`);search.target='_blank';search.rel='noopener noreferrer';article.append(document.createElement('br'),search);}
  grid.append(article);
 }
 const broad=document.getElementById('external-broad');
 broad.href='https://www.google.com/search?q='+encodeURIComponent(`leilão imóvel ${city} ${entity}`);
 renderMega();
}
['source-category','external-city','external-entity'].forEach(id=>document.getElementById(id).addEventListener('input',renderSources));
let megaData=null;
function renderMega() {
 if(!megaData)return;
 const query=normalizeText(document.getElementById('external-city').value).split(/\s+/).filter(Boolean);
 const entity=normalizeText(document.getElementById('external-entity').value);
 const rows=megaData.properties.filter(p=>query.every(q=>normalizeText(`${p.cidade} ${p.uf} ${p.titulo}`).includes(q))&&normalizeText(p.titulo).includes(entity));
 document.getElementById('mega-status').textContent=`${rows.length} de ${megaData.properties.length} anúncios desta amostra. Coleta: ${new Date(megaData.collected_at).toLocaleString('pt-BR')}. ${megaData.coverage}`;
 const cards=document.getElementById('mega-cards');cards.replaceChildren();
 for(const p of rows){const article=document.createElement('article');article.className='card cardbody';const title=document.createElement('h3'),details=document.createElement('p'),link=document.createElement('a');title.textContent=p.titulo;details.textContent=`${money(p.preco)} · ${p.cidade} / ${p.uf} · ${p.modalidade}. Situação na coleta: ${p.status}.`;link.textContent='Ver anúncio e edital na Mega Leilões ↗';link.href=p.link;link.target='_blank';link.rel='noopener noreferrer';article.append(title,details,link);cards.append(article);}
}
async function loadMega(){try {const r=await fetch('mega-data.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.properties)||data.properties.some(p=>!p.link.startsWith('https://www.megaleiloes.com.br/imoveis/')||!Number.isFinite(p.preco)))throw Error();megaData=data;renderMega();}catch{document.getElementById('mega-status').textContent='Não foi possível atualizar o índice parcial. Consulte o catálogo externo; eventuais dados anteriores permanecem na tela.';}}
renderSources();loadMega();document.getElementById('refresh').addEventListener('click',loadMega);setInterval(()=>{if(!document.hidden)loadMega();},15*60*1000);
fetch('source-audit.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
 document.getElementById('audit-status').textContent=`Verificação técnica: ${new Date(data.checked_at).toLocaleString('pt-BR')}. Escopo: fontes selecionadas, sem promessa de cobertura total.`;
 const table=document.createElement('table');
 const head=document.createElement('tr');for(const title of ['Fonte','Categoria','Acesso automático','Importação']){const cell=document.createElement('th');cell.textContent=title;head.append(cell);}table.append(head);
 for(const source of data.sources){const row=document.createElement('tr');for(const value of [source.name,source.category,source.status,source.integration_mode||(source.integrated?'Índice parcial':'Consulta externa')]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}table.append(row);}
 document.getElementById('audit-table').replaceChildren(table);
}).catch(()=>{document.getElementById('audit-status').textContent='Relatório de acesso indisponível. Isso não altera a base de imóveis já carregada.';});
