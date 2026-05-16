/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Drum, Music, Info, Trash2 } from 'lucide-react';

// Constants
const BPM = 88;
const MAX_BEATS = 4.0;
const BEAT_TIME = 60 / BPM;

interface NoteType {
  id: string;
  type: '4' | '4r' | '8-8' | '8' | '8r' | '16-16';
  label: string;
  icon: string;
  len: number;
}

const NOTE_PALETTE: NoteType[] = [
  { id: 'n1', type: '4', label: '4분음표', icon: '♩', len: 1.0 },
  { id: 'n2', type: '4r', label: '4분쉼표', icon: '𝄽', len: 1.0 },
  { id: 'n3', type: '8-8', label: '8분 2개', icon: '♫', len: 1.0 },
  { id: 'n4', type: '8', label: '8분 1개', icon: '♪', len: 0.5 },
  { id: 'n5', type: '8r', label: '8분쉼표', icon: '𝄾', len: 0.5 },
  { id: 'n6', type: '16-16', label: '16분 2개', icon: '♬', len: 0.5 },
];

export default function App() {
  const [sequence, setSequence] = useState<NoteType[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const totalBeats = sequence.reduce((sum, note) => sum + note.len, 0);
  const remainingBeats = Math.max(0, MAX_BEATS - totalBeats);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playTick = (freq: number, startTime: number, duration: number) => {
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const addNote = (note: NoteType) => {
    if (totalBeats + note.len > MAX_BEATS + 0.001) {
      return;
    }
    setSequence(prev => [...prev, note]);
  };

  const removeLastNote = () => {
    setSequence(prev => prev.slice(0, -1));
  };

  const reset = () => {
    setSequence([]);
    setActiveIndex(null);
  };

  const playRhythm = async () => {
    if (sequence.length === 0 || isPlaying) return;
    
    initAudio();
    setIsPlaying(true);
    
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    let nextStartTime = ctx.currentTime + 0.1;

    for (let i = 0; i < sequence.length; i++) {
      const note = sequence[i];
      const visualDelay = (nextStartTime - ctx.currentTime) * 1000;
      setTimeout(() => setActiveIndex(i), visualDelay);

      switch (note.type) {
        case '4':
          playTick(440, nextStartTime, 0.1);
          break;
        case '8-8':
          playTick(440, nextStartTime, 0.05);
          playTick(440, nextStartTime + (BEAT_TIME / 2), 0.05);
          break;
        case '8':
          playTick(440, nextStartTime, 0.05);
          break;
        case '16-16':
          playTick(550, nextStartTime, 0.03);
          playTick(550, nextStartTime + (BEAT_TIME / 4), 0.03);
          break;
      }

      const duration = note.len * BEAT_TIME;
      nextStartTime += duration;
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    setActiveIndex(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-studio-bg text-slate-200 overflow-hidden font-sans">
      {/* Top Header Section */}
      <header className="flex items-center justify-between px-8 py-6 bg-studio-card border-b border-studio-border shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-neon-emerald rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Drum className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase leading-tight">
              Rhythm Lab <span className="text-slate-500 font-normal">Foundry</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">AUDIO_ENGINE: STABLE_V2</p>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-studio-bg px-6 py-2 rounded-full border border-studio-border">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tempo</span>
            <span className="text-xl font-mono text-neon-emerald font-bold">{BPM}.00 <span className="text-xs text-slate-700">BPM</span></span>
          </div>
          <div className="w-px h-8 bg-studio-border"></div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Signature</span>
            <span className="text-xl font-mono text-white">4 / 4</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="hidden md:flex gap-3">
            <div className="flex flex-col items-end justify-center">
              <span className="text-[10px] text-slate-500 font-mono">LATENCY: 12ms</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tighter">BITRATE: 320KBPS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto">
        {/* Sequence Timeline Card */}
        <div className="flex-1 bg-studio-card rounded-3xl border border-studio-border shadow-2xl p-8 md:p-10 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2 items-center">
              <motion.span 
                animate={isPlaying ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 rounded-full bg-neon-emerald shadow-[0_0_8px_rgba(16,185,129,1)]"
              ></motion.span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Sequence Timeline</span>
            </div>
            <div className="text-sm font-mono bg-studio-bg px-4 py-2 rounded-lg border border-studio-border">
              <span className="text-slate-500">Available:</span>
              <span className="text-neon-emerald font-bold ml-2 underline decoration-emerald-900 underline-offset-4">
                {remainingBeats.toFixed(1)} / 4.0
              </span>
            </div>
          </div>

          <div className="flex-1 border-t border-b border-dashed border-studio-border flex items-center justify-center relative overflow-hidden bg-slate-950/20 rounded-xl">
            <div className="flex items-center gap-4 px-8 w-full justify-center flex-wrap">
              <AnimatePresence mode="popLayout">
                {sequence.map((note, i) => (
                  <motion.div
                    key={`${i}-${note.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: activeIndex === i ? 1.15 : 1,
                      borderColor: activeIndex === i ? 'rgba(16, 185, 129, 0.6)' : 'rgba(30, 41, 59, 0.5)',
                      boxShadow: activeIndex === i ? '0 0 40px rgba(16, 185, 129, 0.15)' : 'none',
                      y: activeIndex === i ? -6 : 0
                    }}
                    exit={{ opacity: 0, scale: 0.5, x: -20 }}
                    className={`
                      relative group flex flex-col items-center
                    `}
                  >
                    <div className={`
                      w-24 h-32 bg-slate-800/40 rounded-2xl border-2 flex flex-col items-center justify-center gap-2
                      transition-all duration-200
                      ${activeIndex === i ? 'bg-slate-800/80 border-neon-emerald/50' : 'border-slate-700/50'}
                    `}>
                      <span className={`text-5xl transition-colors ${activeIndex === i ? 'text-white' : 'text-slate-400'}`}>
                        {note.icon}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {note.len.toFixed(1)} Beat
                      </span>
                    </div>
                    {activeIndex === i && (
                      <motion.div 
                        layoutId="playhead"
                        className="mt-4 w-1.5 h-1.5 bg-neon-emerald rounded-full"
                      />
                    )}
                  </motion.div>
                ))}
                
                {sequence.length < 1 && (
                  <div className="flex flex-col items-center opacity-30">
                    <Music size={48} className="mb-4 text-slate-600" />
                    <span className="text-slate-500 font-mono text-xs uppercase tracking-widest text-center">
                      Drop notes to assemble sequence
                    </span>
                  </div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-4 divide-x divide-slate-800/30 opacity-50">
              <div /> <div /> <div /> <div />
            </div>
          </div>
        </div>

        {/* Bottom Section: Palette & Transport */}
        <div className="flex flex-col lg:flex-row gap-8 shrink-0">
          {/* Note Palette */}
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-2">Subdivision Palette</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {NOTE_PALETTE.map((note) => (
                <motion.button
                  key={note.id}
                  whileHover={{ y: -4, borderColor: '#10b981' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addNote(note)}
                  disabled={isPlaying || totalBeats + note.len > MAX_BEATS + 0.001}
                  className={`
                    flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl border border-slate-800 
                    transition-all text-slate-400 hover:text-white group
                    disabled:opacity-20 disabled:cursor-not-allowed
                  `}
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{note.icon}</span>
                  <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-400 uppercase tracking-wider">
                    {note.len === 1 ? 'Quarter' : 'Eighth'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Transport Controls */}
          <div className="w-full lg:w-80 bg-studio-card rounded-3xl border border-studio-border p-6 flex flex-col justify-between gap-6 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transport Control</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={playRhythm}
                disabled={sequence.length === 0 || isPlaying}
                className="w-full h-16 bg-emerald-600 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg hover:bg-emerald-500 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:bg-slate-800 disabled:shadow-none"
              >
                {isPlaying ? (
                  <div className="flex gap-1 items-center">
                    <span className="w-1 h-4 bg-white animate-[bounce_0.6s_infinite_0.1s]" />
                    <span className="w-1 h-6 bg-white animate-[bounce_0.6s_infinite_0.2s]" />
                    <span className="w-1 h-4 bg-white animate-[bounce_0.6s_infinite_0.3s]" />
                  </div>
                ) : (
                  <Play size={24} fill="currentColor" />
                )}
                {isPlaying ? 'PLAYING...' : 'PLAY SEQUENCE'}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={removeLastNote}
                  disabled={sequence.length === 0 || isPlaying}
                  className="flex-1 h-12 bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-bold text-xs hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-30"
                >
                  <RotateCcw size={16} />
                  UNDO
                </button>
                <button
                  onClick={reset}
                  disabled={sequence.length === 0 || isPlaying}
                  className="flex-1 h-12 bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-rose-400 font-bold text-xs hover:bg-rose-950/20 border border-slate-700 transition-all disabled:opacity-30"
                >
                  <Trash2 size={16} />
                  CLEAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Breadcrumb */}
      <footer className="h-8 bg-studio-bg border-t border-studio-border px-8 flex items-center justify-between shrink-0">
        <div className="flex gap-6">
          <span className="text-[9px] text-slate-600 font-mono uppercase">© 2024 Rhythm Foundry Labs</span>
          <span className="text-[9px] text-slate-600 font-mono uppercase hidden sm:inline">User_Session: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="text-[9px] text-slate-500 uppercase tracking-widest hidden sm:block">Built with Google AI Studio • Production Stable</div>
      </footer>
    </div>
  );
}

