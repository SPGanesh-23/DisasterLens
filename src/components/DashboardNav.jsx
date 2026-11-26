import { Compass, Info, ExternalLink } from 'lucide-react';
import { SECTIONS } from '../utils/sections';

// Desktop sidebar: brand at the top, section nav in the middle,
// How it works / About / GitHub at the bottom.
export function Sidebar({ activeSection, onSelect, onOpenModal }) {
  return (
    <aside className="sidebar" aria-label="Dashboard navigation">
      <div className="sidebar-brand">
        <span className="header-logo sidebar-logo">
          <img src="/logo.png" alt="DisasterLens Logo" className="logo-img" />
        </span>
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">DisasterLens AI</span>
          <span className="sidebar-brand-sub">Climate Risk Assessment</span>
        </span>
      </div>

      <nav className="sidebar-nav" aria-label="Sections">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;
          return (
            <button
              key={section.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(section.id)}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="sidebar-nav-label">{section.label}</span>
              {isActive && <span className="sidebar-nav-indicator" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-footer-link" onClick={() => onOpenModal('how-it-works')}>
          <Compass size={15} aria-hidden="true" /> How it works
        </button>
        <button type="button" className="sidebar-footer-link" onClick={() => onOpenModal('about')}>
          <Info size={15} aria-hidden="true" /> About
        </button>
        <a
          href="https://github.com/SPGanesh-23/DisasterLens"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-footer-link"
        >
          <ExternalLink size={15} aria-hidden="true" /> GitHub
        </a>
      </div>
    </aside>
  );
}

// Mobile / tablet bottom navigation: same sections, icon + short label.
export function BottomNav({ activeSection, onSelect }) {
  return (
    <nav className="bottom-nav" aria-label="Sections">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = section.id === activeSection;
        return (
          <button
            key={section.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={section.label}
            onClick={() => onSelect(section.id)}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="bottom-nav-label">{section.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
