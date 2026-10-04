import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import TripPlanner from './pages/planner/TripPlanner.jsx';

import HomePage from './pages/home/HomePage.jsx';
import DestinationDetail from './pages/destination/DestinationDetail.jsx';
import NotFoundPage from './pages/notFound/NotFoundPage.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import JourneysPage from './pages/journeys/JourneysPage.jsx';
import SharedJourneyPage from './pages/journeys/SharedJourneyPage.jsx';
import AmbientField from './components/ambient/AmbientField.jsx';
import ProgressRail from './components/rail/ProgressRail.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      {/* Stage layer 1 — site-wide ambient particle field. */}
      <AmbientField />

      {/* Stage layer 2 — persistent progress rail (M10). */}
      <ProgressRail />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/destinations/:slug" element={<DestinationDetail />} />
        <Route path="/planner" element={<TripPlanner />} />

        {/* Auth (scope §47) — one page, sign-in and sign-up tabs. */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Journey library (scope §48). Reads the journeys API that was
            already complete but had no screen listing it. Its own header
            carries the way out, so the page can't dead-end. */}
        <Route path="/journeys" element={<JourneysPage />} />

        {/* A shared journey, opened by someone who has no account and no
            cookies. Kept separate from /journeys so the public, read-only
            view never inherits owner chrome. */}
        <Route path="/shared/:slug" element={<SharedJourneyPage />} />

        {/* Broken-route handling (scope §42): unknown URLs used to render
            only the stage layers — an empty page with no way back. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
