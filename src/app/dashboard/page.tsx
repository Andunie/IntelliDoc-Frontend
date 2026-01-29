"use client";

import { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    UploadCloud,
    File,
    MoreHorizontal,
    ArrowUpRight,
    Loader2,
    FileSpreadsheet,
    RefreshCw
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { documentService } from '@/lib/api';
import { DocumentDto, AnalyticsData, DocumentStatus } from '@/types/api';
import { cn, downloadBlob, formatCurrency } from '@/lib/utils';

// Helper for currency formatting if not in utils
const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    // Data State
    const [documents, setDocuments] = useState<DocumentDto[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docs, statsData] = await Promise.all([
                documentService.getMyDocuments(),
                documentService.getDashboardStats() // Assuming this never fails or returns partial data
            ]);
            setDocuments(docs);
            setAnalytics(statsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            // Fallback for docs if stats fail, or vice versa? 
            // For now, let's assume if one fails, we might still want to show what we have, 
            // but Promise.all rejects if any rejects.
            // In a real app, might want Promise.allSettled.
        } finally {
            setLoading(false);
        }
    };

    const handleBulkExport = async () => {
        if (selectedIds.length === 0) return;

        try {
            setExporting(true);
            const blob = await documentService.exportBatch(selectedIds);
            downloadBlob(blob, `Bulk_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            setSelectedIds([]); // Clear selection after export
        } catch (error) {
            console.error("Bulk export failed", error);
        } finally {
            setExporting(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            handleUpload(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setUploadStatus('uploading');
        try {
            await documentService.upload(file);
            setUploadStatus('success');
            // Refresh list
            fetchData();
            // Reset after 3 seconds
            setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setTimeout(() => setUploadStatus('idle'), 3000);
        }
    };

    // Calculate dynamic stats based on analytics data
    const stats = [
        {
            name: 'Total Documents',
            value: analytics ? analytics.totalDocuments.toString() : '...',
            icon: FileText,
            color: 'bg-blue-500',
            textColor: 'text-blue-500'
        },
        {
            name: 'Total Spend',
            value: analytics ? formatCurrency(analytics.totalSpend) : '...',
            icon: CheckCircle2, // Changed icon for variety or keep relevant
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500'
        },
        // We can keep some static or derived stats like "Processing" count from documents list
        {
            name: 'Processing',
            value: documents.filter(d => d.status === DocumentStatus.Processing || d.status === DocumentStatus.Uploaded).length.toString(),
            icon: Clock,
            color: 'bg-amber-500',
            textColor: 'text-amber-500'
        },
        {
            name: 'Needs Review',
            value: documents.filter(d => d.status === DocumentStatus.Error).length.toString(),
            icon: AlertCircle,
            color: 'bg-rose-500',
            textColor: 'text-rose-500'
        },
    ];

    const getStatusBadge = (status: DocumentStatus) => {
        switch (status) {
            case DocumentStatus.Approved:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                        Completed
                    </span>
                );
            case DocumentStatus.Processing:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20">
                        Processing
                    </span>
                );
            case DocumentStatus.Uploaded:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                        New
                    </span>
                );
            case DocumentStatus.Error:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-600/20">
                        Error
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-600/20">
                        Unknown
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8">

            {/* Welcome Section */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
                <p className="text-slate-500 mt-1">Welcome back, here is what’s happening with your documents today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
                        <dt>
                            <div className={`absolute rounded-md p-3 ${item.color} bg-opacity-10`}>
                                <item.icon className={`h-6 w-6 ${item.textColor}`} aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-200 animate-pulse rounded"></div>
                            ) : (
                                <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                            )}
                        </dd>
                    </div>
                ))}
            </div>

            {/* Analytics Section (New) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Spending Trend */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Monthly Spending Trend</h3>
                    <div className="h-[300px] w-full">
                        {loading || !analytics ? (
                            <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 12 }}
                                        tickFormatter={(value: number) => `₺${value}`}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="amount" name="Spend" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Vendors */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Top Vendors</h3>
                    <div className="h-[300px] w-full flex flex-col justify-center">
                        {loading || !analytics ? (
                            <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <div className="flex h-full">
                                {/* Pie Chart */}
                                <div className="w-1/2 h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.topVendors}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="amount"
                                            >
                                                {analytics.topVendors.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: number) => formatMoney(value || 0)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Legend List */}
                                <div className="w-1/2 flex flex-col justify-center gap-3 pl-4">
                                    {analytics.topVendors.map((vendor, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span className="text-slate-600 truncate max-w-[100px]" title={vendor.name}>{vendor.name}</span>
                                            </div>
                                            <span className="font-medium text-slate-900">{formatMoney(vendor.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Section: Recent Activity Table */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between min-h-[64px]">
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-4 w-full animate-in fade-in slide-in-from-top-2">
                                <span className="text-sm font-medium text-slate-700">{selectedIds.length} selected</span>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <button
                                    onClick={handleBulkExport}
                                    disabled={exporting}
                                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                                    Export Selected to Excel
                                </button>
                                <div className="flex-1"></div>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-base font-semibold leading-6 text-slate-900">Recent Activity</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchData()}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                                        title="Refresh List"
                                    >
                                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="min-w-full whitespace-nowrap text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={documents.length > 0 && selectedIds.length === documents.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(documents.map(d => d.id));
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 font-medium">Document Name</th>
                                    <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                    <th scope="col" className="px-6 py-3 font-medium">Date</th>
                                    <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            Loading documents...
                                        </td>
                                    </tr>
                                ) : documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            No documents found. Upload one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => (
                                        <tr key={doc.id} className={cn("hover:bg-slate-50/80 transition-colors", selectedIds.includes(doc.id) && "bg-indigo-50/30")}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={selectedIds.includes(doc.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds(prev => [...prev, doc.id]);
                                                        } else {
                                                            setSelectedIds(prev => prev.filter(id => id !== doc.id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-lg">
                                                    <File className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <a href={`/dashboard/documents/${doc.id}`} className="hover:text-indigo-600 hover:underline">
                                                    {doc.originalFileName}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(doc.status)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Section: Upload */}
                <div className="lg:col-span-1">
                    <div
                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                            } p-12 text-center h-full min-h-[300px]`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        <div className={`rounded-full p-4 mb-4 transition-all duration-300 ${isDragOver ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                            <UploadCloud className="h-10 w-10" />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900">Upload new document</h3>
                        <p className="mt-2 text-sm text-slate-500 max-w-[200px] mx-auto">
                            Drag and drop your files here, or <label htmlFor="file-upload" className="text-indigo-600 hover:text-indigo-500 font-medium cursor-pointer hover:underline">browse</label> to upload.
                        </p>
                        <p className="mt-4 text-xs text-slate-400 uppercase tracking-wide">
                            PDF, DOCX, JPG supported
                        </p>

                        {/* Status Indicator */}
                        {uploadStatus === 'uploading' && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                                    <p className="text-sm font-medium text-indigo-600">Uploading...</p>
                                </div>
                            </div>
                        )}
                        {uploadStatus === 'success' && (
                            <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                    <p className="text-lg font-medium text-emerald-700">Upload Complete!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
