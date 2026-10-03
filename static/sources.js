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
}
['source-category','external-city','external-entity'].forEach(id=>document.getElementById(id).addEventListener('input',renderSources));
renderSources();
