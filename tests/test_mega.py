import unittest
from mega_sync import parse

FIXTURE = '''<div data-key="0"><a class="card-title" href="https://www.megaleiloes.com.br/imoveis/casa/J123?tracking=1">Casa &amp; terreno</a><div class="card-price">R$ 100.000,00</div><a class="card-locality">Campinas, SP</a><div class="card-number">J123</div>'''

class MegaTests(unittest.TestCase):
    def test_factual_fields_and_duplicates(self):
        rows = parse(FIXTURE + FIXTURE)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['preco'], 100000)
        self.assertEqual(rows[0]['cidade'], 'Campinas')
        self.assertEqual(rows[0]['titulo'], 'Casa & terreno')
        self.assertNotIn('?', rows[0]['link'])
        self.assertEqual(rows[0]['status'], 'Não informado')

    def test_empty_or_unsafe_source_rejected(self):
        for value in ['<html>Captcha</html>', FIXTURE.replace('www.megaleiloes.com.br', 'evil.example')]:
            with self.assertRaises(ValueError):
                parse(value)
