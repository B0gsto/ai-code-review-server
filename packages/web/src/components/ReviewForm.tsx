/**
 * Code input form component.
 * Collects API credentials and code content for review.
 */

import { useState, FormEvent } from 'react';
import type { ReviewInput, Ruleset } from '../types';

interface Props {
    onSubmit: (input: ReviewInput) => void;
    loading: boolean;
}

/** Popular OpenRouter models */
const MODELS = [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.1-70b-instruct',
];

const RULESETS: Ruleset[] = ['correctness', 'security', 'performance'];

export function ReviewForm({ onSubmit, loading }: Props) {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState(MODELS[0]);
    const [content, setContent] = useState('');
    const [inputType, setInputType] = useState<'code' | 'diff'>('code');
    const [languageHint, setLanguageHint] = useState('typescript');
    const [ruleset, setRuleset] = useState<Ruleset>('correctness');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!apiKey || !content) return;

        const input: ReviewInput = {
            apiKey,
            model,
            languageHint,
            ruleset,
            ...(inputType === 'code' ? { code: content } : { diff: content }),
        };

        onSubmit(input);
    };

    return (
        <form className="review-form" onSubmit={handleSubmit}>
            {/* API Credentials */}
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="apiKey">OpenRouter API Key</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
                        {MODELS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Input Options */}
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="inputType">Input Type</label>
                    <select
                        id="inputType"
                        value={inputType}
                        onChange={(e) => setInputType(e.target.value as 'code' | 'diff')}
                    >
                        <option value="code">Code Snippet</option>
                        <option value="diff">Unified Diff</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="language">Language</label>
                    <input
                        id="language"
                        type="text"
                        value={languageHint}
                        onChange={(e) => setLanguageHint(e.target.value)}
                        placeholder="typescript"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="ruleset">Focus</label>
                    <select
                        id="ruleset"
                        value={ruleset}
                        onChange={(e) => setRuleset(e.target.value as Ruleset)}
                    >
                        {RULESETS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Code Input */}
            <div className="form-group">
                <label htmlFor="content">
                    {inputType === 'code' ? 'Code to Review' : 'Unified Diff'}
                </label>
                <textarea
                    id="content"
                    className="code-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                        inputType === 'code'
                            ? 'Paste your code here...'
                            : '--- a/file.ts\n+++ b/file.ts\n@@ -1,3 +1,4 @@\n...'
                    }
                    required
                />
            </div>

            <button type="submit" className="submit-btn" disabled={loading || !apiKey || !content}>
                {loading ? 'Analyzing...' : 'Review Code'}
            </button>
        </form>
    );
}
