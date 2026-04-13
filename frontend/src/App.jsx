import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TravelDataProvider } from './contexts/TravelDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import LoginPage from './pages/LoginPage';
import RecommendationPage from './pages/RecommendationPage';
import TripsPage from './pages/TripsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TravelDataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="places/:id" element={<PlaceDetailPage />} />
              <Route path="recommendations" element={<RecommendationPage />} />
              <Route path="trips" element={<TripsPage />} />
            </Route>
          </Routes>
        </TravelDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
