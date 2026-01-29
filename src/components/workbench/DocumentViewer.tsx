"use client";

import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface DocumentViewerProps {
    url?: string;
}

export default function DocumentViewer({ url }: DocumentViewerProps) {
    // If no URL is provided, we won't show the iframe to avoid "refused to connect" errors

    return (
        <div className="flex flex-col h-full bg-slate-800 text-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900">
                <span className="text-sm font-medium text-slate-300">Document Preview</span>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white" disabled={!url}>
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-slate-400 min-w-[3rem] text-center">100%</span>
                    <button className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white" disabled={!url}>
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white" disabled={!url}>
                        <Maximize2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Viewer Frame */}
            <div className="flex-1 relative bg-slate-700/50 flex items-center justify-center overflow-hidden">
                {url ? (
                    <iframe
                        src={url}
                        className="w-full h-full border-none"
                        title="Document Viewer"
                    />
                ) : (
                    <div className="text-center p-8 text-slate-400">
                        <div className="bg-slate-800 p-4 rounded-full inline-flex mb-4">
                            <Maximize2 className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="text-sm">No preview available.</p>
                        <p className="text-xs mt-2 opacity-60">The document content URL was not provided or is invalid.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
