"use client";

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-api';
import { Button } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Calendar,
  Home,
  LogOut,
  Menu,
  X,
  Mail,
  DollarSign,
  Activity,
  Send
} from 'lucide-react';
import * as XLSX from 'xlsx';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

interface Quote {
  id: string;
  email: string;
  message: string;
  status: 'pending' | 'replied';
  createdAt: string;
}

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [emailHtml, setEmailHtml] = useState('');
  const [replyModal, setReplyModal] = useState<{ open: boolean; quoteId: string; email: string; reply: string }>({
    open: false,
    quoteId: '',
    email: '',
    reply: ''
  });
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<Record<string, unknown>[]>([]);
  const [availablePlaceholders, setAvailablePlaceholders] = useState<string[]>(['name', 'email']);
  const [templates, setTemplates] = useState<{ name: string; subject: string; body: string; html: string; isHtmlMode: boolean }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [analytics, setAnalytics] = useState({
    userCount: 0,
    serviceCount: 0,
    bookingCount: 0,
    emailOpenRate: 0.72,
    emailClickRate: 0.38,
    emailBounceRate: 0.04
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: '',
    maintenanceMode: false,
    supportEmail: '',
    emailHost: '',
    emailPort: '',
    emailUser: '',
    emailPassword: '',
    emailFrom: '',
    emailSecure: false,
    emailReplyTo: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const { data: userData, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    fetchQuotes();
    const saved = localStorage.getItem('emailBlastTemplates');
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const map = Object.fromEntries((data.settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));
        setSettings({
          siteName: map.siteName || '',
          maintenanceMode: map.maintenanceMode === 'true',
          supportEmail: map.supportEmail || '',
          emailHost: map.emailHost || '',
          emailPort: map.emailPort || '',
          emailUser: map.emailUser || '',
          emailPassword: map.emailPassword || '',
          emailFrom: map.emailFrom || '',
          emailSecure: map.emailSecure === 'true',
          emailReplyTo: map.emailReplyTo || ''
        });
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics({
          userCount: data.userCount,
          serviceCount: data.serviceCount,
          bookingCount: data.bookingCount,
          emailOpenRate: data.emailOpenRate,
          emailClickRate: data.emailClickRate,
          emailBounceRate: data.emailBounceRate
        });
      }
    } catch {
      // fallback to dummy data
      setAnalytics({
        userCount: 1234,
        serviceCount: 87,
        bookingCount: 456,
        emailOpenRate: 0.72,
        emailClickRate: 0.38,
        emailBounceRate: 0.04
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setExcelFile(file || null);
    setParsedUsers([]);
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
        if (json.length > 0) {
          setAvailablePlaceholders(Object.keys(json[0]).map(k => k.toLowerCase()));
        }
        const users = json.map((row: Record<string, string>) => {
          const lowerRow: Record<string, string> = {};
          Object.keys(row).forEach(k => lowerRow[k.toLowerCase()] = row[k]);
          return lowerRow;
        }).filter((u: Record<string, string>) => u.email);
        setParsedUsers(users);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const sendEmailBlastWithExcel = async () => {
    if (!emailSubject || !(emailBody || emailHtml)) {
      toast.error('Please fill in both subject and body');
      return;
    }
    if (!excelFile) {
      toast.error('Please upload an Excel file');
      return;
    }
    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('subject', emailSubject);
    formData.append('message', emailBody);
    if (isHtmlMode && emailHtml) formData.append('html', emailHtml);
    try {
      const response = await fetch('/api/quotes/email-blast', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        toast.success('Email blast sent successfully!');
        setEmailSubject('');
        setEmailBody('');
        setEmailHtml('');
        setExcelFile(null);
        setParsedUsers([]);
      } else {
        toast.error('Failed to send email blast');
      }
    } catch (error) {
      toast.error('Error sending email blast');
    }
  };

  const openReplyModal = (quote: Quote) => {
    setReplyModal({
      open: true,
      quoteId: quote.id,
      email: quote.email,
      reply: ''
    });
  };

  const closeReplyModal = () => {
    setReplyModal({
      open: false,
      quoteId: '',
      email: '',
      reply: ''
    });
  };

  const sendReply = async () => {
    if (!replyModal.reply.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      const response = await fetch(`/api/quotes/${replyModal.quoteId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: replyModal.reply }),
      });

      if (response.ok) {
        toast.success('Reply sent successfully!');
        closeReplyModal();
        fetchQuotes(); // Refresh quotes
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      toast.error('Error sending reply');
    }
  };

  const saveTemplate = () => {
    const name = prompt('Template name?');
    if (!name) return;
    const newTemplate = { name, subject: emailSubject, body: emailBody, html: emailHtml, isHtmlMode };
    const updated = [...templates.filter(t => t.name !== name), newTemplate];
    setTemplates(updated);
    localStorage.setItem('emailBlastTemplates', JSON.stringify(updated));
    setSelectedTemplate(name);
  };

  const loadTemplate = (name: string) => {
    const t = templates.find(t => t.name === name);
    if (!t) return;
    setEmailSubject(t.subject);
    setEmailBody(t.body);
    setEmailHtml(t.html);
    setIsHtmlMode(t.isHtmlMode);
    setSelectedTemplate(name);
  };

  const deleteTemplate = (name: string) => {
    if (!window.confirm('Delete this template?')) return;
    const updated = templates.filter(t => t.name !== name);
    setTemplates(updated);
    localStorage.setItem('emailBlastTemplates', JSON.stringify(updated));
    setSelectedTemplate('');
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Enter a test email address');
      return;
    }
    setSendingTest(true);
    const formData = new FormData();
    formData.append('subject', emailSubject);
    formData.append('message', emailBody);
    if (isHtmlMode && emailHtml) formData.append('html', emailHtml);
    formData.append('to', testEmail);
    try {
      const response = await fetch('/api/quotes/email-blast-test', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        toast.success('Test email sent!');
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error) {
      toast.error('Error sending test email');
    } finally {
      setSendingTest(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    setSettingsSaving(true);
    try {
      const res = await fetch('/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        toast.success('Setting updated');
        fetchSettings();
      } else {
        toast.error('Failed to update setting');
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', icon: Home, id: 'dashboard' },
    { name: 'Quotes', icon: MessageSquare, id: 'quotes' },
    { name: 'Email Blast', icon: Mail, id: 'email-blast' },
    { name: 'Analytics', icon: BarChart3, id: 'analytics' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quotes</p>
              <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bookings</p>
              <p className="text-2xl font-bold text-gray-900">567</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$12,345</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {quotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    New quote from {quote.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    quote.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuotes = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Customer Quotes</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-600">No quotes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{quote.email}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    quote.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{quote.message}</p>
                {quote.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openReplyModal(quote)}
                      className="text-sm"
                    >
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderEmailBlast = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Email Blast</h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center mb-4 gap-2">
          <select
            value={selectedTemplate}
            onChange={e => loadTemplate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Select template...</option>
            {templates.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={saveTemplate}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold"
          >Save Template</button>
          {selectedTemplate && (
            <button
              type="button"
              onClick={() => deleteTemplate(selectedTemplate)}
              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold"
            >Delete</button>
          )}
        </div>
        <div className="flex items-center mb-4 gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="Send test email to..."
            className="border rounded px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={sendTestEmail}
            disabled={sendingTest}
            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold disabled:opacity-50"
          >{sendingTest ? 'Sending...' : 'Send Test Email'}</button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email subject"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <div className="flex items-center mb-2">
            <span className="mr-2 text-xs">Plain Text</span>
            <input type="checkbox" checked={isHtmlMode} onChange={() => setIsHtmlMode(v => !v)} className="mr-2" />
            <span className="text-xs">HTML</span>
          </div>
          {!isHtmlMode ? (
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message (use {{name}} for personalization)"
            />
          ) : (
            <div className="bg-white border border-blue-300 rounded-md">
              <ReactQuill
                value={emailHtml}
                onChange={setEmailHtml}
                theme="snow"
                style={{ minHeight: 180 }}
                placeholder="Compose your HTML email (use {{name}} for personalization)"
              />
            </div>
          )}
        </div>
        {parsedUsers.length > 0 && availablePlaceholders.length > 0 && (
          <div className="mb-2 text-xs text-gray-600">
            <span className="font-semibold">Available placeholders:</span>
            {availablePlaceholders.map(ph => (
              <span key={ph} className="ml-2 px-2 py-1 bg-gray-200 rounded">{`{{${ph}}}`}</span>
            ))}
          </div>
        )}
        {isHtmlMode && emailHtml && (
          <div className="border rounded p-2 bg-gray-50">
            <div className="font-semibold mb-1">HTML Preview:</div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: availablePlaceholders.reduce((html, ph) =>
                  html.replace(new RegExp(`{{${ph}}}`, 'g'),
                    parsedUsers[0]?.[ph] ? `<span style='color:blue'>${String(parsedUsers[0][ph])}</span>` : `<span style='color:gray'>[${ph}]</span>`
                  ), emailHtml)
              }}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File (with columns: Name, Email)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {parsedUsers.length > 0 && (
          <div className="bg-gray-50 border rounded p-2 max-h-40 overflow-y-auto">
            <div className="font-semibold mb-1">Preview ({parsedUsers.length} users):</div>
            <ul className="text-xs">
              {parsedUsers.map((u, i) => (
                <li key={i}>{String(u.name)} ({String(u.email)})</li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={sendEmailBlastWithExcel} className="w-full">
          Send Email Blast
        </Button>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center"><BarChart3 className="mr-2" /> Analytics Dashboard</h2>
      {analyticsLoading ? (
        <div>Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <span className="text-4xl font-bold text-blue-600">{analytics.userCount.toLocaleString()}</span>
              <span className="mt-2 text-gray-600">Total Users</span>
            </div>
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <span className="text-4xl font-bold text-green-600">{analytics.serviceCount.toLocaleString()}</span>
              <span className="mt-2 text-gray-600">Total Services</span>
            </div>
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <span className="text-4xl font-bold text-purple-600">{analytics.bookingCount.toLocaleString()}</span>
              <span className="mt-2 text-gray-600">Total Bookings</span>
            </div>
          </div>
          <div className="bg-white rounded shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Email Campaign Stats</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>Email Open Rate</span>
                <span>{Math.round(analytics.emailOpenRate * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.round(analytics.emailOpenRate * 100)}%` }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>Email Click Rate</span>
                <span>{Math.round(analytics.emailClickRate * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${Math.round(analytics.emailClickRate * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Email Bounce Rate</span>
                <span>{Math.round(analytics.emailBounceRate * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: `${Math.round(analytics.emailBounceRate * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center"><Settings className="mr-2" /> Admin Settings</h2>
      {settingsLoading ? <div>Loading...</div> : (
        <form className="space-y-6">
          {/* General Settings */}
          <div>
            <label className="block font-medium mb-1">Site Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={settings.siteName}
              onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
              onBlur={e => saveSetting('siteName', e.target.value)}
              disabled={settingsSaving}
              placeholder="Household"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Support Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              value={settings.supportEmail}
              onChange={e => setSettings(s => ({ ...s, supportEmail: e.target.value }))}
              onBlur={e => saveSetting('supportEmail', e.target.value)}
              disabled={settingsSaving}
              placeholder="support@household.com"
            />
          </div>
          <div className="flex items-center">
            <label className="font-medium mr-4">Maintenance Mode</label>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={e => {
                setSettings(s => ({ ...s, maintenanceMode: e.target.checked }));
                saveSetting('maintenanceMode', String(e.target.checked));
              }}
              disabled={settingsSaving}
            />
            <span className="ml-2 text-sm text-gray-500">(Show maintenance banner to users)</span>
          </div>

          {/* Email Settings */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-xl font-semibold mb-2">Email Settings</h3>
            <p className="text-sm text-gray-500 mb-4">Configure SMTP for email blasts and replies. Changes take effect immediately.</p>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">SMTP Host</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={settings.emailHost}
                  onChange={e => setSettings(s => ({ ...s, emailHost: e.target.value }))}
                  onBlur={e => saveSetting('emailHost', e.target.value)}
                  disabled={settingsSaving}
                  placeholder="smtp.yourdomain.com"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">SMTP Port</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  value={settings.emailPort}
                  onChange={e => setSettings(s => ({ ...s, emailPort: e.target.value }))}
                  onBlur={e => saveSetting('emailPort', e.target.value)}
                  disabled={settingsSaving}
                  placeholder="465 or 587"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">SMTP User</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={settings.emailUser}
                  onChange={e => setSettings(s => ({ ...s, emailUser: e.target.value }))}
                  onBlur={e => saveSetting('emailUser', e.target.value)}
                  disabled={settingsSaving}
                  placeholder="user@yourdomain.com"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">SMTP Password</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="password"
                  value={settings.emailPassword}
                  onChange={e => setSettings(s => ({ ...s, emailPassword: e.target.value }))}
                  onBlur={e => saveSetting('emailPassword', e.target.value)}
                  disabled={settingsSaving}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">From Email Address</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="email"
                  value={settings.emailFrom}
                  onChange={e => setSettings(s => ({ ...s, emailFrom: e.target.value }))}
                  onBlur={e => saveSetting('emailFrom', e.target.value)}
                  disabled={settingsSaving}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div className="flex items-center">
                <label className="font-medium mr-4">Use SSL/TLS</label>
                <input
                  type="checkbox"
                  checked={settings.emailSecure}
                  onChange={e => {
                    setSettings(s => ({ ...s, emailSecure: e.target.checked }));
                    saveSetting('emailSecure', String(e.target.checked));
                  }}
                  disabled={settingsSaving}
                />
                <span className="ml-2 text-sm text-gray-500">(Usually true for port 465, false for 587)</span>
              </div>
              <div>
                <label className="block font-medium mb-1">Reply-To Address (optional)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="email"
                  value={settings.emailReplyTo}
                  onChange={e => setSettings(s => ({ ...s, emailReplyTo: e.target.value }))}
                  onBlur={e => saveSetting('emailReplyTo', e.target.value)}
                  disabled={settingsSaving}
                  placeholder="support@yourdomain.com"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'quotes':
        return renderQuotes();
      case 'email-blast':
        return renderEmailBlast();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData?.user || userData.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation - scrollable */}
          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <div className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              ))}
            </div>
          </nav>

          {/* User section - fixed at bottom */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{userData.user.name}</p>
                <p className="text-xs text-gray-500">{userData.user.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full flex items-center justify-center"
              variant="outline"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 lg:hidden" />
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900 capitalize">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Reply to {replyModal.email}
                    </h3>
                    <div className="mt-2">
                      <textarea
                        value={replyModal.reply}
                        onChange={(e) => setReplyModal({ ...replyModal, reply: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your reply message..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={sendReply}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </Button>
                <Button
                  onClick={closeReplyModal}
                  variant="outline"
                  className="w-full sm:w-auto mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 