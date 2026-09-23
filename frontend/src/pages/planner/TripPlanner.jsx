import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './TripPlanner.css';
import {
  destinations,
  durations,
  travelStyles,
  interests,
  currencies,
  experiences,
} from '../../data/plannerOptions.js';
import { itineraryData } from '../../data/destinations.js';
import {
  createSlug,
  getTravelerProfile,
  getPersonalizedSummary,
} from '../../engine/personalization.js';
import { getJourneyDailyEstimate } from '../../engine/budget.js';
import { getWeatherAwareNote, buildJourneyDays } from '../../engine/journey.js';

function TripPlanner() {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [travelStyle, setTravelStyle] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [budget, setBudget] = useState(3000);
  const [currency, setCurrency] = useState('INR');
  const [isPremiumPlus, setIsPremiumPlus] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState('');
  const [isCrafting, setIsCrafting] = useState(false);
  const [journey, setJourney] = useState(null);
  const [hasSavedJourney, setHasSavedJourney] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [favoriteDays, setFavoriteDays] = useState([]);
  const [regeneratingDay, setRegeneratingDay] = useState(null);

  // Broken-journey state (hygiene pass 5). createJourney() returns null
  // when a destination has no itinerary data, and the wizard then fell
  // through to step 6 with no step content at all — a dead end with no
  // way forward and no explanation.
  const [craftError, setCraftError] = useState('');

  // One-time mount initialization: restore the saved journey flag and apply
  // homepage URL preselection (?destination / ?experience / ?feeling).
  useEffect(() => {
    const saved = localStorage.getItem('solenSavedJourney');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasSavedJourney(Boolean(saved));

    const destinationParam = searchParams.get('destination');
    const experienceParam = searchParams.get('experience');
    const feelingParam = searchParams.get('feeling');

    if (destinationParam) {
      const matchingDestination = destinations.find(
        (item) => createSlug(item) === destinationParam,
      );

      if (matchingDestination) {
        setDestination(matchingDestination);
      }
    }

    if (experienceParam && experiences[experienceParam]) {
      setSelectedExperience(experienceParam);
    }

    const feelingMap = {
      disconnect: 'Slow & Peaceful',
      'fall-in-love': 'Luxury',
      'eat-everything': 'Food & Nightlife',
      'find-adventure': 'Adventure',
      'be-surrounded-by-nature': 'Nature',
      'live-luxuriously': 'Luxury',
      'discover-culture': 'Culture',
    };

    if (feelingParam && feelingMap[feelingParam]) {
      setTravelStyle(feelingMap[feelingParam]);
    }
  }, [searchParams]);

  const selectedCurrency = currencies.find((item) => item.code === currency);

  const handleBudgetChange = (value) => {
    const numericValue = Number(value);

    if (numericValue >= 6000) {
      setBudget(6000);
      setIsPremiumPlus(true);
    } else {
      setBudget(numericValue);
      setIsPremiumPlus(false);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const createJourney = () => {
    const data = itineraryData[destination];

    if (!data) {
      return null;
    }

    const feelingParam = searchParams.get('feeling');
    const travelerProfile = getTravelerProfile(
      travelStyle,
      selectedInterests,
      selectedExperience,
      feelingParam,
    );

    const personalizedSummary = getPersonalizedSummary(
      destination,
      travelStyle,
      selectedInterests,
      selectedExperience,
      feelingParam,
    );

    const personalizedDays = buildJourneyDays(
      data.days,
      duration,
      travelStyle,
      selectedInterests,
      destination,
      budget,
      selectedExperience,
      isPremiumPlus,
      data.weather,
    );

    return {
      destination,
      duration,
      budget,
      currency,
      isPremiumPlus,
      travelStyle,
      interests: selectedInterests,
      feeling: feelingParam || '',
      travelerProfile,
      personalizedSummary,
      experience: selectedExperience ? experiences[selectedExperience] : null,
      accommodation: isPremiumPlus ? data.accommodation.premium : data.accommodation.standard,
      dining: isPremiumPlus ? data.dining.premium : data.dining.standard,
      weather: data.weather,
      weatherNote: getWeatherAwareNote(data.weather, personalizedDays[0]),
      image: data.image,
      days: personalizedDays,
    };
  };

  // Single place where a crafted journey either lands or explains itself.
  // Used by both the initial craft and "Regenerate Journey" so a missing
  // itinerary can never leave the wizard in a wordless dead end.
  const craftJourneyOrFail = () => {
    const newJourney = createJourney();

    if (!newJourney) {
      setCraftError(
        'This destination doesn’t have itinerary data yet. Choose another place and we’ll craft the journey around it.',
      );
    } else {
      setJourney(newJourney);
    }

    setIsCrafting(false);
  };

  const handleCraftJourney = () => {
    if (!destination || !duration || !travelStyle || selectedInterests.length === 0) {
      return;
    }

    setCraftError('');
    setStep(6);
    setIsCrafting(true);

    setTimeout(craftJourneyOrFail, 2400);
  };

  const handleSaveJourney = () => {
    if (!journey) return;

    localStorage.setItem(
      'solenSavedJourney',
      JSON.stringify({
        journey,
        isPremiumPlus,
        favoriteDays,
      }),
    );

    setHasSavedJourney(true);
    setSaveMessage('Saved to this browser ✓');

    setTimeout(() => {
      setSaveMessage('');
    }, 2500);
  };

  const handleResumeJourney = () => {
    const saved = localStorage.getItem('solenSavedJourney');

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (parsed.journey) {
        setJourney(parsed.journey);
        setDestination(parsed.journey.destination || '');
        setDuration(parsed.journey.duration || '');
        setTravelStyle(parsed.journey.travelStyle || '');
        setSelectedInterests(parsed.journey.interests || []);
        setBudget(parsed.journey.budget || 3000);
        setCurrency(parsed.journey.currency || 'INR');
        setSelectedExperience(
          parsed.journey.experience
            ? Object.keys(experiences).find(
                (key) => experiences[key].name === parsed.journey.experience.name,
              ) || ''
            : '',
        );
        setIsPremiumPlus(Boolean(parsed.isPremiumPlus));
        setFavoriteDays(Array.isArray(parsed.favoriteDays) ? parsed.favoriteDays : []);
        setStep(6);
        setSaveMessage('Welcome back to your journey ✓');

        setTimeout(() => {
          setSaveMessage('');
        }, 2500);
      }
    } catch {
      localStorage.removeItem('solenSavedJourney');
      setHasSavedJourney(false);
    }
  };

  const handleCopyJourney = async () => {
    if (!journey) return;

    const summary = [
      `SOLEN — ${journey.destination}`,
      `${journey.duration} days · ${journey.travelStyle}`,
      journey.experience ? `Experience: ${journey.experience.name}` : '',
      `Stay: ${journey.accommodation}`,
      `Dining: ${journey.dining}`,
      `Weather: ${journey.weather}`,
      '',
      'Itinerary:',
      ...journey.days.map(
        (day, index) => `Day ${index + 1}: ${day.title} — ${day.activities.join(', ')}`,
      ),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopyMessage('Copied to clipboard ✓');

      setTimeout(() => {
        setCopyMessage('');
      }, 2500);
    } catch {
      setCopyMessage('Copy failed — please try again');
    }
  };

  const handlePrintJourney = () => {
    window.print();
  };

  const toggleFavoriteDay = (dayIndex) => {
    setFavoriteDays((current) =>
      current.includes(dayIndex)
        ? current.filter((item) => item !== dayIndex)
        : [...current, dayIndex],
    );
  };

  const getTotalTripEstimate = () => {
    if (!journey) return 0;

    return (
      journey.days.reduce((total, day) => total + day.budget, 0) * (selectedCurrency?.rate || 1)
    );
  };

  const getBudgetBreakdown = () => {
    const total = getTotalTripEstimate();

    return {
      stay: total * 0.42,
      dining: total * 0.2,
      experiences: total * 0.18,
      transport: total * 0.12,
      buffer: total * 0.08,
    };
  };

  const handleShareJourney = async () => {
    if (!journey) return;

    const shareText = [
      `SOLEN — ${journey.destination}`,
      `${journey.duration} days · ${journey.travelStyle}`,
      journey.experience ? `Experience: ${journey.experience.name}` : '',
      `Stay: ${journey.accommodation}`,
      `Dining: ${journey.dining}`,
      `Estimated trip spend: ${selectedCurrency?.symbol || '₹'}${Math.round(
        getTotalTripEstimate(),
      ).toLocaleString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: `SOLEN — ${journey.destination}`,
          text: shareText,
        });
        setShareMessage('Journey shared ✓');
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareMessage('Share details copied ✓');
      }

      setTimeout(() => {
        setShareMessage('');
      }, 2500);
    } catch {
      setShareMessage('Share cancelled');

      setTimeout(() => {
        setShareMessage('');
      }, 2500);
    }
  };

  const handleEditJourney = () => {
    setJourney(null);
    setCraftError('');
    setFavoriteDays([]);
    setStep(1);
    setIsCrafting(false);
    setSaveMessage('');
    setCopyMessage('');
  };

  const handleRegenerateJourney = () => {
    if (!destination || !duration || !travelStyle || selectedInterests.length === 0) {
      return;
    }

    setJourney(null);
    setStep(6);
    setIsCrafting(true);

    setTimeout(craftJourneyOrFail, 1800);
  };

  const handleRegenerateDay = (dayIndex) => {
    if (!journey || regeneratingDay !== null) return;

    const sourceDays = itineraryData[journey.destination]?.days || [];
    if (sourceDays.length === 0) return;

    setRegeneratingDay(dayIndex);

    window.setTimeout(() => {
      setJourney((currentJourney) => {
        if (!currentJourney) return currentJourney;

        const usedTitles = new Set(
          currentJourney.days
            .filter((_, index) => index !== dayIndex)
            .map((day) => day.title.replace(' · A Deeper Day', '')),
        );

        const replacementSource =
          sourceDays.find(
            (day) =>
              !usedTitles.has(day.title) && day.title !== currentJourney.days[dayIndex].title,
          ) || sourceDays[(dayIndex + 1) % sourceDays.length];

        const replacement = {
          ...replacementSource,
          title: replacementSource.title,
          activities: [...replacementSource.activities],
        };

        replacement.budget = getJourneyDailyEstimate(
          currentJourney.budget,
          currentJourney.destination,
          currentJourney.travelStyle,
          currentJourney.interests,
          currentJourney.experience
            ? Object.keys(experiences).find(
                (key) => experiences[key].name === currentJourney.experience.name,
              )
            : '',
          currentJourney.isPremiumPlus,
          dayIndex,
        );
        replacement.weatherNote = getWeatherAwareNote(currentJourney.weather, replacement);

        const nextDays = [...currentJourney.days];
        nextDays[dayIndex] = replacement;

        return { ...currentJourney, days: nextDays };
      });

      setFavoriteDays((current) => current.filter((index) => index !== dayIndex));
      setRegeneratingDay(null);
    }, 650);
  };

  const handleClearSavedJourney = () => {
    localStorage.removeItem('solenSavedJourney');
    setHasSavedJourney(false);
    setSaveMessage('Saved journey removed');

    setTimeout(() => {
      setSaveMessage('');
    }, 2500);
  };

  const handleStartOver = () => {
    setStep(1);
    setCraftError('');
    setFavoriteDays([]);
    setDestination('');
    setDuration('');
    setTravelStyle('');
    setSelectedInterests([]);
    setBudget(3000);
    setCurrency('INR');
    setIsPremiumPlus(false);
    setSelectedExperience('');
    setJourney(null);
    setIsCrafting(false);
  };

  const formatBudget = (amount) => {
    const convertedAmount = amount * (selectedCurrency?.rate || 1);

    return `${selectedCurrency?.symbol || '₹'}${Math.round(convertedAmount).toLocaleString()}`;
  };

  if (isCrafting) {
    return (
      <main className="planner-page">
        <section className="planner-crafting">
          <p className="planner-eyebrow">SOLEN</p>

          <h1>Crafting your journey...</h1>

          <p>We&apos;re weaving together places, experiences, stays, and moments just for you.</p>

          <div className="planner-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </section>
      </main>
    );
  }

  // Broken-journey screen (hygiene pass 5). Reuses the crafting screen's
  // styles, so it adds an explanation and a way out — not new chrome.
  if (craftError) {
    return (
      <main className="planner-page">
        <section className="planner-crafting">
          <p className="planner-eyebrow">SOMETHING WENT WRONG</p>

          <h1>We couldn&apos;t craft that journey.</h1>

          <p>{craftError}</p>

          <div className="planner-recovery">
            <button
              type="button"
              className="planner-continue"
              onClick={() => {
                setCraftError('');
                setStep(1);
              }}
            >
              Choose another destination →
            </button>

            <Link to="/" className="planner-back">
              Back to SOLEN
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (journey) {
    return (
      <main className="planner-page">
        <section className="journey-results">
          <div className="journey-header">
            <p className="planner-eyebrow">YOUR JOURNEY</p>

            <h1>{journey.destination}</h1>

            <p>
              {journey.duration} days · {journey.travelStyle}
            </p>

            {journey.experience && (
              <div className="journey-experience">
                <span>YOUR EXPERIENCE</span>
                <strong>{journey.experience.name}</strong>
                <p>{journey.experience.description}</p>
              </div>
            )}

            {journey.travelerProfile && (
              <div className="journey-personality">
                <span>YOUR TRAVEL PERSONALITY</span>
                <strong>{journey.travelerProfile.name}</strong>
                <p>{journey.travelerProfile.description}</p>
              </div>
            )}
          </div>

          <img className="journey-hero-image" src={journey.image} alt={journey.destination} />

          <div className="journey-overview">
            <div className="journey-overview-item">
              <span>STAY</span>
              <strong>{journey.accommodation}</strong>
            </div>

            <div className="journey-overview-item">
              <span>DINING</span>
              <strong>{journey.dining}</strong>
            </div>

            <div className="journey-overview-item">
              <span>WEATHER</span>
              <strong>{journey.weather}</strong>
            </div>
          </div>

          <div className="journey-weather-note">
            <span>WEATHER-AWARE PLANNING</span>
            <p>{journey.weatherNote}</p>
          </div>

          {journey.personalizedSummary && (
            <div className="journey-personalized-summary">
              <span>WHY SOLEN CHOSE THIS</span>
              <p>{journey.personalizedSummary}</p>
            </div>
          )}

          <div className="journey-preferences">
            <span>CRAFTED AROUND YOU</span>
            <strong>{journey.travelStyle}</strong>
            <p>
              {journey.interests && journey.interests.length > 0
                ? `Your journey leans into ${journey.interests.join(', ')}.`
                : 'Your journey is shaped around the way you want to travel.'}
            </p>
            <div className="journey-total-estimate">
              <span>ESTIMATED TRIP SPEND</span>
              <strong>
                {selectedCurrency?.symbol || '₹'}
                {Math.round(getTotalTripEstimate()).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="journey-budget-breakdown">
            <div className="journey-budget-breakdown-heading">
              <span>WHERE YOUR ESTIMATE GOES</span>
              <strong>A considered spend, not a guess.</strong>
            </div>

            <div className="journey-budget-grid">
              {Object.entries(getBudgetBreakdown()).map(([category, amount]) => (
                <div className="journey-budget-item" key={category}>
                  <span>{category}</span>
                  <strong>
                    {selectedCurrency?.symbol || '₹'}
                    {Math.round(amount).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {isPremiumPlus && (
            <div className="journey-premium-note">
              <span>6000+</span>

              <div>
                <strong>Your journey, elevated.</strong>
                <p>
                  Your premium budget unlocks upgraded accommodation, elevated dining, and a more
                  indulgent daily experience.
                </p>
              </div>
            </div>
          )}

          <section className="journey-itinerary">
            <div className="journey-itinerary-heading">
              <p className="planner-eyebrow">THE ITINERARY</p>

              <h2>Your days, thoughtfully planned.</h2>
            </div>

            <div className="journey-days">
              {journey.days.map((day, index) => {
                const convertedDailyBudget = day.budget * (selectedCurrency?.rate || 1);

                return (
                  <article
                    className={`journey-day ${favoriteDays.includes(index) ? 'is-favorite' : ''}`}
                    key={`${day.title}-${index}`}
                  >
                    <div className="journey-day-number">{String(index + 1).padStart(2, '0')}</div>

                    <div className="journey-day-content">
                      <div className="journey-day-topline">
                        <p className="journey-day-label">DAY {index + 1}</p>

                        <button
                          type="button"
                          className="journey-favorite-button"
                          onClick={() => toggleFavoriteDay(index)}
                          aria-label={
                            favoriteDays.includes(index)
                              ? `Remove Day ${index + 1} from favorites`
                              : `Save Day ${index + 1} as a favorite`
                          }
                        >
                          {favoriteDays.includes(index) ? '♥' : '♡'}
                        </button>
                      </div>

                      <h3>{day.title}</h3>

                      <p>{day.description}</p>

                      <ul>
                        {day.activities.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ul>

                      {day.weatherNote && (
                        <div className="journey-day-weather">
                          <span>WEATHER NOTE</span>
                          <p>{day.weatherNote}</p>
                        </div>
                      )}

                      <div className="journey-day-meta">
                        <span>EST. DAILY SPEND</span>

                        <strong>
                          {selectedCurrency?.symbol || '₹'}
                          {Math.round(convertedDailyBudget).toLocaleString()}
                        </strong>

                        <button
                          type="button"
                          className="journey-day-regenerate"
                          onClick={() => handleRegenerateDay(index)}
                          disabled={regeneratingDay === index}
                        >
                          {regeneratingDay === index ? 'Refreshing…' : 'Refresh day ↻'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="journey-map-section">
            <p className="planner-eyebrow">THE ROUTE</p>

            <h2>Your journey at a glance.</h2>

            <p className="journey-route-intro">
              Follow the rhythm of your trip, one day at a time.
            </p>

            <div className="journey-route">
              <div className="journey-route-line" aria-hidden="true"></div>

              {journey.days.map((day, index) => {
                const isFavorite = favoriteDays.includes(index);

                return (
                  <button
                    type="button"
                    className={`journey-route-stop ${isFavorite ? 'is-favorite' : ''}`}
                    key={`${day.title}-route-${index}`}
                    onClick={() => toggleFavoriteDay(index)}
                    aria-label={`Day ${index + 1}: ${day.title}. ${
                      isFavorite ? 'Remove from favorites' : 'Save as favorite'
                    }`}
                  >
                    <span className="journey-route-marker">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="journey-route-copy">
                      <span className="journey-route-day">DAY {index + 1}</span>
                      <strong>{day.title}</strong>
                      <small>{day.activities[0]}</small>
                    </span>

                    <span className="journey-route-heart" aria-hidden="true">
                      {isFavorite ? '♥' : '♡'}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="journey-route-note">Tap a day to save it as a favourite.</p>
          </section>

          <div className="journey-actions">
            <div className="journey-action-left">
              <button type="button" className="journey-save-button" onClick={handleSaveJourney}>
                Save This Journey →
              </button>

              <button
                type="button"
                className="journey-secondary-button"
                onClick={handleCopyJourney}
              >
                Copy Itinerary
              </button>

              <button
                type="button"
                className="journey-secondary-button"
                onClick={handlePrintJourney}
              >
                Print / PDF
              </button>

              <button
                type="button"
                className="journey-secondary-button"
                onClick={handleShareJourney}
              >
                Share Journey
              </button>

              <button
                type="button"
                className="journey-secondary-button"
                onClick={handleRegenerateJourney}
              >
                Regenerate Journey
              </button>

              <button
                type="button"
                className="journey-secondary-button"
                onClick={handleEditJourney}
              >
                Edit Preferences
              </button>

              {(saveMessage || copyMessage || shareMessage) && (
                <span className="journey-action-message">
                  {saveMessage || copyMessage || shareMessage}
                </span>
              )}
            </div>

            <button type="button" className="journey-start-over" onClick={handleStartOver}>
              Start Over
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="planner-page">
      <section className="planner-hero">
        <p className="planner-eyebrow">THE SOLEN PLANNER</p>

        <h1>Where are you dreaming of going?</h1>

        <p>Tell us a little about the journey you imagine. We&apos;ll take care of the details.</p>
      </section>

      <section className="planner-container">
        <div className="planner-progress">
          <div className="planner-progress-label">
            <span>YOUR JOURNEY</span>
            <strong>{Math.min(step, 5)} / 5</strong>
          </div>

          <div className="planner-progress-track">
            {[1, 2, 3, 4, 5].map((item) => (
              <span key={item} className={item <= step ? 'active' : ''} />
            ))}
          </div>

          {hasSavedJourney && (
            <>
              <button type="button" className="planner-resume" onClick={handleResumeJourney}>
                Resume saved journey →
              </button>

              <button
                type="button"
                className="planner-clear-saved"
                onClick={handleClearSavedJourney}
              >
                Remove saved journey
              </button>
            </>
          )}
        </div>

        {step === 1 && (
          <div className="planner-step">
            <p className="planner-step-number">01</p>

            <h2>Choose your destination</h2>

            <p className="planner-step-copy">Where are you dreaming of going?</p>

            <div className="planner-destinations">
              {destinations.map((place) => {
                const isSelected = destination === place;

                return (
                  <button
                    key={place}
                    type="button"
                    className={`planner-destination-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setDestination(place)}
                  >
                    <span>{place}</span>
                    <span>→</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="planner-continue"
              disabled={!destination}
              onClick={() => setStep(2)}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="planner-step">
            <p className="planner-step-number">02</p>

            <h2>How long will you disappear?</h2>

            <p className="planner-step-copy">Choose the rhythm that feels right.</p>

            <div className="planner-durations">
              {durations.map((option) => {
                const isSelected = duration === option;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`planner-duration-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setDuration(option)}
                  >
                    <span>{option}</span>
                    <small>{option === '14+' ? 'days' : option === '1' ? 'day' : 'days'}</small>
                  </button>
                );
              })}
            </div>

            <div className="planner-navigation">
              <button type="button" className="planner-back" onClick={() => setStep(1)}>
                ← Back
              </button>

              <button
                type="button"
                className="planner-continue"
                disabled={!duration}
                onClick={() => setStep(3)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="planner-step">
            <p className="planner-step-number">03</p>

            <h2>What should your journey feel like?</h2>

            <p className="planner-step-copy">Choose the travel style that feels most like you.</p>

            <div className="planner-durations">
              {travelStyles.map((option) => {
                const isSelected = travelStyle === option;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`planner-duration-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setTravelStyle(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="planner-navigation">
              <button type="button" className="planner-back" onClick={() => setStep(2)}>
                ← Back
              </button>

              <button
                type="button"
                className="planner-continue"
                disabled={!travelStyle}
                onClick={() => setStep(4)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="planner-step">
            <p className="planner-step-number">04</p>

            <h2>What are you drawn to?</h2>

            <p className="planner-step-copy">Choose as many interests as you like.</p>

            <div className="planner-interests">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    className={`planner-interest-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    <span>{interest}</span>
                    <span>{isSelected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            <div className="planner-navigation">
              <button type="button" className="planner-back" onClick={() => setStep(3)}>
                ← Back
              </button>

              <button
                type="button"
                className="planner-continue"
                disabled={selectedInterests.length === 0}
                onClick={() => setStep(5)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="planner-step">
            <p className="planner-step-number">05</p>

            <h2>What would you like to spend?</h2>

            <p className="planner-step-copy">
              Set the budget that feels comfortable for your journey.
            </p>

            <div className="planner-budget-top">
              <strong>
                {isPremiumPlus ? `${selectedCurrency.symbol}6,000+` : formatBudget(budget)}
              </strong>

              <span>{currency}</span>
            </div>

            <input
              type="range"
              min="1000"
              max="6000"
              step="500"
              value={budget}
              onChange={(event) => handleBudgetChange(event.target.value)}
              className="planner-budget-slider"
            />

            <div className="planner-budget-labels">
              <span>{selectedCurrency.symbol}1,000</span>

              <span>{selectedCurrency.symbol}6,000+</span>
            </div>

            <button
              type="button"
              className={`planner-premium-option ${isPremiumPlus ? 'selected' : ''}`}
              onClick={() => {
                setIsPremiumPlus(true);
                setBudget(6000);
              }}
            >
              <div>
                <strong>6,000+</strong>
                <span>Go all out</span>
              </div>

              <span>{isPremiumPlus ? '✓' : '+'}</span>
            </button>

            <div className="planner-currency">
              <label htmlFor="planner-currency">Currency</label>

              <select
                id="planner-currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {currencies.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="planner-navigation">
              <button type="button" className="planner-back" onClick={() => setStep(4)}>
                ← Back
              </button>

              <button type="button" className="planner-continue" onClick={handleCraftJourney}>
                Craft My Journey →
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default TripPlanner;
