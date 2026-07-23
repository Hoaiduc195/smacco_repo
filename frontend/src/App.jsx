import { lazy, Suspense } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TravelDataProvider } from './contexts/TravelDataContext';
import { ConversationProvider } from './contexts/ConversationContext';
import ProtectedRoute from './components/ProtectedRoute';
import RouteLoadingFallback from './components/RouteLoadingFallback';
import LandingPage from './pages/LandingPage';

const MainLayout = lazy(() => import('./layouts/MainLayout'));
const HomePage = lazy(() => import('./pages/HomePage'));
const PlaceDetailPage = lazy(() => import('./pages/PlaceDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <TravelDataProvider>
        <ConversationProvider>
          <Outlet />
        </ConversationProvider>
      </TravelDataProvider>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedApp />}>
              <Route path="/places/:id" element={<PlaceDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/app" element={<MainLayout />}>
                <Route index element={<HomePage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
