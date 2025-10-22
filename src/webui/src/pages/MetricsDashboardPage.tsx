import React from 'react';
import { MetricsDashboard } from '../components/metrics/MetricsDashboard';

interface MetricsDashboardPageProps {
  darkMode: boolean;
}

export function MetricsDashboardPage({ darkMode }: MetricsDashboardPageProps): JSX.Element {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <MetricsDashboard darkMode={darkMode} />
    </div>
  );
}
