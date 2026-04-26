'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, ExternalLink, X, Search } from 'lucide-react';
import { useAppStore } from '@/store';

interface FAQItem {
  questionEn: string;
  questionSw: string;
  answerEn: string;
  answerSw: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'pos',
    questionEn: 'How do I make a sale?',
    questionSw: 'Nikufanya mauzo vipi?',
    answerEn: '1. Go to POS page\n2. Select or create a customer\n3. Scan or search for products\n4. Adjust quantities if needed\n5. Choose payment method\n6. Click "Complete Sale" to process\n\nThe receipt will be saved automatically.',
    answerSw: '1. Nenda ukurasa wa POS\n2. Chagua au unda mteja\n3. Scan au tafuta bidhaa\n4. Badilisha idadi kama inahitajika\n5. Chagua njia ya malipo\n6. Bonyeza "Maliza Mauzo"\n\nHati ya mauzo itahifadhiwa moja kwa moja.',
  },
  {
    category: 'pos',
    questionEn: 'How do I handle credit sales?',
    questionSw: 'Nikufanya mauzo ya mikrofi vipi?',
    answerEn: 'Credit sales allow customers to pay later:\n\n1. Select "Credit" as payment method\n2. Customer balance is tracked automatically\n3. Customer can make partial payments\n4. View outstanding balance anytime\n5. Send payment reminders',
    answerSw: 'Mauzo ya mikropo humu muda kwa mteja kulipa baadaye:\n\n1. Chagua "Mikropo" kama njia ya malipo\n2. Salio la mteja linatembelewa moja kwa moja\n3. Mteja anaweza kufanya malipo sehemu\n4. Tazama salio wakati wowote\n5. Tuma ukumbusho wa malipo',
  },
  {
    category: 'inventory',
    questionEn: 'How do I add new products?',
    questionSw: 'Nikiongeza bidhaa mpya vipi?',
    answerEn: '1. Go to Inventory page\n2. Click "Add Product"\n3. Fill in details:\n   - Name, SKU, barcode\n   - Price and cost\n   - Initial stock quantity\n   - Low stock threshold\n4. Save the product\n\nProducts can also be imported via CSV.',
    answerSw: '1. Nenda ukurasa wa Bidhaa\n2. Bonyeza "Ongeza Bidhaa"\n3. Jaza maelezo:\n   - Jina, SKU, barcode\n   - Bei na gharama\n   - Heshima ya kwanza\n   - Kizingo cha chini cha stoku\n4. Hifadhi bidhaa\n\nBidhaa zinaweza kuingizwa kupitia CSV.',
  },
  {
    category: 'inventory',
    questionEn: 'What do the stock adjustment reasons mean?',
    questionSw: 'Maana ya sababu za kurekebisha stoku ni nini?',
    answerEn: '• Kuhesabu (Count): Physical count correction\n• Uharibifu (Damage): Products damaged\n• Wizi (Theft): Items lost/stolen\n• Kosa (Error): Previous data entry error\n• Nyingine (Other): Any other reason',
    answerSw: '• Kuhesabu: Marekebisho ya idadi ya kimwili\n• Uharibifu: Bidhaa zilizo haribika\n• Wizi: Bidhaa zilizopotea/zibwewa\n• Kosa: Hitilafu ya kuingiza data iliyotangulia\n• Nyingine: Sababu nyingine yoyote',
  },
  {
    category: 'expenses',
    questionEn: 'How do I track expenses?',
    questionSw: 'Nikufuatilia matumizi vipi?',
    answerEn: '1. Go to Expenses page\n2. Click "Add Expense"\n3. Select category\n4. Enter amount and description\n5. Set date and supplier\n6. Save the expense\n\nExpenses are grouped by category for reporting.',
    answerSw: '1. Nenda ukurasa wa Matumizi\n2. Bonyeza "Ongeza Matumizi"\n3. Chagua aina\n4. Jaza kiasi na maelezo\n5. Weka tarehe na muuzaji\n6. Hifadhi matumizi\n\nMatumizi hulinganishwa kwa aina kwa ripoti.',
  },
  {
    category: 'reports',
    questionEn: 'How do I export reports?',
    questionSw: 'Nikitoa ripoti vipi?',
    answerEn: '1. Go to Reports page\n2. Select report type\n3. Choose date range\n4. Click Export CSV or PDF\n5. File downloads automatically\n\nYou can also filter by branch.',
    answerSw: '1. Nenda ukurasa wa Ripoti\n2. Chagua aina ya ripoti\n3. Chagua muda\n4. Bonyeza Toa CSV au PDF\n5. File linashuka moja kwa moja\n\nUnaweza kuchuja kwa tawi.',
  },
  {
    category: 'customers',
    questionEn: 'How do I manage customer credit?',
    questionSw: 'Nikushughulikia mikopo ya wateja vipi?',
    answerEn: 'Each customer has a credit limit:\n\n1. Set credit limit when adding customer\n2. Monitor credit balance in customer list\n3. Customer statements show all transactions\n4. Record payments against balance\n5. Get alerts when near limit',
    answerSw: 'Kila mteja ana kikomo cha mikropo:\n\n1. Weka kikomo cha mikropo unapoongeza mteja\n2. Monitori salio katika orodha ya wateja\n3. hati ya mteja inaonyesha muamala wote\n4. Rekodi malipo dhidi ya salio\n5. Pokea tahadhari unapokaribia kikomo',
  },
  {
    category: 'suppliers',
    questionEn: 'How do purchase orders work?',
    questionSw: 'Maagizo ya ununuzi yanavyofanya kazi vipi?',
    answerEn: 'Purchase orders track supplier orders:\n\n1. Create PO → Status: Draft\n2. Send to supplier → Ordered\n3. Receive items → Received\n4. Create invoice → Invoiced\n5. Pay supplier → Paid\n\nEach step updates automatically.',
    answerSw: 'Maagizo ya ununuzi yanafuatilia amuru kwa muuzaji:\n\n1. Unda PO → Hali: Rasimu\n2. Tuma kwa muuzaji → Amuriwa\n3. Pokea bidhaa → Zilizopokelewa\n4. Unda invoice → Invoiced\n5. Lipa muuzaji → Imelipwa\n\nKila hatua inasasisha moja kwa moja.',
  },
];

const GETTING_STARTED = [
  { step: 1, titleEn: 'Complete Setup', titleSw: 'Maliza Utayarishaji', descEn: 'Follow the onboarding wizard to set up your business', descSw: 'Fuata msomi wa utayarishaji kuweka biashara yako' },
  { step: 2, titleEn: 'Add Products', titleSw: 'Ongeza Bidhaa', descEn: 'Add your inventory to start selling', descSw: 'Ongeza bidhaa zako kuanza kuuza' },
  { step: 3, titleEn: 'Process Sales', titleSw: 'Fanyia Mauzo', descEn: 'Use POS to make your first sale', descSw: 'Tumia POS kufanya mauzo yako ya kwanza' },
  { step: 4, titleEn: 'Track Expenses', titleSw: 'Fuatilia Matumizi', descEn: 'Record all business expenses', descSw: 'Rekodi matumizi yote ya biashara' },
  { step: 5, titleEn: 'Generate Reports', titleSw: 'Toa Ripoti', descEn: 'View sales and profit reports', descSw: 'Tazama ripoti za mauzo na faida' },
];

export default function HelpPage() {
  const { language, t } = useAppStore();
  const isSwahili = language === 'sw';
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const filteredFAQs = FAQS.filter(faq =>
    (isSwahili ? faq.questionSw : faq.answerEn).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(FAQS.map(faq => faq.category))];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isSwahili ? 'Ujumbe wako umetumwa! Tutawasiliana na wewe hivi karibuni.' : 'Your message has been sent! We will contact you soon.');
    setShowContact(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-xl text-slate-800">{isSwahili ? 'Musaada' : 'Help & Support'}</h1>
            <p className="text-xs text-slate-500">{isSwahili ? 'Mwongozo na maswali yanayouliziwa mara kwa mara' : 'Guides and frequently asked questions'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-lg text-slate-800 mb-4">{isSwahili ? 'Kuanza' : 'Getting Started'}</h2>
          <div className="grid grid-cols-5 gap-4">
            {GETTING_STARTED.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {item.step}
                </div>
                <p className="text-sm font-medium text-slate-700">{isSwahili ? item.titleSw : item.titleEn}</p>
                <p className="text-xs text-slate-400 mt-1">{isSwahili ? item.descSw : item.descEn}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800">{isSwahili ? 'Maswali Yanayouliziwa Mara kwa Mara' : 'Frequently Asked Questions'}</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSwahili ? 'Tafuta...' : 'Search...'}
                className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 mt-4 first:mt-0">
                  {category === 'pos' ? 'POS' : category === 'inventory' ? (isSwahili ? 'Bidhaa' : 'Inventory') : category === 'expenses' ? (isSwahili ? 'Matumizi' : 'Expenses') : category === 'reports' ? (isSwahili ? 'Ripoti' : 'Reports') : category === 'customers' ? (isSwahili ? 'Wateja' : 'Customers') : (isSwahili ? 'Muuzaji' : 'Suppliers')}
                </h3>
                {filteredFAQs.filter(faq => faq.category === category).map((faq, idx) => {
                  const globalIdx = FAQS.indexOf(faq);
                  return (
                    <div key={globalIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFAQ(openFAQ === globalIdx ? null : globalIdx)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700">
                          {isSwahili ? faq.questionSw : faq.questionEn}
                        </span>
                        {openFAQ === globalIdx ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      {openFAQ === globalIdx && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-slate-600 whitespace-pre-line">
                            {isSwahili ? faq.answerSw : faq.answerEn}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-lg text-slate-800 mb-4">{isSwahili ? 'Wasiliana Nasi' : 'Contact Support'}</h2>
          {showContact ? (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-slate-700">{isSwahili ? ' ujumbe Mpya' : 'New Message'}</span>
                <button onClick={() => setShowContact(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder={isSwahili ? 'Jina lako' : 'Your name'}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
                required
              />
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="Email"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
                required
              />
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder={isSwahili ? 'Andika ujumbe wako hapa...' : 'Write your message here...'}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary resize-none"
                required
              />
              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90">
                {isSwahili ? 'Tuma Ujumbe' : 'Send Message'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowContact(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-primary hover:text-primary transition-colors"
            >
              {isSwahili ? 'Bonyeza hapa kuwasiliana nasi' : 'Click here to contact us'}
            </button>
          )}
        </div>

        <a
          href="/chatbot"
          className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
          {isSwahili ? 'Zungumza na AI' : 'Chat with AI Assistant'}
          <ExternalLink className="w-4 h-4" />
        </a>
      </main>
    </div>
  );
}