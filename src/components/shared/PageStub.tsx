import { memo } from 'react';
import { type LucideIcon } from 'lucide-react';

interface PageStubProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const PageStub = memo(({ title, description, icon: Icon }: PageStubProps) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="zm-glass p-8 rounded-2xl flex flex-col items-center gap-4 max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icon size={32} className="text-primary" />
      </div>
      <h1 className="text-2xl font-bold font-mono-ui zm-gradient-text">{title}</h1>
      <p className="text-sm" style={{ color: 'var(--zm-text-secondary)' }}>{description}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-mono-ui" style={{ color: 'var(--zm-text-faint)' }}>Coming soon in v8.1</span>
      </div>
    </div>
  </div>
));
PageStub.displayName = 'PageStub';

export default PageStub;
