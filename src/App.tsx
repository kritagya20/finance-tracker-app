import { useState, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
import { useNotifications } from './hooks/useNotifications';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { ActivityScreen } from './screens/activity/ActivityScreen';
import { AnalyticsScreen } from './screens/analytics/AnalyticsScreen';
import { NotificationScreen } from './screens/notifications/NotificationScreen';
import { AddTransactionDrawer } from './screens/logger/AddTransactionDrawer';
import { LoginScreen } from './screens/auth/LoginScreen';
import { SignupScreen } from './screens/auth/SignupScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { CategoryListScreen } from './screens/profile/CategoryListScreen';
import { PaymentAccountsScreen } from './screens/profile/PaymentAccountsScreen';
import { ProfileSetupScreen } from './screens/profile/ProfileSetupScreen';
import { CurrencySettingsScreen } from './screens/profile/CurrencySettingsScreen';
import { BackupScreen } from './screens/profile/BackupScreen';
import { resetMockDatabase } from './data/data';
import { Transaction } from './domain/models/types';

// Disable browser scroll restoration so page always starts at top
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

type AuthView = 'login' | 'signup' | 'forgot_password' | 'profile_setup';
type SubViewMode = 'none' | 'categories' | 'accounts' | 'setup' | 'currency' | 'backup';


export function App() {
  const {
    summary,
    transactions,
    accounts,
    categories,
    budgets,
    profile,
    hideBalances,
    toggleHideBalances,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    setCategoryBudget,
    updateProfile,
    refreshData,
  } = useFinance();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notifyTransactionCreated,
  } = useNotifications();

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
  const [subView, setSubView] = useState<SubViewMode>('none');
  const [isViewingNotifications, setIsViewingNotifications] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedTxForInspect, setSelectedTxForInspect] = useState<Transaction | null>(null);

  const handleSelectTransactionFromHome = (tx: Transaction) => {
    setSelectedTxForInspect(tx);
    setActiveTab('activity');
  };

  // Ensure top of page is visible immediately on initial render and on every tab/view change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, authView, isAuthenticated, subView, isViewingNotifications]);

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
    setIsViewingNotifications(false);
    setSubView('none');
    localStorage.removeItem('is_authenticated');
    setAuthView('login');
  };

  const handleResetData = async () => {
    resetMockDatabase();
    await refreshData();
  };

  return (
    <div className="min-h-dvh bg-theme-app text-theme-primary selection:bg-violet-500 selection:text-white transition-colors">
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
        ) : isViewingNotifications ? (
          /* Full Notification Screen View */
          <NotificationScreen
            notifications={notifications}
            unreadCount={unreadCount}
            onBack={() => setIsViewingNotifications(false)}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDeleteNotification={deleteNotification}
            onClearAll={clearAll}
            onNavigateToActivity={(transactionId) => {
              setIsViewingNotifications(false);
              if (transactionId) {
                const target = transactions.find((t) => t.id === transactionId);
                if (target) {
                  setSelectedTxForInspect(target);
                }
              }
              setActiveTab('activity');
            }}
            onSimulateSms={async (txData, rawSms) => {
              const created = await addTransaction(txData);
              notifyTransactionCreated(created, rawSms);
            }}
          />
        ) : subView === 'categories' ? (
          /* Manage & Add Categories Screen */
          <CategoryListScreen
            categories={categories}
            budgets={budgets}
            onBack={() => setSubView('none')}
            onAddCategory={async (cat, limitAmount) => {
              const created = await addCategory(cat);
              if (limitAmount) {
                await setCategoryBudget(created.id, limitAmount);
              }
            }}
            onUpdateCategory={async (id, updates, limitAmount) => {
              if (Object.keys(updates).length > 0) {
                await updateCategory(id, updates);
              }
              if (limitAmount !== undefined) {
                await setCategoryBudget(id, limitAmount);
              }
            }}
            onDeleteCategory={async (id) => {
              await deleteCategory(id);
            }}
          />
        ) : subView === 'accounts' ? (
          /* Manage & Add Payment Accounts Screen */
          <PaymentAccountsScreen
            accounts={accounts}
            onBack={() => setSubView('none')}
            onAddAccount={async (acc) => {
              await addAccount(acc);
            }}
            onDeleteAccount={async (id) => {
              await deleteAccount(id);
            }}
          />
        ) : subView === 'setup' ? (
          /* Full Profile Settings Editor */
          <ProfileSetupScreen
            initialName={profile?.name || userName}
            onComplete={async (profileData) => {
              await updateProfile(profileData);
              if (profileData.name) {
                setUserName(profileData.name);
                localStorage.setItem('user_name', profileData.name);
              }
              setSubView('none');
            }}
            onSkip={() => setSubView('none')}
          />
        ) : subView === 'currency' ? (
          /* Currency & Numbering Settings Screen */
          <CurrencySettingsScreen
            onBack={() => setSubView('none')}
          />
        ) : subView === 'backup' ? (
          /* Cloud Backup & Zero-Knowledge Vault Screen */
          <BackupScreen
            onBack={() => setSubView('none')}
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            profile={profile}
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
                  onProfileClick={() => setActiveTab('profile')}
                  onNotificationsClick={() => setIsViewingNotifications(true)}
                  unreadCount={unreadCount}
                />
                <DashboardScreen
                  summary={summary}
                  transactions={transactions}
                  hideBalances={hideBalances}
                  onOpenAddModal={() => setIsAddDrawerOpen(true)}
                  onNavigate={setActiveTab}
                  onSelectTransaction={handleSelectTransactionFromHome}
                />
              </>
            )}

            {activeTab === 'activity' && (
              <ActivityScreen
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                hideBalances={hideBalances}
                onDeleteTransaction={deleteTransaction}
                onUpdateTransaction={updateTransaction}
                initialInspectingTransaction={selectedTxForInspect}
                onClearInitialInspecting={() => setSelectedTxForInspect(null)}
                onOpenAddModal={() => setIsAddDrawerOpen(true)}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsScreen
                summary={summary}
                transactions={transactions}
                categories={categories}
                budgets={budgets}
                hideBalances={hideBalances}
                onOpenAddModal={() => setIsAddDrawerOpen(true)}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectTransaction={handleSelectTransactionFromHome}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                profile={profile}
                accounts={accounts}
                categories={categories}
                hideBalances={hideBalances}
                onToggleHideBalances={toggleHideBalances}
                onUpdateProfile={async (updates) => {
                  const updated = await updateProfile(updates);
                  if (updates.name) {
                    setUserName(updates.name);
                    localStorage.setItem('user_name', updates.name);
                  }
                  return updated;
                }}
                onResetData={handleResetData}
                onLogout={handleLogout}
                onNavigateToCategories={() => setSubView('categories')}
                onNavigateToAccounts={() => setSubView('accounts')}
                onNavigateToSetup={() => setSubView('setup')}
                onNavigateToCurrency={() => setSubView('currency')}
                onNavigateToBackup={() => setSubView('backup')}
              />
            )}
          </div>
        )}

      </main>

      {/* Fixed Bottom Navigation (Only visible when authenticated and not inside subviews) */}
      {isAuthenticated && !isViewingNotifications && subView === 'none' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setIsViewingNotifications(false);
            setSubView('none');
            setActiveTab(tab);
          }}
          onOpenAddModal={() => setIsAddDrawerOpen(true)}
        />
      )}

      {/* Quick Add Transaction Drawer */}
      {isAuthenticated && (
        <AddTransactionDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          categories={categories}
          accounts={accounts}
          onSave={async (tx) => {
            const created = await addTransaction(tx);
            if (tx.source === 'AUTO_SMS') {
              notifyTransactionCreated(created, tx.rawSmsText);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
