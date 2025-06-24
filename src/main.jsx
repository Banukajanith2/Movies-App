import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import App from './App.jsx';
import './index.css';

// Lazy-loaded pages
const MoviePage = lazy(() => import('./pages/MoviePage.jsx'));
const ErrorPage = lazy(() => import('./pages/404-ErrorPage.jsx'));

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Suspense >
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/movie/:slug' element={<MoviePage />} />
        <Route path='/404-Error' element={<ErrorPage />} />
        <Route path='*' element={<ErrorPage />} />
      </Routes>
    </Suspense>
  </HashRouter>
);
