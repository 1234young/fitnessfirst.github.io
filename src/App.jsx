import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar          from './components/NavBar/Navbar.jsx';
import Admin           from './pages/Admin/Admin.jsx';
import Blog            from './components/Blog/Blog.jsx';
import BookingHistory  from './pages/BookingHistory/BookingHistory.jsx';
import FAQ             from './components/FAQ/FAQ.jsx';
import Hero            from './components/Hero/Hero.jsx';
import Stats           from './components/Stats/Stats.jsx';
import Program         from './components/Programs/Program.jsx';
import Main            from './components/Main/Main.jsx';
import WelcomeMarquee  from './components/Welcome/WelcomeMarquee.jsx';
import AppPreview      from './components/AppPreview/AppPreview.jsx';
import Action          from './components/CTA/Action.jsx';
import Footer          from './components/Footer/Footer.jsx';
import LoginModal      from './pages/GetStarted/LoginModal.jsx';
import Profile         from './pages/Profile/Profile.jsx';
import RegisterModal   from './pages/GetStarted/RegisterModal.jsx';
import Pricing         from './pages/Pricing/Pricing.jsx';
import Trainers        from './pages/Trainers/Trainers.jsx';
import Contact         from './pages/Contact/Contact.jsx';
import Workout         from './pages/Workouts/Workout.jsx';
import Progress        from './pages/Progress/Progress.jsx';
import Testimonials    from './components/Testimonials/Testimonials.jsx';
import HowItWorks      from './components/HowItWorks/HowItWorks.jsx';
import NotFound        from './pages/NotFound/NotFound.jsx';
import Nutrition       from './pages/Nutrition/Nutrition.jsx';

export default function App() {

  // GLOBAL AUTH STATE
  // The function inside useState runs only once on first render.
  // !! converts the value to boolean: null → false, "{...}" → true.
  // So if 'user' exists in localStorage → isLoggedIn starts as true.
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('user');
  });

  // Controls visibility of login and register modals.
  // These are used by the Action (CTA) section buttons — Join Now / Free Trial.
  const [showLogin, setShowLogin]       = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // useLocation gives us the current URL path.
  // We use it to only render homepage sections (Stats, Programs etc.) on '/'.
  const location    = useLocation();
  const isHomePage  = location.pathname === '/';

  // Called after successful login anywhere in the app.
  // Sets global auth state to true — triggers re-render of protected routes.
  const handleLoginSuccess = () => setIsLoggedIn(true);

  // Clears both localStorage and React state on logout.
  // React state change triggers re-render — protected routes block access again.
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // Sync auth state across multiple browser tabs.
  // If user logs out in Tab A, Tab B automatically updates too.
  // The 'storage' event fires when localStorage changes in another tab.
  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(!!localStorage.getItem('user'));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  return (
    <>
      {/* Navbar receives auth state and handlers to control login/logout UI */}
      <Navbar
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Scrolling welcome banner — always visible on all pages */}
      <WelcomeMarquee />

      <Routes>
        {/* Home — Hero receives login handler to trigger after Start Training */}
        <Route path="/" element={<Hero onLoginSuccess={handleLoginSuccess} />} />

        {/* Programs — receives isLoggedIn so Explore button can check auth */}
        <Route path="/programs" element={<Program isLoggedIn={isLoggedIn} />} />
        <Route path="/training" element={<Program isLoggedIn={isLoggedIn} />} />

        <Route path="/pricing"  element={<Pricing />} />
        <Route path="/trainers" element={<Trainers onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/contact"  element={<Contact />} />

        {/* PROTECTED ROUTE — /workouts */}
        <Route
          path="/workouts"
          element={
            (isLoggedIn || !!localStorage.getItem('user'))
              ? <Workout />
              : <Navigate to="/" replace />
          }
        />

        {/* PROTECTED ROUTE — /bookings */}
        <Route
          path="/bookings"
          element={
            (isLoggedIn || !!localStorage.getItem('user'))
              ? <BookingHistory />
              : <Navigate to="/" replace />
          }
        />

        {/* PROTECTED ROUTE — /profile */}
        <Route
          path="/profile"
          element={
            (isLoggedIn || !!localStorage.getItem('user'))
              ? <Profile />
              : <Navigate to="/" replace />
          }
        />

        {/* PROTECTED ROUTE — /progress */}
        <Route
          path="/progress"
          element={
            (isLoggedIn || !!localStorage.getItem('user'))
              ? <Progress />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="/nutrition"
          element={
          (isLoggedIn || !!localStorage.getItem('user'))
          ? <Nutrition />
          : <Navigate to="/" replace />
          }
        />

        {/* PROTECTED ROUTE — /admin
            Checks login first, then checks role from localStorage user object.
            Only users with role='admin' can access this page. */}
        <Route
          path="/admin"
          element={(() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return (isLoggedIn || !!localStorage.getItem('user'))
              ? user.role === 'admin'
                ? <Admin />
                : <Navigate to="/" replace />
              : <Navigate to="/" replace />;
          })()}
        />

        {/* 404 — any unknown URL now shows the NotFound page instead of
            silently redirecting to home, which confused users about what happened */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Homepage-only sections */}
      {isHomePage && (
        <>
          <Stats />
          <HowItWorks
            isLoggedIn={isLoggedIn}
            onOpenRegister={() => setShowRegister(true)}
          />
          <Program isLoggedIn={isLoggedIn} />
          <Blog />
          <Main />
          <AppPreview />
          <Testimonials />
          <FAQ />
          <Action
            isLoggedIn={isLoggedIn}
            onOpenLogin={() => setShowLogin(true)}
            onOpenRegister={() => setShowRegister(true)}
          />
        </>
      )}

      <Footer onLogout={handleLogout} />

      {/* GLOBAL MODALS */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => {
          handleLoginSuccess();
          setShowLogin(false);
        }}
        onOpenRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onRegistered={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}
