import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShoppingBag,
  Calculator,
  ArrowRight,
  RefreshCw,
  Layers,
  ChevronDown,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import { VoiceAssistantMessage, ServiceItem } from '../../types';

interface VoiceAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (service: ServiceItem) => void;
  onOpenServiceDetails: (service: ServiceItem) => void;
  onOpenCalculator: () => void;
  currentCity?: string;
  services?: ServiceItem[];
}

export const VoiceAIAssistant: React.FC<VoiceAIAssistantProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  onOpenServiceDetails,
  onOpenCalculator,
  currentCity = 'الرياض',
  services = [],
}) => {
  const [messages, setMessages] = useState<VoiceAssistantMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'يا هلا ومرحباً بك في يوصل! أنا وكيلك الصوتي الذكي لتوريد ضيافة المناسبات. تفضل بالتحدث صوتياً أو كتابة طلبك، وأنا جاهز لتجهيز أفضل الباقات لك.',
      spokenAudio: 'يا هلا ومرحباً بك في يوصل! أنا وكيلك الصوتي الذكي.',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      action: 'recommend_service',
      suggestedServiceIds: [],
      quickOptions: [
        'أبغى ضيافة قهوة في الرياض',
        'كم تكلفة بوفيه لـ 80 ضيف؟',
        'وش المنتجات المتوفرة في السوق؟',
        'أبي أترك طلب لمدينتي',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('يرجى السماح بصلاحية الميكروفون لاستخدام المحادثة الصوتية.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-to-Speech synthesis for natural spoken replies
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95; // Natural human cadence
    utterance.pitch = 1.0;

    // Look for Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle listening
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('التعرف الصوتي غير مدعوم في متصفحك، يمكنك الكتابة في المربع أدناه.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputQuery('');
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Send query to Voice AI backend
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: VoiceAssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpeech: query,
          conversationHistory: messages.slice(-4),
          currentCity,
        }),
      });

      const data = await res.json();

      const assistantMsg: VoiceAssistantMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.spokenResponse || 'أبشر، بخدمتك لتجهيز مناسبتك بأعلى درجات الفخامة.',
        spokenAudio: data.spokenResponse,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        action: data.action,
        suggestedServiceIds: data.suggestedServiceIds,
        estimatedBudget: data.estimatedBudget,
        bundleDiscount: data.bundleDiscount,
        quickOptions: data.quickOptions,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak response aloud
      if (data.spokenResponse) {
        speakText(data.spokenResponse);
      }
    } catch (err) {
      const fallbackMsg: VoiceAssistantMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: 'يا هلا فيك في يوصل. السوق يعرض منتجات المورّدين المعتمدين فقط، وما فيه كتالوج وهمي. اكتب طلبك أو اترك طلب مدينة.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        suggestedServiceIds: [],
        quickOptions: ['عرض منتجات السوق', 'اترك طلب مدينة'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getServiceById = (id: string): ServiceItem | undefined => {
    return services.find((s) => s.id === id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in duration-200 usil-modal-scroll">
      <div
        className={`bg-white rounded-3xl w-full border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-w-4xl h-[90vh]' : 'max-w-2xl h-[640px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Human-like Voice AI Branding */}
        <div className="bg-gradient-to-r from-[#0A1A33] via-[#0F284D] to-[#155EEF] p-4 sm:p-5 text-white flex items-center justify-between gap-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-[#C0A16B]">
                <Bot className="w-6 h-6" />
              </div>
              {/* Pulsing Status Dot */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A1A33] ${
                  isSpeaking
                    ? 'bg-emerald-400 animate-ping'
                    : isListening
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">وكيل يوصل الصوتي الذكي</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#C0A16B]/20 text-[#C0A16B] text-[10px] font-bold border border-[#C0A16B]/30 font-mono">
                  VOICE AI ⚡
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal">
                محادثة صوتية تفاعلية تحاكي الإنسان لاختيار وتنسيق الضيافة والباقات
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Voice Mute Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) window.speechSynthesis?.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? 'كتم الصوت' : 'تفعيل الصوت البشري'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${
                voiceEnabled
                  ? 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                  : 'bg-red-500/20 text-red-200 border-red-400/30'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Expand / Minimize Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'تصغير النافذة' : 'تكبير النافذة'}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                if (isSpeaking) window.speechSynthesis?.cancel();
                onClose();
              }}
              aria-label="إغلاق الوكيل الصوتي"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/30 text-white flex items-center justify-center transition-colors border border-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Waveform Indicator (When Speaking or Listening) */}
        {(isListening || isSpeaking) && (
          <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs text-white border-b border-slate-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">
                {isListening ? 'جارٍ الاستماع لصوتك الآن...' : 'المساعد الصوتي يتحدث...'}
              </span>
            </div>
            {/* Sound Wave Bars */}
            <div className="flex items-center gap-1">
              {[40, 75, 95, 60, 85, 45, 90, 65].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-[#C0A16B] rounded-full animate-bounce"
                  style={{
                    height: `${h * 0.22}px`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50">
          {speechError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center justify-between">
              <span>{speechError}</span>
              <button
                onClick={() => setSpeechError(null)}
                className="text-amber-900 underline text-[11px]"
              >
                تجاهل
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#155EEF] text-white'
                      : 'bg-[#0A1A33] text-[#C0A16B]'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#155EEF] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="font-medium">{msg.text}</p>

                  <div
                    className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                      msg.sender === 'user' ? 'text-blue-200 justify-end' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && voiceEnabled && (
                      <button
                        onClick={() => speakText(msg.text)}
                        title="إعادة نطق الإجابة"
                        className="hover:text-[#155EEF] transition-colors"
                      >
                        <Volume2 className="w-3 h-3 inline" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Service Recommendations from Voice AI */}
              {msg.suggestedServiceIds && msg.suggestedServiceIds.length > 0 && (
                <div className="mt-3 mr-10.5 space-y-2 w-full max-w-[90%]">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#155EEF]" />
                    <span>الخدمات المقترحة صوتياً لمناسبتك:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {msg.suggestedServiceIds.map((srvId) => {
                      const service = getServiceById(srvId);
                      if (!service) return null;

                      return (
                        <div
                          key={service.id}
                          className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#155EEF]/50 transition-all flex flex-col justify-between"
                        >
                          <div className="flex gap-2.5 items-start">
                            <img
                              src={service.image}
                              alt={service.title}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-[#155EEF] bg-blue-50 px-1.5 py-0.5 rounded">
                                {service.categoryName}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                                {service.title}
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="font-black text-slate-900 text-xs">
                                  {service.price.toLocaleString('ar-SA')} ر.س
                                </span>
                                <span className="text-[10px] text-slate-400">/{service.priceUnit}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                            <button
                              onClick={() => onAddToCart(service)}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0A1A33] hover:bg-[#101828] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                            >
                              <ShoppingBag className="w-3 h-3 text-[#C0A16B]" />
                              <span>إضافة للسلة</span>
                            </button>
                            <button
                              onClick={() => onOpenServiceDetails(service)}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                            >
                              تفاصيل
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Spoken Action Options */}
              {msg.quickOptions && msg.quickOptions.length > 0 && (
                <div className="mt-2 mr-10.5 flex flex-wrap gap-1.5">
                  {msg.quickOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(opt)}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-[#155EEF] text-xs font-bold transition-all shadow-xs"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit shadow-xs animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#155EEF]" />
              <span>الوكيل الصوتي يقوم بتحليل طلبك وإعداد التوصية...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
                  : 'bg-gradient-to-br from-[#0A1A33] to-[#155EEF] text-white hover:opacity-90'
              }`}
              title={isListening ? 'إيقاف التسجيل الصوتي' : 'تحدث صوتياً الآن'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#C0A16B]" />}
            </button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  isListening
                    ? 'تحدث الآن، الوكيل الصوتي يستمع لك...'
                    : 'اكتب طلبك أو اضغط على الميكروفون للتحدث صوتياً...'
                }
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-[#155EEF] focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              aria-label="إرسال الرسالة إلى الوكيل الصوتي"
              className="w-12 h-12 rounded-2xl bg-[#0A1A33] hover:bg-[#101828] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180 text-[#C0A16B]" />
            </button>
          </form>

          {/* Assistant Capabilities Badges */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>يدعم اللهجة السعودية والفصحى، وتجهيز الباقات المتكاملة</span>
            </span>
            <button
              type="button"
              onClick={onOpenCalculator}
              className="text-[#155EEF] font-bold hover:underline flex items-center gap-1"
            >
              <Calculator className="w-3 h-3" />
              <span>فتح حاسبة المناسبات السريعة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
