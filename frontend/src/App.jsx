import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TravelDataProvider } from './contexts/TravelDataContext';
import { ConversationProvider } from './contexts/ConversationContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TravelDataProvider>
          <ConversationProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/places/:id"
                element={
                  <ProtectedRoute>
                    <PlaceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                {/* Route for SearchPage removed since file was deleted */}
              </Route>
            </Routes>
          </ConversationProvider>
        </TravelDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
