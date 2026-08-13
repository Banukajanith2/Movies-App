import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import App from './App.jsx';
import PageLoad from './components/PageLoad.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // 1. Imported the AuthProvider
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

const MoviePage  = lazy(() => import('./pages/MoviePage.jsx'));
const TVPage     = lazy(() => import('./pages/TVPage.jsx'));
const MoviesPage  = lazy(() => import('./pages/MoviesPage.jsx'));
const TVShowsPage = lazy(() => import('./pages/TVShowsPage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const ErrorPage  = lazy(() => import('./pages/404-ErrorPage.jsx'));
const Login  = lazy(() => import('./pages/Login.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AuthProvider> {/* 2. Wrapped the app inside the Auth Context */}
      <ToastProvider>
        <Suspense>
          <PageLoad>
            <Routes>
              <Route path='/'           element={<App />} />
              <Route path='/movies'      element={<MoviesPage />} />
              <Route path='/tv-shows'    element={<TVShowsPage />} />
              <Route path='/movie/:slug' element={<MoviePage />} />
              <Route path='/tv/:slug'    element={<TVPage />} />
              <Route path='/search'      element={<SearchPage />} />
              <Route path='/login'      element={<Login />} />
              <Route path='/account'    element={<Account />} />
              <Route path='/404-Error'   element={<ErrorPage />} />
              <Route path='*'            element={<ErrorPage />} />
            </Routes>
          </PageLoad>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);