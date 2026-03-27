import { useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import SectionHeading from '../components/SectionHeading';

const EXAMPLE_PROMPTS = [
  'Which AI agent startups are growing fastest?',
  'What domains appear most crowded?',
  'Which companies are strongest in healthcare AI?',
  'Who are the major competitors to OpenAI?',
];

const highlightText = (text, terms = []) => {
  if (!text || !terms.length) {
    return text;
  }

  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
  const escapedTerms = sortedTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const segments = text.split(regex);

  return segments.map((segment, index) => {
    const normalizedSegment = segment.toLowerCase();
    const isMatch = terms.some((term) => normalizedSegment === term.toLowerCase());

    if (!isMatch) {
      return <span key={`${segment}-${index}`}>{segment}</span>;
    }

    return (
      <mark key={`${segment}-${index}`} className="rounded bg-theme-accent/25 px-1 text-theme-primary">
        {segment}
      </mark>
    );
  });
};

const CompanyModal = ({ activeView, companyDetail, companyInsight, loading, onClose }) => {
  if (!activeView) {
    return null;
  }

  const title = activeView.mode === 'insight' ? `${activeView.name} insight` : `${activeView.name} profile`;

  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-theme-primary">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted hover:border-theme-accent hover:text-theme-accent"
        >
          Close
        </button>
      </div>

      {loading ? <p className="mt-3 text-sm text-theme-muted">Loading company context…</p> : null}

      {activeView.mode === 'detail' && companyDetail ? (
        <div className="mt-3 space-y-2 text-sm text-theme-secondary">
          <p>{companyDetail.description}</p>
          <p>
            <span className="font-semibold text-theme-primary">Domain:</span> {companyDetail.domain} · {companyDetail.subdomain}
          </p>
          <p>
            <span className="font-semibold text-theme-primary">Tags:</span> {companyDetail.tags?.join(', ')}
          </p>
          <p>
            <span className="font-semibold text-theme-primary">Scores:</span> Growth {companyDetail.growth_score?.toFixed(1)} · Influence{' '}
            {companyDetail.influence_score?.toFixed(1)} · Power {companyDetail.power_score?.toFixed(1)}
          </p>
        </div>
      ) : null}

      {activeView.mode === 'insight' && companyInsight ? (
        <div className="mt-3 space-y-2 text-sm text-theme-secondary">
          <p>{companyInsight.summary}</p>
          <p>{companyInsight.detail}</p>
          <p>
            <span className="font-semibold text-theme-primary">Signal:</span> {companyInsight.signal}
          </p>
        </div>
      ) : null}
    </section>
  );
};

const AskAIPage = ({ compactMode, companies = [], onNavigate }) => {
  const [query, setQuery] = useState('Which AI infrastructure companies are strongest right now?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [companyInsight, setCompanyInsight] = useState(null);

  const companyNames = useMemo(() => new Set(companies.map((company) => company.name.toLowerCase())), [companies]);

  const onSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Please enter a question to run retrieval.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.searchCompanies(trimmedQuery);
      setResponse(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to run search request.');
    } finally {
      setLoading(false);
    }
  };

  const openCompanyView = async (result, mode) => {
    setActiveView({ id: result.id, name: result.name, mode });
    setCompanyDetail(null);
    setCompanyInsight(null);
    setModalLoading(true);

    try {
      if (mode === 'insight') {
        const insight = await apiClient.getCompanyInsight(result.id);
        setCompanyInsight(insight);
      } else {
        const company = await apiClient.getCompanyById(result.id);
        setCompanyDetail(company);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load company context.');
    } finally {
      setModalLoading(false);
    }
  };

  const clearModal = () => {
    setActiveView(null);
    setCompanyDetail(null);
    setCompanyInsight(null);
  };

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Ask AI"
          subtitle="Natural-language research assistant grounded in your tracked AI company intelligence."
        />

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label htmlFor="ai-query" className="text-xs font-semibold uppercase tracking-[0.14em] text-theme-muted">
            Research query
          </label>
          <textarea
            id="ai-query"
            rows={3}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask about domains, strengths, momentum, or competitors"
            className="w-full rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-primary outline-none transition focus:border-theme-accent"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Analyzing…' : 'Submit'}
            </button>
            {loading ? <span className="text-xs text-theme-muted">Retrieving and ranking grounded matches…</span> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuery(prompt)}
                className="rounded-full border border-theme-border bg-theme-surface px-3 py-1 text-xs text-theme-muted transition hover:border-theme-accent hover:text-theme-accent"
              >
                {prompt}
              </button>
            ))}
          </div>
        </form>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 shadow-card">
          {error}
        </section>
      ) : null}

      {response ? (
        <>
          <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Answer</p>
            <p className="mt-3 text-sm leading-6 text-theme-secondary">{response.answer}</p>
          </section>

          <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Analyst summary</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-theme-border bg-theme-surface p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Key finding</h3>
                <p className="mt-2 text-sm text-theme-secondary">{response.analysis?.key_finding}</p>
              </article>
              <article className="rounded-xl border border-theme-border bg-theme-surface p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Strongest matching companies</h3>
                <ul className="mt-2 space-y-1 text-sm text-theme-secondary">
                  {response.analysis?.strongest_matching_companies?.map((company) => (
                    <li key={company.id}>
                      #{company.rank} {company.name} · {company.domain} · Power {company.power_score.toFixed(1)}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-theme-border bg-theme-surface p-4 md:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Why they match</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
                  {response.analysis?.why_they_match?.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
              {response.analysis?.domain_trend ? (
                <article className="rounded-xl border border-theme-border bg-theme-surface p-4 md:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Notable domain trend</h3>
                  <p className="mt-2 text-sm text-theme-secondary">{response.analysis.domain_trend}</p>
                </article>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Ranked relevant companies</p>
            <div className="mt-4 space-y-3">
              {response.results?.map((result, index) => (
                <article key={result.id} className="rounded-xl border border-theme-border bg-theme-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-theme-primary">
                      #{index + 1} {result.name}
                    </h3>
                    <span className="rounded-lg bg-theme-chart px-2 py-1 text-xs text-theme-accent">
                      Power {result.power_score.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-theme-muted">
                    {result.domain} · {result.subdomain}
                  </p>
                  <p className="mt-2 text-sm text-theme-secondary">{result.reason}</p>
                  {result.matched_fields?.length ? (
                    <div className="mt-3 space-y-2">
                      {result.matched_fields.map((field) => (
                        <p key={`${result.id}-${field.field}`} className="text-xs text-theme-secondary">
                          <span className="font-semibold text-theme-primary">{field.label}:</span> {highlightText(field.text, field.matched_terms)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openCompanyView(result, 'detail')}
                      className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted hover:border-theme-accent hover:text-theme-accent"
                    >
                      View company detail
                    </button>
                    <button
                      type="button"
                      onClick={() => openCompanyView(result, 'insight')}
                      className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted hover:border-theme-accent hover:text-theme-accent"
                    >
                      View company insight
                    </button>
                    {companyNames.has(result.name.toLowerCase()) ? (
                      <button
                        type="button"
                        onClick={() => onNavigate?.('Companies')}
                        className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted hover:border-theme-accent hover:text-theme-accent"
                      >
                        Open companies page
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Supporting evidence</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-theme-secondary">
              {response.supporting_snippets?.map((snippet) => (
                <li key={snippet}>{snippet}</li>
              ))}
            </ul>
          </section>

          <CompanyModal
            activeView={activeView}
            companyDetail={companyDetail}
            companyInsight={companyInsight}
            loading={modalLoading}
            onClose={clearModal}
          />
        </>
      ) : null}
    </main>
  );
};

export default AskAIPage;
