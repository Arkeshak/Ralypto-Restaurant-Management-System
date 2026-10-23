import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type MicState = 'idle' | 'listening' | 'processing' | 'error';

interface MicButtonProps {
  onTranscript: (transcript: string) => void;
  lang?: 'en-US' | 'si-LK' | 'ta-LK' | string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  onTranscript,
  lang,
  size = 'md',
  label,
  className = '',
  disabled = false,
}) => {
  const { i18n } = useTranslation();
  const [state, setState] = useState<MicState>('idle');
  const [liveSnippet, setLiveSnippet] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Derive recognition language from props or active i18n language
  const activeLang = lang || (i18n.language === 'si' ? 'si-LK' : i18n.language === 'ta' ? 'ta-LK' : 'en-US');

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already idle
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (disabled || state === 'listening') return;

    // Check for Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Graceful simulated input fallback for environments without Web Speech API
      const simulatedText = window.prompt(
        'Voice input simulation (Web Speech API not available in this browser):\nTry: "Table 5, two chicken kottu, one lime juice, extra spicy"',
        'Table 5, two chicken kottu, one lime juice, extra spicy'
      );
      if (simulatedText) {
        onTranscript(simulatedText);
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = activeLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState('listening');
        setLiveSnippet('');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setLiveSnippet(transcript);

        if (event.results[0]?.isFinal) {
          setState('processing');
          setTimeout(() => {
            onTranscript(transcript);
            setState('idle');
            setLiveSnippet('');
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[MicButton] Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setState('error');
          setTimeout(() => setState('idle'), 2000);
        } else {
          setState('idle');
        }
      };

      recognition.onend = () => {
        setState((curr) => (curr === 'listening' ? 'idle' : curr));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[MicButton] Could not start speech recognition:', err);
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }, [disabled, state, activeLang, onTranscript]);

  const toggleListening = () => {
    if (state === 'listening') {
      stopListening();
      setState('idle');
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const sizeClasses = {
    sm: 'p-2 text-xs gap-1.5',
    md: 'p-3 text-sm gap-2',
    lg: 'p-4 text-base gap-3',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        aria-label={label || 'Voice input (Push to talk)'}
        title={label || 'Click to talk (English, Sinhala, Tamil)'}
        className={`relative inline-flex items-center justify-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 select-none ${sizeClasses} ${
          state === 'listening'
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50 scale-105 animate-pulse ring-4 ring-rose-500/30'
            : state === 'processing'
            ? 'bg-amber-600 text-white'
            : state === 'error'
            ? 'bg-red-800 text-white'
            : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 hover:border-zinc-500 active:scale-95'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        {state === 'processing' ? (
          <Loader2 className={`${iconSizes} animate-spin`} />
        ) : state === 'listening' ? (
          <Mic className={`${iconSizes} animate-bounce`} />
        ) : state === 'error' ? (
          <MicOff className={iconSizes} />
        ) : (
          <Mic className={iconSizes} />
        )}

        {label && <span className="font-semibold">{label}</span>}
      </button>

      {/* Floating listening waveform / snippet indicator */}
      {state === 'listening' && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none whitespace-nowrap bg-black/90 backdrop-blur-md text-white border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-2xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-mono text-zinc-300">
            {liveSnippet ? `"${liveSnippet}"` : 'Listening... speak now'}
          </span>
        </div>
      )}
    </div>
  );
};
