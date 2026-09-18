import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import TripPlanner from './pages/planner/TripPlanner.jsx';

import HomePage from './pages/home/HomePage.jsx';
import DestinationDetail from './pages/destination/DestinationDetail.jsx';
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
      </Routes>
    </>
  );
}

export default AppRoutes;
