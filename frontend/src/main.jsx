import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './AppRoutes.jsx';
import './styles/index.css';
import './styles/motion.css';
import './styles/responsive.css';
import { initReveal } from './utils/reveal.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);

// Motion foundation: observes opted-in [data-reveal] elements only.
initReveal();
