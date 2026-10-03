"""Auditoria técnica de páginas públicas, sem login, contorno de bloqueios ou pagamentos.

HTTP 200 significa acesso à página, não autorização de redistribuição ou integração.
Uma requisição por origem, com limite de tamanho e timeout, para evitar varredura intensa.
"""
import concurrent.futures
import datetime as dt
import html
import json
from pathlib import Path
import re
import urllib.error
import urllib.request

SOURCES = [
 ('Banco do Brasil','Bancos','https://www.seuimovelbb.com.br/catalogo'),
 ('Itaú','Bancos','https://www.itau.com.br/imoveis-itau/'),
 ('Bradesco','Bancos','https://corporate.bradesco/html/classic/produtos-servicos/leiloes/index.shtm'),
 ('Zuk: bancos, Creditas, construtoras e incorporadoras','Bancos / financeiras / construtoras / leiloeiros','https://www.portalzuk.com.br/'),
 ('Superbid','Leiloeiros e plataformas','https://www.superbid.net/categorias/imoveis?isHomeCategory=true'),
 ('Mega Leilões','Leiloeiros e plataformas','https://www.megaleiloes.com.br/'),
 ('Sodré Santoro','Leiloeiros e plataformas','https://www.sodresantoro.com.br/'),
 ('Comprei PGFN','Órgãos públicos','https://comprei.pgfn.gov.br/anuncio'),
 ('Receita Federal: mercadorias apreendidas','Órgãos públicos — outros bens','https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/leilao'),
]

def check(source):
    name, category, url = source
    result = dict(name=name, category=category, url=url, checked_at=dt.datetime.now(dt.timezone.utc).isoformat(), integrated=name=='Mega Leilões', integration_mode='Índice parcial: primeira página' if name=='Mega Leilões' else 'Consulta externa')
    try:
        request=urllib.request.Request(url,headers={'User-Agent':'RadarLeiloes/2.0 public-source-audit'})
        with urllib.request.urlopen(request,timeout=15) as response:
            content=response.read(1_000_000).decode('utf-8',errors='replace')
            result.update(http_status=response.status, final_url=response.url)
        blocked=bool(re.search(r'<title>[^<]*(captcha|access denied|just a moment)',content,re.I))
        result['status']='Consulta bloqueada' if blocked else 'Página acessível; importação não validada'
        title=re.search(r'<title[^>]*>(.*?)</title>',content,re.I|re.S)
        result['title']=html.unescape(re.sub('<[^>]+>','',title[1])).strip()[:200] if title else None
        result['structured_data_detected']='application/ld+json' in content.lower()
        result['note']='Consulta sem credenciais. API/feed gratuito e permissão de reutilização ainda não confirmados.'
    except urllib.error.HTTPError as exc:
        result.update(http_status=exc.code,status=f'Consulta automatizada indisponível (HTTP {exc.code})',note='Consulta pelo portal pode continuar disponível. Não houve tentativa de contornar o bloqueio.')
    except Exception as exc:
        result.update(http_status=None,status='Acesso não confirmado',note=type(exc).__name__)
    return result

def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        rows=list(executor.map(check,SOURCES))
    output=dict(checked_at=dt.datetime.now(dt.timezone.utc).isoformat(),scope='Auditoria de acesso técnico em fontes selecionadas; não é cobertura exaustiva nem licença de uso.',sources=rows)
    path=Path(__file__).parent/'static'/'source-audit.json'
    path.write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
    for row in rows:
        print(f"{row['name']}: {row['status']}")

if __name__=='__main__': main()
