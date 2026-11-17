import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('catalogo', Path(__file__).parents[1]/'scripts/actualizar_catalogo.py')
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)

class CatalogoTests(unittest.TestCase):
    def test_listing_and_pagination_without_prices(self):
        html = '''<span>1 resultado</span><li class="ui-search-layout__item"><div class="poly-card"><img src="https://http2.mlstatic.com/imagen.webp"><a class="poly-component__title" href="https://www.mercadolibre.com.ar/dije/up/MLAU123?x=y#wid=MLA456">Dije corazón &amp; amor</a><span>$19000</span></div></li><a rel="next" href="https://listado.mercadolibre.com.ar/_CustId_344979423_Desde_49">Siguiente</a>'''
        items, next_url, total = module.parse_listing(html)
        self.assertEqual(items[0]['id'], 'MLA456')
        self.assertEqual(items[0]['title'], 'Dije corazón & amor')
        self.assertNotIn('price', items[0])
        self.assertIn('_Desde_49', next_url)
        self.assertEqual(total, 1)
    def test_empty_does_not_replace(self):
        with self.assertRaises(ValueError): module.merge_catalog({'products': []}, [])
    def test_incomplete_does_not_replace(self):
        old = {'products': [{'id':str(i)} for i in range(143)]}
        with self.assertRaises(ValueError): module.merge_catalog(old, [{'id':'new'}])
    def test_upsert_preserves_previous_and_category(self):
        old = {'products': [{'id':'MLA1','title':'Antes','category':'Especiales','price':100}, {'id':'MLA2','title':'Anterior'}]}
        result = module.merge_catalog(old, [{'id':'MLA1','title':'Nuevo','category':'Otros'}, {'id':'MLA3','title':'Agregado'}])
        self.assertEqual(len(result['products']), 3)
        self.assertEqual(result['products'][0]['title'], 'Nuevo')
        self.assertEqual(result['products'][0]['category'], 'Especiales')
        self.assertTrue(all('price' not in p for p in result['products']))
    def test_external_url_rejected(self):
        self.assertFalse(module.public_url('https://mercadolibre.com.ar.evil.test/item/MLA1'))
    def test_lazy_image_and_old_title(self):
        html = '''<li class="ui-search-layout__item"><a class="ui-search-link" href="https://articulo.mercadolibre.com.ar/MLA-456-pulsera"><h2 class="ui-search-item__title">Pulsera Luna</h2></a><img src="data:image/png;base64,AAAA" data-src="https://http2.mlstatic.com/luna.jpg"></li>'''
        items, _, _ = module.parse_listing(html)
        self.assertEqual(items[0]['id'], 'MLA456')
        self.assertEqual(items[0]['category'], 'Pulseras')

if __name__ == '__main__': unittest.main()
