import { LayoutDashboard, TrendingUp, History, ShieldCheck, Scale, MessageCircle } from 'lucide-react';

// The dashboard sections. Every feature of the app lives in exactly
// one section, so nothing can be lost behind the navigation.
export const SECTIONS = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard, description: 'Risk overview, map, search & scores' },
  { id: 'trends', label: 'Trends', shortLabel: 'Trends', icon: TrendingUp, description: '10-year trends & future simulator' },
  { id: 'timeline', label: 'Timeline', shortLabel: 'Timeline', icon: History, description: 'Past disasters & live news' },
  { id: 'prepare', label: 'Prepare', shortLabel: 'Prepare', icon: ShieldCheck, description: 'Preparedness plans' },
  { id: 'compare', label: 'Compare', shortLabel: 'Compare', icon: Scale, description: 'Compare two locations' },
  { id: 'chat', label: 'Chat', shortLabel: 'Chat', icon: MessageCircle, description: 'Ask the climate advisor' },
];

export function getSection(id) {
  return SECTIONS.find((s) => s.id === id) || SECTIONS[0];
}
