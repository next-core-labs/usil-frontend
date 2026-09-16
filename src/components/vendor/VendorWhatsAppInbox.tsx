import React, { useState } from 'react';
import { WhatsAppThread, WhatsAppMessage } from '../../types';
import {
  MessageCircle,
  Send,
  FileText,
  CheckCheck,
  PhoneCall,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  DollarSign,
  Share2,
  Paperclip,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface VendorWhatsAppInboxProps {
  threads: WhatsAppThread[];
  onSendMessage: (threadId: string, text: string, attachmentType?: WhatsAppMessage['attachmentType'], attachmentData?: any) => void;
}

export const VendorWhatsAppInbox: React.FC<VendorWhatsAppInboxProps> = ({
  threads,
  onSendMessage,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(threads[0]?.id || 'th-1');
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showQuickTemplateMenu, setShowQuickTemplateMenu] = useState(false);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const filteredThreads = threads.filter((t) =>
    t.clientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.clientPhone.includes(searchFilter) ||
    t.lastMessage.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    onSendMessage(activeThread.id, inputText.trim());
    setInputText('');
  };

  // Quick Action Templates
  const handleSendInstantQuote = () => {
    if (!activeThread) return;
    const text = `أهلاً بك أستاذ/ة ${activeThread.clientName}، تم إنشاء عرض السعر المعتمد بناءً على طلبك مع ضمان عدم التعارض وجاهزية الطاقم.`;
    const quoteData = {
      title: 'عرض سعر باقة الضيافة الملكية المتكاملة',
      amount: 1850,
      date: activeThread.eventDate || '2026-08-28',
      deposit: 500,
    };
    onSendMessage(activeThread.id, text, 'quote_card', quoteData);
    setShowQuickTemplateMenu(false);
  };

  const handleSendInvoiceLink = () => {
    if (!activeThread) return;
    const text = `تم إصدار الفاتورة الضريبية الرسمية رقم INV-2026-0992 مشمولة بضمان الحماية. يمكنك السداد عبر مدى أو التحويل المباشر.`;
    const invoiceData = {
      invoiceNo: 'INV-2026-0992',
      total: 1850,
      status: 'unpaid',
    };
    onSendMessage(activeThread.id, text, 'invoice_pdf', invoiceData);
    setShowQuickTemplateMenu(false);
  };

  const handleSendArrivalConfirmation = () => {
    if (!activeThread) return;
    const text = `نود إعلامكم بأن مشرف الضيافة وفريق التجهيز في الطريق إلى موقع المناسبة، موعد الوصول المتوقع قبل البدء بساعة ونصف 🚗✨`;
    onSendMessage(activeThread.id, text);
    setShowQuickTemplateMenu(false);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Business API — مزامنة محادثات العملاء المباشرة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            صندوق محادثات الواتساب وإرسال عروض الأسعار
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            تواصل مع عملائك، أرسل عروض الأسعار التفاعلية والفواتير، وأكد الحجوزات بنقرة واحدة عبر قنوات واتساب الرسمية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>API متصل (رقم معتمد)</span>
          </span>
        </div>
      </div>

      {/* Main Chat Interface Grid */}
      <div className="grid lg:grid-cols-12 gap-0 rounded-3xl bg-white border border-slate-200 card-shadow overflow-hidden min-h-[640px]">
        
        {/* Left: Threads List (4 cols) */}
        <div className="lg:col-span-4 border-l border-slate-200 flex flex-col bg-slate-50/50">
          
          {/* Threads Search */}
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="بحث في محادثات العملاء أو الجوال..."
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-action"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* List of Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-white shadow-xs border-r-4 border-r-action' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <img
                    src={thread.clientAvatar && !thread.clientAvatar.includes('unsplash') ? thread.clientAvatar : ''}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 bg-navy"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-medium text-slate-900 truncate">
                        {thread.clientName}
                      </h4>
                      <span className="text-2xs text-slate-400 font-mono shrink-0">
                        {thread.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 truncate font-normal">
                      {thread.lastMessage}
                    </p>

                    <div className="flex items-center justify-between pt-1.5">
                      {thread.statusTag && (
                        <span className="px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 text-slate-700">
                          {thread.statusTag}
                        </span>
                      )}

                      {thread.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-2xs font-medium flex items-center justify-center font-mono">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat View (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <img
                    src={activeThread.clientAvatar && !activeThread.clientAvatar.includes('unsplash') ? activeThread.clientAvatar : ''}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-navy"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{activeThread.clientName}</span>
                      <span className="text-2xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-normal">
                        متصل الآن
                      </span>
                    </h4>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {activeThread.clientPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${activeThread.clientPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح في تطبيق واتساب</span>
                  </a>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/30">
                {activeThread.messages.map((msg) => {
                  const isVendor = msg.sender === 'vendor';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed ${
                          isVendor
                            ? 'bg-navy text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs card-shadow'
                        }`}
                      >
                        <p className="font-normal">{msg.text}</p>

                        {/* Quote Card Attachment */}
                        {msg.attachmentType === 'quote_card' && msg.attachmentData && (
                          <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-right space-y-2 mt-2">
                            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                              <span className="font-medium text-white text-2xs">
                                {msg.attachmentData.title}
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                {msg.attachmentData.amount} ر.س
                              </span>
                            </div>
                            <div className="text-2xs text-slate-300 space-y-1">
                              <div>📅 تاريخ المناسبة: {msg.attachmentData.date}</div>
                              <div>💰 العربون المطلوب: {msg.attachmentData.deposit} ر.س</div>
                            </div>
                            <div className="text-2xs text-emerald-300 font-medium bg-emerald-950/40 p-1.5 rounded text-center">
                              ✓ عرض سعر معتمد مع تأكيد خلو التعارض
                            </div>
                          </div>
                        )}

                        {/* Invoice Attachment */}
                        {msg.attachmentType === 'invoice_pdf' && msg.attachmentData && (
                          <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-right space-y-1.5 mt-2">
                            <div className="flex items-center justify-between font-medium text-white text-2xs">
                              <span>فاتورة ضريبية #{msg.attachmentData.invoiceNo}</span>
                              <span className="font-mono text-emerald-400">{msg.attachmentData.total} ر.س</span>
                            </div>
                            <span className="text-2xs text-amber-300 block">
                              الحالة: بانتظار سداد الدفعة الأولى
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-2xs text-slate-400 mt-1 px-1 font-mono">
                        <span>{msg.timestamp}</span>
                        {isVendor && <CheckCheck className="w-3 h-3 text-action" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Template Triggers Bar */}
              <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center gap-2 overflow-x-auto">
                <span className="text-2xs font-medium text-slate-500 shrink-0 px-2">
                  ردود سريعة وقوالب:
                </span>
                
                <button
                  type="button"
                  onClick={handleSendInstantQuote}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-2xs font-medium shrink-0 flex items-center gap-1 transition-colors"
                >
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span>إرسال عرض سعر فوري</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendInvoiceLink}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-2xs font-medium shrink-0 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-action" />
                  <span>إرسال فاتورة ضريبية</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendArrivalConfirmation}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-2xs font-medium shrink-0 flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>تأكيد تحرك الطاقم</span>
                </button>
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="اكتب رسالتك للعميل (سيتم إرسالها عبر WhatsApp API مباشرة)..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-action focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-action-pressed disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>إرسال</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
              اختر محادثة من القائمة للبدء
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
