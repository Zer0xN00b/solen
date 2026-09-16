import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SolenGlobe.css';
import { globeDestinations } from '../../data/globeDestinations.js';

function SolenGlobe() {
  const navigate = useNavigate();
  const [activeDestination, setActiveDestination] = useState(globeDestinations[0]);

  const handleDestinationClick = (destination) => {
    navigate(`/destinations/${destination.slug}`);
  };

  return (
    <section className="solen-globe-section">
      <div className="solen-globe-heading">
        <div className="solen-globe-label">
          <span>05</span>
          THE WORLD, CURATED
        </div>

        <div className="solen-globe-heading-copy">
          <h2>
            Your world,
            <br />
            <em>beautifully open.</em>
          </h2>

          <p>Seven places to begin. Countless ways to make the journey your own.</p>
        </div>
      </div>

      <div className="solen-globe-layout">
        <div className="solen-globe-stage">
          <div className="solen-globe-orbit orbit-one"></div>
          <div className="solen-globe-orbit orbit-two"></div>

          <div className="solen-globe">
            <div className="solen-globe-highlight"></div>
            <div className="solen-globe-shadow"></div>
            <div className="solen-globe-grid globe-grid-horizontal"></div>
            <div className="solen-globe-grid globe-grid-vertical"></div>

            <div className="solen-globe-destinations">
              {globeDestinations.map((destination) => {
                const isActive = activeDestination.name === destination.name;

                return (
                  <button
                    key={destination.name}
                    type="button"
                    className={`solen-globe-point ${isActive ? 'active' : ''}`}
                    style={{
                      left: `${destination.x}%`,
                      top: `${destination.y}%`,
                    }}
                    onMouseEnter={() => setActiveDestination(destination)}
                    onFocus={() => setActiveDestination(destination)}
                    onClick={() => handleDestinationClick(destination)}
                    aria-label={`Explore ${destination.name}`}
                  >
                    <span className="solen-globe-point-core"></span>
                    <span className="solen-globe-point-pulse"></span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="solen-globe-info">
          <p className="solen-globe-info-label">CURRENTLY EXPLORING</p>

          <span className="solen-globe-number">
            0{globeDestinations.findIndex((item) => item.name === activeDestination.name) + 1}
          </span>

          <h3>{activeDestination.name}</h3>

          <p className="solen-globe-region">{activeDestination.region}</p>

          <p className="solen-globe-description">{activeDestination.description}</p>

          <button
            type="button"
            className="solen-globe-explore"
            onClick={() => handleDestinationClick(activeDestination)}
          >
            Explore {activeDestination.name}
            <span>↗</span>
          </button>

          <div className="solen-globe-destination-list">
            {globeDestinations.map((destination, index) => (
              <button
                key={destination.name}
                type="button"
                className={activeDestination.name === destination.name ? 'active' : ''}
                onMouseEnter={() => setActiveDestination(destination)}
                onFocus={() => setActiveDestination(destination)}
                onClick={() => handleDestinationClick(destination)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>

                {destination.name}

                <small>→</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SolenGlobe;
