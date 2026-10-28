import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

type ModuleHeaderProps = {
  title: string;
  subtitle: string;
  action: string;
  onAction: () => void;
  children: ReactNode;
};

export function ModuleHeader({ title, subtitle, action, onAction, children }: ModuleHeaderProps) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="live-dot" /> LasyNet · GESTION</div>
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button className="primary-button" onClick={onAction}><Plus size={18} />{action}</button>
      </section>
      <section className="panel computers-panel module-panel">{children}</section>
    </>
  );
}
