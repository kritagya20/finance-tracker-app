import { useState, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { ActivityScreen } from './screens/activity/ActivityScreen';
import { AnalyticsScreen } from './screens/analytics/AnalyticsScreen';
import { VaultScreen } from './screens/vault/VaultScreen';
import { AddTransactionDrawer } from './screens/logger/AddTransactionDrawer';
import { LoginScreen } from './screens/auth/LoginScreen';
import { SignupScreen } from './screens/auth/SignupScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ProfileSetupScreen } from './screens/profile/ProfileSetupScreen';
import { resetMockDatabase } from './data/data';

// Disable browser scroll restoration so page always starts at top
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

type AuthView = 'login' | 'signup' | 'forgot_password' | 'profile_setup';

export function App() {
  const {
    summary,
    transactions,
    categories,
    profile,
    hideBalances,
    toggleHideBalances,
    addTransaction,
    deleteTransaction,
    updateProfile,
    refreshData,
  } = useFinance();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('user_name') || 'User';
  });
  const [pendingSignupName, setPendingSignupName] = useState<string>('Alex Morgan');
  const [authView, setAuthView] = useState<AuthView>('login');

  // Modal / In-App Subview State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // Ensure top of page is visible immediately on initial render and on every tab/view change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, authView, isAuthenticated, isEditingProfile]);

  const handleLoginSuccess = (name = 'User') => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsAuthenticated(true);
    setUserName(name);
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('user_name', name);
    setActiveTab('home');
  };

  const handleSignupSuccess = (name = 'Alex Morgan') => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setPendingSignupName(name);
    setAuthView('profile_setup');
  };

  const handleLogout = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsAuthenticated(false);
    localStorage.removeItem('is_authenticated');
    setAuthView('login');
  };

  const handleResetData = async () => {
    resetMockDatabase();
    await refreshData();
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-50 selection:bg-violet-500 selection:text-white">
      {/* Mobile Frame Container */}
      <main className="mx-auto flex min-h-dvh max-w-[390px] flex-col px-4 pb-28 pt-4">
        {!isAuthenticated ? (
          /* Authentication & Onboarding Screen Flows */
          <>
            {authView === 'login' && (
              <LoginScreen
                onLoginSuccess={handleLoginSuccess}
                onNavigateSignup={() => setAuthView('signup')}
                onNavigateForgotPassword={() => setAuthView('forgot_password')}
              />
            )}
            {authView === 'signup' && (
              <SignupScreen
                onSignupSuccess={handleSignupSuccess}
                onNavigateLogin={() => setAuthView('login')}
              />
            )}
            {authView === 'forgot_password' && (
              <ForgotPasswordScreen
                onResetSuccess={() => handleLoginSuccess(userName)}
                onNavigateLogin={() => setAuthView('login')}
              />
            )}
            {authView === 'profile_setup' && (
              <ProfileSetupScreen
                initialName={pendingSignupName}
                onComplete={async (profileData) => {
                  await updateProfile(profileData);
                  const effectiveName = profileData.name || pendingSignupName;
                  handleLoginSuccess(effectiveName);
                }}
                onSkip={async () => {
                  await updateProfile({
                    name: pendingSignupName,
                    onboardingCompleted: true,
                  });
                  handleLoginSuccess(pendingSignupName);
                }}
              />
            )}
          </>
        ) : isEditingProfile ? (
          /* Full Profile Settings Editor */
          <ProfileSetupScreen
            initialName={profile?.name || userName}
            onComplete={async (profileData) => {
              await updateProfile(profileData);
              if (profileData.name) {
                setUserName(profileData.name);
                localStorage.setItem('user_name', profileData.name);
              }
              setIsEditingProfile(false);
            }}
            onSkip={() => setIsEditingProfile(false)}
          />
        ) : (
          /* Authenticated Application Views */
          <div className="flex flex-col gap-5">
            {/* Dynamic Screen Views (Screen-specific headers) */}
            {activeTab === 'home' && (
              <>
                <TopHeader
                  userName={profile?.name || userName}
                  hideBalances={hideBalances}
                  onToggleHideBalances={toggleHideBalances}
                  onProfileClick={() => setIsEditingProfile(true)}
                />
                <DashboardScreen
                  summary={summary}
                  transactions={transactions}
                  hideBalances={hideBalances}
                  onOpenAddModal={() => setIsAddDrawerOpen(true)}
                  onNavigate={setActiveTab}
                />
              </>
            )}

            {activeTab === 'activity' && (
              <ActivityScreen
                transactions={transactions}
                categories={categories}
                hideBalances={hideBalances}
                onDeleteTransaction={deleteTransaction}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsScreen
                summary={summary}
                transactions={transactions}
                hideBalances={hideBalances}
              />
            )}

            {activeTab === 'settings' && (
              <VaultScreen
                profile={profile}
                onEditProfile={() => setIsEditingProfile(true)}
                onResetData={handleResetData}
                onLogout={handleLogout}
              />
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation (Only visible when authenticated) */}
      {isAuthenticated && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddModal={() => setIsAddDrawerOpen(true)}
        />
      )}

      {/* Quick Add Transaction Drawer */}
      {isAuthenticated && (
        <AddTransactionDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          categories={categories}
          onSave={async (tx) => {
            await addTransaction(tx);
          }}
        />
      )}
    </div>
  );
}

export default App;
