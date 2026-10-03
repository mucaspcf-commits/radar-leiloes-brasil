"""Importa somente CSV oficial válido; nunca gera anúncios ou substitui base por HTML."""
import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import math
from pathlib import Path
import re
import unicodedata
import urllib.request

URL = 'https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_geral.csv'
REGIONS = {uf: region for region, states in {
    'Norte': 'AC AP AM PA RO RR TO', 'Nordeste': 'AL BA CE MA PB PE PI RN SE',
    'Centro-Oeste': 'DF GO MT MS', 'Sudeste': 'ES MG RJ SP', 'Sul': 'PR RS SC'
}.items() for uf in states.split()}

def normal(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value.lower()) if not unicodedata.combining(c)).strip()

def number(value):
    value = value.strip().replace('R$', '').replace(' ', '').replace('%', '')
    if ',' in value:
        value = value.replace('.', '').replace(',', '.')
    result = float(value)
    if not math.isfinite(result):
        raise ValueError('Número não finito')
    return result

def parse_csv(raw):
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = raw.decode('cp1252')
    if re.search(r'<(?:html|head|script)|captcha', text[:2000], re.I):
        raise ValueError('A fonte retornou bloqueio/HTML. A base anterior foi preservada.')
    lines = list(csv.reader(io.StringIO(text), delimiter=';'))
    start = next((i for i, row in enumerate(lines[:30]) if 'uf' in [normal(x) for x in row] and 'cidade' in [normal(x) for x in row]), None)
    if start is None:
        raise ValueError('Cabeçalho oficial não reconhecido')
    header = [normal(x) for x in lines[start]]
    required = ['uf', 'cidade', 'bairro', 'endereco', 'preco', 'valor de avaliacao', 'descricao', 'modalidade de venda', 'link de acesso']
    if any(name not in header for name in required):
        raise ValueError('Colunas obrigatórias ausentes; importação interrompida')
    date_match = re.search(r'Data de gera[^\n]*?(\d{2}/\d{2}/\d{4})', text, re.I)
    if not date_match:
        raise ValueError('Data de geração ausente')
    source_date = dt.datetime.strptime(date_match[1], '%d/%m/%Y').date()
    if source_date > dt.datetime.now(dt.timezone.utc).date() + dt.timedelta(days=1):
        raise ValueError('Data de geração no futuro')
    records = {}
    for row in lines[start+1:]:
        if not row or not any(x.strip() for x in row):
            continue
        if len(row) != len(header):
            raise ValueError('Linha com quantidade inesperada de colunas')
        data = dict(zip(header, [x.strip() for x in row]))
        code = row[0].strip()
        if not code.isdigit() or data['uf'] not in REGIONS:
            raise ValueError('Código de imóvel ou UF inválido')
        price, appraisal = number(data['preco']), number(data['valor de avaliacao'])
        if price <= 0 or appraisal <= 0:
            raise ValueError('Valores de imóvel inválidos')
        description = data['descricao']
        normalized = normal(description)
        kind = next((label for term, label in [('apartamento', 'Apartamento'), ('casa', 'Casa'), ('terreno', 'Terreno'), ('sala', 'Sala comercial'), ('galpao', 'Galpão'), ('loja', 'Loja'), ('rural', 'Rural')] if normalized.startswith(term)), 'Outros')
        area_match = re.search(r'([\d.,]+)\s*(?:m[²2])?\s*de area privativa', normalized)
        area = number(area_match[1]) if area_match else None
        finance = data.get('financiamento', '')
        finance = 'Sim' if normal(finance) == 'sim' else 'Não' if normal(finance) == 'nao' else 'Não informado'
        # Não deduz ocupação, data do leilão ou financiamento a partir de publicidade.
        records[code] = dict(id=code, uf=data['uf'], regiao=REGIONS[data['uf']], cidade=data['cidade'], bairro=data['bairro'], endereco=data['endereco'], preco=price, avaliacao=appraisal, desconto=round((1-price/appraisal)*100, 2), tipo=kind, area=area, financiamento=finance, ocupacao='Não informada', modalidade=data['modalidade de venda'], descricao=description, fonte='Caixa', link=f'https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel={code}')
    if not records:
        raise ValueError('Lista vazia; base anterior preservada')
    return dict(schema=1, source_date=source_date.isoformat(), imported_at=dt.datetime.now(dt.timezone.utc).isoformat(), source_url=URL, sha256=hashlib.sha256(raw).hexdigest(), coverage=sorted({p['uf'] for p in records.values()}), properties=list(records.values()))

def save_snapshot(raw, output, source_url=URL):
    snapshot = parse_csv(raw)
    snapshot['source_url'] = source_url
    output = Path(output)
    if output.exists():
        old = json.loads(output.read_text(encoding='utf-8'))
        if old['source_date'] > snapshot['source_date']:
            raise ValueError('Lista anterior à base atual; atualização recusada')
        if not set(old['coverage']).issubset(snapshot['coverage']):
            raise ValueError('Cobertura reduziu; revisão manual necessária')
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix('.tmp')
    temp.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')
    temp.replace(output)
    return snapshot

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output', default='static/data.json')
    args = parser.parse_args()
    try:
        if args.input:
            raw = args.input.read_bytes()
            source = 'https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_SP.csv'
        else:
            request = urllib.request.Request(URL, headers={'User-Agent': 'RadarLeiloes/2.0 (public CSV reader)'})
            with urllib.request.urlopen(request, timeout=45) as response:
                raw = response.read(30_000_001)
            if len(raw) > 30_000_000:
                raise ValueError('Resposta excedeu limite de 30 MB')
            source = URL
        snapshot = save_snapshot(raw, args.output, source)
        print(f"{len(snapshot['properties'])} registros; geração {snapshot['source_date']}; UFs: {', '.join(snapshot['coverage'])}")
    except Exception as exc:
        parser.exit(1, f'Atualização não concluída: {exc}\n')
