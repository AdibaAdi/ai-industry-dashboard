import { useState } from 'react';
import { apiClient } from '../api/client';
import SectionHeading from '../components/SectionHeading';

const AskAIPage = ({ compactMode }) => {
  const [query, setQuery] = useState('Which AI infrastructure companies are strongest right now?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
                  <p className="mt-1 text-xs text-theme-muted">{result.domain}</p>
                  <p className="mt-2 text-sm text-theme-secondary">{result.reason}</p>
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
        </>
      ) : null}
    </main>
  );
};

export default AskAIPage;
