'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { getCachedJWT } from '@/lib/appwrite';
import {
    User,
    Mail,
    Shield,
    Bell,
    Moon,
    Sun,
    Monitor,
    Save,
    Loader2,
    Zap,
    Lock,
    Globe,
    Palette
} from 'lucide-react';
import { toast } from 'react-toastify';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'tutobuddy-theme';
const NOTIFICATION_STORAGE_KEY = 'tutobuddy-notification-preferences';

const applyTheme = (theme: ThemeMode) => {
    if (typeof document === 'undefined') return;

    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
};

const ThemeButton = ({
    active,
    onClick,
    icon: Icon,
    title,
    description,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    title: string;
    description: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
            active
                ? 'border-secondary bg-secondary/10 shadow-md shadow-secondary/10'
                : 'border-primary/10 bg-background/70 dark:bg-background/20 hover:border-secondary/30 hover:bg-surface/90 dark:hover:bg-surface-2/60'
        }`}
    >
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? 'bg-secondary text-white' : 'bg-primary/10 text-primary dark:text-cream'}`}>
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <p className="text-sm font-bold text-foreground dark:text-cream">{title}</p>
            <p className="text-xs text-foreground/55 dark:text-cream/55 leading-relaxed">{description}</p>
        </div>
    </button>
);

const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) => (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-background/70 dark:bg-background/20 p-4">
        <div>
            <p className="font-bold text-foreground dark:text-cream text-sm">{label}</p>
            <p className="text-xs text-foreground/55 dark:text-cream/55 mt-0.5">{description}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative h-7 w-12 rounded-full transition-all ${checked ? 'bg-secondary' : 'bg-gray-300 dark:bg-gray-700'}`}
            aria-pressed={checked}
            aria-label={label}
        >
            <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all ${checked ? 'left-6' : 'left-1'}`}
            />
        </button>
    </label>
);

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [smtpLoading, setSmtpLoading] = useState(false);
    const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; ready?: boolean; host?: string; fromEmail?: string } | null>(null);
    const showSmtpStatusCard = false;
    const [theme, setTheme] = useState<ThemeMode>('dark');
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [studyReminders, setStudyReminders] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
            setTheme(savedTheme);
            applyTheme(savedTheme);
            return;
        }

        const defaultTheme: ThemeMode = 'dark';
        setTheme(defaultTheme);
        localStorage.setItem(THEME_STORAGE_KEY, defaultTheme);
        applyTheme(defaultTheme);
    }, []);

    useEffect(() => {
        try {
            const savedPreferences = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
            if (!savedPreferences) return;

            const parsed = JSON.parse(savedPreferences);
            if (typeof parsed.emailAlerts === 'boolean') setEmailAlerts(parsed.emailAlerts);
            if (typeof parsed.studyReminders === 'boolean') setStudyReminders(parsed.studyReminders);
            if (typeof parsed.weeklySummary === 'boolean') setWeeklySummary(parsed.weeklySummary);
            if (typeof parsed.privacyMode === 'boolean') setPrivacyMode(parsed.privacyMode);
        } catch {
            // ignore invalid saved preferences
        }
    }, []);

    useEffect(() => {
        const fetchSmtpStatus = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/notifications/smtp-status`);
                setSmtpStatus(res.data);
            } catch {
                setSmtpStatus({ configured: false, ready: false });
            }
        };

        fetchSmtpStatus();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        localStorage.setItem(THEME_STORAGE_KEY, theme);
        applyTheme(theme);

        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const preferenceSummary = useMemo(() => {
        const enabled = [emailAlerts, studyReminders, weeklySummary, privacyMode].filter(Boolean).length;
        return `${enabled} active preference${enabled === 1 ? '' : 's'}`;
    }, [emailAlerts, studyReminders, weeklySummary, privacyMode]);

    const handleSave = () => {
        setLoading(true);

        setTimeout(() => {
            try {
                localStorage.setItem(
                    NOTIFICATION_STORAGE_KEY,
                    JSON.stringify({
                        emailAlerts,
                        studyReminders,
                        weeklySummary,
                        privacyMode
                    })
                );
            } catch {
                // ignore localStorage failures
            }

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('TutorBuddy settings saved', {
                    body: 'Your notification preferences have been updated successfully.'
                });
            }

            setLoading(false);
            toast.success('Settings saved successfully!');
        }, 700);
    };

    const handleTestEmail = async () => {
        setSmtpLoading(true);
        try {
            const jwt = await getCachedJWT();
            const res = await axios.post(`${API_URL}/api/notifications/test-email`, {}, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success(res.data?.message || 'Test email sent successfully!');
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || 'Failed to send test email.'
                : 'Failed to send test email.';
            toast.error(message);
        } finally {
            setSmtpLoading(false);
        }
    };

    const handleEnableBrowserNotifications = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            toast.error('Your browser does not support notifications.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('TutorBuddy notifications enabled', {
                    body: 'You will now receive browser alerts for new study updates.'
                });
                toast.success('Browser notifications enabled!');
            } else {
                toast.info('Browser notifications were not enabled.');
            }
        } catch {
            toast.error('Unable to request notification permission.');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="rounded-3xl border border-primary/10 bg-linear-to-br from-primary/10 via-background to-secondary/10 p-6 md:p-8 shadow-sm">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-foreground dark:text-cream">Settings</h1>
                    <p className="text-foreground/60 dark:text-cream/60">Manage your account, appearance, and study preferences.</p>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface/90 dark:bg-surface-2/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary">
                    <Zap className="h-3.5 w-3.5" />
                    {preferenceSummary}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl border border-primary/10 bg-surface/90 dark:bg-surface-2/90 p-6 shadow-sm">
                        <h3 className="mb-6 flex items-center text-lg font-bold text-foreground dark:text-cream">
                            <User className="mr-2 h-5 w-5 text-primary dark:text-secondary" />
                            Profile Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.name || ''}
                                    className="w-full rounded-xl border-none bg-background/70 px-4 py-3 font-medium text-foreground outline-none focus:ring-2 focus:ring-secondary dark:bg-background/20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email || ''}
                                    disabled
                                    className="w-full cursor-not-allowed rounded-xl border-none bg-gray-100 px-4 py-3 font-medium text-foreground/45 dark:bg-gray-800/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-primary/10 bg-surface/90 dark:bg-surface-2/90 p-6 shadow-sm">
                        <h3 className="mb-6 flex items-center text-lg font-bold text-foreground dark:text-cream">
                            <Palette className="mr-2 h-5 w-5 text-secondary" />
                            Appearance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ThemeButton
                                active={theme === 'light'}
                                onClick={() => setTheme('light')}
                                icon={Sun}
                                title="Light"
                                description="Bright cream surfaces with green and orange accents."
                            />
                            <ThemeButton
                                active={theme === 'dark'}
                                onClick={() => setTheme('dark')}
                                icon={Moon}
                                title="Dark"
                                description="Deep green surfaces with high-contrast text."
                            />
                            <ThemeButton
                                active={theme === 'system'}
                                onClick={() => setTheme('system')}
                                icon={Monitor}
                                title="System"
                                description="Follow your device's theme automatically."
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-primary/10 bg-surface/90 dark:bg-surface-2/90 p-6 shadow-sm">
                        <h3 className="mb-6 flex items-center text-lg font-bold text-foreground dark:text-cream">
                            <Bell className="mr-2 h-5 w-5 text-secondary" />
                            Notification Preferences
                        </h3>
                        <div className="space-y-4">
                            <ToggleRow
                                label="Email Alerts"
                                description="Receive important account and course updates by email."
                                checked={emailAlerts}
                                onChange={setEmailAlerts}
                            />
                            <ToggleRow
                                label="Study Reminders"
                                description="Get nudges for upcoming deadlines and study sessions."
                                checked={studyReminders}
                                onChange={setStudyReminders}
                            />
                            <ToggleRow
                                label="Weekly Summary"
                                description="See a summary of your learning progress every week."
                                checked={weeklySummary}
                                onChange={setWeeklySummary}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleEnableBrowserNotifications}
                            className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/10 bg-background/70 px-4 py-3 text-sm font-bold text-foreground transition-all hover:border-secondary/30 hover:bg-surface/90 dark:bg-background/20 dark:text-cream"
                        >
                            <Bell className="h-4 w-4 text-secondary" />
                            Enable Browser Notifications
                        </button>
                    </div>

                    <div className="rounded-3xl border border-primary/10 bg-surface/90 dark:bg-surface-2/90 p-6 shadow-sm">
                        <h3 className="mb-6 flex items-center text-lg font-bold text-foreground dark:text-cream">
                            <Shield className="mr-2 h-5 w-5 text-primary dark:text-secondary" />
                            Privacy & Security
                        </h3>
                        <ToggleRow
                            label="Privacy Mode"
                            description="Hide sensitive details in shared or public views."
                            checked={privacyMode}
                            onChange={setPrivacyMode}
                        />
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-background/70 px-4 py-3 text-sm font-bold text-foreground transition-all hover:border-secondary/30 hover:bg-surface/90 dark:bg-background/20 dark:text-cream"
                            >
                                <Mail className="h-4 w-4 text-secondary" />
                                Update Email
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-background/70 px-4 py-3 text-sm font-bold text-foreground transition-all hover:border-secondary/30 hover:bg-surface/90 dark:bg-background/20 dark:text-cream"
                            >
                                <Lock className="h-4 w-4 text-primary dark:text-secondary" />
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-linear-to-br from-primary to-secondary p-6 text-white shadow-xl shadow-secondary/20">
                        <h3 className="mb-2 text-xl font-bold">Save Changes</h3>
                        <p className="text-cream/90 text-sm leading-relaxed">
                            Your preferences are ready to be applied across the whole app.
                        </p>
                        <button
                            type="button"
                            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-secondary shadow-lg transition-all hover:bg-cream"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Settings
                        </button>
                    </div>

                    {showSmtpStatusCard && (
                    <div className="rounded-3xl border border-primary/10 bg-surface/90 dark:bg-surface-2/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <p className="text-sm font-bold text-foreground dark:text-cream">Brevo SMTP Status</p>
                                <p className="text-xs text-foreground/55 dark:text-cream/55">Check whether your SMTP settings are ready.</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${smtpStatus?.configured ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                {smtpStatus?.configured ? 'Connected' : 'Not Configured'}
                            </span>
                        </div>
                        <div className="space-y-2 text-xs text-foreground/60 dark:text-cream/60">
                            <p>Host: {smtpStatus?.host || 'smtp-relay.brevo.com'}</p>
                            <p>Sender: {smtpStatus?.fromEmail || 'Not set yet'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleTestEmail}
                            disabled={smtpLoading || !smtpStatus?.configured}
                            className="mt-4 flex w-full items-center justify-center rounded-2xl border border-primary/10 bg-background/70 px-4 py-3 text-sm font-bold text-foreground transition-all hover:border-secondary/30 hover:bg-surface/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-background/20 dark:text-cream"
                        >
                            {smtpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4 text-secondary" />}
                            Send Test Email
                        </button>
                    </div>
                    )}

                    <div className="rounded-3xl border border-primary/10 bg-surface/90 dark:bg-surface-2/90 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-cream">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground dark:text-cream">Language</p>
                                <p className="text-xs text-foreground/55 dark:text-cream/55">English (Nigeria)</p>
                            </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-dashed border-primary/15 bg-background/60 p-4 text-sm text-foreground/60 dark:bg-background/15">
                            More account and study controls can be added here later — notifications, accessibility, backup, and exam mode.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
