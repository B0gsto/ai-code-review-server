/**
 * Hook for submitting code reviews.
 * Manages loading, error, and result state.
 */

import { useState, useCallback } from 'react';
import type { ReviewInput, ReviewOutput } from '../types';

const API_URL = '/api/review';

interface UseReviewReturn {
    submitReview: (input: ReviewInput) => Promise<void>;
    result: ReviewOutput | null;
    loading: boolean;
    error: string | null;
    reset: () => void;
}

export function useReview(): UseReviewReturn {
    const [result, setResult] = useState<ReviewOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitReview = useCallback(async (input: ReviewInput) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-correlation-id': crypto.randomUUID(),
                },
                body: JSON.stringify(input),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed: ${response.status}`);
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return { submitReview, result, loading, error, reset };
}
