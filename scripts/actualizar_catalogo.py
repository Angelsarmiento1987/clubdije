"""Importa publicaciones públicas del vendedor, sin API ni precios.
Si ML bloquea el acceso, falla sin modificar el catálogo.
También admite HTML guardado desde un navegador: --html pagina1.html pagina2.html
"""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from urllib.parse import urljoin, urlsplit, parse_qs
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SELLER = 'https://listado.mercadolibre.com.ar/_CustId_344979423'

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []
    def all(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.all()
    def text(self):
        return ' '.join(c.text() if isinstance(c, Node) else c for c in self.children).strip()
    def has(self, name):
        return name in self.attrs.get('class', '').split()

class Tree(HTMLParser):
    VOID = {'img', 'meta', 'link', 'input', 'br', 'hr', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'param', 'track'}
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node(); self.stack = [self.root]; self.feed(html)
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs); self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID: self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]; break
    def handle_data(self, data):
        self.stack[-1].children.append(data)

def public_url(url):
    parsed = urlsplit(url)
    host = parsed.hostname or ''
    return parsed.scheme == 'https' and (host == 'mercadolibre.com.ar' or host.endswith('.mercadolibre.com.ar'))

def product_id(url):
    parsed = urlsplit(url)
    wid = parse_qs(parsed.fragment).get('wid', []) + parse_qs(parsed.query).get('wid', [])
    if wid and re.fullmatch(r'MLA\d+', wid[0]): return wid[0]
    match = re.search(r'\b(MLAU?)-?(\d+)\b', parsed.path)
    return ''.join(match.groups()) if match else None

def category(title):
    title = title.casefold()
    for key, value in [('pulsera', 'Pulseras'), ('aro', 'Aros'), ('anillo', 'Anillos'), ('llavero', 'Llaveros')]:
        if re.search(r'\b'+key+r's?\b', title): return value
    return 'Dijes y collares'

def parse_listing(html):
    tree = Tree(html).root
    products = {}
    tiles = [n for n in tree.all() if n.has('ui-search-layout__item')]
    if not tiles: tiles = [n for n in tree.all() if n.has('poly-card')]
    for tile in tiles:
        nodes = list(tile.all())
        links = [n for n in nodes if n.tag == 'a' and public_url(n.attrs.get('href', ''))]
        link = next((n for n in links if n.has('poly-component__title') or n.has('ui-search-link')), None)
        if link is None: link = next((n for n in links if product_id(n.attrs['href'])), None)
        if link is None: continue
        url = link.attrs['href']; ident = product_id(url)
        title_node = next((n for n in nodes if n.has('poly-component__title') or n.has('ui-search-item__title')), link)
        title = ' '.join(title_node.text().split())
        images = [n for n in nodes if n.tag == 'img']
        image = next((u for n in images for u in [n.attrs.get('data-src'), n.attrs.get('data-lazy-src'), n.attrs.get('src')] if u and urlsplit(u).scheme == 'https' and (urlsplit(u).hostname or '').endswith('.mlstatic.com')), None)
        if not ident or not title or not image:
            raise ValueError('Una publicación no tiene identificador, título o imagen. Se conserva el catálogo anterior.')
        products[ident] = dict(id=ident, title=title, image=image, url=url, category=category(title))
    next_url = None
    for n in tree.all():
        if n.tag != 'a': continue
        if n.attrs.get('rel') == 'next' or n.has('andes-pagination__link') and ('siguiente' in n.text().casefold() or 'siguiente' in n.attrs.get('title', '').casefold()):
            next_url = urljoin(SELLER, n.attrs.get('href', '')); break
    text = tree.text()
    total_match = re.search(r'([\d.]+)\s+resultados?\b', text, re.I)
    total = int(total_match.group(1).replace('.', '')) if total_match else None
    return list(products.values()), next_url, total

def merge_catalog(old, products):
    if not products: raise ValueError('No se encontraron productos. No se sobrescribe el catálogo.')
    if len(products) < max(1, len(old['products']) // 2):
        raise ValueError('Lectura demasiado pequeña: puede estar incompleta. No se modifica el catálogo.')
    # Conserva publicaciones anteriores: este catálogo no representa stock en vivo.
    merged = {p['id']: {k:v for k,v in p.items() if k != 'price'} for p in old['products']}
    for p in products:
        p = {k:v for k,v in p.items() if k != 'price'}
        if p['id'] in merged: p['category'] = merged[p['id']]['category']
        merged[p['id']] = p
    return {'updatedAt': datetime.now(timezone.utc).date().isoformat(), 'products': list(merged.values())}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--html', nargs='+', type=Path, help='Todas las páginas del vendedor guardadas como HTML')
    args = parser.parse_args()
    target = ROOT / 'src/productos.json'
    old = json.loads(target.read_text(encoding='utf-8'))
    found = {}; expected = None
    if args.html:
        pages = [p.read_text(encoding='utf-8') for p in args.html]
        for html in pages:
            items, _, total = parse_listing(html)
            expected = max(expected or 0, total or 0)
            for item in items: found[item['id']] = item
    else:
        url = SELLER; visited = set()
        while url:
            if not public_url(url) or not urlsplit(url).hostname == 'listado.mercadolibre.com.ar':
                raise ValueError('La paginación apunta fuera del listado permitido.')
            if url in visited or len(visited) >= 30: raise ValueError('Paginación incompleta o repetida.')
            visited.add(url)
            req = Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'es-AR,es;q=0.9'})
            with urlopen(req, timeout=40) as response:
                if not public_url(response.url): raise ValueError('Redirección fuera de Mercado Libre.')
                html = response.read().decode('utf-8')
            items, url, total = parse_listing(html)
            if not items: raise ValueError('Página vacía, acceso bloqueado o formato no reconocido.')
            expected = max(expected or 0, total or 0)
            for item in items: found[item['id']] = item
            if url: time.sleep(2)
    if expected and len(found) < expected:
        raise ValueError(f'Lectura incompleta: {len(found)} de {expected} publicaciones. Se conserva el catálogo.')
    result = merge_catalog(old, list(found.values()))
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temporary.replace(target)
    print(f"Catálogo actualizado: {len(result['products'])} productos; {len(set(found)-{p['id'] for p in old['products']})} nuevos.")

if __name__ == '__main__':
    try: main()
    except Exception as exc:
        print(f'No se pudo actualizar: {exc}', file=sys.stderr); sys.exit(1)
