/**
 * App.tsx — ZERØ MERIDIAN push43
 * push43: Portal auto-redirect, fixed NFT+Ordinals routing, "/" → /dashboard
 * push23: ThemeProvider (next-themes)
 * - React.memo + displayName ✓  - rgba() only ✓  - QueryClient optimized ✓
 */

import { memo, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CryptoProvider } from '@/contexts/CryptoContext';
import { useCryptoData } from '@/hooks/useCryptoData';
import Skeleton from '@/components/shared/Skeleton';
import {
  Landmark, Coins, Gem, DollarSign,
  Map, Vote, Wrench, Timer, Settings,
} from 'lucide-react';

// ─── Lazy Pages ───────────────────────────────────────────────────────────────

const Portal        = lazy(() => import('./pages/Portal'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Markets       = lazy(() => import('./pages/Markets'));
const OrderBook     = lazy(() => import('./pages/OrderBook'));
const Derivatives   = lazy(() => import('./pages/Derivatives'));
const Alerts        = lazy(() => import('./pages/Alerts'));
const Watchlist     = lazy(() => import('./pages/Watchlist'));
const Converter     = lazy(() => import('./pages/Converter'));
const Defi          = lazy(() => import('./pages/Defi'));
const PageStub      = lazy(() => import('./components/shared/PageStub'));
const OnChain       = lazy(() => import('./pages/OnChain'));
const Intelligence  = lazy(() => import('./pages/Intelligence'));
const Charts        = lazy(() => import('./pages/Charts'));
const Fundamentals  = lazy(() => import('./pages/Fundamentals'));
const Portfolio     = lazy(() => import('./pages/Portfolio'));
const Networks      = lazy(() => import('./pages/Networks'));
const Tokens        = lazy(() => import('./pages/Tokens'));
const NotFound      = lazy(() => import('./pages/NotFound'));
const AIResearch    = lazy(() => import('./pages/AIResearch'));
const AISignals     = lazy(() => import('./pages/AISignals'));
const SmartMoney    = lazy(() => import('./pages/SmartMoney'));
const Security      = lazy(() => import('./pages/Security'));
const Sentiment     = lazy(() => import('./pages/Sentiment'));
const NFT           = lazy(() => import('./pages/NFT'));
const Ordinals      = lazy(() => import('./pages/Ordinals'));
const Governance    = lazy(() => import('./pages/Governance'));
const Ecosystem     = lazy(() => import('./pages/Ecosystem'));
const Stablecoins   = lazy(() => import('./pages/Stablecoins'));
const Staking       = lazy(() => import('./pages/Staking'));
const Bridges       = lazy(() => import('./pages/Bridges'));
import AppShell     from './components/layout/AppShell';

// ─── QueryClient ──────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      gcTime:               5 * 60 * 1000,
      retry:                2,
      retryDelay:           (i) => Math.min(1000 * 2 ** i, 30_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
  },
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

const PageFallback = memo(() => (
  <div style={{ padding: '20px' }}>
    <Skeleton.Page />
  </div>
));
PageFallback.displayName = 'PageFallback';

// ─── DataLoaderShell ──────────────────────────────────────────────────────────

const DataLoaderShell = memo(() => {
  useCryptoData();
  return (
    <AppShell>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/markets"       element={<Markets />} />
          <Route path="/orderbook"     element={<OrderBook />} />
          <Route path="/derivatives"   element={<Derivatives />} />
          <Route path="/alerts"        element={<Alerts />} />
          <Route path="/watchlist"     element={<Watchlist />} />
          <Route path="/converter"     element={<Converter />} />
          <Route path="/defi"          element={<Defi />} />
          <Route path="/intelligence"  element={<Intelligence />} />
          <Route path="/charts"        element={<Charts />} />
          <Route path="/fundamentals"  element={<Fundamentals />} />
          <Route path="/networks"      element={<Networks />} />
          <Route path="/onchain"       element={<OnChain />} />
          <Route path="/tokens"        element={<Tokens />} />
          <Route path="/ai-research"   element={<AIResearch />} />
          <Route path="/portfolio"     element={<Portfolio />} />
          <Route path="/security"      element={<Security />} />
          <Route path="/ai-signals"    element={<AISignals />} />
          <Route path="/smart-money"   element={<SmartMoney />} />
          <Route path="/sentiment"     element={<Sentiment />} />
          <Route path="/nft"           element={<NFT />} />
          <Route path="/ordinals"      element={<Ordinals />} />
          <Route path="/bridges"       element={<Bridges />} />
          <Route path="/lending"       element={<PageStub title="Lending Deep Dive"   description="Supply/borrow APY across Aave, Compound, Morpho with liquidation risk." icon={Coins} />} />
          <Route path="/staking"       element={<Staking />} />
          <Route path="/stablecoins"   element={<Stablecoins />} />
          <Route path="/ecosystem"     element={<Ecosystem />} />
          <Route path="/governance"    element={<Governance />} />
          <Route path="/productivity"  element={<PageStub title="Productivity Suite"  description="Tasks, notes, Pomodoro timer, trade journal, market calendar."           icon={Timer} />} />
          <Route path="/devtools"      element={<PageStub title="Developer Tools"     description="JSON formatter, Base64, regex tester, hash generator, JWT decoder."      icon={Wrench} />} />
          <Route path="/settings"      element={<PageStub title="Settings"            description="Theme, display preferences, API keys, notifications, account."           icon={Settings} />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
});
DataLoaderShell.displayName = 'DataLoaderShell';

// ─── App ──────────────────────────────────────────────────────────────────────

const App = memo(() => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem={false}
    disableTransitionOnChange={false}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CryptoProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                {/* "/" → Portal (splash) → auto-redirects to /dashboard */}
                <Route path="/"       element={<Portal />} />
                {/* "/portal" → direct access to Portal if needed */}
                <Route path="/portal" element={<Portal />} />
                {/* All terminal routes */}
                <Route path="/*"      element={<DataLoaderShell />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CryptoProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
));
App.displayName = 'App';

export default App;
