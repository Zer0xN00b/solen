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
import {
  getItinerary,
  loadDestinationContent,
} from '../../data/destinationSource.js';
import {
  createSlug,
  getTravelerProfile,
  getPersonalizedSummary,
} from '../../engine/personalization.js';
import { getJourneyDailyEstimate } from '../../engine/budget.js';
import { getWeatherAwareNote, buildJourneyDays, normalizeJourney } from '../../engine/journey.js';
import { formatLiveConditions, liveConditionsLabel } from '../../engine/liveWeather.js';
import { weather as weatherApi } from '../../api/client.js';
import {
  clearSavedJourney,
  hasSavedJourney as hasAnySavedJourney,
  loadLatestJourney,
  loadJourneyById,
  saveJourney,
} from '../../api/journeyStorage.js';

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
  // Id of the API row backing the saved journey. Needed so "Remove
  // saved journey" deletes the real row rather than only the browser's
  // copy — without it, removing would leave the journey in the account.
  const [savedJourneyId, setSavedJourneyId] = useState(null);
  // True once a journey was opened by deep link from the library. While it
  // holds, the generic "Resume saved journey" button is suppressed — it would
  // load rows[0] (the newest journey), which is a *different* journey from the
  // one already on screen.
  const [openedFromLibrary, setOpenedFromLibrary] = useState(false);
  // Save is now an async round trip; without this the button would let a
  // second click fire a duplicate create before the first resolves.
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  // Live conditions for the crafted destination (scope §52). Starts null and
  // stays null when the provider is unreachable — the curated prose is
  // already on screen, so there is nothing to show until a real reading
  // arrives. Never an error state: an unreachable provider is an expected
  // outcome here, not something to apologize for on screen.
  const [liveWeather, setLiveWeather] = useState(null);
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
    // Fetch destination content from the API. This is a refresh, not a gate:
    // the source module is already serving the bundled values, so the wizard
    // is fully usable before this resolves and nothing on screen waits on it.
    loadDestinationContent();

    // Now an async check against the API (with a localStorage fallback),
    // so the flag reflects the API rather than just this browser's copy.
    // `cancelled` guards the state update: the effect re-runs when
    // searchParams changes, and a slow response from a superseded run
    // must not overwrite a newer one.
    let cancelled = false;

    hasAnySavedJourney().then((has) => {
      if (!cancelled) setHasSavedJourney(has);
    });

    const destinationParam = searchParams.get('destination');
    const experienceParam = searchParams.get('experience');
    const feelingParam = searchParams.get('feeling');

    if (destinationParam) {
      const matchingDestination = destinations.find(
        (item) => createSlug(item) === destinationParam,
      );

      if (matchingDestination) {
        // Pre-existing: these URL-preselection setters are synchronous
        // and intentional (they seed the wizard from the homepage link).
        // The saved-journey check above no longer needs a suppression —
        // it runs in a promise callback — so the directive moved here,
        // where the rule actually fires.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    return () => {
      cancelled = true;
    };
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
    const data = getItinerary()[destination];

    // No record at all, OR a record with no day blocks. The second case was
    // missed by the original check: `data` is truthy for a destination that
    // exists in the database but has an empty itinerary, so it sailed past
    // here and then crashed inside buildJourneyDays — bypassing the
    // craftError path that exists precisely to explain this situation.
    if (!data || !Array.isArray(data.days) || data.days.length === 0) {
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
      setJourney(normalizeJourney(newJourney));
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

  const flashSaveMessage = (message) => {
    setSaveMessage(message);

    setTimeout(() => {
      setSaveMessage('');
    }, 2500);
  };

  const handleSaveJourney = async () => {
    if (!journey || isSaving) return;

    setIsSaving(true);

    // The API is the source of truth; journeyStorage falls back to
    // localStorage if it's unreachable. The confirmation copy reports
    // which actually happened rather than always claiming the cloud.
    const result = await saveJourney({
      journey,
      isPremiumPlus,
      favoriteDays,
    });

    setIsSaving(false);
    setHasSavedJourney(true);
    setSavedJourneyId(result.journey?.id ?? null);

    flashSaveMessage(
      result.target === 'api' ? 'Saved to your library ✓' : 'Saved to this browser ✓',
    );
  };

  /**
   * Applies a normalized journey envelope to wizard state and jumps to the
   * result step.
   *
   * Extracted from handleResumeJourney so "resume the latest" and "resume the
   * one named in ?journey=" cannot drift apart — the earlier version had this
   * inline, which meant the new path would have been a second copy of a
   * nine-setter block waiting to diverge.
   */
  const applyJourney = (parsed) => {
    const resumed = parsed.journey;

    setJourney(normalizeJourney(resumed));
    setDestination(resumed.destination || '');
    setDuration(resumed.duration || '');
    setTravelStyle(resumed.travelStyle || '');
    setSelectedInterests(resumed.interests || []);
    setBudget(resumed.budget || 3000);
    setCurrency(resumed.currency || 'INR');
    setSelectedExperience(
      resumed.experience
        ? Object.keys(experiences).find((key) => experiences[key].name === resumed.experience.name) || ''
        : '',
    );
    setIsPremiumPlus(Boolean(parsed.isPremiumPlus));
    setFavoriteDays(Array.isArray(parsed.favoriteDays) ? parsed.favoriteDays : []);

    // Remember the row id so "Remove saved journey" deletes the API row
    // rather than only clearing this browser's copy.
    setSavedJourneyId(parsed.id ?? null);

    setStep(6);
  };

  const handleResumeJourney = async () => {
    const parsed = await loadLatestJourney();

    if (!parsed?.journey) return;

    applyJourney(parsed);
    flashSaveMessage('Welcome back to your journey ✓');
  };

  // Deep link from the journey library: /planner?journey=<id> opens one
  // specific saved journey. Needed because "resume latest" always loads
  // rows[0], so without this the library's Open button would silently open
  // the wrong journey for every row except the newest.
  //
  // Declared here rather than alongside the mount effect above because it
  // depends on `applyJourney` and `flashSaveMessage`.
  useEffect(() => {
    const journeyParam = searchParams.get('journey');
    if (!journeyParam) return undefined;

    let cancelled = false;

    loadJourneyById(journeyParam).then((parsed) => {
      if (cancelled || !parsed?.journey) return;
      applyJourney(parsed);
      flashSaveMessage('Welcome back to your journey ✓');
      setOpenedFromLibrary(true);
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Live conditions for the journey on screen (scope §52).
  //
  // Fetched per destination rather than at craft time, so opening a saved or
  // shared journey shows live conditions too. The server keys its cache on
  // coordinates, so revisiting a destination costs no upstream call.
  //
  // `cancelled` guards the same way the loaders above do: switching
  // destination mid-flight would otherwise let the slower response land last
  // and overwrite the newer journey's weather.
  useEffect(() => {
    if (!journey?.destination) return undefined;

    let cancelled = false;

    // No synchronous setState here on purpose. Clearing `liveWeather` in the
    // effect body would cascade a render on every destination change, and it
    // buys nothing: the response carries its own slug, so a reading for the
    // previous destination is recognised as stale at render time below rather
    // than being erased first.
    weatherApi
      .destination(createSlug(journey.destination))
      .then((payload) => {
        if (cancelled) return;
        setLiveWeather(payload?.weather ?? null);
      })
      // A rejected promise here means the API itself was unreachable, not
      // merely the upstream provider. Leave the curated prose standing — the
      // planner must not surface a third-party failure as a broken journey.
      .catch(() => {
        if (!cancelled) setLiveWeather(null);
      });

    return () => {
      cancelled = true;
    };
  }, [journey?.destination]);

  // Only a reading for the destination actually on screen may be shown. This
  // is what removes the need to clear state on every change, and it also stops
  // a slow response for a previous destination being displayed under a new one
  // in the moment before the `cancelled` guard fires.
  const currentWeather =
    liveWeather && journey?.destination && liveWeather.slug === createSlug(journey.destination)
      ? liveWeather
      : null;

  // Formatted once per render rather than twice inside the JSX.
  const liveConditionsText = formatLiveConditions(currentWeather);

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

    const sourceDays = getItinerary()[journey.destination]?.days || [];
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

  const handleClearSavedJourney = async () => {
    await clearSavedJourney(savedJourneyId);

    setHasSavedJourney(false);
    setSavedJourneyId(null);
    flashSaveMessage('Saved journey removed');
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

          {/* Live conditions (scope §52). Appears only once a real reading
              has arrived. When the provider is unreachable this renders
              nothing at all and the curated prose above stands on its own —
              the itinerary was never waiting on this. */}
          {liveConditionsText && (
            <div className="journey-live-weather">
              <span>{liveConditionsLabel(currentWeather)}</span>
              <p>{liveConditionsText}</p>
            </div>
          )}

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
              <button
                type="button"
                className="journey-save-button"
                onClick={handleSaveJourney}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save This Journey →'}
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

          {hasSavedJourney && !openedFromLibrary && (
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
