/**
 * Security.tsx — ZERØ MERIDIAN 2026 push82
 * push82: Coming Soon — real audit data not yet connected.
 */
import React from 'react';
import ComingSoon from '@/components/shared/ComingSoon';

const Security: React.FC = () => (
  <ComingSoon
    title="Security Dashboard"
    description="Smart contract audit scores, exploit history, and rug pull risk indicators. Requires DeFiSafety & GoPlus API integration."
    icon="🛡️"
    eta="push85"
  />
);

Security.displayName = 'Security';
export default React.memo(Security);
