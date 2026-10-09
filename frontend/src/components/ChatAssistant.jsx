import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  Calendar,
  Sparkles,
  RefreshCw,
  PhoneCall,
  Clock,
  ArrowRight,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Check,
  AlertCircle
} from 'lucide-react';
import EmergencyModal from './EmergencyModal';

const API_BASE = 'http://localhost:5000/api';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', speechLang: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', speechLang: 'te-IN' }
];

const LOCALIZED_DATA = {
  en: {
    welcome: "👋 Welcome to **CareConnect Virtual Health Assistant**!\n\nI can help you navigate symptoms, recommend the right specialist department, assist with OPD appointment bookings, and answer hospital queries.\n\n*How may I assist you today?*",
    placeholder: "Describe symptoms or ask about OPD hours, doctors, fees... (or use mic)",
    listeningBanner: "Listening in English... Speak clearly now",
    errorMic: "Microphone access denied or not supported in this browser.",
    actions: {
      book: "Book Appointment",
      track: "Track Appointment",
      opd: "OPD Timings"
    },
    prompts: [
      'I have persistent knee & joint pain',
      'My 3-year-old child has a fever',
      'What are your OPD timings?',
      'What are the doctor consultation fees?',
      'What documents should I bring?',
      'I have a skin rash and itching'
    ]
  },
  hi: {
    welcome: "👋 **केयरकनेक्ट डिजिटल स्वास्थ्य सहायक** में आपका स्वागत है!\n\nमैं आपके लक्षणों का मूल्यांकन कर सही विशेषज्ञ विभाग का सुझाव दे सकता हूँ, ओपीडी अपॉइंटमेंट बुक करने और अस्पताल से जुड़े सवालों के उत्तर दे सकता हूँ।\n\n*आज मैं आपकी क्या सहायता कर सकता हूँ?*",
    placeholder: "अपने लक्षण बताएं या ओपीडी समय, डॉक्टर, फीस के बारे में पूछें... (या माइक दबाएं)",
    listeningBanner: "हिन्दी में सुन रहे हैं... कृपया अब बोलें",
    errorMic: "माइक्रोफ़ोन अनुमति अस्वीकृत या यह ब्राउज़र समर्थित नहीं है।",
    actions: {
      book: "अपॉइंटमेंट बुक करें",
      track: "बुकिंग स्थिति जांचें",
      opd: "ओपीडी का समय"
    },
    prompts: [
      'मुझे घुटने और जोड़ों में दर्द है',
      'मेरे 3 साल के बच्चे को बुखार है',
      'ओपीडी का समय क्या है?',
      'डॉक्टर की फीस कितनी है?',
      'अस्पताल आते समय क्या दस्तावेज लाएं?',
      'त्वचा पर खुजली और लाल दाने हैं'
    ]
  },
  te: {
    welcome: "👋 **కేర్‌కనెక్ట్ వర్చువల్ హెల్త్ అసిస్టెంట్‌**కు స్వాగతం!\n\nమీ ఆరోగ్య లక్షణాలను బట్టి తగిన వైద్య విభాగాన్ని సిఫార్సు చేయడం, OPD అపాయింట్‌మెంట్ బుకింగ్ మరియు ఆసుపత్రి సమాచారం అందించడంలో నేను సహాయపడగలను.\n\n*ఈ రోజు మీకు ఎలా సహాయపడగలను?*",
    placeholder: "మీ లక్షణాలను తెలపండి లేదా OPD సమయాలు, డాక్టర్ల వివరాలు అడగండి... (లేదా మైక్ నొక్కండి)",
    listeningBanner: "తెలుగులో వింటున్నాము... దయచేసి ఇప్పుడు మాట్లాడండి",
    errorMic: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది లేదా ఈ బ్రౌజర్‌లో అందుబాటులో లేదు.",
    actions: {
      book: "అపాయింట్‌మెంట్ బుక్ చేయండి",
      track: "బుకింగ్ వివరాలు చూడండి",
      opd: "OPD సమయాలు"
    },
    prompts: [
      'నాకు మోకాలు మరియు కీళ్ల నొప్పులు ఉన్నాయి',
      'నా 3 సంవత్సరాల పాపకి జ్వరం వచ్చింది',
      'OPD సమయాలు ఏమిటి?',
      'డాక్టర్ కన్సల్టేషన్ ఫీజు ఎంత?',
      'ఆసుపత్రికి వచ్చేటప్పుడు ఏ డాక్యుమెంట్లు తీసుకురావాలి?',
      'చర్మంపై దురద మరియు దద్దుర్లు ఉన్నాయి'
    ]
  }
};

export default function ChatAssistant({ onNavigateToBooking, onNavigateToLookup }) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [micStatusText, setMicStatusText] = useState('');
  const [micError, setMicError] = useState('');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: LOCALIZED_DATA.en.welcome,
      isEmergency: false,
      actions: [
        { label: 'Book Appointment', type: 'navigate', value: 'booking' },
        { label: 'Track Appointment', type: 'navigate', value: 'lookup' },
        { label: 'OPD Timings', type: 'faq', value: 'What are your OPD timings?' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionInstanceRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  const currentLangData = LOCALIZED_DATA[selectedLang] || LOCALIZED_DATA.en;

  // Cleanup audio tracks on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  // Stop active microphone & speech recognition
  const stopListening = () => {
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionInstanceRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setIsListening(false);
    setMicStatusText('');
    setVolumeLevel(0);
  };

  // Robust Microphone / Speech-to-Text handler
  const startListening = async () => {
    stopListening();
    setMicError('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(
        'Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    // 1. Explicitly request microphone stream from user to guarantee browser permission
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.warn('Microphone permission check failed:', err);
      setMicError(
        'Microphone access blocked. Please click the permissions icon in your browser address bar and allow Microphone access.'
      );
      return;
    }

    // 2. Setup Web Audio Analyser for live visual feedback of user voice volume
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      console.warn('Web Audio meter not available:', e);
    }

    // 3. Create fresh SpeechRecognition instance
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const speechLang = LANGUAGES.find((l) => l.code === selectedLang)?.speechLang || 'en-IN';
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusText(currentLangData.listeningBanner);
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript.trim()) {
          setInput(fullTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError(
            'Microphone access is blocked. Please allow microphone in Chrome settings.'
          );
        } else if (event.error === 'network') {
          setMicError(
            'Browser speech service encountered a network error. Please verify internet connection.'
          );
        } else if (event.error !== 'no-speech') {
          setMicError(`Voice error: ${event.error}. You can also type your message directly.`);
        }
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionInstanceRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting SpeechRecognition:', err);
      setMicError(`Failed to initialize speech recognition: ${err.message}`);
      stopListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  };

  // Language Change
  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    stopSpeaking();
    stopListening();
    setMicError('');

    const langData = LOCALIZED_DATA[langCode] || LOCALIZED_DATA.en;
    const langSwitchMsg = {
      id: 'lang-switch-' + Date.now(),
      sender: 'bot',
      text: langData.welcome,
      isEmergency: false,
      actions: [
        { label: langData.actions.book, type: 'navigate', value: 'booking' },
        { label: langData.actions.track, type: 'navigate', value: 'lookup' },
        { label: langData.actions.opd, type: 'faq', value: 'What are your OPD timings?' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, langSwitchMsg]);
  };

  // Text to Speech
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  const speakText = (text, msgId, langCode = selectedLang) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/•/g, ', ')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (langCode === 'te') {
      utterance.lang = 'te-IN';
    } else if (langCode === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(
      (v) =>
        v.lang === utterance.lang ||
        v.lang.startsWith(langCode) ||
        v.name.toLowerCase().includes(langCode === 'te' ? 'telugu' : langCode === 'hi' ? 'hindi' : 'english')
    );
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.rate = 0.95;
    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    stopSpeaking();
    stopListening();

    const userMsgId = 'user-' + Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, language: selectedLang })
      });

      const data = await res.json();
      const botMsgId = 'bot-' + Date.now();

      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: data.reply || "I'm sorry, I couldn't process your request. Please try again.",
        isEmergency: !!data.is_emergency,
        category: data.category,
        actions: data.suggested_actions || [],
        deptRec: data.department_recommendation,
        disclaimer: data.disclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      if (autoSpeak) {
        speakText(botMsg.text, botMsgId, selectedLang);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'bot',
          text: '⚠️ Unable to connect to CareConnect Assistant service. Please verify the backend is running at http://localhost:5000.',
          isEmergency: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.type === 'navigate') {
      if (action.value === 'booking' && onNavigateToBooking) onNavigateToBooking();
      if (action.value === 'lookup' && onNavigateToLookup) onNavigateToLookup();
    } else if (action.type === 'book_dept') {
      if (onNavigateToBooking) onNavigateToBooking(action.value);
    } else if (action.type === 'faq') {
      handleSendMessage(action.value);
    } else if (action.type === 'call') {
      // Open the clean emergency helpline modal instead of navigating to a blank chrome website!
      setEmergencyModalOpen(true);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    stopListening();
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: currentLangData.welcome,
        isEmergency: false,
        actions: [
          { label: currentLangData.actions.book, type: 'navigate', value: 'booking' },
          { label: currentLangData.actions.opd, type: 'faq', value: 'What are your OPD timings?' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Emergency Contacts Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      <div className="chat-wrapper">
        <div className="chat-box">
          {/* Header */}
          <div className="chat-box-header">
            <div className="chat-header-info">
              <div className="bot-avatar">
                <Bot size={22} />
              </div>
              <div>
                <div className="chat-header-title">CareConnect AI Assistant</div>
                <div className="chat-status-indicator">
                  <span className="chat-status-dot"></span>
                  <span>Active • Voice & Multilingual Enabled</span>
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Reset conversation"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}
            >
              <RefreshCw size={14} /> Clear
            </button>
          </div>

          {/* Voice & Language Selection Bar */}
          <div className="voice-control-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Languages size={15} /> Language / భాష / भाषा:
              </span>
              <div className="language-selector">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`lang-pill-btn ${selectedLang === lang.code ? 'active' : ''}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Read-out Toggle */}
            <button
              type="button"
              className={`voice-auto-read-btn ${autoSpeak ? 'active' : ''}`}
              onClick={() => setAutoSpeak(!autoSpeak)}
              title="Automatically read aloud replies"
            >
              {autoSpeak ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>Voice Narration: {autoSpeak ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages-container">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              const isSpeakingThis = speakingMsgId === m.id;

              return (
                <div
                  key={m.id}
                  className={`message-item ${isUser ? 'user' : 'assistant'} ${
                    m.isEmergency ? 'emergency' : ''
                  } animate-fade-in`}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: m.isEmergency ? '#be123c' : 'linear-gradient(135deg, #0284c7, #0d9488)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                      }}
                    >
                      {m.isEmergency ? <AlertTriangle size={17} /> : <Bot size={17} />}
                    </div>
                  )}

                  <div style={{ maxWidth: '85%' }}>
                    <div className="message-bubble">
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                      {/* Department Recommendation Card */}
                      {m.deptRec && (
                        <div
                          style={{
                            marginTop: '0.85rem',
                            padding: '0.75rem',
                            background: '#f0fdfa',
                            border: '1px solid #99f6e4',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f766e' }}>
                              {selectedLang === 'hi'
                                ? 'अनुशंसित विभाग'
                                : selectedLang === 'te'
                                ? 'సిఫార్సు చేయబడిన విభాగం'
                                : 'Recommended Department'}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#134e4a' }}>
                              {m.deptRec.department_name}
                            </div>
                          </div>
                          <button
                            onClick={() => onNavigateToBooking && onNavigateToBooking(m.deptRec.department_id)}
                            className="btn-primary"
                            style={{
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              background: '#0d9488',
                              color: '#fff'
                            }}
                          >
                            {selectedLang === 'hi' ? 'बुक करें' : selectedLang === 'te' ? 'బుక్ చేయండి' : 'Book Now'}{' '}
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      )}

                      {/* Interactive Action Chips */}
                      {m.actions && m.actions.length > 0 && (
                        <div className="suggested-actions">
                          {m.actions.map((act, i) => (
                            <button
                              key={i}
                              className="action-btn-chip"
                              onClick={() => handleActionClick(act)}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Speaker Read-Aloud Button */}
                      {!isUser && (
                        <div
                          style={{
                            marginTop: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <button
                            type="button"
                            className={`message-speak-btn ${isSpeakingThis ? 'speaking' : ''}`}
                            onClick={() => speakText(m.text, m.id)}
                            title={isSpeakingThis ? 'Stop speaking' : 'Listen to this message'}
                          >
                            {isSpeakingThis ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            <span>{isSpeakingThis ? 'Stop Audio' : 'Listen Voice'}</span>
                          </button>

                          <span className="message-time">{m.timestamp}</span>
                        </div>
                      )}

                      {/* Disclaimer */}
                      {m.disclaimer && (
                        <div className="disclaimer-tag">
                          {m.disclaimer}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="message-time" style={{ textAlign: 'right' }}>
                        {m.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="message-item assistant animate-fade-in">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  <Bot size={17} />
                </div>
                <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: '#0284c7',
                      borderRadius: '50%',
                      animation: 'pulseGlow 1s infinite'
                    }}
                  ></span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {selectedLang === 'hi'
                      ? 'लक्षणों का विश्लेषण किया जा रहा है...'
                      : selectedLang === 'te'
                      ? 'లక్షణాలను విశ్లేషిస్తున్నాము...'
                      : 'Analyzing symptoms & querying hospital directory...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Quick Chips */}
          <div className="chat-input-area">
            {/* Mic Error Alert */}
            {micError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.5rem 0.85rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{micError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicError('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Active Voice Listening Banner with Audio Volume Meter */}
            {isListening && (
              <div className="listening-wave-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="sound-wave-bars">
                    <div className="wave-bar" style={{ height: Math.max(6, (volumeLevel / 100) * 22) + 'px' }}></div>
                    <div className="wave-bar" style={{ height: Math.max(8, (volumeLevel / 100) * 26) + 'px' }}></div>
                    <div className="wave-bar" style={{ height: Math.max(10, (volumeLevel / 100) * 30) + 'px' }}></div>
                    <div className="wave-bar" style={{ height: Math.max(7, (volumeLevel / 100) * 24) + 'px' }}></div>
                  </div>
                  <span>{micStatusText || currentLangData.listeningBanner}</span>
                  {volumeLevel > 5 && (
                    <span style={{ fontSize: '0.72rem', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                      Audio detected 🎙️
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Done Speaking
                </button>
              </div>
            )}

            {/* Quick Prompts Bar */}
            <div className="quick-prompts-bar">
              {currentLangData.prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  className="quick-chip"
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              {/* Microphone Button with Active Listening Glow */}
              <button
                type="button"
                className={`chat-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={
                  isListening
                    ? 'Listening... Click to stop'
                    : `Click to speak in ${LANGUAGES.find((l) => l.code === selectedLang)?.native}`
                }
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <input
                type="text"
                className="chat-input"
                placeholder={currentLangData.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />

              <button
                type="submit"
                className="chat-send-btn"
                disabled={loading || !input.trim()}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Emergency Alert Card */}
          <div
            className="card"
            style={{
              background: 'var(--emergency-bg)',
              borderColor: 'var(--emergency-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldAlert size={22} color="var(--emergency)" />
              <span style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem' }}>
                {selectedLang === 'hi' ? 'आपातकालीन सहायता' : selectedLang === 'te' ? 'అత్యవసర సహాయం' : 'Emergency Notice'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#9f1239', lineHeight: 1.5, marginBottom: '12px' }}>
              {selectedLang === 'hi'
                ? 'यदि सीने में दर्द, सांस फूलना या भारी रक्तस्राव हो, तो तुरंत संपर्क करें:'
                : selectedLang === 'te'
                ? 'ఛాతీ నొప్పి, శ్వాస ఆడకపోవడం లేదా తీవ్రమైన రక్తస్రావం ఉంటే వెంటనే సంప్రదించండి:'
                : 'If experiencing severe chest pain, acute breathlessness, or trauma, contact immediately:'}
            </p>
            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="emergency-quick-btn"
              style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
            >
              <PhoneCall size={16} />{' '}
              {selectedLang === 'hi'
                ? 'आपातकालीन नंबर देखें (112)'
                : selectedLang === 'te'
                ? 'అత్యవసర నంబర్లు (112)'
                : 'Emergency Helpline (112)'}
            </button>
          </div>

          {/* Voice & Multilingual Info Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
              borderColor: '#ccfbf1'
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#0f766e'
              }}
            >
              <Mic size={17} color="#0d9488" /> Multilingual Voice Assistant
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#134e4a', lineHeight: 1.5, marginBottom: '10px' }}>
              Supports natural speech and voice responses in 3 languages:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#0f766e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🇬🇧</span> <strong>English:</strong> Speak symptoms & listen to advice
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🇮🇳</span> <strong>हिन्दी (Hindi):</strong> बोलकर लक्षण बताएं और सुनें
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🇮🇳</span> <strong>తెలుగు (Telugu):</strong> మాట్లాడి డాక్టర్ సలహా పొందండి
              </div>
            </div>
          </div>

          {/* Quick Capabilities Card */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--primary)" /> Assistant Capabilities
            </h3>
            <ul
              style={{
                listStyle: 'none',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✓ <strong>Symptom Triage:</strong> Recommends specialist department
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✓ <strong>Real-time Slot Booking:</strong> Book in-person OPD slots
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✓ <strong>Voice STT & TTS:</strong> Voice input + Speech playback
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✓ <strong>Hospital Guide:</strong> OPD hours, fees & visiting rules
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
