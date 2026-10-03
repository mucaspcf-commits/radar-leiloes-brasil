import json
from pathlib import Path
import tempfile
import unittest
from data_sync import number, parse_csv, save_snapshot

CSV = '''Lista de Imóveis da Caixa;;Data de geração:;25/09/2026
Nº do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;Financiamento;Descrição;Modalidade de venda;Link de acesso
123;SP;São Paulo;Centro;Rua A;100.000,00;200.000,00;50.00;Sim;Casa, 116.12 de área privativa;Venda Online;https://example.com
'''.encode('cp1252')

class ImportTests(unittest.TestCase):
    def test_decimal_formats(self):
        self.assertEqual(number('116.12'),116.12)
        self.assertEqual(number('100.000,00'),100000)
        for value in ['nan','inf']:
            with self.assertRaises(ValueError): number(value)
    def test_source_fields_and_no_fabrication(self):
        data=parse_csv(CSV); p=data['properties'][0]
        self.assertEqual(data['source_date'],'2026-09-25')
        self.assertEqual(p['area'],116.12)
        self.assertEqual(p['desconto'],50)
        self.assertEqual(p['ocupacao'],'Não informada')
        self.assertTrue(p['link'].startswith('https://venda-imoveis.caixa.gov.br/'))
        self.assertNotIn('growth_anual',p)
    def test_html_does_not_overwrite_valid_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'data.json'; save_snapshot(CSV,path); original=path.read_bytes()
            with self.assertRaises(ValueError): save_snapshot(b'<head>CAPTCHA</head>',path)
            self.assertEqual(path.read_bytes(),original)
    def test_missing_column_and_empty_list_rejected(self):
        with self.assertRaises(ValueError): parse_csv(CSV.replace(b'UF;',b'Estado;'))
        with self.assertRaises(ValueError): parse_csv(b'\n'.join(CSV.splitlines()[:2]))
    def test_unknown_financing_not_no(self):
        self.assertEqual(parse_csv(CSV.replace(b';Sim;',b';;'))['properties'][0]['financiamento'],'Não informado')
    def test_older_snapshot_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'data.json'; save_snapshot(CSV,path)
            with self.assertRaises(ValueError): save_snapshot(CSV.replace(b'25/09/2026',b'24/09/2026'),path)

if __name__=='__main__': unittest.main()

