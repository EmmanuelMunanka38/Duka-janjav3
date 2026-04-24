'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HelpCircle, CircleCheck, MessageCircle } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function HelpPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
        reset();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      alert('Failed to send message. Please try again.');
    }
  };

  const faqs = [
    {
      question: 'How do I process a sale?',
      answer: 'Go to the POS page, add products to your cart, select a payment method, and click "Complete Sale". The inventory will automatically update.',
    },
    {
      question: 'How do I add new products?',
      answer: 'Navigate to Inventory > Click "Add Product" > Fill in the details (name, SKU, price, cost, stock) > Click "Add Product".',
    },
    {
      question: 'How do I generate reports?',
      answer: 'Go to the Reports page > Select the type of report (Sales, Expenses, Inventory) > Choose date range > Click "Export CSV" to download.',
    },
    {
      question: 'How do I track expenses?',
      answer: 'Go to the Expenses page > Click "Add Expense" > Fill in description, amount, category, and vendor > Click "Add Expense".',
    },
    {
      question: 'How do I manage suppliers?',
      answer: 'Go to the Suppliers page > Click "Add Supplier" > Fill in company details > Link products to suppliers.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <div>
            <h1 className="font-bold text-xl text-slate-800">Help Center</h1>
            <p className="text-xs text-slate-500">Get help and support</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    {faq.question}
                  </h3>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Contact Support</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <CircleCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Message Sent!</h3>
                  <p className="text-slate-500 mb-4">
                    We&apos;ll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      {...register('name')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input
                      {...register('subject')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="How can we help?"
                    />
                    {errors.subject && (
                      <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      {...register('message')}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Describe your issue or question..."
                    />
                    {errors.message && (
                      <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
