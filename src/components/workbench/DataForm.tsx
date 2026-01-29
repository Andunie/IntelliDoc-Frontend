"use client";

import { useState } from 'react';
import { ExtractionResult } from '@/types/api';
import { auditService, documentService } from '@/lib/api';
import { authHelper } from '@/lib/auth-helper';
import AuditTimeline from './AuditTimeline'; // Import the new component
import { Check, Loader2, AlertCircle, Save, Clock, FileSpreadsheet } from 'lucide-react'; // Add Clock icon
import { cn, downloadBlob } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DataFormProps {
    documentId: string;
    data: ExtractionResult;
}

export default function DataForm({ documentId, data }: DataFormProps) {
    const router = useRouter();
    // Local state for form values to allow editing
    const [fields, setFields] = useState<Record<string, any>>(data.fields || {});
    // Track update status: 'idle' | 'saving' | 'saved' | 'error'
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedField, setLastSavedField] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); // State for history drawer
    const [exporting, setExporting] = useState(false);
    const [approving, setApproving] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await documentService.exportToExcel(documentId);
            downloadBlob(blob, `Export_${documentId}.xlsx`);
        } catch (error) {
            console.error("Export failed", error);
            // Optional: Show toast or error state
        } finally {
            setExporting(false);
        }
    };

    const handleApprove = async () => {
        try {
            setApproving(true);
            await auditService.approveDocument(documentId);
            setIsApproved(true);
            toast.success("Document approved successfully! Redirecting...");

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (error) {
            console.error("Approval failed", error);
            toast.error("Failed to approve document. Please try again.");
            setApproving(false);
        }
    };

    const handleInputChange = (key: string, value: string) => {
        setFields(prev => ({
            ...prev,
            [key]: value
        }));
        // Reset status to idle on change so 'Saved' disappears if they type more
        if (status === 'saved') setStatus('idle');
    };

    // Helper to format numeric-like strings (especially amounts) with comma decimal
    const formatValue = (key: string, val: any) => {
        if (val === null || val === undefined) return '';
        const strVal = String(val);

        // Simple heuristic: if key contains Amount/Total/Price/Cost and looks like a number
        // OR just if it looks like a number with a dot
        // But user asked specifically for "Amount" fields.
        const isAmountField = /Amount|Total|Price|Cost|Balance|Tax|Vat/i.test(key);

        if (isAmountField && !isNaN(parseFloat(strVal))) {
            // Replace dot with comma for display
            return strVal.replace('.', ',');
        }

        return strVal;
    };

    const handleBlur = async (key: string, currentValue: string) => {
        let originalValue = data.fields[key];

        // Handle array comparison safely
        if (Array.isArray(originalValue)) {
            originalValue = originalValue.join(', ');
        }

        // Only update if value changed
        if (String(currentValue) !== String(originalValue)) {
            setStatus('saving');
            setLastSavedField(key);

            try {
                // Get current user ID
                const currentUser = authHelper.getUserFromToken();

                // Call Audit Service
                await auditService.updateField({
                    documentId,
                    fieldName: `Fields.${key}`, // Updated to Fields
                    oldValue: String(originalValue),
                    newValue: String(currentValue),
                    reason: 'User Correction',
                    userId: currentUser ? currentUser.userId : 'anonymous'
                });

                setStatus('saved');

                // Hide 'Saved' after a few seconds
                setTimeout(() => {
                    setStatus('idle');
                    setLastSavedField(null);
                }, 3000);

            } catch (error) {
                console.error("Failed to update field", error);
                setStatus('error');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Header / Status Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Extraction Results</h2>
                    <p className="text-xs text-slate-500">Review and validate the extracted data below.</p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center h-8">
                    {status === 'saving' && (
                        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving...
                        </div>
                    )}
                    {status === 'saved' && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-medium animate-in fade-in slide-in-from-top-1">
                            <Check className="h-3 w-3" />
                            Saved
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Error saving
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50"
                        title="Export to Excel"
                    >
                        {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
                    </button>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="View History"
                    >
                        <Clock className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Audit History Drawer */}
            <AuditTimeline
                documentId={documentId}
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Fields Section (Dynamic) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="h-6 w-1 rounded bg-indigo-500"></div>
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Document Details ({data.documentType})</h3>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 text-sm text-slate-600 italic">
                        "{data.summary}"
                    </div>

                    <div className="grid grid-cols-1 gap-y-5 gap-x-6">
                        {Object.entries(fields).map(([key, value]) => {
                            // Handle Array Display
                            const displayValue = Array.isArray(value) ? value.join(', ') : value;

                            return (
                                <div key={key} className="relative group">
                                    <label
                                        htmlFor={`field-${key}`}
                                        className="block text-xs font-medium text-slate-500 mb-1.5 ml-1"
                                    >
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id={`field-${key}`}
                                            value={formatValue(key, displayValue)}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                            onBlur={(e) => handleBlur(key, e.target.value)}
                                            className={cn(
                                                "block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all",
                                                lastSavedField === key && status === 'saved' ? "ring-emerald-500 bg-emerald-50/30" : "bg-white focus:bg-white"
                                            )}
                                        />
                                        {lastSavedField === key && status === 'saved' && (
                                            <div className="absolute right-3 top-2.5 text-emerald-500 animate-in zoom-in">
                                                <Check className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tables Section (Dynamic) */}
                {data.tables && data.tables.map((table, tIdx) => (
                    <div key={tIdx} className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="h-6 w-1 rounded bg-amber-500"></div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{table.name}</h3>
                        </div>

                        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {table.rows.length > 0 && Object.keys(table.rows[0]).map((header) => (
                                                <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {table.rows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                                {Object.entries(row).map(([cellKey, val], vIdx) => (
                                                    <td key={vIdx} className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                                        {val !== null && val !== undefined ? formatValue(cellKey, val) : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
                <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
                    Discard Changes
                </button>
                <button
                    onClick={handleApprove}
                    disabled={approving || isApproved}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all",
                        isApproved
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-md"
                    )}
                >
                    {approving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isApproved ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {isApproved ? "Document Approved" : "Approve Document"}
                </button>
            </div>
        </div>
    );
}
