import { AnimatePresence, motion } from 'framer-motion';
import { useDashboardStore } from './store/dashboardStore';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AIChatbot from './components/AIChatbot';
import TutorialOverlay from './components/TutorialOverlay';
import ToastNotifications from './components/ToastNotifications';
import AnomalyBanner from './components/AnomalyBanner';
import DashboardPage from './pages/DashboardPage';
import SendSMSPage from './pages/SendSMSPage';
import ContactsPage from './pages/ContactsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CampaignsPage from './pages/CampaignsPage';
import APIPage from './pages/APIPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import GenericPage from './pages/GenericPage';

export default function App() {
  const { isDarkMode, activePage } = useDashboardStore();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'send-sms': return <SendSMSPage />;
      case 'contacts': return <ContactsPage />;
      case 'campaigns': return <CampaignsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'reports': return <ReportsPage />;
      case 'api': return <APIPage />;
      case 'billing': return <BillingPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="p-6"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Overlays */}
      <AIChatbot />
      <TutorialOverlay />
      <ToastNotifications />
      <AnomalyBanner />
    </div>
  );
}
