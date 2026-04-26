'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useAppStore } from '@/store';

interface PageHelp {
  key: string;
  titleEn: string;
  titleSw: string;
  descriptionEn: string;
  descriptionSw: string;
  link?: string;
  linkTextEn?: string;
  linkTextSw?: string;
}

const PAGE_HELP: Record<string, PageHelp> = {
  '/dashboard': {
    key: 'dashboard',
    titleEn: 'Dashboard',
    titleSw: 'Dashibodi',
    descriptionEn: 'This page shows an overview of your business performance including today\'s sales, low stock alerts, and quick actions. Check the charts for trends.',
    descriptionSw: 'Ukurasa huu unaonyesha muhtasari wa utendaji wa biashara yako ikiwa ni pamoja na mauzo ya leo, tahadhari za stoku ya chini, na vitendo vya haraka. Angalia chati kwa mwelekeo.',
    link: '/help',
    linkTextEn: 'View full guide',
    linkTextSw: 'Tazama mwongozo kamili',
  },
  '/pos': {
    key: 'pos',
    titleEn: 'Point of Sale',
    titleSw: 'Nafasi ya Kuuza',
    descriptionEn: 'This page allows you to process sales transactions. Select a customer, add products, choose payment method, and complete the sale. Receipts are saved automatically.',
    descriptionSw: 'Ukurasa huu unakuruhusu kufanyia muamala wa mauzo. Chagua mteja, ongeza bidhaa, chagua njia ya malipo, na maliza mauzo. Picha huhifadhiwa moja kwa moja.',
    link: '/help',
    linkTextEn: 'View sales guide',
    linkTextSw: 'Tazama mwongozo wa mauzo',
  },
  '/inventory': {
    key: 'inventory',
    titleEn: 'Inventory',
    titleSw: 'Bidhaa',
    descriptionEn: 'This page lets you manage your products and stock. Add new products, adjust stock levels, and view stock history. Low stock items are highlighted.',
    descriptionSw: 'Ukurasa huu unakuruhusu kudhibiti bidhaa na stoku zako. Ongeza bidhaa mpya, rekebisha viwango vya stoku, na tazama historia ya stoku. Bidhaa zenye stoku ya chini zinaangaziwa.',
    link: '/help',
    linkTextEn: 'View inventory guide',
    linkTextSw: 'Tazama mwongozo wa bidhaa',
  },
  '/expenses': {
    key: 'expenses',
    titleEn: 'Expenses',
    titleSw: 'Matumizi',
    descriptionEn: 'This page tracks all your business expenses. Add expenses by category, view summaries, and export reports for accounting purposes.',
    descriptionSw: 'Ukurasa huu unafuatilia matumizi yote ya biashara yako. Ongeza matumizi kwa aina, tazama muhtasari, na toa ripoti kwa madhumuni ya uhasibu.',
    link: '/help',
    linkTextEn: 'View expenses guide',
    linkTextSw: 'Tazama mwongozo wa matumizi',
  },
  '/customers': {
    key: 'customers',
    titleEn: 'Customers',
    titleSw: 'Wateja',
    descriptionEn: 'This page manages your customer database. Add customers, set credit limits, track balances, and view statements. Customer data is never deleted.',
    descriptionSw: 'Ukurasa huu unadhibiti database ya wateja wako. Ongeza wateja, weka viwango vya mikropo, fuatilia salio, na tazama hati. Data ya wateja haiwezi kufutwa.',
    link: '/help',
    linkTextEn: 'View customers guide',
    linkTextSw: 'Tazama mwongozo wa wateja',
  },
  '/suppliers': {
    key: 'suppliers',
    titleEn: 'Suppliers',
    titleSw: 'Muuzaji',
    descriptionEn: 'This page manages your supplier relationships. Track purchase orders, receive inventory, and manage supplier credit. All supplier history is preserved.',
    descriptionSw: 'Ukurasa huu unadhibiti uhusiano wako na muuzaji. Fuatilia maagizo ya ununuzi, pokea bidhaa, na dhibiti mikropo ya muuzaji. Historia yote ya muuzaji inahifadhiwa.',
    link: '/help',
    linkTextEn: 'View suppliers guide',
    linkTextSw: 'Tazama mwongozo wa muuzaji',
  },
  '/reports': {
    key: 'reports',
    titleEn: 'Reports',
    titleSw: 'Ripoti',
    descriptionEn: 'This page generates business reports. View sales, expenses, and profit summaries. Export as CSV, Excel, or PDF for further analysis or accounting.',
    descriptionSw: 'Ukurasa huu hutoa ripoti za biashara. Tazama muhtasari wa mauzo, matumizi, na faida. Toa kama CSV, Excel, au PDF kwa uchanganuzi zaidi au uhasibu.',
    link: '/help',
    linkTextEn: 'View reports guide',
    linkTextSw: 'Tazama mwongozo wa ripoti',
  },
  '/chatbot': {
    key: 'chatbot',
    titleEn: 'AI Assistant',
    titleSw: 'Msaidizi wa AI',
    descriptionEn: 'Ask me anything about your business! I can show you sales summaries, stock alerts, and answer questions about using the POS system. Just type in Swahili or English.',
    descriptionSw: 'Niulie swali lolote kuhusu biashara yako! Naweza kukuonyesha muhtasari wa mauzo, tahadhari za stoku, na kujibu maswali kuhusu kutumia mfumo wa POS. Andika tu kwa Kiswahili au Kiingereza.',
  },
  '/settings': {
    key: 'settings',
    titleEn: 'Settings',
    titleSw: 'Mipangilio',
    descriptionEn: 'Configure your business settings here. Update business info, manage users, and customize payment methods and categories.',
    descriptionSw: 'Sanidi mipangilio ya biashara yako hapa. Sasisha maelezo ya biashara, dhibiti watumiaji, na peana njia za malipo na aina za bidhaa.',
    link: '/help',
    linkTextEn: 'View settings guide',
    linkTextSw: 'Tazama mwongozo wa mipangilio',
  },
  '/notifications': {
    key: 'notifications',
    titleEn: 'Notifications',
    titleSw: 'Tahadhari',
    descriptionEn: 'This page shows all your notifications including low stock alerts, large sales, returns, and payment reminders. Mark them as read or view all.',
    descriptionSw: 'Ukurasa huu unaonyesha tahadhari zote zako ikiwa ni pamoja na tahadhari za stoku ya chini, mauzo makubwa, marudio, na ukumbusho wa malipo. Weka kama umesoma au tazama zote.',
  },
};

interface HelpIconProps {
  pageKey?: string;
}

export default function HelpIcon({ pageKey }: HelpIconProps) {
  const { language } = useAppStore();
  const isSwahili = language === 'sw';
  const [showHelp, setShowHelp] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showHelp && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 340)),
      });
    }
  }, [showHelp]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const help = PAGE_HELP[pageKey || ''] || PAGE_HELP['/dashboard'];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowHelp(!showHelp)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        title={isSwahili ? 'Musaada' : 'Help'}
      >
        <HelpCircle className="w-5 h-5 text-slate-500" />
      </button>

      {showHelp && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4"
          style={{ top: position.top, left: position.left }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">{isSwahili ? help.titleSw : help.titleEn}</h3>
            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            {isSwahili ? help.descriptionSw : help.descriptionEn}
          </p>
          {help.link && (
            <a
              href={help.link}
              className="text-sm text-blue-600 hover:underline"
            >
              {isSwahili ? help.linkTextSw : help.linkTextEn}
            </a>
          )}
        </div>
      )}
    </div>
  );
}