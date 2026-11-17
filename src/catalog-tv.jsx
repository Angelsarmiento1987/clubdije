import React, {useEffect, useMemo, useState} from 'react';

const openingChannels = ['MLA2552778524', 'MLA2863220224', 'MLA2836608372'];
const channelDuration = 5000;

function TVPicture({product}) {
  const [failedImage, setFailedImage] = useState(false);
  const [widePhoto, setWidePhoto] = useState(false);
  return <a className="catalog-tv-picture" href={product.url} target="_blank" rel="noopener noreferrer"
    aria-label={`Ver ${product.title} en Mercado Libre`}>
    {failedImage
      ? <span className="catalog-tv-fallback">Ver producto ↗</span>
      : <>
        <img className="catalog-tv-backdrop" src={product.image} alt="" aria-hidden="true" decoding="async" />
        <img className="catalog-tv-image" src={product.image} alt="" decoding="async" data-wide={widePhoto}
          onLoad={({currentTarget}) => setWidePhoto(currentTarget.naturalWidth * 3 >= currentTarget.naturalHeight * 4)}
          onError={() => setFailedImage(true)} />
      </>}
  </a>;
}

export function CatalogTV({products}) {
  const channels = useMemo(() => {
    const pendants = products.filter(product => product.category === 'Dijes y collares');
    const opening = openingChannels.map(id => pendants.find(product => product.id === id)).filter(Boolean);
    return [...opening, ...pendants.filter(product => !openingChannels.includes(product.id))];
  }, [products]);
  const [selectedId, setSelectedId] = useState(openingChannels[0]);
  const [paused, setPaused] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [screenActive, setScreenActive] = useState(false);
  const channelIndex = Math.max(0, channels.findIndex(product => product.id === selectedId));
  const product = channels[channelIndex];
  const playing = channels.length > 1 && !paused && !screenActive;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setTimeout(() => {
      setSelectedId(channels[(channelIndex + 1) % channels.length].id);
    }, channelDuration);
    return () => window.clearTimeout(timer);
  }, [playing, channelIndex, channels]);

  if (!product) return null;

  function changeChannel(direction) {
    const index = (channelIndex + direction + channels.length) % channels.length;
    setSelectedId(channels[index].id);
  }

  return <div className="comic-hero-art catalog-tv" role="group" aria-label="Club TV, dijes del catálogo">
    <div className="catalog-tv-antenna" aria-hidden="true" />
    <div className="catalog-tv-cabinet">
      <div className="catalog-tv-main">
        <div className="catalog-tv-header"><strong>Club TV</strong><span>CH {String(channelIndex + 1).padStart(2, '0')}</span></div>
        <div className="catalog-tv-screen" onFocus={() => setScreenActive(true)} onBlur={() => setScreenActive(false)}>
          <TVPicture key={`${product.id}:${product.image}`} product={product} />
        </div>
        <div className="catalog-tv-caption" aria-live={paused ? 'polite' : 'off'}>
          <span title={product.title}>{product.title}</span>
          <span className="catalog-tv-count">{channelIndex + 1} / {channels.length}</span>
        </div>
      </div>
      <div className="catalog-tv-controls" aria-label="Controles de Club TV" role="group">
        <button className="catalog-tv-dial" type="button" aria-label="Dije anterior" title="Dije anterior"
          disabled={channels.length < 2} onClick={() => changeChannel(-1)}>−</button>
        <button className="catalog-tv-dial" type="button" aria-label="Dije siguiente" title="Dije siguiente"
          disabled={channels.length < 2} onClick={() => changeChannel(1)}>+</button>
        <span className="catalog-tv-speaker" aria-hidden="true" />
        <button className="catalog-tv-play" type="button" aria-label={paused ? 'Reanudar rotación' : 'Pausar rotación'}
          title={paused ? 'Reanudar rotación' : 'Pausar rotación'} disabled={channels.length < 2}
          onClick={() => setPaused(value => !value)}>{paused ? '▶' : 'Ⅱ'}</button>
        <span className="catalog-tv-light" data-playing={playing} aria-hidden="true" />
      </div>
    </div>
  </div>;
}
