/**
 * Review result display component.
 * Shows risk score, issues, and recommendations.
 */

import type { ReviewOutput } from '../types';
import { IssueCard } from './IssueCard';

interface Props {
    data: ReviewOutput;
}

/**
 * Returns CSS class for risk score color.
 */
function getRiskClass(score: number): string {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
}

export function ReviewResult({ data }: Props) {
    const riskClass = getRiskClass(data.risk_score);

    return (
        <div className="review-result">
            {/* Risk Score Header */}
            <div className="result-header">
                <div className={`risk-badge ${riskClass}`}>
                    Risk: {data.risk_score}/100
                </div>
                <div className="meta-info">
                    {data.meta.model} • {data.meta.latency_ms}ms
                    {data.meta.prompt_tokens && ` • ${data.meta.prompt_tokens + (data.meta.completion_tokens || 0)} tokens`}
                </div>
            </div>

            {/* Summary */}
            <section className="result-section">
                <h3>Summary</h3>
                <p>{data.summary}</p>
            </section>

            {/* Issues */}
            {data.issues.length > 0 && (
                <section className="result-section">
                    <h3>Issues ({data.issues.length})</h3>
                    <div className="issues-list">
                        {data.issues.map((issue, i) => (
                            <IssueCard key={i} issue={issue} />
                        ))}
                    </div>
                </section>
            )}

            {/* Missing Tests */}
            {data.missing_tests.length > 0 && (
                <section className="result-section">
                    <h3>Missing Tests</h3>
                    <ul className="tests-list">
                        {data.missing_tests.map((test, i) => (
                            <li key={i}>
                                <strong>{test.area}:</strong> {test.cases.join(', ')}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Questions for Human */}
            {data.questions_for_human.length > 0 && (
                <section className="result-section">
                    <h3>Questions for You</h3>
                    <ul className="questions-list">
                        {data.questions_for_human.map((q, i) => (
                            <li key={i}>{q}</li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
