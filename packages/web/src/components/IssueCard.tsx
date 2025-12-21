/**
 * Individual issue card component.
 * Displays a single code issue with severity styling.
 */

import type { ReviewIssue } from '../types';

interface Props {
    issue: ReviewIssue;
}

export function IssueCard({ issue }: Props) {
    return (
        <div className={`issue-card ${issue.severity}`}>
            <div className="issue-header">
                <span className={`severity-badge ${issue.severity}`}>
                    {issue.severity}
                </span>
                <span className="issue-type">{issue.type}</span>
                <span className="confidence">{Math.round(issue.confidence * 100)}% confidence</span>
            </div>

            <div className="issue-location">
                📄 {issue.file}
                {issue.lines.length > 0 && ` : ${issue.lines.join(', ')}`}
            </div>

            <p className="issue-explanation">{issue.explanation}</p>

            <div className="issue-fix">
                <strong>Suggested fix:</strong>
                <pre>{issue.suggested_fix}</pre>
            </div>
        </div>
    );
}
