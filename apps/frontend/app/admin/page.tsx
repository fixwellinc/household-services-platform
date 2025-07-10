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
    
    setEmailHtml(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fixwell Subscription Services</title>
  <style>
    @media only screen and (max-width: 600px) {
      .mobile-full { width: 100% !important; }
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-text { font-size: 16px !important; }
      .mobile-title { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"80\" cy=\"40\" r=\"1.5\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"40\" cy=\"80\" r=\"1\" fill=\"rgba(255,255,255,0.1)\"/></svg>'); opacity: 0.3;"></div>
      <div style="position: relative; z-index: 1;">
        <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 36px;">🔧</span>
        </div>
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Fixwell</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 18px; font-weight: 300;">Your Home's Personal Fix-It Team</p>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 15px;">
          <span style="color: white; font-size: 14px; font-weight: 500;">Professional • Reliable • Trusted</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;" class="mobile-padding">
      <h2 style="color: #1f2937; margin: 0 0 25px 0; font-size: 26px; font-weight: 600;" class="mobile-title">Hi {{name}},</h2>
      
      <!-- Hero Section -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center; border: 2px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">🏠 TIRED OF ENDLESS HOME REPAIR STRESS? 🏠</h3>
        <p style="color: #78350f; margin: 0; font-size: 16px; font-weight: 500;">
          We get it. That dripping faucet, squeaky door, or flickering light has been on your "to-do" list for months.
        </p>
      </div>

      <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;" class="mobile-text">
        Finding a reliable handyman shouldn't feel like a part-time job. What if you had a <strong>professional fix-it team on speed dial</strong>?
      </p>

      <!-- Intro Section -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 5px solid #2563eb; padding: 25px; margin: 30px 0; border-radius: 0 12px 12px 0; position: relative;">
        <div style="position: absolute; top: -15px; left: 20px; background: #2563eb; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">New Service</div>
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">🎯 INTRODUCING FIXWELL SUBSCRIPTION SERVICES</h3>
        <p style="color: #1e3a8a; margin: 0; font-size: 16px; font-weight: 500;">
          Your home's personal maintenance team that keeps everything running smoothly, so you can focus on what matters most.
        </p>
      </div>

      <!-- Plans Section -->
      <h3 style="color: #1f2937; margin: 40px 0 25px 0; font-size: 22px; font-weight: 600; text-align: center;">📋 CHOOSE YOUR PERFECT PLAN</h3>

      <!-- Starter Plan -->
      <div style="border: 3px solid #e5e7eb; border-radius: 16px; padding: 30px; margin-bottom: 25px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); position: relative; transition: all 0.3s ease;">
        <div style="position: absolute; top: -12px; left: 20px; background: #6b7280; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Starter</div>
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="background: #6b7280; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <span style="font-size: 24px;">🔧</span>
          </div>
          <div>
            <h4 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">STARTER PLAN</h4>
            <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 24px; font-weight: bold;">$39<span style="font-size: 14px; color: #6b7280;">/month</span></p>
          </div>
        </div>
        <p style="color: #6b7280; font-style: italic; margin: 0 0 20px 0; font-size: 15px;">Perfect for light upkeep & peace of mind</p>
        <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 25px; font-size: 15px;">
          <li style="margin-bottom: 8px;"><strong>Quarterly visits</strong> (up to 30 minutes each)</li>
          <li style="margin-bottom: 8px;">Minor repairs, lightbulb changes, safety checks</li>
          <li style="margin-bottom: 8px;"><strong style="color: #16a34a;">FREE annual home inspection</strong> ($200 value)</li>
          <li style="margin-bottom: 8px;">Priority scheduling when you need us</li>
          <li style="margin-bottom: 8px;"><strong>24/7 emergency support</strong></li>
        </ul>
      </div>

      <!-- Homecare Plan -->
      <div style="border: 3px solid #2563eb; border-radius: 16px; padding: 30px; margin-bottom: 25px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); position: relative; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);">
        <div style="position: absolute; top: -12px; right: 20px; background: #2563eb; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Most Popular</div>
        <div style="position: absolute; top: -12px; left: 20px; background: #f59e0b; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Best Value</div>
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="background: #2563eb; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <span style="font-size: 24px;">🏠</span>
          </div>
          <div>
            <h4 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">HOMECARE PLAN</h4>
            <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 24px; font-weight: bold;">$59<span style="font-size: 14px; color: #6b7280;">/month</span></p>
          </div>
        </div>
        <p style="color: #6b7280; font-style: italic; margin: 0 0 20px 0; font-size: 15px;">Monthly help for ongoing maintenance</p>
        <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 25px; font-size: 15px;">
          <li style="margin-bottom: 8px;"><strong>Monthly visits</strong> (up to 1 hour each)</li>
          <li style="margin-bottom: 8px;">Everything in Starter PLUS gutter cleaning, seasonal maintenance</li>
          <li style="margin-bottom: 8px;">Small drywall repairs, caulking, weather stripping</li>
          <li style="margin-bottom: 8px;"><strong style="color: #16a34a;">10% off larger projects</strong></li>
          <li style="margin-bottom: 8px;">Emergency visits at standard rates</li>
          <li style="margin-bottom: 8px;"><strong style="color: #16a34a;">FREE annual deep cleaning service</strong></li>
        </ul>
      </div>

      <!-- Priority Plan -->
      <div style="border: 3px solid #f59e0b; border-radius: 16px; padding: 30px; margin-bottom: 35px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); position: relative;">
        <div style="position: absolute; top: -12px; left: 20px; background: #f59e0b; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Premium</div>
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="background: #f59e0b; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <span style="font-size: 24px;">⭐</span>
          </div>
          <div>
            <h4 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">PRIORITY PLAN</h4>
            <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 24px; font-weight: bold;">$150<span style="font-size: 14px; color: #6b7280;">/month</span></p>
          </div>
        </div>
        <p style="color: #6b7280; font-style: italic; margin: 0 0 20px 0; font-size: 15px;">For homeowners who want their home proactively managed</p>
        <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 25px; font-size: 15px;">
          <li style="margin-bottom: 8px;"><strong>2 visits monthly</strong> (up to 2 hours total)</li>
          <li style="margin-bottom: 8px;">Everything above PLUS same-week emergency callouts</li>
          <li style="margin-bottom: 8px;">Smart home setup, TV mounting, furniture assembly</li>
          <li style="margin-bottom: 8px;"><strong style="color: #16a34a;">FREE consumables included</strong> (caulk, screws, anchors)</li>
          <li style="margin-bottom: 8px;"><strong style="color: #16a34a;">15% off renovations and major projects</strong></li>
          <li style="margin-bottom: 8px;"><strong>Dedicated account manager</strong></li>
        </ul>
      </div>

      <!-- Benefits Section -->
      <h3 style="color: #1f2937; margin: 40px 0 25px 0; font-size: 22px; font-weight: 600; text-align: center;">💎 WHY FIXWELL MEMBERS LOVE US</h3>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 35px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; border: 2px solid #16a34a; padding: 30px;">
        <tr>
          <td style="vertical-align: top; width: 32px; padding: 12px 0;"><span style="font-size: 20px; color: #16a34a;">✅</span></td>
          <td style="vertical-align: middle; color: #4b5563; font-weight: 500; font-size: 16px; padding: 12px 0;">No More Contractor Hunting</td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 32px; padding: 12px 0;"><span style="font-size: 20px; color: #16a34a;">✅</span></td>
          <td style="vertical-align: middle; color: #4b5563; font-weight: 500; font-size: 16px; padding: 12px 0;">Proactive Maintenance</td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 32px; padding: 12px 0;"><span style="font-size: 20px; color: #16a34a;">✅</span></td>
          <td style="vertical-align: middle; color: #4b5563; font-weight: 500; font-size: 16px; padding: 12px 0;">Predictable Costs</td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 32px; padding: 12px 0;"><span style="font-size: 20px; color: #16a34a;">✅</span></td>
          <td style="vertical-align: middle; color: #4b5563; font-weight: 500; font-size: 16px; padding: 12px 0;">Quality Guaranteed</td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 32px; padding: 12px 0;"><span style="font-size: 20px; color: #16a34a;">✅</span></td>
          <td style="vertical-align: middle; color: #4b5563; font-weight: 500; font-size: 16px; padding: 12px 0;">Fully Insured &amp; Bonded</td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 32px; padding: 12px 0;"><span style="font-size: 20px; color: #16a34a;">✅</span></td>
          <td style="vertical-align: middle; color: #4b5563; font-weight: 500; font-size: 16px; padding: 12px 0;">Same-Day Response</td>
        </tr>
      </table>

      <!-- Testimonials -->
      <h3 style="color: #1f2937; margin: 40px 0 25px 0; font-size: 22px; font-weight: 600; text-align: center;">📊 REAL RESULTS FROM REAL CUSTOMERS</h3>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
        <div style="font-style: italic; color: #4b5563; line-height: 1.7; margin-bottom: 15px; font-size: 16px;">
          "I used to dread my growing fix-it list. Now I just text Fixwell and it's handled. Best $59 I spend each month! They've saved me thousands in potential damage."
        </div>
        <div style="color: #6b7280; font-weight: 600; font-size: 14px;">- Sarah M., Homeowner</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
        <div style="font-style: italic; color: #4b5563; line-height: 1.7; margin-bottom: 15px; font-size: 16px;">
          "They caught a small leak that could have cost me thousands. The subscription paid for itself in one visit. My home has never been better maintained."
        </div>
        <div style="color: #6b7280; font-weight: 600; font-size: 14px;">- Mike T., Property Owner</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 16px; margin-bottom: 35px; border-left: 4px solid #f59e0b;">
        <div style="font-style: italic; color: #4b5563; line-height: 1.7; margin-bottom: 15px; font-size: 16px;">
          "Finally, a service that actually shows up when they say they will. Fixwell has transformed how I think about home maintenance."
        </div>
        <div style="color: #6b7280; font-weight: 600; font-size: 14px;">- Jennifer L., Busy Professional</div>
      </div>

      <!-- CTA Section -->
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; border-radius: 20px; text-align: center; margin: 40px 0; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"1\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"80\" cy=\"40\" r=\"0.8\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"40\" cy=\"80\" r=\"0.6\" fill=\"rgba(255,255,255,0.1)\"/></svg>'); opacity: 0.3;"></div>
        <div style="position: relative; z-index: 1;">
          <h3 style="color: white; margin: 0 0 15px 0; font-size: 24px; font-weight: bold;">🔥 LIMITED TIME OFFER: FIRST MONTH ONLY $19! 🔥</h3>
          <p style="color: #fecaca; margin: 0 0 30px 0; font-size: 18px; font-weight: 500;">Ready to never stress about home repairs again?</p>
          <a href="#" style="background: white; color: #dc2626; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.3s ease;">🚀 CHOOSE YOUR PLAN NOW</a>
        </div>
      </div>

      <!-- Contact Info -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 2px solid #e5e7eb;">
        <h4 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; text-align: center;">📞 Questions? Contact us:</h4>
        <div style="color: #4b5563; line-height: 2; text-align: center; font-size: 16px;">
          <div style="margin-bottom: 10px;"><strong>📞 Call us:</strong> <a href="tel:5551234567" style="color: #2563eb; text-decoration: none;">(555) 123-4567</a></div>
          <div style="margin-bottom: 10px;"><strong>🌐 Learn more:</strong> <a href="https://www.fixwell.com" style="color: #2563eb; text-decoration: none;">www.fixwell.com</a></div>
          <div style="margin-bottom: 10px;"><strong>📧 Email us:</strong> <a href="mailto:hello@fixwell.com" style="color: #2563eb; text-decoration: none;">hello@fixwell.com</a></div>
        </div>
      </div>

      <!-- PS Section -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 2px solid #f59e0b;">
        <h4 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">💡 P.S. - Special Offer for Referrals!</h4>
        <p style="color: #78350f; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
          Current subscribers get <strong>10% off their next month</strong> when they refer friends. Know someone who needs Fixwell? Send them our way!
        </p>
        <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.6;">
          Already have a handyman? No problem! Our subscription works alongside major projects - we handle the small stuff so your contractor can focus on the big jobs.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #1f2937; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <div style="color: white; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">The Fixwell Team</h3>
          <p style="margin: 0; font-size: 16px; font-style: italic; color: #d1d5db;">"Making homes better, one fix at a time"</p>
        </div>
        <div style="border-top: 1px solid #374151; padding-top: 20px;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            Fixwell Services • Professional Home Maintenance • Fully Insured & Bonded
          </p>
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            © 2024 Fixwell Inc. All rights reserved. | <a href="#" style="color: #9ca3af; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #9ca3af; text-decoration: none;">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
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