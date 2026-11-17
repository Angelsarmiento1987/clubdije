import React, {useState} from 'react';

const featured = [
  {id:'MLA2552778524', theme:'boca', label:'Boca'},
  {id:'MLA2863220224', theme:'harry', label:'Harry Potter'},
  {id:'MLA2836608372', theme:'quince', label:'Mis 15'},
];

function FeaturedCharm({product, label}) {
  const [failedImage, setFailedImage] = useState(null);
  return <a className="comic-charm" href={product.url} target="_blank" rel="noopener noreferrer"
    aria-label={`Ver ${product.title} en Mercado Libre`}>
    <span className="comic-charm-photo">
      {failedImage === product.image
        ? <span className="comic-charm-fallback">Ver producto ↗</span>
        : <img src={product.image} alt="" decoding="async" onError={() => setFailedImage(product.image)} />}
    </span>
    <span className="comic-charm-caption"><span>{label}</span> <span aria-hidden="true">↗</span></span>
  </a>;
}

export function ComicCharms({products}) {
  const [selectedId, setSelectedId] = useState(featured[0].id);
  const [paused, setPaused] = useState(false);
  const charms = featured.flatMap(item => {
    const product = products.find(product => product.id === item.id);
    return product ? [{...item, product}] : [];
  });
  const selected = charms.find(charm => charm.id === selectedId) ?? charms[0];
  if (!selected) return null;

  return <div className="comic-hero-art" aria-label="Dijes destacados" role="group">
    <div className={`comic-charm-stage comic-charm-stage-${selected.theme}`} data-paused={paused}>
      <span className="comic-feature-kicker">EN PORTADA <span aria-hidden="true">✦</span></span>
      <FeaturedCharm key={selected.id} product={selected.product} label={selected.label} />
    </div>
    <div className="comic-charm-controls">
      <div className="comic-charm-selector" role="group" aria-label="Elegir dije destacado">
        {charms.map(({id, label}) => <button key={id} type="button" aria-pressed={selected.id === id}
          onClick={() => setSelectedId(id)}>{label}</button>)}
      </div>
      <button className="comic-motion-control" type="button" onClick={() => setPaused(value => !value)}>
        {paused ? 'Reanudar' : 'Pausar'} <span className="comic-motion-label">movimiento</span>
      </button>
    </div>
  </div>;
}
