// src/types/api.ts

// --- AUTH TYPES ---
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    department: string;
}

export interface AuthResponse {
    token: string;
    userId: string;
    fullName: string;
}

// --- DOCUMENT TYPES ---
// Belge yüklendiğinde dönen cevap (Swagger'da net değil ama genelde ID döner)
export interface DocumentUploadResponse {
    documentId: string;
    // Backend boş dönüyorsa burası any veya void olabilir
}

export enum DocumentStatus {
    Uploaded = 0,
    Processing = 1,
    Approved = 2,
    Error = 3
}

export interface DocumentDto {
    id: string;
    originalFileName: string;
    status: DocumentStatus;
    uploadedAt: string;
    uploadedBy: string;
    storagePath?: string;
}

// --- EXTRACTION TYPES ---
export interface ExtractedTable {
    name: string;
    rows: Record<string, any>[];
}

export interface ExtractionResult {
    documentType: string;
    summary: string;
    fields: Record<string, any>; // Esnek anahtar-değer yapısı (String, Number, Array olabilir)
    tables: ExtractedTable[];    // Birden fazla tabloyu destekler
}

// --- AUDIT TYPES ---
export interface AuditHistoryItem {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    userId: string;
    // Swagger çıktısına göre ek alanlar olabilir
}

export interface UpdateFieldRequest {
    documentId: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    reason: string;
    userId: string;
}

// --- SEARCH TYPES ---
export interface SearchResult {
    // Elasticsearch'ten dönen yapı
    id: string;
    content: string;
    metadata: any;
}

// --- ANALYTICS TYPES ---
export interface AnalyticsData {
    totalDocuments: number;
    totalSpend: number;
    monthlyTrend: { month: string; amount: number }[];
    topVendors: { name: string; amount: number }[];
}