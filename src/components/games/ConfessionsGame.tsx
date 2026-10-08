"use client";

import React, { useState } from "react";
import { MessageCircle, ThumbsUp, Send, Sparkles, Shuffle } from "lucide-react";

interface ConfessionItem {
  id: string;
  question: string;
  votes: number;
}

const DEFAULT_CONFESSIONS: ConfessionItem[] = [
  {
    id: "1",
    question: "¿Quién del grupo sería el primero en terminar durmiendo en la tina o con los zapatos puestos?",
    votes: 7,
  },
  {
    id: "2",
    question: "¿Quién es más probable que le mande un mensaje arrepentido a su ex a las 4 AM?",
    votes: 12,
  },
  {
    id: "3",
    question: "¿Quién tiene la anécdota de carrete más vergonzosa que todavía nadie sabe?",
    votes: 5,
  },
  {
    id: "4",
    question: "¿Quién es el más amarrete a la hora de pagar la cuota de la vaquita?",
    votes: 9,
  },
  {
    id: "5",
    question: "¿Quién dice siempre 'yo voy por una sola chela y me voy' y se queda hasta que sale el sol?",
    votes: 15,
  },
];

export default function ConfessionsGame() {
  const [confessions, setConfessions] = useState<ConfessionItem[]>(DEFAULT_CONFESSIONS);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [newQuestion, setNewQuestion] = useState<string>("");

  const handleVote = (id: string) => {
    setConfessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % confessions.length);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const newItem: ConfessionItem = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      votes: 1,
    };

    setConfessions([newItem, ...confessions]);
    setActiveIndex(0);
    setNewQuestion("");
  };

  const current = confessions[activeIndex] || confessions[0];

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6 border-purple-500/30 text-center bg-night-950/80">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <MessageCircle className="w-7 h-7 text-purple-400" />
        <h3 className="text-xl sm:text-2xl font-black text-white">
          Ruleta Rusa de Confesiones 🎭
        </h3>
      </div>

      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
        Señalen todos al unísono a la cuenta de 3 a la persona del grupo que mejor encaja con la afirmación.
      </p>

      {/* Main Dilemma Box */}
      <div className="p-6 rounded-3xl bg-purple-950/30 border-2 border-purple-500/50 max-w-lg mx-auto shadow-glow space-y-4">
        <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-widest block">
          Dilema #{activeIndex + 1} de {confessions.length}
        </span>

        <h4 className="text-xl sm:text-2xl font-black text-white leading-snug">
          &ldquo;{current.question}&rdquo;
        </h4>

        {/* Voting & Next buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleVote(current.id)}
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <ThumbsUp className="w-4 h-4 text-purple-400" />
            <span>Votar (+1) • {current.votes} votos</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-carrete-primary hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-glow transition-all active:scale-95"
          >
            <Shuffle className="w-4 h-4" />
            <span>Siguiente Pregunta</span>
          </button>
        </div>
      </div>

      {/* Add your own confession input */}
      <form onSubmit={handleAddQuestion} className="max-w-md mx-auto pt-2 space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 block text-left">
          ¿Tienes una pregunta anónima picante o divertida para el grupo?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe tu pregunta aquí..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 min-h-[44px] bg-night-900 border border-night-700 rounded-2xl px-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!newQuestion.trim()}
            className="min-h-[44px] px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
}
