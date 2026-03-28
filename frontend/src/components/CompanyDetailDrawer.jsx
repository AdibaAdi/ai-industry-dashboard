import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import ConfidenceBadge from './ConfidenceBadge';
import { getConfidenceMeta } from '../utils/confidence';

const InfoItem = ({ label, value }) => (
  <div className="rounded-lg border border-theme-border bg-theme-surface p-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">{label}</p>
    <p className="mt-1 text-sm text-theme-primary">{value || '—'}</p>
  </div>
);

const scoreColor = {
  growth: 'text-emerald-400',
  influence: 'text-cyan-400',
  power: 'text-theme-primary',
};

const getPublicTickerStatus = (company) => {
  if (company.company_type === 'Public') {
    return 'Public company';
  }

  if (company.company_type === 'Private') {
    return 'Private company';
  }

  return company.company_type;
};

const CompanyDetailDrawer = ({ companyId, contextLabel, onClose, onNavigateCompanies }) => {
  const [company, setCompany] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let isMounted = true;

    const loadCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [companyPayload, insightPayload] = await Promise.all([
          apiClient.getCompanyById(companyId),
          apiClient.getCompanyInsight(companyId),
        ]);

        if (!isMounted) {
          return;
        }

        setCompany(companyPayload);
        setInsight(insightPayload);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : 'Failed to load company detail.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCompanyData();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const competitors = useMemo(() => insight?.related_competitors ?? [], [insight]);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [companyId, onClose]);

  if (!companyId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-sm">
      <button type="button" className="h-full flex-1" onClick={onClose} aria-label="Close company details" />
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-theme-border bg-theme-card p-6 shadow-2xl">
        <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-5 border-b border-theme-border bg-theme-card px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-theme-muted">Company detail</p>
              {contextLabel ? <p className="mt-1 text-xs text-theme-muted">Opened from: {contextLabel}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted transition hover:border-theme-accent hover:text-theme-accent"
            >
              Close
            </button>
          </div>
        </div>

        {loading ? <p className="text-sm text-theme-muted">Loading company profile and AI insight…</p> : null}

        {error ? (
          <section className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</section>
        ) : null}

        {company ? (
          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold text-theme-primary">{company.name}</h2>
              <p className="mt-2 text-sm text-theme-secondary">{company.description}</p>
            </header>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="Website" value={<a href={company.website} target="_blank" rel="noreferrer" className="text-theme-accent hover:underline">{company.website}</a>} />
              <InfoItem label="Headquarters" value={company.headquarters} />
              <InfoItem label="Domain" value={company.domain} />
              <InfoItem label="Subdomain" value={company.subdomain} />
              <InfoItem label="Founded year" value={company.founded_year} />
              <InfoItem label="Company type" value={company.company_type} />
              <InfoItem label="Public market status" value={getPublicTickerStatus(company)} />
            </div>

            <section className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Score profile</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className={scoreColor.growth}>Growth {company.growth_score?.toFixed(1)}</span>
                <span className={scoreColor.influence}>Influence {company.influence_score?.toFixed(1)}</span>
                <span className={scoreColor.power}>Power {company.power_score?.toFixed(1)}</span>
              </div>
            </section>


            <section className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Data confidence</p>
              <div className="mt-2">
                <ConfidenceBadge
                  score={company.confidence_score}
                  sources={company.sources}
                  lastUpdated={company.last_updated}
                />
              </div>
              <p className="mt-2 text-xs text-theme-muted">
                {getConfidenceMeta(company.confidence_score).explanation}
              </p>
            </section>
            <section className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(company.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full border border-theme-border bg-theme-card px-2 py-0.5 text-xs text-theme-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {insight ? (
              <section className="space-y-3">
                <article className="rounded-xl border border-theme-border bg-theme-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">AI-generated summary</p>
                  <p className="mt-2 text-sm text-theme-secondary">{insight.summary}</p>
                </article>

                <article className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Strengths</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
                      {insight.strengths?.map((strength) => (
                        <li key={strength}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Risks</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
                      {insight.risks?.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </article>

                <article className="rounded-xl border border-theme-border bg-theme-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Trend</p>
                  <p className="mt-2 text-sm capitalize text-theme-secondary">{insight.trend}</p>
                </article>

                <article className="rounded-xl border border-theme-border bg-theme-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Related competitors</p>
                  <ul className="mt-2 space-y-1 text-sm text-theme-secondary">
                    {competitors.map((competitor) => (
                      <li key={competitor.id}>
                        {competitor.name} · {competitor.domain} · Power {competitor.power_score.toFixed(1)}
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            ) : null}

            <section className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">Source URLs</p>
              <ul className="mt-2 space-y-1 text-sm text-theme-accent">
                {(company.source_urls ?? []).map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-theme-muted">Data sources: {(company.sources ?? []).join(' • ') || 'Not available'}</p>
              <p className="mt-1 text-xs text-theme-muted">Last updated: {company.last_updated}</p>
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted transition hover:border-theme-accent hover:text-theme-accent"
              >
                Back to {contextLabel || 'previous context'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateCompanies?.();
                }}
                className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
              >
                Go to companies list
              </button>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
};

export default CompanyDetailDrawer;
