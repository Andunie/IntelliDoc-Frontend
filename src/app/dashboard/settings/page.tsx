'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Webhook, Activity, Save } from 'lucide-react';
import { settingsService, WebhookConfig } from '@/lib/api';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [config, setConfig] = useState<WebhookConfig>({
        endpointUrl: '',
        isActive: false
    });
    // Track the last saved state to detect changes
    const [savedConfig, setSavedConfig] = useState<WebhookConfig | null>(null);

    // Derived state for unsaved changes
    const isDirty = !savedConfig ||
        config.endpointUrl !== savedConfig.endpointUrl ||
        config.isActive !== savedConfig.isActive;

    useEffect(() => {
        const loadSettings = async () => {
            const data = await settingsService.getWebhook();
            if (data) {
                const loadedConfig = {
                    endpointUrl: data.endpointUrl || '',
                    isActive: data.isActive || false,
                    secret: data.secret
                };
                setConfig(loadedConfig);
                setSavedConfig(loadedConfig);
            }
            setLoading(false);
        };
        loadSettings().catch(error => {
            console.error('Failed to load settings:', error);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (!config.endpointUrl && config.isActive) {
            toast.error('Please enter a Webhook URL to activate integration.');
            return;
        }

        setSaving(true);
        try {
            await settingsService.saveWebhook({
                url: config.endpointUrl,
                isActive: config.isActive
            });
            // Update savedConfig to match current config after successful save
            setSavedConfig({ ...config });
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!config.endpointUrl) {
            toast.error('Please enter a Webhook URL first.');
            return;
        }

        if (isDirty) {
            toast.error('Please save your changes before testing.');
            return;
        }

        setTesting(true);
        try {
            await settingsService.testWebhook();
            toast.success('Test payload sent! Check your logs.');
        } catch (error: any) {
            console.error('Test Webhook Error:', error);
            if (error.response?.status === 400) {
                toast.error('Invalid configuration. Please ensure settings are saved.');
            } else {
                toast.error('Test failed. Check the URL and try again.');
            }
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Integration Settings</h1>
                <p className="text-slate-500">Manage your external integrations and webhooks.</p>
            </div>

            {/* Content */}
            <div className="grid gap-6 max-w-2xl">

                {/* Webhook Card */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Webhook className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Webhook Configuration</h2>
                            <p className="text-sm text-slate-500">Real-time event notifications</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Info Box */}
                        <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-4 flex gap-3 text-blue-700">
                            <Activity className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium mb-1">How it works</p>
                                <p className="text-blue-600/90 leading-relaxed">
                                    When a document is approved, we will send a <span className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">POST</span> request with the JSON data to the URL specified below.
                                </p>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="webhook-url" className="text-sm font-medium text-slate-700">
                                    Webhook URL
                                </label>
                                <div className="relative">
                                    <input
                                        id="webhook-url"
                                        type="url"
                                        placeholder="https://api.yourcompany.com/webhook"
                                        value={config.endpointUrl}
                                        onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                                <div className="space-y-0.5">
                                    <label htmlFor="active-mode" className="text-sm font-medium text-slate-700 block">
                                        Active Status
                                    </label>
                                    <p className="text-xs text-slate-500">
                                        Enable or disable this integration
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="active-mode"
                                            className="sr-only peer"
                                            checked={config.isActive}
                                            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                                            disabled={loading}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={handleTest}
                                disabled={testing || loading || !config.endpointUrl || isDirty}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                title={isDirty ? "Please save changes before testing" : "Send a test payload"}
                            >
                                {testing ? (
                                    'Testing...'
                                ) : (
                                    <>
                                        <Activity className="mr-2 h-4 w-4" />
                                        Test Connection
                                    </>
                                )}
                            </button>
                            {isDirty && config.endpointUrl && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                    Save changes to test
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm shadow-indigo-200"
                        >
                            {saving ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
