"""Índice parcial da primeira página pública da Mega Leilões; uma consulta por execução.

Não copia imagens ou editais. Mantém apenas metadados factuais e links para a fonte.
Não afirma cobertura integral nem confirma disponibilidade individual.
"""
import argparse
import datetime as dt
import html
import json
from pathlib import Path
import re
import urllib.request
from urllib.parse import urlsplit
from data_sync import number

URL='https://www.megaleiloes.com.br/imoveis'

def clean(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>',' ',value)).split())

def parse(text):
    rows=[]
    for block in re.split(r'<div[^>]+data-key="\d+"[^>]*>',text)[1:]:
        title=re.search(r'<a class="card-title" href="([^"]+)"[^>]*>(.*?)</a>',block,re.S)
        price=re.search(r'<div class="card-price">([^<]+)</div>',block)
        locality=re.search(r'<a class="card-locality"[^>]*>(.*?)</a>',block,re.S)
        code=re.search(r'<div class="card-number[^" ]*(?: pull-left)?">([^<]+)</div>',block)
        if not all([title,price,locality,code]):
            continue
        link=html.unescape(title[1]).split('?')[0]
        if urlsplit(link).hostname!='www.megaleiloes.com.br' or not link.startswith('https://www.megaleiloes.com.br/imoveis/'):
            continue
        place=clean(locality[1]).rsplit(',',1)
        if len(place)!=2 or not re.fullmatch('[A-Z]{2}',place[1].strip()):
            continue
        modality=re.search(r'<div class="card-instance-title"><a[^>]*>(.*?)</a>',block,re.S)
        status=re.search(r'<div class="card-status">([^<]+)</div>',block)
        amount=number(clean(price[1])); identifier=clean(code[1])
        if amount<=0 or not re.fullmatch('[A-Z]\d+',identifier):
            continue
        rows.append(dict(id=identifier,titulo=clean(title[2]),preco=amount,cidade=place[0],uf=place[1].strip(),modalidade=clean(modality[1]) if modality else 'Não informada',status=clean(status[1]) if status else 'Não informado',link=link))
    if not rows:
        raise ValueError('Nenhum anúncio válido; base anterior preservada')
    return list({p['id']:p for p in rows}.values())

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path);args=parser.parse_args()
    if args.input:
        text=args.input.read_text(encoding='utf-8')
    else:
        req=urllib.request.Request(URL,headers={'User-Agent':'RadarLeiloes/2.0 public-source-audit'})
        with urllib.request.urlopen(req,timeout=25) as response:
            raw=response.read(3_000_001)
        if len(raw)>3_000_000: raise ValueError('Resposta excedeu limite')
        text=raw.decode('utf-8')
    data=dict(source='Mega Leilões',source_url=URL,collected_at=dt.datetime.now(dt.timezone.utc).isoformat(),coverage='Parcial: primeira página do catálogo público de imóveis; anúncios podem encerrar ou mudar.',properties=parse(text))
    path=Path(__file__).parent/'static'/'mega-data.json';temp=path.with_suffix('.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(path)
    print(f"{len(data['properties'])} anúncios públicos indexados (cobertura parcial)")

if __name__=='__main__':main()
