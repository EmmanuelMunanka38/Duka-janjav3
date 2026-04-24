'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, Database, Users, Mail, ChevronDown } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: Database,
      content: `We collect information you provide directly to us, including:
      
• Account Information: Name, email address, password, and business details when you register for an account
• Business Data: Product inventory, sales transactions, customer information, expense records, and supplier details
• Payment Information: Payment method details processed through our system (card numbers are handled by payment processors)
• Usage Data: Device information, browser type, IP address, and how you interact with our platform
• Cookies: Small data files stored on your device to remember your preferences and login status`
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Data',
      icon: Eye,
      content: `We use the information we collect to:

• Provide and maintain our POS services
• Process sales transactions and generate receipts
• Manage your inventory and product catalog
• Track expenses and generate financial reports
• Communicate with you about your account and service updates
• Improve our services and user experience
• Protect against fraud and ensure security
• Comply with legal obligations

We do not sell your personal information or business data to third parties.`
    },
    {
      id: 'data-storage',
      title: 'Data Storage and Security',
      icon: Lock,
      content: `Your data is stored securely using industry-standard measures:

• Encryption: All data is encrypted in transit (HTTPS) and at rest
• Access Controls: Strict access controls limit who can view your data
• Authentication: JWT-based authentication with cryptographic signing protects your sessions
• Database Security: Our database uses SQLite with proper file permissions
• Regular Updates: We continuously update our security measures

You are responsible for maintaining the confidentiality of your login credentials.`
    },
    {
      id: 'third-party',
      title: 'Third-Party Services',
      icon: Users,
      content: `We may share your information with third-party service providers:

• Payment Processors: To process card and mobile payments securely
• Cloud Services: For data storage and backup (e.g., Supabase)
• Analytics: To understand how you use our platform
• Legal Compliance: When required by law or to protect our rights

All third-party providers are contractually bound to protect your data and use it only for the services they provide.`
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      icon: Shield,
      content: `You have the following rights regarding your data:

• Access: Request a copy of your personal data
• Correction: Request correction of inaccurate data
• Deletion: Request deletion of your account and associated data
• Portability: Request your data in a machine-readable format
• Object: Object to certain processing activities
• Withdrawal: Withdraw consent where applicable

To exercise these rights, contact us at the email provided below.`
    },
    {
      id: 'cookies-policy',
      title: 'Cookies Policy',
      icon: Database,
      content: `Our platform uses cookies:

• Session Cookies: Essential for authentication and maintaining your login session
• Preference Cookies: Remember your settings and preferences
• Analytics Cookies: Help us understand how visitors use our site

You can control cookie settings through your browser. Disabling cookies may affect functionality.

For more details, see our Cookie Policy or contact us.`
    },
    {
      id: 'childrens-privacy',
      title: "Children's Privacy",
      icon: Users,
      content: `Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately so we can take appropriate action.`
    },
    {
      id: 'changes-policy',
      title: 'Changes to This Policy',
      icon: Mail,
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by:

• Posting the updated policy on this page
• Updating the "Last Updated" date
• Providing prominent notice through our platform

We encourage you to review this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.`
    },
    {
      id: 'contact',
      title: 'Contact Us',
      icon: Mail,
      content: `If you have questions about this Privacy Policy or our data practices, please contact us:

• Email: privacy@dukajanja.com
• Address: Duka Janja POS, [Your Address]
• Website: www.dukajanja.com

We aim to respond to all inquiries within 30 days.`
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Privacy Policy</h1>
              <p className="text-xs text-slate-500">Last updated: April 2026</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Introduction</h2>
          <p className="text-slate-600 leading-relaxed">
            Duka Janja POS ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Point of Sale system and related services.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            Please read this Privacy Policy carefully. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-slate-800">{section.title}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedSection === section.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSection === section.id && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <pre className="text-slate-600 whitespace-pre-wrap font-sans text-sm mt-4 leading-relaxed">
                    {section.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mt-8">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Data Protection Commitment</h3>
              <p className="text-sm text-slate-600">
                We take the security of your data seriously. Your business information and personal data are protected using industry-standard security measures. We continuously monitor and improve our security practices to ensure your data remains safe.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Duka Janja POS - Secure Point of Sale Solution</p>
          <p className="mt-1">For questions, contact: privacy@dukajanja.com</p>
        </div>
      </main>
    </div>
  );
}