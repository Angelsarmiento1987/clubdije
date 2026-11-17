import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useCatalog, recordVisit} from './catalog-service.js';
import {GiftCards, GiftPortal, useGiftRoute} from './gifts.jsx';
import {INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_URL} from './business-info.js';
import {ComicLogo, CollectionArt} from './comic-art.jsx';
import {CatalogTV} from './catalog-tv.jsx';
import {collections, otherCollections} from './collections.js';
import './styles.css';
import './comic.css';

const seller = 'https://listado.mercadolibre.com.ar/_CustId_344979423';
const pageSize = 24;
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const whatsapp = product => WHATSAPP_URL + '?text=' + encodeURIComponent(
  `¡Hola! Quiero consultar por este producto: ${product.title}\n${product.url}`
);

function ProductCard({product}) {
  const [failedImage, setFailedImage] = useState(null);
  return <article className="comic-product">
    <a className="comic-product-picture" href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${product.title} en Mercado Libre`}>
      {failedImage === product.image
        ? <span className="comic-no-photo">Imagen no disponible</span>
        : <img src={product.image} alt={product.title} loading="lazy" onError={() => setFailedImage(product.image)} />}
      <span className="comic-picture-arrow" aria-hidden="true">↗</span>
    </a>
    <div className="comic-product-copy">
      <span className="comic-product-category">{product.category}</span>
      <h3><a href={product.url} target="_blank" rel="noopener noreferrer">{product.title}</a></h3>
      <a className="comic-button comic-whatsapp" href={whatsapp(product)} target="_blank" rel="noopener noreferrer" aria-label={`Consultar por WhatsApp sobre ${product.title}`}>
        <img className="product-brand-icon" src="./brands/whatsapp.svg" alt="" /> Consultar por WhatsApp
      </a>
      <a className="comic-button comic-market-link" href={product.url} target="_blank" rel="noopener noreferrer">
        <img className="product-brand-icon" src="./brands/mercado-libre.svg" alt="" /> Comprar en Mercado Libre
      </a>
    </div>
  </article>;
}

function useCatalogFilters(catalog) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [sort, setSort] = useState('original');
  const [limit, setLimit] = useState(pageSize);
  const [mood, setMood] = useState(null);
  const products = useMemo(() => {
    const search = normalize(query);
    const results = catalog.products.filter(product => {
      const title = normalize(product.title);
      return (category === 'Todos' || product.category === category) && title.includes(search)
        && (!mood || mood.match.test(title));
    });
    if (sort === 'name') results.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    return results;
  }, [query, category, sort, mood, catalog]);

  function chooseMood(selectedMood) {
    setMood(selectedMood);
    setCategory('Todos');
    setQuery('');
    setLimit(pageSize);
    const section = document.getElementById('coleccion');
    section?.focus({preventScroll:true});
    section?.scrollIntoView();
  }

  function resetFilters() {
    setMood(null);
    setQuery('');
    setCategory('Todos');
    setLimit(pageSize);
  }

  return {query, setQuery, category, setCategory, sort, setSort, limit, setLimit, mood, setMood, products, chooseMood, resetFilters};
}

function Catalog({catalog, filters}) {
  const {query, setQuery, category, setCategory, sort, setSort, limit, setLimit, mood, setMood, products, resetFilters} = filters;
  const categories = ['Todos', ...new Set(catalog.products.map(product => product.category))];
  const updated = new Intl.DateTimeFormat('es-AR', {timeZone:'UTC'}).format(new Date(catalog.updatedAt + 'T12:00:00Z'));

  return <>
    <section className="comic-wrap comic-catalog" id="coleccion" aria-labelledby="catalog-heading" tabIndex={-1}>
      <div className="comic-section-heading">
        <div><span className="comic-kicker">EL CATÁLOGO</span><h2 id="catalog-heading">{mood ? mood.name : 'La colección'}</h2></div>
        <p>Encontrá tu dije y consultanos por WhatsApp.</p>
      </div>
      <div className="comic-filter-panel">
        <div className="comic-filter-row">
          <label className="comic-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>
            <input type="search" aria-label="Buscar productos" placeholder="Buscá un dije, un equipo o una pasión…" value={query} onChange={event => {setQuery(event.target.value); setLimit(pageSize);}} />
          </label>
          <label className="comic-sort">Ordenar <select value={sort} onChange={event => {setSort(event.target.value); setLimit(pageSize);}}>
            <option value="original">Orden del catálogo</option><option value="name">Nombre: A–Z</option>
          </select></label>
        </div>
        <div className="comic-categories" role="group" aria-label="Categorías">
          {categories.map(item => <button type="button" key={item} aria-pressed={item === category} onClick={() => {setCategory(item); setLimit(pageSize);}}>{item}</button>)}
        </div>
      </div>
      <div className="comic-result-line">
        <span role="status">{products.length} {products.length === 1 ? 'producto' : 'productos'}</span>
        {mood && <button type="button" className="comic-clear-mood" onClick={() => {setMood(null); setLimit(pageSize);}}>Quitar filtro «{mood.name}» <span aria-hidden="true">×</span></button>}
        <small>Actualizado el {updated}</small>
      </div>
      <div className="comic-product-grid">{products.slice(0, limit).map(product => <ProductCard key={product.id} product={product} />)}</div>
      {!products.length && <div className="comic-empty">
        <h3>No encontramos ese dije.</h3><p>Probá con otra palabra o mirá toda la colección.</p>
        <button type="button" className="comic-button" onClick={resetFilters}>Ver todos los productos</button>
      </div>}
      {limit < products.length && <div className="comic-load">
        <button type="button" className="comic-button" onClick={() => setLimit(current => current + pageSize)}>Ver más productos ↓</button>
        <small>Mostrando {Math.min(limit, products.length)} de {products.length}</small>
      </div>}
    </section>
  </>;
}

const sideLinks = [
  {href:'#contenido', label:'Inicio', icon:'M3 10l9-7 9 7v10H3z M9 20v-6h6v6'},
  {href:'#tematicas', label:'Temáticas', icon:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'},
  {href:'#coleccion', label:'Catálogo', icon:'M4 8h16l1 12H3z M8 8V6a4 4 0 0 1 8 0v2'},
  {href:'#tarjetas', label:'Tarjetas de regalo', icon:'M4 10h16v10H4z M3 6h18v4H3z M12 6v14 M12 6C6 6 5 2 8 2c2 0 4 4 4 4s2-4 4-4c3 0 2 4-4 4z'},
  {href:'#club', label:'El club', icon:'M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12z'},
];

function CatalogSidebar() {
  return <aside className="catalog-sidebar">
    <nav className="catalog-side-nav" aria-label="Explorar El Club del Dije">
      <p>EXPLORÁ EL CLUB</p>
      {sideLinks.map(({href, label, icon}) => <a key={href} href={href}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon}/></svg>{label}
      </a>)}
    </nav>
    <div className="catalog-side-gift">
      <span aria-hidden="true">✦</span><strong>¿Tenés un código?</strong>
      <a href="#tarjetas">Abrí tu tarjeta ↗</a>
    </div>
    <a className="catalog-side-social" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
      aria-label={`Seguí a ${INSTAGRAM_HANDLE} en Instagram`}>
      <span className="catalog-side-social-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <strong>Seguí al Club</strong>
      <span className="catalog-side-social-handle">{INSTAGRAM_HANDLE} <span aria-hidden="true">↗</span></span>
    </a>
    <a className="catalog-side-social catalog-side-whatsapp" href={WHATSAPP_URL} target="_blank"
      rel="noopener noreferrer" aria-label="Escribinos por WhatsApp">
      <span className="catalog-side-social-icon" aria-hidden="true"><img src="./brands/whatsapp.svg" alt="" /></span>
      <strong>¿Una consulta?</strong>
      <span className="catalog-side-social-handle">Escribinos por WhatsApp <span aria-hidden="true">↗</span></span>
    </a>
  </aside>;
}

function CatalogFooter() {
  const brandRef = useRef(null);
  const [sway, setSway] = useState(false);

  useEffect(() => {
    if (!window.IntersectionObserver) {
      setSway(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSway(true);
    }, {threshold: 0.5});
    observer.observe(brandRef.current);
    return () => observer.disconnect();
  }, []);

  return <footer className="comic-footer"><div className="comic-wrap comic-footer-inner">
      <a ref={brandRef} className="comic-footer-brand" href="#contenido" aria-label="El Club del Dije, volver al inicio">
        <ComicLogo className={sway ? 'comic-footer-logo is-swaying' : 'comic-footer-logo'} full />
      </a>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{INSTAGRAM_HANDLE} ↗</a>
      <a href={seller} target="_blank" rel="noopener noreferrer">Nuestra tienda ↗</a>
      <small>© {new Date().getFullYear()} El Club del Dije</small>
    </div></footer>;
}

function App() {
  const route = useGiftRoute();
  const catalog = useCatalog();
  const filters = useCatalogFilters(catalog);
  useEffect(() => {
    if (!/\/superadmin\/?$/.test(window.location.pathname)) recordVisit();
  }, []);

  if (route.kind !== 'home') return <GiftPortal route={route} />;

  return <div className="comic-site">
    <a className="comic-skip" href="#contenido">Saltar al contenido</a>
    <header className="comic-header">
      <div className="comic-wrap comic-header-inner">
        <a href="#" className="comic-brand" aria-label="El Club del Dije, inicio"><ComicLogo /></a>
        <nav className="comic-nav" aria-label="Principal">
          <a href="#coleccion">La colección</a><a href="#tarjetas">Tarjetas de regalo</a><a href="#club">El club</a>
          <a className="comic-button comic-store" href={seller} target="_blank" rel="noopener noreferrer">Mercado Libre ↗</a>
        </nav>
      </div>
    </header>
    <div className="catalog-shell">
    <CatalogSidebar />
    <main id="contenido">
      <section className="comic-wrap comic-hero" aria-labelledby="comic-title">
        <div className="comic-hero-copy">
          <ComicLogo className="comic-hero-logo" full label="El Club del Dije" />
          <h1 id="comic-title">Un dije para<br/><em>tu mundo.</em></h1>
          <p>Para la cancha, tus 15, la pileta y todo eso que te hace vos.</p>
          <div className="comic-hero-actions">
            <a className="comic-button comic-primary" href="#coleccion" onClick={filters.resetFilters}>Ver todos los dijes <span aria-hidden="true">↘</span></a>
            <a className="comic-gift-link" href="#tarjetas">Tengo un código <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <CatalogTV products={catalog.products} />
      </section>
      <section className="comic-wrap collection-section" id="tematicas" aria-labelledby="themes-heading">
        <div className="collection-heading"><h2 id="themes-heading">Elegí tu temática</h2><span>{catalog.products.length} accesorios</span></div>
        <div className="collection-grid">
          {collections.map(item => <button className={`collection-tile collection-${item.id}`} type="button" key={item.id}
            aria-pressed={filters.mood === item} onClick={() => filters.chooseMood(item)}>
            <span className="collection-caption">{item.caption}</span>
            <CollectionArt id={item.id}/>
            <span className="collection-name">{item.name}<span aria-hidden="true">↗</span></span>
          </button>)}
        </div>
      </section>
      <div className="comic-wrap collection-quick" role="group" aria-label="Más colecciones">
        <strong>Más colecciones</strong>
        {otherCollections.map(item => <button type="button" key={item.id} aria-pressed={filters.mood === item} onClick={() => filters.chooseMood(item)}>{item.name} ↗</button>)}
      </div>
      <Catalog catalog={catalog} filters={filters} />
      <div className="comic-wrap comic-gift-section"><GiftCards /></div>
      <section className="comic-wrap comic-about" id="club" aria-labelledby="club-heading">
        <div className="comic-about-art" aria-hidden="true"><ComicLogo /></div>
        <div className="comic-about-copy">
          <span className="comic-kicker">EL CLUB</span>
          <h2 id="club-heading">Llevá algo tuyo.</h2>
          <p>Un equipo que alentás, una canción que te marcó o un detalle para alguien que querés. En El Club del Dije encontrás accesorios para llevar esas historias con vos.</p>
          <a className="comic-button" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{INSTAGRAM_HANDLE} ↗</a>
        </div>
      </section>
    </main>
    </div>
    <CatalogFooter />
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
