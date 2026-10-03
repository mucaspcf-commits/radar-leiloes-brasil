const test=require('node:test');const assert=require('node:assert/strict');
const {simulate,filterProperties}=require('../static/core.js');
const base={compra:100000,venda:150000,meses:12,comissao:5,tributos:3000,cartorio:2000,reforma:10000,juridico:4000,dividas:1000,financeiro:0,mensal:500,corretagem:5,imposto:2000};
test('All informed costs included',()=>{const r=simulate(base);assert.equal(r.investimento,131000);assert.equal(r.receita,140500);assert.equal(r.resultado,9500);});
test('Loss is preserved, not classified as opportunity',()=>assert.ok(simulate({...base,venda:50000}).resultado<0));
test('Reject invalid assumptions',()=>{for(const v of [{meses:0},{compra:-1},{venda:Infinity},{corretagem:101},{meses:2.5}])assert.throws(()=>simulate({...base,...v}));});
test('Break-even handles 100% fee',()=>assert.equal(simulate({...base,corretagem:100}).equilibrio,null));
test('No discount filter must retain premiums above 100%',()=>assert.equal(filterProperties([{preco:100,desconto:-500}],{min:'',max:'',desconto:''}).length,1));
test('Homonymous cities separated by state',()=>assert.equal(filterProperties([{cidade:'Bom Jesus',uf:'PI',preco:100,desconto:0},{cidade:'Bom Jesus',uf:'RS',preco:100,desconto:0}],{cidade:'Bom Jesus / PI',min:'',max:''}).length,1));
test('Filters accents, favorites and price together',()=>{const rows=[{id:'1',cidade:'São Paulo',bairro:'Sé',endereco:'Rua',uf:'SP',preco:100,desconto:30},{id:'2',cidade:'São Paulo',uf:'SP',preco:200,desconto:30}];assert.equal(filterProperties(rows,{search:'sao paulo',min:'',max:'150',favorites:true},['1']).length,1);});

