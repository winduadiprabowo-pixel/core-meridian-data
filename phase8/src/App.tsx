/**
 * App.tsx — ZERØ MERIDIAN 2026 Phase 5
 * React.lazy semua pages, Suspense dengan PageSkeleton fallback.
 * Phase 5: Added Defi page, GlobalStatsBar, useGlobalStats.
 * - React.memo + displayName ✓
 * - rgba() only ✓
 * - QueryClient optimized ✓
 */

import { memo, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CryptoProvider } from '@/contexts/CryptoContext';
import { useCryptoData } from '@/hooks/useCryptoData';
import { PageSkeleton } from '@/components/shared/Skeleton';
import {
  Globe, Search, Rocket, Landmark, ShieldCheck,
  Building2, Coins, Gem, DollarSign, Brain, Bot,
  Target, Radio, Map, Image, Bitcoin, Vote,
  Briefcase, Wrench, Timer,
} from 'lucide-react';

// ─── Lazy Pages ───────────────────────────────────────────────────────────────

const Portal      = lazy(() => import('./pages/Portal'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Markets     = lazy(() => import('./pages/Markets'));
const OrderBook   = lazy(() => import('./pages/OrderBook'));
const Derivatives = lazy(() => import('./pages/Derivatives'));
const Alerts      = lazy(() => import('./pages/Alerts'));
const Watchlist   = lazy(() => import('./pages/Watchlist'));
const Converter   = lazy(() => import('./pages/Converter'));
const Defi        = lazy(() => import('./pages/Defi'));
const PageStub    = lazy(() => import('./components/shared/PageStub'));
const OnChain     = lazy(() => import('./pages/OnChain'));
const NotFound    = lazy(() => import('./pages/NotFound'));
import AppShell   from './components/layout/AppShell';

// ─── QueryClient ──────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      gcTime:               5 * 60 * 1000,
      retry:                1,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
  },
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

const PageFallback = memo(() => (
  <div className="p-5">
    <PageSkeleton />
  </div>
));
PageFallback.displayName = 'PageFallback';

// ─── DataLoaderShell ─────────────────────────────────────────────────────────

const DataLoaderShell = memo(() => {
  useCryptoData();
  return (
    <AppShell>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/markets"      element={<Markets />} />
          <Route path="/orderbook"    element={<OrderBook />} />
          <Route path="/derivatives"  element={<Derivatives />} />
          <Route path="/alerts"       element={<Alerts />} />
          <Route path="/watchlist"    element={<Watchlist />} />
          <Route path="/converter"    element={<Converter />} />
          <Route path="/defi"         element={<Defi />} />

          <Route path="/networks"     element={<PageStub title="Network Intelligence"    description="50+ blockchain networks with TVL, TPS, and cross-chain flow analysis."              icon={Globe} />} />
          <Route path="/onchain"      element={<OnChain />} />
          <Route path="/tokens"       element={<PageStub title="Token Discovery"         description="New listings, trending tokens, momentum scores, and risk grades."                  icon={Rocket} />} />
          <Route path="/bridges"      element={<PageStub title="Bridge Monitor"          description="Cross-chain bridge volume, security scores, and TVL tracking."                    icon={Landmark} />} />
          <Route path="/security"     element={<PageStub title="Security & Risk"         description="Smart contract audits, exploit history, rug pull indicators."                     icon={ShieldCheck} />} />

          <Route path="/lending"      element={<PageStub title="Lending Deep Dive"       description="Supply/borrow APY across Aave, Compound, Morpho with liquidation risk."         icon={Coins} />} />
          <Route path="/staking"      element={<PageStub title="Staking & Yield"         description="ETH staking comparison, restaking, liquid staking peg health."                   icon={Gem} />} />
          <Route path="/stablecoins"  element={<PageStub title="Stablecoin Center"       description="Supply tracking, peg health, dominance, and yield rates."                        icon={DollarSign} />} />

          <Route path="/ai-signals"   element={<PageStub title="AI Signals ULTRA"        description="15-asset technical analysis with RSI, MACD, Bollinger Bands, pattern detection." icon={Brain} />} />
          <Route path="/ai-research"  element={<PageStub title="AI Research"             description="AI-generated market reports, macro analysis, narrative tracking."                icon={Bot} />} />
          <Route path="/smart-money"  element={<PageStub title="Smart Money Tracker"     description="Wallet profiling, copy signals, on-chain PnL for tracked wallets."              icon={Target} />} />
          <Route path="/sentiment"    element={<PageStub title="Sentiment Intelligence"  description="Overall sentiment gauge, narrative trending, social velocity."                   icon={Radio} />} />
          <Route path="/ecosystem"    element={<PageStub title="Ecosystem Map"           description="Interactive force graph of protocol relationships and funding."                  icon={Map} />} />

          <Route path="/nft"          element={<PageStub title="NFT Intelligence"        description="Top collections, wash trading detection, whale tracker."                         icon={Image} />} />
          <Route path="/ordinals"     element={<PageStub title="Ordinals & BRC-20"       description="Inscription activity, BRC-20 tokens, rare sat tracking."                        icon={Bitcoin} />} />
          <Route path="/governance"   element={<PageStub title="Governance"              description="Active proposals, voting power, treasury balances."                              icon={Vote} />} />

          <Route path="/portfolio"    element={<PageStub title="Portfolio Tracker ULTRA" description="Performance charts, risk metrics, allocation, and trade journal."               icon={Briefcase} />} />
          <Route path="/productivity" element={<PageStub title="Productivity Suite"      description="Tasks, notes, Pomodoro timer, trade journal, market calendar."                  icon={Timer} />} />
          <Route path="/devtools"     element={<PageStub title="Developer Tools"         description="JSON formatter, Base64, regex tester, hash generator, JWT decoder."             icon={Wrench} />} />

          <Route path="*"             element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
});
DataLoaderShell.displayName = 'DataLoaderShell';

// ─── App ──────────────────────────────────────────────────────────────────────

const App = memo(() => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CryptoProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/"  element={<Portal />} />
              <Route path="/*" element={<DataLoaderShell />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CryptoProvider>
    </TooltipProvider>
  </QueryClientProvider>
));
App.displayName = 'App';

export default App;
