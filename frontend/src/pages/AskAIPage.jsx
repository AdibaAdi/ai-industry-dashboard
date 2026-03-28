import { useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import SectionHeading from '../components/SectionHeading';
import { buildAskAIResultViewModel } from '../utils/dashboardDataBuilder';

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

const AskAIPage = ({ compactMode, companies = [], onNavigate, onOpenCompany }) => {
  const [query, setQuery] = useState('Which AI infrastructure companies are strongest right now?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const companyNames = useMemo(() => new Set(companies.map((company) => company.name.toLowerCase())), [companies]);
  const responseViewModel = useMemo(() => buildAskAIResultViewModel(response), [response]);

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
            <p className="mt-3 text-sm leading-6 text-theme-secondary">{responseViewModel.answer}</p>
            {responseViewModel.relevance ? (
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-theme-muted">
                Confidence: {responseViewModel.relevance.overall_confidence} · Top relevance {(responseViewModel.relevance.top_relevance_score * 100).toFixed(0)}%
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Retrieved companies</p>
            <div className="mt-4 space-y-3">
              {responseViewModel.retrievedCompanies.map((company, index) => (
                <article key={company.id} className="rounded-xl border border-theme-border bg-theme-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-theme-primary">#{index + 1} {company.name}</h3>
                    <span className="rounded-lg bg-theme-chart px-2 py-1 text-xs text-theme-accent">
                      Relevance {(company.relevance_score * 100).toFixed(0)}% · Power {company.power_score.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-theme-muted">{company.domain} · {company.subdomain}</p>
                  <p className="mt-2 text-sm text-theme-secondary">Why selected: {company.why_selected}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenCompany?.(company.id, 'Ask AI retrieved companies')}
                      className="rounded-lg border border-theme-border px-3 py-1.5 text-xs text-theme-muted hover:border-theme-accent hover:text-theme-accent"
                    >
                      Open company detail
                    </button>
                    {companyNames.has(company.name.toLowerCase()) ? (
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Supporting evidence snippets</p>
            <div className="mt-4 space-y-3">
              {responseViewModel.supportingSnippets.map((snippet, index) => (
                <article key={`${snippet.company_id}-${snippet.source_field}-${index}`} className="rounded-xl border border-theme-border bg-theme-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">
                    {snippet.company_name} · {snippet.source_field} · Relevance {(snippet.relevance_score * 100).toFixed(0)}%
                  </p>
                  <p className="mt-2 text-sm text-theme-secondary">{highlightText(snippet.snippet, snippet.matched_terms)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-theme-muted">Reasoning summary</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-theme-secondary">
              {responseViewModel.reasoningSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
};

export default AskAIPage;
