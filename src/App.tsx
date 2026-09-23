import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ContinuousGameProvider } from './context/ContinuousGameContext';
import { HomeLobby } from './components/HomeLobby';
import { WingoGame } from './components/WingoGame';
import { AviatorGame } from './components/AviatorGame';
import { PromotionView } from './components/PromotionView';
import { AccountView } from './components/AccountView';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { AdminSpecialPage } from './components/AdminSpecialPage';
import { LoginFirstGateway } from './components/LoginFirstGateway';
import { RegistrationBonusModal } from './components/RegistrationBonusModal';
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { BetResultPopup } from './components/BetResultPopup';
import { TabTransitionSkeleton } from './components/TabTransitionSkeleton';
import { FloatingSupportButton } from './components/FloatingSupportButton';
import { CustomerSupportModal } from './components/CustomerSupportModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { useAndroidInstallPrompt } from './hooks/useAndroidInstallPrompt';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { triggerHaptic } from './utils/haptics';
import { playTabSound } from './utils/audio';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Home, 
  Gamepad2, 
  Share2, 
  Wallet, 
  User as UserIcon,
  Crown,
  Bell,
  Download
} from 'lucide-react';

function AppContent() {
  const { 
    user, 
    profile, 
    isAdmin, 
    loading, 
    isNewRegistration, 
    dismissNewRegistrationModal, 
    pendingRequestsCount, 
    logout,
    betNotification,
    dismissBetNotification
  } = useAuth();

  // Navigation: 'home' | 'wingo' | 'aviator' | 'promotion' | 'wallet' | 'account' | 'admin'
  const [currentTab, setCurrentTab] = useState<'home' | 'wingo' | 'aviator' | 'promotion' | 'wallet' | 'account' | 'admin'>('home');
  const [isTabTransitioning, setIsTabTransitioning] = useState<boolean>(false);
  const [displaySkeletonTab, setDisplaySkeletonTab] = useState<'home' | 'wingo' | 'aviator' | 'promotion' | 'wallet' | 'account' | 'admin'>('home');
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [adminConsoleOpen, setAdminConsoleOpen] = useState<boolean>(false);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [walletDefaultTab, setWalletDefaultTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Android Native Install / PWA prompt hook
  const {
    isInstallable,
    isInstalled,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = useAndroidInstallPrompt();

  // Auto-logout timer: 15-minute timeout with 60s warning modal
  const {
    isWarningOpen,
    secondsRemaining,
    resetInactivity,
    simulateWarning,
    performAutoLogout,
  } = useInactivityTimer({
    isEnabled: Boolean(user),
    onLogout: logout,
    timeoutMs: 15 * 60 * 1000,
    warningThresholdMs: 14 * 60 * 1000,
  });

  // Clean up any pending transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const openWallet = (tab: 'deposit' | 'withdraw' = 'deposit') => {
    triggerHaptic('light');
    setWalletDefaultTab(tab);
    setWalletModalOpen(true);
  };

  const handleSwitchTab = (tab: 'home' | 'wingo' | 'aviator' | 'promotion' | 'wallet' | 'account' | 'admin') => {
    if (tab === currentTab && !isTabTransitioning) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    triggerHaptic(tab === 'promotion' ? 'medium' : 'selection');
    playTabSound();

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    // Activate transition skeleton period to prevent UI layout shift and jank
    setDisplaySkeletonTab(tab);
    setIsTabTransitioning(true);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });

    transitionTimerRef.current = setTimeout(() => {
      setIsTabTransitioning(false);
    }, 240);
  };

  // 1. Loading splash state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center font-sans p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-red-500/30 animate-pulse">
            WX
          </div>
          <div>
            <div className="text-xl font-black tracking-wider text-white flex items-center justify-center gap-1.5 leading-none">
              <span>WinXbet</span>
              <span className="text-amber-400 text-xs px-2 py-0.5 bg-amber-400/10 rounded-md border border-amber-400/30 font-extrabold">
                VIP
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Authenticating VIP Gaming Session...</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-400/80 font-medium">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Securing encrypted connection...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. User must login first then view the sites
  if (!user) {
    return <LoginFirstGateway />;
  }

  // 3. Authenticated site view
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Mobile-First Layout Container */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-gray-950 shadow-2xl relative main-content-safe">
        
        {/* WinXbet Header */}
        <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 px-4 py-3 pt-safe flex items-center justify-between">
          <div 
            onClick={() => handleSwitchTab('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-base tracking-tighter shadow-md shadow-red-500/30">
              WX
            </div>
            <div>
              <div className="text-base font-black text-white tracking-wider flex items-center gap-1 leading-none">
                <span>WinXbet</span>
                <span className="text-amber-400 text-xs px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
                  VIP
                </span>
                {isAdmin && (
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      setAdminConsoleOpen(true);
                    }}
                    className="text-amber-300 text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-red-500/20 rounded border border-amber-500/40 font-black cursor-pointer flex items-center gap-1 shadow-sm hover:border-amber-400 transition"
                    title="Open Platform Admin Console"
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>ADMIN</span>
                    {pendingRequestsCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    )}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-medium tracking-wide">
                Fair Lottery &amp; Prediction
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                id="header-admin-hub-btn"
                onClick={() => {
                  triggerHaptic('heavy');
                  handleSwitchTab('admin');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition ${
                  currentTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md shadow-amber-500/30'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300'
                }`}
                title="Super Admin Special Center & Support Queries"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Hub</span>
              </button>
            )}

            <button
              id="header-wallet-btn"
              onClick={() => openWallet('deposit')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-xl hover:bg-amber-500/30 transition"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black text-amber-300">
                ₹{profile ? profile.balance.toFixed(2) : '68.00'}
              </span>
            </button>

            <button
              id="header-download-app-btn"
              onClick={() => {
                triggerHaptic('medium');
                triggerInstall();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition relative"
              title="Install WinXbet VIP App on Android"
            >
              <Download className="w-4 h-4 text-amber-400" />
              {isInstallable && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area with Layout Shift Protection and Skeleton Loading */}
        <main className="flex-1 p-4 relative min-h-[calc(100vh-140px)]">
          <AnimatePresence mode="wait">
            {isTabTransitioning ? (
              <TabTransitionSkeleton key={`skeleton-${displaySkeletonTab}`} tab={displaySkeletonTab} />
            ) : (
              <motion.div
                key={`tab-content-${currentTab}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                {currentTab === 'home' && (
                  <HomeLobby
                    onSelectGame={(game) => {
                      triggerHaptic('medium');
                      if (game === 'wingo' || game === 'k3' || game === 'trx') {
                        handleSwitchTab('wingo');
                      } else if (game === 'aviator') {
                        handleSwitchTab('aviator');
                      }
                    }}
                    onOpenWallet={openWallet}
                    onOpenAuth={() => {
                      triggerHaptic('light');
                      setAuthModalOpen(true);
                    }}
                  />
                )}

                {currentTab === 'wingo' && (
                  <WingoGame
                    onOpenWallet={openWallet}
                    onOpenAuth={() => {
                      triggerHaptic('light');
                      setAuthModalOpen(true);
                    }}
                    onOpenAdminHub={() => handleSwitchTab('admin')}
                  />
                )}

                {currentTab === 'aviator' && (
                  <AviatorGame
                    onOpenWallet={openWallet}
                    onOpenAuth={() => {
                      triggerHaptic('light');
                      setAuthModalOpen(true);
                    }}
                  />
                )}

                {currentTab === 'promotion' && <PromotionView onOpenWallet={openWallet} />}

                {currentTab === 'wallet' && (
                  <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                      <h3 className="font-black text-white text-base">Game Wallet Overview</h3>
                      <p className="text-xs text-gray-400 mt-1">Manage balances, instant UPI deposits and fast withdrawals</p>
                      <div className="mt-4 flex gap-3 justify-center">
                        <button
                          onClick={() => openWallet('deposit')}
                          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs"
                        >
                          Recharge Balance
                        </button>
                        <button
                          onClick={() => openWallet('withdraw')}
                          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl text-xs"
                        >
                          Withdraw Funds
                        </button>
                      </div>
                    </div>
                    <AccountView 
                      onOpenWallet={openWallet} 
                      onOpenAuth={() => setAuthModalOpen(true)}
                      onTestInactivityWarning={() => simulateWarning(60)}
                      onDownloadApp={triggerInstall}
                      onOpenAdminHub={() => handleSwitchTab('admin')}
                      onSelectGame={(game) => {
                        triggerHaptic('medium');
                        if (game === 'aviator') {
                          handleSwitchTab('aviator');
                        } else {
                          handleSwitchTab('wingo');
                        }
                      }}
                    />
                  </div>
                )}

                {currentTab === 'account' && (
                  <AccountView 
                    onOpenWallet={openWallet} 
                    onOpenAuth={() => setAuthModalOpen(true)} 
                    onTestInactivityWarning={() => simulateWarning(60)}
                    onOpenSupport={() => setSupportModalOpen(true)}
                    onDownloadApp={triggerInstall}
                    onOpenAdminHub={() => handleSwitchTab('admin')}
                    onSelectGame={(game) => {
                      triggerHaptic('medium');
                      if (game === 'aviator') {
                        handleSwitchTab('aviator');
                      } else {
                        handleSwitchTab('wingo');
                      }
                    }}
                  />
                )}

                {currentTab === 'admin' && (
                  <AdminSpecialPage
                    onBackToGame={() => handleSwitchTab('wingo')}
                    onOpenWallet={openWallet}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* WinXbet Signature Bottom Navigation Bar with Diamond Promotion tab */}
        <nav
          id="winxbet-bottom-nav"
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-950/95 backdrop-blur-lg border-t border-gray-800/90 py-2 px-3 z-40 flex items-center justify-around overflow-hidden bottom-nav-safe"
        >
          {/* Transition Loading Indicator line along the top border */}
          {isTabTransitioning && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-amber-400 to-emerald-400 animate-pulse">
              <div className="w-full h-full bg-white/40 animate-[shimmer_0.8s_infinite]" />
            </div>
          )}

          {/* Home */}
          <button
            id="nav-tab-home"
            onClick={() => handleSwitchTab('home')}
            className={`flex flex-col items-center gap-1 transition ${
              (currentTab === 'home' || (isTabTransitioning && displaySkeletonTab === 'home'))
                ? 'text-amber-400 scale-105' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Activity / Games */}
          <button
            id="nav-tab-games"
            onClick={() => handleSwitchTab('wingo')}
            className={`flex flex-col items-center gap-1 transition ${
              ((currentTab === 'wingo' || currentTab === 'aviator') || (isTabTransitioning && (displaySkeletonTab === 'wingo' || displaySkeletonTab === 'aviator')))
                ? 'text-amber-400 scale-105'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Lottery</span>
          </button>

          {/* Center Diamond Promotion Tab (Iconic IN999 element) */}
          <div className="relative -top-5">
            <button
              id="nav-tab-promotion"
              onClick={() => handleSwitchTab('promotion')}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center rotate-45 transition transform shadow-xl ${
                (currentTab === 'promotion' || (isTabTransitioning && displaySkeletonTab === 'promotion'))
                  ? 'bg-gradient-to-tr from-red-600 to-amber-500 ring-4 ring-amber-400/40 scale-110'
                  : 'bg-gradient-to-tr from-gray-900 to-gray-800 border border-amber-500/40 text-amber-400 hover:scale-105'
              }`}
            >
              <div className="-rotate-45 flex flex-col items-center justify-center text-white">
                <Share2 className="w-5 h-5 text-white" />
              </div>
            </button>
            <div className="text-center text-[10px] font-black text-amber-400 mt-1">
              Promotion
            </div>
          </div>

          {/* Wallet */}
          <button
            id="nav-tab-wallet"
            onClick={() => handleSwitchTab('wallet')}
            className={`flex flex-col items-center gap-1 transition ${
              (currentTab === 'wallet' || (isTabTransitioning && displaySkeletonTab === 'wallet'))
                ? 'text-amber-400 scale-105' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-bold">Wallet</span>
          </button>

          {/* Account / Admin Hub */}
          <button
            id="nav-tab-account"
            onClick={() => handleSwitchTab(isAdmin ? (currentTab === 'admin' ? 'account' : 'admin') : 'account')}
            className={`flex flex-col items-center gap-1 transition relative ${
              ((currentTab === 'account' || currentTab === 'admin') || (isTabTransitioning && (displaySkeletonTab === 'account' || displaySkeletonTab === 'admin')))
                ? 'text-amber-400 scale-105' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              {isAdmin ? (
                currentTab === 'admin' ? <UserIcon className="w-5 h-5" /> : <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
              {isAdmin && (
                <span className="absolute -top-1 -right-2 px-1 rounded-full bg-amber-500 text-[8px] font-black text-gray-950 flex items-center gap-0.5">
                  ADM
                  {pendingRequestsCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  )}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">
              {isAdmin ? (currentTab === 'admin' ? 'Account' : 'Admin Hub') : 'Account'}
            </span>
          </button>
        </nav>

        {/* Registration Bonus Celebration Modal */}
        <RegistrationBonusModal
          isOpen={isNewRegistration}
          onClose={dismissNewRegistrationModal}
          onStartPlaying={() => handleSwitchTab('wingo')}
        />

        {/* Wallet Modal */}
        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          defaultTab={walletDefaultTab}
        />

        {/* Admin Console Modal */}
        {isAdmin && (
          <AdminConsoleModal
            isOpen={adminConsoleOpen}
            onClose={() => setAdminConsoleOpen(false)}
          />
        )}

        {/* 15-Minute Session Inactivity Warning Modal */}
        <InactivityWarningModal
          isOpen={isWarningOpen}
          secondsRemaining={secondsRemaining}
          totalWarningSeconds={60}
          onStayLoggedIn={resetInactivity}
          onLogoutNow={performAutoLogout}
        />

        {/* 3-Second Bet Settlement Notification Popup (Win celebration & Lost alert) */}
        <BetResultPopup
          notification={betNotification}
          onClose={dismissBetNotification}
        />

        {/* Customer Support Chat & Help Request Modal */}
        <CustomerSupportModal
          isOpen={supportModalOpen}
          onClose={() => setSupportModalOpen(false)}
        />

        {/* Floating 24/7 Customer Support Action Button */}
        {!supportModalOpen && (
          <FloatingSupportButton
            onClick={() => setSupportModalOpen(true)}
          />
        )}

        {/* Android Native Install & App Download Modal */}
        <AndroidInstallModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstall={triggerInstall}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="WinXbet Casino" fallbackMessage="Application experienced an unexpected error.">
      <AuthProvider>
        <ContinuousGameProvider>
          <AppContent />
        </ContinuousGameProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
