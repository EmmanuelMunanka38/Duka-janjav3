import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Context {
  businessName: string;
  currentDate: string;
  todaysSalesTotal: number;
  todaysTransactions: number;
  lowStockCount: number;
  lowStockProducts: string[];
  outOfStockProducts: string[];
  topProductsThisWeek: string[];
  userName: string | null;
  totalProducts: number;
}

export async function generateAIResponse(userMessage: string, context: Context): Promise<string> {
  const isSwahili = detectLanguage(userMessage);
  const systemPrompt = buildSystemPrompt(context, isSwahili);

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

function detectLanguage(text: string): 'sw' | 'en' {
  const swahiliWords = ['nini', 'naf', 'hii', 'kwa', 'ya', 'ni', 'katika', 'za', 'wa', 'ume', 'ume', 'hap', 'kuna', 'sana', 'hapa', 'au', 'lakini', 'vile', 'kama', 'bila', 'kutoka', 'kwa'];
  const words = text.toLowerCase().split(/\s+/);
  const swahiliCount = words.filter(w => swahiliWords.includes(w)).length;
  return swahiliCount > words.length * 0.2 ? 'sw' : 'en';
}

function buildSystemPrompt(context: Context, lang: 'sw' | 'en'): string {
  const t = lang === 'sw';
  
  return `${t ? 'Wewe ni Duka Janja AI Assistant, msaidizi wa mfumo wa POS.' : 'You are Duka Janja AI Assistant, a helpful POS system assistant.'}

${t ? 'Miongozi' : 'Business Context'}:
- Business: ${context.businessName}
- Date: ${context.currentDate}
- User: ${context.userName}

${t ? "Takwimu za leo" : "Today's Metrics"}:
- ${t ? 'Jumla ya mauzo ya leo' : "Today's Sales Total"}: ${context.todaysSalesTotal.toFixed(2)}
- ${t ? 'Mauzo ya leo' : 'Transactions today'}: ${context.todaysTransactions}

${t ? 'Stoku ya chini' : 'Low Stock Alerts'} (${context.lowStockCount} ${t ? 'bidhaa' : 'items'}):
${context.lowStockProducts.length > 0 ? context.lowStockProducts.map(p => `- ${p}`).join('\n') : `- ${t ? 'Hakuna' : 'None'}`}

${t ? 'Bidhaa zilizo закончил stock' : 'Out of Stock'}:
${context.outOfStockProducts.length > 0 ? context.outOfStockProducts.map(p => `- ${p}`).join('\n') : `- ${t ? 'Hakuna' : 'None'}`}

${t ? 'Bidhaa zaidi zinazouzwa wiki hii' : 'Top selling this week'}:
${context.topProductsThisWeek.length > 0 ? context.topProductsThisWeek.map((p, i) => `${i + 1}. ${p}`).join('\n') : `- ${t ? 'Hakuna mauzo' : 'No sales yet'}`}

${t ? 'Kanuni' : 'Rules'}:
1. ${t ? 'Jibu kwa lugha ileile uliyotumiwa (Swahili au English)' : 'Respond in the same language the user used (Swahili or English)'}
2. ${t ? 'Tumia data ya moja kwa moja kutoka database' : 'Use live data directly from the database'}
3. ${t ? 'Toa muhtasari na mapendekezo' : 'Provide summaries and recommendations'}
4. ${t ? 'Eleza maneno ya kifedha kwa lugha rahisi' : 'Explain financial terms in simple language'}
5. ${t ? 'USIICHukue hatua yoyote - soma tu, usiandike data' : 'Do NOT take actions - read-only for safety'}
6. ${t ? 'Kwa maswali ya hesabu, toa hesabu sahihi' : 'For calculation questions, provide accurate figures'}

${t ? 'Mfano wa majibu' : 'Example responses'}:
${t ? '- "Leo umeuza TSh 125,000. Hii ni $50 Zaidi ya Jana."' : '- "You sold TSh 125,000 today. That is $50 more than yesterday."'}
${t ? '- "Kuna bidhaa 3 zenye stoku ya chini. Mfano: Mabati (5 zaka), screws (2 zaka)."' : '- "3 items are low on stock. Example: Roof sheets (5 left), screws (2 left)."'}
${t ? '- "Wiki hii, bidhaa 5 zinazouzwa zaidi ni: Rice, Sugar, Salt, Oil, Soap."' : '- "This week, the top 5 selling products are: Rice, Sugar, Salt, Oil, Soap."'}`;
}