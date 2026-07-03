import type { PropsWithChildren } from 'react';

interface PageWrapperProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
}

export function PageWrapper({ title, eyebrow, description, className, children }: PageWrapperProps) {
  return (
    <section className={className ? `page-shell ${className}` : 'page-shell'}>
      <header className="page-header">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}