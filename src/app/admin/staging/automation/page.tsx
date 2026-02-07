'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface DiscoveryJob {
  id: string;
  jobType: string;
  parameters: { city?: string; state?: string; genre?: string };
  status: string;
  priority: number;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  searchesUsed: number;
  tokensUsed: number;
  venuesFound: number;
  artistsFound: number;
  estimatedCost: number;
  errorMessage: string | null;
  createdAt: string;
}

interface Budget {
  searchesUsed: number;
  costCents: number;
  searchLimit: number;
  costLimitCents: number;
  venuesStaged: number;
  artistsStaged: number;
}

interface Progress {
  id: string;
  city: string;
  state: string;
  genre: string | null;
  lastSearched: string;
  venuesFound: number;
  artistsFound: number;
}

export default function AutomationPage() {
  const [queue, setQueue] = useState<DiscoveryJob[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<{ daily: Budget; monthly: Budget } | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [stagedCounts, setStagedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/discovery/queue?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setQueue(data.queue);
      setCounts(data.counts);
      setBudget(data.budget);
      setProgress(data.recentProgress);
      setStagedCounts(data.stagedCounts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: string, params: any = {}) => {
    setActionLoading(action);
    try {
      const res = await fetch('/api/admin/discovery/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      });
      
      if (!res.ok) throw new Error('Action failed');
      
      const result = await res.json();
      if (result.message) {
        alert(result.message);
      }
      
      loadData();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunJobs = async (count: number) => {
    setActionLoading('run');
    try {
      const res = await fetch('/api/admin/discovery/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxJobs: count })
      });
      
      const result = await res.json();
      alert(`Ran ${result.jobsRun} job(s).\n${JSON.stringify(result.results, null, 2)}`);
      
      loadData();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400';
      case 'RUNNING': return 'text-blue-400';
      case 'COMPLETED': return 'text-green-400';
      case 'FAILED': return 'text-red-400';
      case 'CANCELLED': return 'text-gray-400';
      case 'BUDGET_EXCEEDED': return 'text-orange-400';
      default: return 'text-text-muted';
    }
  };

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatPercent = (used: number, limit: number) => {
    const pct = Math.min((used / limit) * 100, 100);
    return { pct, color: pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500' };
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-text-accent">[AUTOMATED DISCOVERY]</span>
              <span className="text-2xs text-text-muted uppercase tracking-wider">Budget-Controlled Cron</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/admin/staging" className="btn text-2xs">&lt;&lt; STAGING QUEUE</a>
              <a href="/admin/staging/discover" className="btn text-2xs">MANUAL DISCOVERY</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Budget Overview */}
        {budget && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Budget */}
            <div className="module-section">
              <div className="module-header">&gt; DAILY BUDGET</div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-text-muted">Searches</span>
                    <span>{budget.daily.searchesUsed} / {budget.daily.searchLimit}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded">
                    <div 
                      className={`h-2 rounded ${formatPercent(budget.daily.searchesUsed, budget.daily.searchLimit).color}`}
                      style={{ width: `${formatPercent(budget.daily.searchesUsed, budget.daily.searchLimit).pct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-text-muted">Cost</span>
                    <span>{formatCost(budget.daily.costCents)} / {formatCost(budget.daily.costLimitCents)}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded">
                    <div 
                      className={`h-2 rounded ${formatPercent(budget.daily.costCents, budget.daily.costLimitCents).color}`}
                      style={{ width: `${formatPercent(budget.daily.costCents, budget.daily.costLimitCents).pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-2xs pt-2 border-t border-border-subtle">
                  <span className="text-text-muted">Staged Today</span>
                  <span className="text-green-400">{budget.daily.venuesStaged} venues, {budget.daily.artistsStaged} artists</span>
                </div>
              </div>
            </div>

            {/* Monthly Budget */}
            <div className="module-section">
              <div className="module-header">&gt; MONTHLY BUDGET</div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-text-muted">Searches</span>
                    <span>{budget.monthly.searchesUsed} / {budget.monthly.searchLimit}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded">
                    <div 
                      className={`h-2 rounded ${formatPercent(budget.monthly.searchesUsed, budget.monthly.searchLimit).color}`}
                      style={{ width: `${formatPercent(budget.monthly.searchesUsed, budget.monthly.searchLimit).pct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-text-muted">Cost</span>
                    <span>{formatCost(budget.monthly.costCents)} / {formatCost(budget.monthly.costLimitCents)}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded">
                    <div 
                      className={`h-2 rounded ${formatPercent(budget.monthly.costCents, budget.monthly.costLimitCents).color}`}
                      style={{ width: `${formatPercent(budget.monthly.costCents, budget.monthly.costLimitCents).pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-2xs pt-2 border-t border-border-subtle">
                  <span className="text-text-muted">Staged This Month</span>
                  <span className="text-green-400">{budget.monthly.venuesStaged} venues, {budget.monthly.artistsStaged} artists</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="module-section">
          <div className="module-header">&gt; QUICK ACTIONS</div>
          <div className="p-4 flex flex-wrap gap-3">
            <button
              onClick={() => handleAction('seed_cities')}
              disabled={actionLoading !== null}
              className="btn text-2xs bg-status-active/20 border-status-active/40 hover:bg-status-active/30"
            >
              {actionLoading === 'seed_cities' ? '...' : '🏙️ Seed All Cities (Venues)'}
            </button>
            <button
              onClick={() => handleAction('seed_genres')}
              disabled={actionLoading !== null}
              className="btn text-2xs bg-status-info/20 border-status-info/40 hover:bg-status-info/30"
            >
              {actionLoading === 'seed_genres' ? '...' : '🎵 Seed Genre Searches'}
            </button>
            <button
              onClick={() => handleRunJobs(1)}
              disabled={actionLoading !== null}
              className="btn text-2xs bg-green-500/20 border-green-500/40 hover:bg-green-500/30 text-green-400"
            >
              {actionLoading === 'run' ? '...' : '▶️ Run 1 Job Now'}
            </button>
            <button
              onClick={() => handleRunJobs(5)}
              disabled={actionLoading !== null}
              className="btn text-2xs bg-green-500/20 border-green-500/40 hover:bg-green-500/30 text-green-400"
            >
              {actionLoading === 'run' ? '...' : '▶️▶️ Run 5 Jobs'}
            </button>
            <button
              onClick={() => handleAction('clear_completed')}
              disabled={actionLoading !== null}
              className="btn text-2xs"
            >
              {actionLoading === 'clear_completed' ? '...' : '🗑️ Clear Old Jobs'}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn text-2xs"
            >
              {loading ? '...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Staged Summary */}
        <div className="module-section">
          <div className="module-header">&gt; STAGING QUEUE STATUS</div>
          <div className="p-4 flex gap-4 text-2xs">
            {Object.entries(stagedCounts).map(([status, count]) => (
              <div key={status} className="px-3 py-2 border border-border-subtle">
                <div className="text-text-muted">{status}</div>
                <div className="text-lg text-text-accent">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Queue */}
        <div className="module-section">
          <div className="module-header flex justify-between items-center">
            <span>&gt; JOB QUEUE</span>
            <div className="flex gap-2">
              {['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-2xs px-2 py-1 border ${
                    statusFilter === status 
                      ? 'border-text-accent text-text-accent' 
                      : 'border-border-subtle text-text-muted hover:text-text-primary'
                  }`}
                >
                  {status} ({counts[status] || 0})
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="mb-2">No {statusFilter.toLowerCase()} jobs</p>
              <p className="text-2xs">Use "Seed All Cities" to add jobs to the queue</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle max-h-[400px] overflow-y-auto">
              {queue.map(job => (
                <div key={job.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm">
                        <span className={getStatusColor(job.status)}>[{job.status}]</span>{' '}
                        <span className="text-text-primary">
                          {job.parameters.city}, {job.parameters.state}
                          {job.parameters.genre && ` • ${job.parameters.genre}`}
                        </span>
                      </div>
                      <div className="text-2xs text-text-muted mt-1">
                        Type: {job.jobType} • Priority: {job.priority}
                        {job.scheduledFor && ` • Scheduled: ${new Date(job.scheduledFor).toLocaleString()}`}
                      </div>
                      {job.status === 'COMPLETED' && (
                        <div className="text-2xs text-green-400 mt-1">
                          Found: {job.venuesFound} venues, {job.artistsFound} artists • 
                          Cost: {formatCost(job.estimatedCost)} • 
                          Tokens: {job.tokensUsed.toLocaleString()}
                        </div>
                      )}
                      {job.status === 'FAILED' && job.errorMessage && (
                        <div className="text-2xs text-red-400 mt-1">
                          Error: {job.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-2xs text-text-muted">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Progress */}
        {progress.length > 0 && (
          <div className="module-section">
            <div className="module-header">&gt; RECENT SEARCHES</div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-2xs">
                {progress.map(p => (
                  <div key={p.id} className="px-3 py-2 border border-border-subtle">
                    <div className="text-text-primary font-medium">
                      {p.city}, {p.state}
                      {p.genre && ` • ${p.genre}`}
                    </div>
                    <div className="text-text-muted">
                      {p.venuesFound} venues, {p.artistsFound} artists
                    </div>
                    <div className="text-text-muted">
                      {new Date(p.lastSearched).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="module-section">
          <div className="module-header">&gt; CRON SETUP</div>
          <div className="p-4 text-xs text-text-secondary space-y-4">
            <p>
              <strong className="text-text-accent">How it works:</strong> Jobs are queued and run one at a time 
              via a cron endpoint. Each job uses 1 Tavily search (~$0.001) and Claude Haiku for extraction 
              (~$0.001 per job). Budget limits prevent runaway costs.
            </p>
            
            <div className="bg-bg-tertiary p-3 border border-border-subtle">
              <p className="text-text-muted mb-2">To run automatically, add to <code>vercel.json</code>:</p>
              <pre className="text-green-400 text-2xs overflow-x-auto">{`{
  "crons": [{
    "path": "/api/admin/discovery/cron",
    "schedule": "*/30 * * * *"
  }]
}`}</pre>
              <p className="text-text-muted mt-2 text-2xs">This runs every 30 minutes. Adjust schedule as needed.</p>
            </div>

            <div className="bg-bg-tertiary p-3 border border-border-subtle">
              <p className="text-text-muted mb-2">Also add a CRON_SECRET to your environment:</p>
              <pre className="text-green-400 text-2xs">CRON_SECRET=your-random-secret-here</pre>
            </div>

            <div>
              <p className="text-text-muted mb-2">Current cost estimates per job:</p>
              <ul className="list-disc list-inside text-2xs space-y-1">
                <li>Tavily search: ~$0.001 (1 credit)</li>
                <li>Claude Haiku extraction: ~$0.001 (depends on result size)</li>
                <li><strong>Total: ~$0.002 per city searched</strong></li>
                <li>40 cities = ~$0.08 total</li>
                <li>1000 searches/month = ~$2/month</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
