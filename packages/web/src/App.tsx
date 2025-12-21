/**
 * Main App component.
 * Orchestrates the review form and result display.
 */

import { ReviewForm, ReviewResult } from './components';
import { useReview } from './hooks';

export default function App() {
    const { submitReview, result, loading, error } = useReview();

    return (
        <div className="app">
            <header className="header">
                <h1>🔍 MCP Code Review</h1>
                <p className="subtitle">AI-powered code correctness analysis</p>
            </header>

            <main className="main">
                <section className="panel">
                    <h2>Submit Code for Review</h2>
                    <ReviewForm onSubmit={submitReview} loading={loading} />
                </section>

                {error && (
                    <div className="error-banner">
                        ⚠️ {error}
                    </div>
                )}

                {result && (
                    <section className="panel">
                        <ReviewResult data={result} />
                    </section>
                )}
            </main>

            <footer className="footer">
                <a href="/api/health" target="_blank" rel="noopener">Health</a>
                <span className="divider">•</span>
                <a href="/api/config" target="_blank" rel="noopener">Config</a>
                <span className="divider">•</span>
                <a href="/api/metrics" target="_blank" rel="noopener">Metrics</a>
            </footer>
        </div>
    );
}
