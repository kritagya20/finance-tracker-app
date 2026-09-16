import { useState } from 'react';
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

type AuthView = 'login' | 'signup' | 'forgot_password';

export function App() {
  const {
    summary,
    transactions,
    categories,
    hideBalances,
    toggleHideBalances,
    addTransaction,
    deleteTransaction,
  } = useFinance();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('user_name') || 'User';
  });
  const [authView, setAuthView] = useState<AuthView>('login');

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const handleLoginSuccess = (name = 'User') => {
    setIsAuthenticated(true);
    setUserName(name);
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('user_name', name);
    setActiveTab('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_authenticated');
    setAuthView('login');
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-50 selection:bg-violet-500 selection:text-white">
      {/* Mobile Frame Container */}
      <main className="mx-auto flex min-h-dvh max-w-[390px] flex-col justify-between px-4 pb-28 pt-4">
        {!isAuthenticated ? (
          /* Authentication Screen Flows */
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
                onSignupSuccess={handleLoginSuccess}
                onNavigateLogin={() => setAuthView('login')}
              />
            )}
            {authView === 'forgot_password' && (
              <ForgotPasswordScreen
                onResetSuccess={() => handleLoginSuccess(userName)}
                onNavigateLogin={() => setAuthView('login')}
              />
            )}
          </>
        ) : (
          /* Authenticated Application Views */
          <div className="flex flex-col gap-5">
            {/* Top App Header */}
            <TopHeader
              userName={userName}
              hideBalances={hideBalances}
              onToggleHideBalances={toggleHideBalances}
            />

            {/* Dynamic Screen View */}
            {activeTab === 'home' && (
              <DashboardScreen
                summary={summary}
                transactions={transactions}
                hideBalances={hideBalances}
                onOpenAddModal={() => setIsAddDrawerOpen(true)}
                onNavigate={setActiveTab}
              />
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

            {activeTab === 'settings' && <VaultScreen onLogout={handleLogout} />}
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
