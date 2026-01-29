"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { documentService } from '@/lib/api';
import { ExtractionResult } from '@/types/api';
import DocumentViewer from '@/components/workbench/DocumentViewer';
import DataForm from '@/components/workbench/DataForm';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function WorkbenchPage() {
    const params = useParams();
    // In Next 15+ params is async in server components, but standard object in useParams client hook
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ExtractionResult | null>(null);
    const [docUrl, setDocUrl] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        async function fetchData() {
            setLoading(true);
            try {
                // Fetch extraction data and document URL in parallel
                const [extractionResult, urlResult] = await Promise.allSettled([
                    documentService.getExtractionResult(id),
                    documentService.getDownloadUrl(id)
                ]);

                // Handle Extraction Result
                if (extractionResult.status === 'fulfilled') {
                    setData(extractionResult.value);
                } else {
                    console.error("Failed to load extraction data", extractionResult.reason);
                    // Don't fail completely if only extraction fails, we might still want to see the doc
                    // setError("Failed to load extraction data.");
                }

                // Handle URL Result
                if (urlResult.status === 'fulfilled') {
                    setDocUrl(urlResult.value);
                } else {
                    console.error("Failed to load document URL", urlResult.reason);
                }

                // If both failed, then show error
                if (extractionResult.status === 'rejected' && urlResult.status === 'rejected') {
                    setError("Failed to load document and data.");
                }

            } catch (err) {
                console.error("Unexpected error", err);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium text-slate-500">Loading workbench...</p>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg border border-rose-200 shadow-sm text-rose-600">
                    <AlertTriangle className="h-8 w-8" />
                    <p className="font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm text-indigo-600 hover:underline"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden border-t border-slate-200">
            {/* Left Pane: Document Viewer (50%) */}
            <div className="w-1/2 h-full border-r border-slate-200 bg-slate-100 hidden lg:block">
                <DocumentViewer url={docUrl} />
            </div>

            {/* Right Pane: Data Form (50%) */}
            <div className="w-full lg:w-1/2 h-full bg-white relative">
                {data && <DataForm documentId={id} data={data} />}
            </div>
        </div>
    );
}
