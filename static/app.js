'use strict';
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(n);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let snapshot, rows = [], filtered = [], page = 1, selection = new Set(), loading = false;
let favorites = [];
try { const saved = JSON.parse(localStorage.getItem('radar-favorites') || '[]'); if (Array.isArray(saved)) favorites = saved.filter(x => typeof x === 'string'); } catch { /* armazenamento indisponível */ }
const ids = ['search','regiao','uf','cidade','tipo','modalidade','financiamento','min','max','desconto'];
function filters() { return {...Object.fromEntries(ids.map(id => [id,$(id).value])),favorites:$('favorites').checked}; }
function setOptions(id, values, label) {
  const previous = $(id).value;
  $(id).replaceChildren(new Option(label, ''), ...values.sort((a,b)=>a.localeCompare(b,'pt-BR')).map(v=>new Option(v,v)));
  if (values.includes(previous)) $(id).value = previous;
}
function updateLocations() {
  const regionRows=rows.filter(p=>!$('regiao').value||p.regiao===$('regiao').value);
  setOptions('uf',[...new Set(regionRows.map(p=>p.uf))],'Todos da base');
  const cityRows=regionRows.filter(p=>!$('uf').value||p.uf===$('uf').value);
  setOptions('cidade',[...new Set(cityRows.map(p=>`${p.cidade} / ${p.uf}`))],'Todas da base');
}
function render() {
  const f = filters();
  filtered = filterProperties(rows, f, favorites);
  const sort = $('sort').value;
  filtered.sort((a,b) => sort === 'preco' ? a.preco-b.preco : sort === 'preco_desc' ? b.preco-a.preco : sort === 'cidade' ? a.cidade.localeCompare(b.cidade,'pt-BR') : b.desconto-a.desconto);
  page = Math.max(1, Math.min(page, Math.ceil(filtered.length/18)));
  $('count').textContent = `${filtered.length.toLocaleString('pt-BR')} imóveis encontrados`;
  $('cards').innerHTML = filtered.slice((page-1)*18,page*18).map(p => `<article class="card"><div class="cardtop"><span>${escapeHTML(p.tipo)} · ${escapeHTML(p.uf)}</span><button class="favorite" data-action="favorite" data-id="${p.id}" aria-label="${favorites.includes(p.id)?'Remover dos':'Adicionar aos'} favoritos: ${escapeHTML(p.id)}" aria-pressed="${favorites.includes(p.id)}">${favorites.includes(p.id)?'★':'☆'}</button></div><div class="cardbody"><span class="tag">${p.desconto.toFixed(1)}% sobre a avaliação</span><h3>${escapeHTML(p.cidade)}</h3><p class="address">${escapeHTML(p.bairro)}<br>${escapeHTML(p.endereco)}</p><strong class="price">${money(p.preco)}</strong><span class="meta">Avaliação na lista: ${money(p.avaliacao)}</span><p class="meta">${p.area ? `${p.area.toLocaleString('pt-BR')} m² privativos · ` : ''}${escapeHTML(p.modalidade)}<br>Financiamento: ${escapeHTML(p.financiamento)} · Ocupação não informada</p><div class="cardactions"><button data-action="detail" data-id="${p.id}" class="secondary">Ver detalhes</button><button data-action="simulate" data-id="${p.id}">Simular custos</button></div><label class="check"><input type="checkbox" data-action="select" data-id="${p.id}" ${selection.has(p.id)?'checked':''}> Comparar este imóvel</label></div></article>`).join('') || '<p class="empty">Nenhum imóvel nesta seleção. Amplie os filtros. Ausência na base não significa ausência de imóveis na região.</p>';
  $('page').textContent = `Página ${page} de ${Math.max(1,Math.ceil(filtered.length/18))}`;
  $('prev').disabled = page <= 1; $('next').disabled = page*18 >= filtered.length;
  $('compare').textContent = `Comparar selecionados (${selection.size}/3)`;
  $('compare').disabled = selection.size < 2;
}
async function load(manual=false) {
  if (loading) return;
  loading = true; $('refresh').disabled = true;
  try {
    const response = await fetch(`data.json?t=${Date.now()}`, {cache:'no-store',signal:AbortSignal.timeout(25000)});
    if (!response.ok) throw Error('Base temporariamente indisponível');
    const data = await response.json();
    if (data.schema !== 1 || !Array.isArray(data.properties) || !data.source_date) throw Error('Formato de base inválido');
    if (data.properties.some(p => !/^\d+$/.test(p.id) || !Number.isFinite(p.preco) || !Number.isFinite(p.avaliacao) || !Number.isFinite(p.desconto))) throw Error('Registros inválidos');
    const oldIds = new Set(rows.map(p=>p.id));
    const added = rows.length ? data.properties.filter(p=>!oldIds.has(p.id)).length : 0;
    snapshot = data; rows = data.properties;
    selection = new Set([...selection].filter(id=>rows.some(p=>p.id===id)));
    updateLocations();
    setOptions('tipo',[...new Set(rows.map(p=>p.tipo))],'Todos');
    setOptions('modalidade',[...new Set(rows.map(p=>p.modalidade))],'Todas');
    const age = Math.max(0,Math.floor((Date.now()-Date.parse(data.source_date+'T00:00:00Z'))/86400000));
    $('total').textContent = rows.length.toLocaleString('pt-BR');
    $('freshness').textContent = `Lista gerada em ${data.source_date.split('-').reverse().join('/')}. Cobertura: ${data.coverage.join(', ')}. ${age>2 ? `Atenção: base com ${age} dias; confirme os anúncios na fonte.` : 'Disponibilidade deve ser confirmada na fonte.'}`;
    $('status').textContent = `${manual ? `Lista recarregada. ${added} novos registros desde a última leitura. ` : ''}O Radar tenta importar a fonte a cada 6 horas. Esta página consulta a base publicada a cada 15 minutos e pelo botão Atualizar lista. A data acima só muda após uma importação válida.`;
    render();
  } catch(error) {
    $('status').textContent = `${error.message}. ${rows.length?'A última lista carregada foi preservada.':'Tente Atualizar lista ou consulte a Caixa diretamente.'}`;
    if (!rows.length) { $('count').textContent='Não foi possível carregar'; $('cards').textContent='Nenhum dado foi inventado para substituir a fonte indisponível.'; }
  } finally { loading=false; $('refresh').disabled=false; }
}
$('filters').addEventListener('input',event=>{if(['regiao','uf'].includes(event.target.id))updateLocations();page=1;render();});
$('filters').addEventListener('submit',e=>e.preventDefault());
$('filters').addEventListener('reset',()=>setTimeout(()=>{page=1;updateLocations();render();},0));
$('sort').addEventListener('change',()=>{page=1;render();});
$('prev').addEventListener('click',()=>{page--;render();$('results').scrollIntoView();});
$('next').addEventListener('click',()=>{page++;render();$('results').scrollIntoView();});
$('refresh').addEventListener('click',()=>load(true));
document.querySelectorAll('.close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('cards').addEventListener('click',event=>{
  const button = event.target.closest('[data-action]'); if(!button)return;
  const p=rows.find(p=>p.id===button.dataset.id); if(!p)return;
  switch(button.dataset.action) {
    case 'favorite': favorites=favorites.includes(p.id)?favorites.filter(id=>id!==p.id):[...favorites,p.id];
      try {localStorage.setItem('radar-favorites',JSON.stringify(favorites));} catch { $('status').textContent='Favoritos disponíveis apenas nesta sessão: armazenamento bloqueado.';} render(); break;
    case 'select': if(selection.has(p.id))selection.delete(p.id); else if(selection.size<3)selection.add(p.id); else $('status').textContent='Selecione até 3 imóveis. Desmarque um para adicionar outro.'; render();break;
    case 'detail': $('detailbody').innerHTML=`<p class="eyebrow">CAIXA · IMÓVEL ${p.id}</p><h2>${escapeHTML(p.tipo)} em ${escapeHTML(p.cidade)}</h2><p>${escapeHTML(p.endereco)} · ${escapeHTML(p.bairro)}</p><p>${escapeHTML(p.descricao)}</p><p>Preço: <strong>${money(p.preco)}</strong><br>Avaliação: ${money(p.avaliacao)}<br>Financiamento na lista: ${escapeHTML(p.financiamento)}<br>Ocupação e datas de praça: não informadas nesta base.</p><p>Registro na lista de ${snapshot.source_date.split('-').reverse().join('/')}. A presença aqui não confirma disponibilidade atual.</p><a href="https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${p.id}" target="_blank" rel="noopener noreferrer">Conferir imóvel e edital na Caixa ↗</a>`; $('details').showModal();break;
    case 'simulate': openSimulation(p);break;
  }
});
$('compare').addEventListener('click',()=>{
  const chosen=rows.filter(p=>selection.has(p.id));
  const fields=[['Cidade',p=>p.cidade],['Preço',p=>money(p.preco)],['Avaliação',p=>money(p.avaliacao)],['Desconto',p=>p.desconto+'%'],['Área privativa',p=>p.area?p.area+' m²':'Não informada'],['Preço/m² privativo',p=>p.area?money(p.preco/p.area):'Não calculável'],['Financiamento',p=>p.financiamento],['Modalidade',p=>p.modalidade],['Ocupação',()=> 'Não informada']];
  $('comparisonbody').innerHTML=`<table><thead><tr><th scope="col">Característica</th>${chosen.map(p=>`<th scope="col">${escapeHTML(p.tipo)} ${p.id}</th>`).join('')}</tr></thead><tbody>${fields.map(([label,fn])=>`<tr><th scope="row">${label}</th>${chosen.map(p=>`<td>${escapeHTML(fn(p))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('comparison').showModal();
});
const simLabels={compra:'Preço de compra (R$)',venda:'Revenda hipotética (R$)',meses:'Prazo até revenda (meses)',comissao:'Comissão do leiloeiro (%)',tributos:'Tributos de aquisição (R$)',cartorio:'Registro e cartório (R$)',reforma:'Reforma (R$)',juridico:'Jurídico / desocupação (R$)',dividas:'Débitos a assumir (R$)',financeiro:'Juros e custos financeiros (R$)',mensal:'Manutenção por mês (R$)',corretagem:'Corretagem de revenda (%)',imposto:'Imposto sobre a venda (R$)'};
function openSimulation(p) {
  const initial={compra:p.preco,venda:p.avaliacao,meses:12,comissao:5,tributos:0,cartorio:0,reforma:0,juridico:0,dividas:0,financeiro:0,mensal:0,corretagem:5,imposto:0};
  $('simtitle').textContent=`${p.tipo} · ${p.cidade} · ${p.id}. A avaliação foi usada apenas como hipótese inicial de revenda.`;
  $('simfields').innerHTML=Object.entries(simLabels).map(([key,label])=>`<label>${label}<input name="${key}" type="number" min="${key==='meses'?1:0}" ${key==='meses'?'max="120"':''} step="${key==='meses'?1:0.01}" value="${initial[key]}" required></label>`).join('');
  $('simresult').textContent='Custos iniciados em zero ainda precisam ser preenchidos. Alíquotas e responsabilidades dependem do caso.';
  $('simulator').showModal();
}
$('simform').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    const v=Object.fromEntries([...new FormData(event.target)].map(([k,v])=>[k,Number(v)])), r=simulate(v);
    const stress=simulate({...v,venda:v.venda*0.9,meses:Math.min(120,v.meses+6)});
    $('simresult').innerHTML=`<h3>Resultado hipotético: <span class="${r.resultado<0?'negative':'positive'}">${money(r.resultado)}</span></h3><p>Desembolso com custos informados: ${money(r.investimento)}<br>Retorno sobre esse desembolso: ${r.roi.toFixed(1)}% no período de ${v.meses} meses.<br>Revenda de equilíbrio: ${r.equilibrio===null?'Não calculável com corretagem de 100%':money(r.equilibrio)}</p><p>Cenário de estresse (revenda 10% menor e até 6 meses adicionais): <strong>${money(stress.resultado)}</strong>.</p><p>Custos não preenchidos não entram no cálculo. Não há previsão de mercado ou garantia de lucro. O imposto informado não é recalculado automaticamente no cenário de estresse.</p>`;
  } catch(error) { $('simresult').textContent=error.message; }
});
$('export').addEventListener('click',()=>{
  const quote=value=>'"'+String(value??'').replace(/^[=+@\-]/,"'$&").replace(/"/g,'""')+'"';
  const keys=['id','uf','cidade','bairro','endereco','tipo','preco','avaliacao','desconto','area','financiamento','modalidade'];
  const text='\uFEFF'+[keys.map(quote).join(';'),...filtered.map(p=>keys.map(k=>quote(p[k])).join(';'))].join('\r\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download=`radar-leiloes-${snapshot.source_date}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
load(); setInterval(()=>{if(!document.hidden)load();},15*60*1000);
