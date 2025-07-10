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

interface NavigationItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  external?: boolean;
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
  const [sendingBlast, setSendingBlast] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
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

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModal, setUserModal] = useState<{ open: boolean; mode: 'view' | 'edit' | 'assign' }>({
    open: false,
    mode: 'view'
  });
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'customers' | 'employees' | 'admins'>('all');
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);

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

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchAvailableEmployees();
    }
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/settings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/analytics', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
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

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/users?role=EMPLOYEE', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableEmployees(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
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
      toast.error('Please fill in subject and message');
      return;
    }
    if (parsedUsers.length === 0) {
      toast.error('Please upload an Excel file with user data');
      return;
    }

    setSendingBlast(true);
    try {
      const emails = parsedUsers.map(u => u.email).filter(Boolean);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/email-blast', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          html: emailHtml,
          isHtmlMode,
          emails
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(`Email blast sent to ${data.sentCount} recipients`);
        setEmailSubject('');
        setEmailBody('');
        setEmailHtml('');
        setIsHtmlMode(false);
        setExcelFile(null);
        setParsedUsers([]);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send email blast');
      }
    } catch (error) {
      toast.error('Error sending email blast');
    } finally {
      setSendingBlast(false);
    }
  };

  const sendQuoteReply = async () => {
    if (!replyModal.reply.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${replyModal.quoteId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: replyModal.reply,
          email: replyModal.email
        })
      });

      if (res.ok) {
        toast.success('Reply sent successfully');
        closeReplyModal();
        fetchQuotes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send reply');
      }
    } catch (error) {
      toast.error('Error sending reply');
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

  const loadFixwellTemplate = () => {
    setEmailSubject('🚀 Transform Your Home with Fixwell - Professional Maintenance for Just $39/Month');
    setEmailBody(`Hi {{name}},

🏠 TIRED OF ENDLESS HOME REPAIR STRESS? 🏠

We get it. That dripping faucet, squeaky door, or flickering light has been on your "to-do" list for months. Finding a reliable handyman shouldn't feel like a part-time job.

What if you had a professional fix-it team on speed dial?

🎯 INTRODUCING FIXWELL SUBSCRIPTION SERVICES
Your home's personal maintenance team that keeps everything running smoothly, so you can focus on what matters most.

📋 CHOOSE YOUR PERFECT PLAN:

🔧 STARTER PLAN - $39/month
Perfect for light upkeep & peace of mind
• Quarterly visits (up to 30 minutes each)
• Minor repairs, lightbulb changes, safety checks
• FREE annual home inspection ($200 value)
• Priority scheduling when you need us
• 24/7 emergency support

🏠 HOMECARE PLAN - $59/month ⭐ MOST POPULAR
Monthly help for ongoing maintenance
• Monthly visits (up to 1 hour each)
• Everything in Starter PLUS gutter cleaning, seasonal maintenance
• Small drywall repairs, caulking, weather stripping
• 10% off larger projects
• Emergency visits at standard rates
• FREE annual deep cleaning service

⭐ PRIORITY PLAN - $150/month
For homeowners who want their home proactively managed
• 2 visits monthly (up to 2 hours total)
• Everything above PLUS same-week emergency callouts
• Smart home setup, TV mounting, furniture assembly
• FREE consumables included (caulk, screws, anchors)
• 15% off renovations and major projects
• Dedicated account manager

💎 WHY FIXWELL MEMBERS LOVE US:
✅ No More Contractor Hunting - We're already your trusted team
✅ Proactive Maintenance - We catch problems before they become expensive
✅ Predictable Costs - No surprise bills or inflated "emergency" rates
✅ Quality Guaranteed - Professional service you can count on
✅ Fully Insured & Bonded - Your home is protected
✅ Same-Day Response - We're here when you need us

📊 REAL RESULTS FROM REAL CUSTOMERS:

"I used to dread my growing fix-it list. Now I just text Fixwell and it's handled. Best $59 I spend each month! They've saved me thousands in potential damage." - Sarah M., Homeowner

"They caught a small leak that could have cost me thousands. The subscription paid for itself in one visit. My home has never been better maintained." - Mike T., Property Owner

"Finally, a service that actually shows up when they say they will. Fixwell has transformed how I think about home maintenance." - Jennifer L., Busy Professional

🔥 LIMITED TIME OFFER: FIRST MONTH ONLY $19! 🔥

Ready to never stress about home repairs again?

📞 Questions? Call us: (555) 123-4567
🌐 Learn more: www.fixwell.com
📧 Email us: hello@fixwell.com

💡 P.S. Current subscribers get 10% off when they refer friends. Know someone who needs Fixwell? Send them our way!

🔧 Already have a handyman? No problem! Our subscription works alongside major projects - we handle the small stuff so your contractor can focus on the big jobs.

Best regards,
The Fixwell Team
"Making homes better, one fix at a time"`);
    
    setEmailHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Fixwell Subscription Services</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8fafc;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.07);margin:24px 0;"><tr><td align="center" style="background:#2563eb;padding:32px 0 16px 0;border-radius:12px 12px 0 0;"><span style="font-size:40px;">🔧</span><h1 style="color:#fff;margin:12px 0 0 0;font-size:28px;font-weight:bold;">Fixwell</h1><p style="color:#e0e7ff;margin:8px 0 0 0;font-size:16px;">Your Home's Personal Fix-It Team</p></td></tr><tr><td style="padding:32px 24px 0 24px;"><h2 style="color:#1f2937;margin:0 0 18px 0;font-size:22px;font-weight:600;">Hi {{name}},</h2><p style="color:#4b5563;line-height:1.7;font-size:16px;margin:0 0 18px 0;">Tired of endless home repair stress? Let Fixwell handle your to-do list with professional, reliable, and affordable home maintenance.</p></td></tr><tr><td style="padding:0 24px 0 24px;"><!-- Benefits Section --> <h3 style="color:#1f2937;margin:24px 0 12px 0;font-size:20px;font-weight:600;text-align:left;">💎 WHY FIXWELL MEMBERS LOVE US</h3><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;background:#f0fdf4;border-radius:10px;border:2px solid #16a34a;padding:16px;"><tr><td style="width:32px;padding:8px 0;vertical-align:top;"><span style="font-size:20px;color:#16a34a;">✅</span></td><td style="color:#4b5563;font-weight:500;font-size:16px;padding:8px 0;vertical-align:middle;">No More Contractor Hunting</td></tr><tr><td style="width:32px;padding:8px 0;vertical-align:top;"><span style="font-size:20px;color:#16a34a;">✅</span></td><td style="color:#4b5563;font-weight:500;font-size:16px;padding:8px 0;vertical-align:middle;">Proactive Maintenance</td></tr><tr><td style="width:32px;padding:8px 0;vertical-align:top;"><span style="font-size:20px;color:#16a34a;">✅</span></td><td style="color:#4b5563;font-weight:500;font-size:16px;padding:8px 0;vertical-align:middle;">Predictable Costs</td></tr><tr><td style="width:32px;padding:8px 0;vertical-align:top;"><span style="font-size:20px;color:#16a34a;">✅</span></td><td style="color:#4b5563;font-weight:500;font-size:16px;padding:8px 0;vertical-align:middle;">Quality Guaranteed</td></tr><tr><td style="width:32px;padding:8px 0;vertical-align:top;"><span style="font-size:20px;color:#16a34a;">✅</span></td><td style="color:#4b5563;font-weight:500;font-size:16px;padding:8px 0;vertical-align:middle;">Fully Insured &amp; Bonded</td></tr><tr><td style="width:32px;padding:8px 0;vertical-align:top;"><span style="font-size:20px;color:#16a34a;">✅</span></td><td style="color:#4b5563;font-weight:500;font-size:16px;padding:8px 0;vertical-align:middle;">Same-Day Response</td></tr></table></td></tr><tr><td style="padding:0 24px 0 24px;"><!-- Testimonials --><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="padding:0 0 12px 0;"><em style="color:#4b5563;font-size:15px;">"I used to dread my growing fix-it list. Now I just text Fixwell and it's handled. Best $59 I spend each month! They've saved me thousands in potential damage."</em><br><span style="color:#6b7280;font-size:14px;">- Sarah M., Homeowner</span></td></tr><tr><td style="padding:0 0 12px 0;"><em style="color:#4b5563;font-size:15px;">"They caught a small leak that could have cost me thousands. The subscription paid for itself in one visit. My home has never been better maintained."</em><br><span style="color:#6b7280;font-size:14px;">- Mike T., Property Owner</span></td></tr><tr><td style="padding:0 0 12px 0;"><em style="color:#4b5563;font-size:15px;">"Finally, a service that actually shows up when they say they will. Fixwell has transformed how I think about home maintenance."</em><br><span style="color:#6b7280;font-size:14px;">- Jennifer L., Busy Professional</span></td></tr></table></td></tr><tr><td style="padding:0 24px 0 24px;"><!-- Offer/CTA --><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:2px solid #f59e0b;border-radius:10px;margin-bottom:24px;"><tr><td align="center" style="padding:20px 10px;"><span style="font-size:18px;font-weight:bold;color:#b45309;">🔥 LIMITED TIME OFFER: FIRST MONTH ONLY $19! 🔥</span><br><span style="color:#92400e;font-size:15px;">Ready to never stress about home repairs again?</span><br><a href="https://www.fixwell.com" style="display:inline-block;margin-top:14px;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">🚀 CHOOSE YOUR PLAN NOW</a></td></tr></table></td></tr><tr><td style="padding:0 24px 0 24px;"><!-- Contact Info --><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="font-size:15px;padding:6px 0;"><span style="font-size:18px;">📞</span> <b>Questions? Contact us:</b></td></tr><tr><td style="font-size:15px;padding:6px 0;"><span style="font-size:18px;">📞</span> Call us: <a href="tel:5551234567" style="color:#2563eb;text-decoration:none;">(555) 123-4567</a></td></tr><tr><td style="font-size:15px;padding:6px 0;"><span style="font-size:18px;">🌐</span> Learn more: <a href="https://www.fixwell.com" style="color:#2563eb;text-decoration:none;">www.fixwell.com</a></td></tr><tr><td style="font-size:15px;padding:6px 0;"><span style="font-size:18px;">✉️</span> Email us: <a href="mailto:hello@fixwell.com" style="color:#2563eb;text-decoration:none;">hello@fixwell.com</a></td></tr></table></td></tr><tr><td style="padding:0 24px 24px 24px;"><!-- Referrals --><table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9c3;border-radius:10px;"><tr><td style="padding:16px 10px;"><span style="font-size:18px;">💡</span> <b>P.S. - Special Offer for Referrals!</b><br><span style="font-size:15px;">Current subscribers get <b>10% off their next month</b> when they refer friends. Know someone who needs Fixwell? Send them our way!<br>Already have a handyman? No problem! Our subscription works alongside major projects - we handle the small stuff so your contractor can focus on the big jobs.</span></td></tr></table></td></tr><tr><td align="center" style="background:#1f2937;padding:24px;border-radius:0 0 12px 12px;"><span style="color:#fff;font-size:16px;font-style:italic;">"Making homes better, one fix at a time"</span><br><span style="color:#9ca3af;font-size:13px;">© 2024 Fixwell Inc. All rights reserved.</span></td></tr></table></td></tr></table></body></html>`);
    setIsHtmlMode(true);
    setSelectedTemplate('Fixwell Subscription Template');
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Enter a test email address');
      return;
    }
    setSendingTest(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/quotes/email-blast-test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: emailSubject,
          message: emailBody,
          html: isHtmlMode && emailHtml ? emailHtml : undefined,
          to: testEmail
        }),
      });
      if (response.ok) {
        toast.success('Test email sent!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Error sending test email');
    } finally {
      setSendingTest(false);
    }
  };

  const sendSubscriptionMarketingBlast = async () => {
    if (!excelFile && (!emails || emails.length === 0)) {
      toast.error('Please upload an Excel file or enter email addresses');
      return;
    }
    
    if (!window.confirm('Send subscription marketing email to all recipients?')) {
      return;
    }

    setSendingBlast(true);
    const formData = new FormData();
    if (excelFile) {
      formData.append('file', excelFile);
    } else if (emails) {
      emails.forEach(email => formData.append('emails', email));
    }
    formData.append('planType', 'all');

    try {
      const response = await fetch('/api/quotes/subscription-marketing-blast', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Subscription marketing blast sent to ${result.sent} recipients!`);
        setExcelFile(null);
        setEmails([]);
      } else {
        toast.error('Failed to send subscription marketing blast');
      }
    } catch {
      toast.error('Error sending subscription marketing blast');
    } finally {
      setSendingBlast(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
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

  // User management functions
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });
      if (res.ok) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      toast.error('Error updating user status');
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        toast.success('User role updated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to update user role');
      }
    } catch (error) {
      toast.error('Error updating user role');
    }
  };

  const assignEmployeeToCustomer = async (customerId: string, employeeId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/users/${customerId}/assign-employee`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        toast.success('Employee assigned successfully');
        setUserModal({ open: false, mode: 'view' });
      } else {
        toast.error('Failed to assign employee');
      }
    } catch (error) {
      toast.error('Error assigning employee');
    }
  };

  const openUserModal = (user: any, mode: 'view' | 'edit' | 'assign') => {
    setSelectedUser(user);
    setUserModal({ open: true, mode });
  };

  const closeUserModal = () => {
    setUserModal({ open: false, mode: 'view' });
    setSelectedUser(null);
  };

  // Filter and search users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === 'all' || user.role?.toLowerCase() === userFilter;
    return matchesSearch && matchesFilter;
  });

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', icon: Home, id: 'dashboard' },
    { name: 'Users', icon: Users, id: 'users' },
    { name: 'Quotes', icon: MessageSquare, id: 'quotes' },
    { name: 'Email Blast', icon: Mail, id: 'email-blast' },
    { name: 'Analytics', icon: BarChart3, id: 'analytics' },
    { name: 'Email Settings', icon: Settings, id: 'external-settings', external: true },
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
          <button
            type="button"
            onClick={() => loadFixwellTemplate()}
            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold"
          >Load Fixwell Template</button>
          <button
            type="button"
            onClick={() => sendSubscriptionMarketingBlast()}
            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold"
          >Send Subscription Blast</button>
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manual Email Addresses (one per line)
          </label>
          <textarea
            value={emails.join('\n')}
            onChange={e => setEmails(e.target.value.split('\n').filter(email => email.trim()))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email addresses, one per line"
          />
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
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Settings className="mr-2" /> Admin Settings</h2>
      </div>
      {settingsLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <form className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => saveSetting('siteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => saveSetting('supportEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => saveSetting('maintenanceMode', e.target.checked.toString())}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
              </label>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.emailHost}
                  onChange={(e) => saveSetting('emailHost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={settings.emailPort}
                  onChange={(e) => saveSetting('emailPort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Username</label>
                <input
                  type="text"
                  value={settings.emailUser}
                  onChange={(e) => saveSetting('emailUser', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Password</label>
                <input
                  type="password"
                  value={settings.emailPassword}
                  onChange={(e) => saveSetting('emailPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                <input
                  type="email"
                  value={settings.emailFrom}
                  onChange={(e) => saveSetting('emailFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reply To Email</label>
                <input
                  type="email"
                  value={settings.emailReplyTo}
                  onChange={(e) => saveSetting('emailReplyTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailSecure}
                    onChange={(e) => saveSetting('emailSecure', e.target.checked.toString())}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Use SSL/TLS</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {settingsSaving ? (
                <span className="text-yellow-600">Saving...</span>
              ) : (
                <span className="text-green-600">✓ Settings auto-save on change</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchSettings()}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              disabled={settingsSaving}
            >
              Refresh Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="customers">Customers</option>
              <option value="employees">Employees</option>
              <option value="admins">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600 mt-1">Manage user accounts and assign employees to customers</p>
        </div>
        
        {usersLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openUserModal(user, 'view')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openUserModal(user, 'edit')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        {user.role === 'CUSTOMER' && (
                          <button
                            onClick={() => openUserModal(user, 'assign')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Assign Employee
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
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
                item.external ? (
                  <a
                    key={item.id}
                    href="/admin/settings"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                ) : (
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
                )
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
                  onClick={sendQuoteReply}
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

      {/* User Management Modal */}
      {userModal.open && selectedUser && (
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
                      {userModal.mode === 'view' && 'User Details'}
                      {userModal.mode === 'edit' && 'Edit User'}
                      {userModal.mode === 'assign' && 'Assign Employee'}
                    </h3>
                    
                    {userModal.mode === 'view' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Joined</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(selectedUser.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {userModal.mode === 'edit' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={selectedUser.name}
                            onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <select
                            value={selectedUser.role}
                            onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedUser.isActive}
                              onChange={(e) => updateUserStatus(selectedUser.id, e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Active Account</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {userModal.mode === 'assign' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign Employee to {selectedUser.name}
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                assignEmployeeToCustomer(selectedUser.id, e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select an employee...</option>
                            {availableEmployees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} ({employee.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-sm text-gray-600">
                          This will assign an employee to handle all future requests from this customer.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={closeUserModal}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 