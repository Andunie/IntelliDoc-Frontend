"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { searchService } from '@/lib/api';
import { SearchResult } from '@/types/api';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setHasSearched(true);
        setResults([]);

        try {
            const data = await searchService.search(query);
            setResults(data);
        } catch (err) {
            console.error("Search failed:", err);
            setError("Failed to perform search. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Header Area */}
            <div className="text-center space-y-2 pt-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Document Search</h1>
                <p className="text-slate-500">Search across all your processed documents instantly.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all text-lg"
                        placeholder="Search inside documents (e.g., Invoice Number, Vendor Name...)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Results Area */}
            <div className="space-y-6">

                {/* Initial State */}
                {!hasSearched && !loading && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Ready to search</h3>
                        <p className="text-slate-500 mt-1">Enter a keyword above to find documents.</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3 text-rose-700">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* No Results */}
                {hasSearched && !loading && results.length === 0 && !error && (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-slate-500">No results found for <span className="font-semibold text-slate-900">"{query}"</span>.</p>
                        <p className="text-sm text-slate-400 mt-1">Try checking for typos or using broader keywords.</p>
                    </div>
                )}

                {/* Results List */}
                {results.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-slate-500 px-1">Found {results.length} matching documents</p>

                        {results.map((result, index) => (
                            <div
                                key={result.id || index}
                                className="group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        {/* Title / Link */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <Link
                                                href={`/dashboard/documents/${result.id}`}
                                                className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition-colors focus:outline-none focus:underline"
                                            >
                                                {/* Use ID as name if name not available in search result */}
                                                Document {result.id}
                                                <span className="absolute inset-0" aria-hidden="true" />
                                            </Link>

                                            {/* Badges */}
                                            {result.metadata?.type && (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                                    {result.metadata.type}
                                                </span>
                                            )}
                                        </div>

                                        {/* Snippet */}
                                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-3">
                                            {/* Highlight the match if we could, for now just show content */}
                                            {result.content}
                                        </p>

                                        {/* Footer Metadata */}
                                        {result.metadata && (
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                {result.metadata.date && <span>{result.metadata.date}</span>}
                                                {result.metadata.author && (
                                                    <span className="flex items-center gap-1">
                                                        <span>•</span> {result.metadata.author}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                        <ArrowRight className="h-5 w-5 text-indigo-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
