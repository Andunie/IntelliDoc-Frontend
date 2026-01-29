import api from './axios';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UpdateFieldRequest,
    ExtractionResult,
    SearchResult,
    DocumentDto,
    AnalyticsData
} from '@/types/api';

export const authService = {
    login: async (data: LoginRequest) => {
        const response = await api.post<AuthResponse>('/login', null, {
            params: {
                Email: data.email,
                Password: data.password
            }
        });
        return response.data;
    },

    // SWAGGER: POST /register?Email=...
    register: async (data: RegisterRequest) => {
        const response = await api.post('/register', null, {
            params: {
                Email: data.email,
                Password: data.password,
                FullName: data.fullName,
                Department: data.department
            }
        });
        return response.data;
    },

    // SWAGGER: POST /auth/confirm-email
    confirmEmail: async (userId: string, token: string) => {
        const response = await api.post('/confirm-email', { userId, token });
        return response.data;
    },

    // SWAGGER: POST /auth/forgot-password
    forgotPassword: async (email: string) => {
        const response = await api.post('/forgot-password', { email });
        return response.data;
    },

    // SWAGGER: POST /auth/reset-password
    resetPassword: async (email: string, token: string, newPassword: string) => {
        const response = await api.post('/reset-password', { email, token, newPassword });
        return response.data;
    }
};

export const documentService = {
    // SWAGGER: POST /api/documents (Multipart/Form-Data)
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Handoff Raporuna göre extraction endpointi
    getExtractionResult: async (id: string) => {
        // Backend returns: { jsonData: string, rawText: string, ... }
        const response = await api.get<any>(`/api/extraction/${id}`);
        const rawData = response.data;

        let parsedData: any = null;

        // Helper to clean Markdown code blocks (```json ... ```)
        const cleanJsonString = (str: string) => {
            if (!str) return "";
            return str
                .replace(/^```json\s*/, "") // Remove starting ```json
                .replace(/^```\s*/, "")     // Remove starting ```
                .replace(/\s*```$/, "")     // Remove ending ```
                .trim();
        };

        try {
            // Priority 1: Use rawText if available
            if (rawData.rawText) {
                const textToParse = typeof rawData.rawText === 'string' ? rawData.rawText : JSON.stringify(rawData.rawText);
                parsedData = JSON.parse(cleanJsonString(textToParse));
            }
            // Priority 2: Use jsonData
            else if (rawData.jsonData) {
                const innerData = typeof rawData.jsonData === 'string' ? JSON.parse(rawData.jsonData) : rawData.jsonData;

                // If nested inside 'text' property (and that text is a string)
                if (innerData.text && typeof innerData.text === 'string') {
                    parsedData = JSON.parse(cleanJsonString(innerData.text));
                } else {
                    parsedData = innerData;
                }
            }
        } catch (e) {
            console.error("JSON Parsing Error inside getExtractionResult:", e);
        }

        if (parsedData) {
            // Map PascalCase fields from backend to our interface

            // 1. FIELDS: Support both 'Fields' and 'Entities'
            //    Also: FLATTEN nested objects (like CV sections) so they show up in the UI form
            const rawFields = parsedData.Fields || parsedData.Entities || {};

            const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
                let result: Record<string, any> = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const newKey = prefix ? `${prefix}.${key}` : key;
                        const value = obj[key];

                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            // Recursively flatten objects (e.g. PersonalInformation.Name)
                            const flatObject = flattenObject(value, newKey);
                            result = { ...result, ...flatObject };
                        } else {
                            // Keep arrays and primitives as is
                            result[newKey] = value;
                        }
                    }
                }
                return result;
            };

            const finalFields = flattenObject(rawFields);

            // 2. TABLES: Support both 'Tables' and 'LineItems'
            let finalTables: any[] = [];

            if (parsedData.Tables && Array.isArray(parsedData.Tables)) {
                finalTables = parsedData.Tables.map((t: any) => ({
                    name: t.Name || "Table",
                    rows: t.Rows || []
                }));
            } else if (parsedData.LineItems && Array.isArray(parsedData.LineItems)) {
                finalTables = [{
                    name: "Line Items",
                    rows: parsedData.LineItems
                }];
            }

            return {
                documentType: parsedData.DocumentType || "Unknown",
                summary: parsedData.Summary || "",
                fields: finalFields,
                tables: finalTables
            } as ExtractionResult;
        }

        console.warn("Could not parse backend response, returning empty safe object.", rawData);
        // Return safe empty object instead of throwing to prevent crashing UI
        return {
            documentType: "Processing...",
            summary: "Data extraction is in progress or failed.",
            fields: {},
            tables: []
        };
    },

    getAll: async () => {
        const response = await api.get<DocumentDto[]>('/api/documents');
        return response.data;
    },

    // Yeni Eklenen: Kullanıcının kendi belgelerini listele
    getMyDocuments: async () => {
        const response = await api.get<DocumentDto[]>('/api/documents/mine');
        return response.data;
    },

    // Yeni Eklenen: Tekil belge getir
    getById: async (id: string) => {
        const response = await api.get<DocumentDto>(`/api/documents/${id}`);
        return response.data;
    },

    // Yeni Eklenen: İndirme/Görüntüleme Linki Getir (Presigned URL)
    getDownloadUrl: async (id: string) => {
        const response = await api.get<{ url: string }>(`/api/documents/${id}/download-url`);
        return response.data.url;
    },

    // Yeni Eklenen: Excel Export (Single)
    exportToExcel: async (documentId: string) => {
        const response = await api.get(`/api/extraction/${documentId}/export`, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Yeni Eklenen: Excel Export (Batch)
    exportBatch: async (documentIds: string[]) => {
        const response = await api.post('/api/extraction/export-batch', documentIds, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Yeni Eklenen: Dashboard Stats (Analytics)
    getDashboardStats: async () => {
        const response = await api.get<AnalyticsData>('/api/analytics/dashboard');
        return response.data;
    }
};

export const auditService = {
    // SWAGGER: GET /api/audit/history/{documentId}
    getHistory: async (documentId: string) => {
        const response = await api.get(`/api/audit/history/${documentId}`);
        return response.data;
    },

    // SWAGGER: POST /api/audit/update-field (JSON Body)
    updateField: async (data: UpdateFieldRequest) => {
        const response = await api.post('/api/audit/update-field', data);
        return response.data;
    },

    // SWAGGER: POST /api/audit/approve/{documentId}
    approveDocument: async (documentId: string) => {
        const response = await api.post(`/api/audit/approve/${documentId}`);
        return response.data;
    },

    // SWAGGER: GET /api/audit/logs
    getAllLogs: async () => {
        const response = await api.get<any[]>('/api/audit/logs');
        return response.data;
    }
};

export const searchService = {
    // SWAGGER: GET /api/search?q=...
    search: async (query: string) => {
        const response = await api.get<SearchResult[]>('/api/search', {
            params: { q: query }
        });
        return response.data;
    }
};

export interface WebhookConfig {
    endpointUrl: string;
    isActive: boolean;
    secret?: string;
}

export const settingsService = {
    // SWAGGER: GET /api/settings/webhook
    getWebhook: async () => {
        const response = await api.get<WebhookConfig>('/api/settings/webhook');
        return response.data;
    },

    // SWAGGER: POST /api/settings/webhook
    saveWebhook: async (data: { url: string; isActive: boolean }) => {
        const response = await api.post('/api/settings/webhook', data);
        return response.data;
    },

    // SWAGGER: POST /api/settings/webhook/test
    testWebhook: async () => {
        const response = await api.post('/api/settings/webhook/test');
        return response.data;
    }
};