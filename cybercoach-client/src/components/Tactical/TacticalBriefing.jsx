import React from 'react';
import { Brain, CheckCircle2, AlertOctagon } from 'lucide-react';
import { detectPlaystyle } from '../../utils/analytics';
import PerformanceRadar from '../Charts/PerformanceRadar';

const TacticalBriefing = ({ stats }) => {
  if (!stats || !stats.profile) return null;

  const { kpr, dpr, adr, kast, impact, rating } = stats.profile;
  const playstyleData = detectPlaystyle(stats);

  // Fix: Definindo variáveis que o usuário adicionou
  const hs_percent = stats.categories?.firepower?.items?.find(i => i.label === "HS %")?.value || 0;
  const kd_ratio = (parseFloat(kpr) / (parseFloat(dpr) || 1)).toFixed(2);

  const pros = [];
  const cons = [];

  // Lógica de Pontos Fortes
  if (parseFloat(rating) >= 1.15) pros.push("Rating de elite. Você carrega o time.");
  if (parseFloat(adr) > 85) pros.push("Dano massivo. Pressão constante.");
  if (parseFloat(kast) > 74) pros.push("KAST Sólido. Contribui quase todo round.");
  if (parseFloat(dpr) < 0.60) pros.push("Difícil de matar. Posicionamento seguro.");
  if (parseFloat(rating) <= 0.7) pros.push("Nossa, nada de bom por aqui.");
  if (parseFloat(hs_percent) > 55) pros.push("Aim de alto nível. Mira na cabeça em dia.");
  if (parseFloat(hs_percent) > 40 && parseFloat(hs_percent) <= 55) pros.push("Mira consistente.");
  if (parseFloat(kpr) > 0.85) pros.push("Máquina de matar. Garante frags todo round.");
  if (parseFloat(kd_ratio) > 1.3) pros.push("Vantagem numérica. Mata muito mais do que morre.");

  // Lógica de Pontos Fracos
  if (parseFloat(rating) < 0.95) cons.push("Impacto baixo. Participe mais das jogadas decisivas.");
  if (parseFloat(adr) < 65) cons.push("Dano crítico. Treine spray e mira.");
  if (parseFloat(dpr) > 0.75) cons.push("Feeding. Evite avanços sem necessidade.");
  if (parseFloat(hs_percent) < 30) cons.push("Headshot baixo. Tente focar na altura da cabeça.");
  if (parseFloat(kpr) < 0.55) cons.push("Passivo demais. O time precisa de mais iniciativa sua.");
  if (parseFloat(kd_ratio) < 0.9) cons.push("K/D Negativo. Cuidado para não entregar rounds.");

  if (pros.length === 0) pros.push("Jogo consistente. Mantenha o foco.");
  if (cons.length === 0) cons.push("Sem falhas graves detectadas.");

  // Lógica de Plano de Treino
  const trainingPlan = [];

  if (parseFloat(stats.profile.kpr) < 0.65) {
    trainingPlan.push({
      title: "Treino de Mira (Aim Lab)",
      desc: "Seu KPR está baixo. Foque em reflexos e tracking.",
      link: "https://store.steampowered.com/app/714010/Aim_Lab/",
      icon: "🎯"
    });
  }

  if (parseFloat(stats.profile.adr) < 70) {
    trainingPlan.push({
      title: "Spray Control (Recoil Master)",
      desc: "Dano baixo indica problemas com spray. Treine os padrões das armas.",
      link: "https://steamcommunity.com/sharedfiles/filedetails/?id=419404847",
      icon: "🔫"
    });
  }

  const utilDmg = parseFloat(stats.categories?.utility?.items?.[0]?.value || 0);
  if (utilDmg < 2.0) {
    trainingPlan.push({
      title: "Yprac Guide (Utilitários)",
      desc: "Aprenda smokes e flashes essenciais para cada mapa.",
      link: "https://steamcommunity.com/workshop/filedetails/?id=740795413",
      icon: "💣"
    });
  }

  if (parseFloat(stats.profile.dpr) > 0.75) {
    trainingPlan.push({
      title: "Análise de Demo (Posicionamento)",
      desc: "Você morre muito. Assista suas demos e veja onde foi pego fora de posição.",
      link: "https://www.youtube.com/results?search_query=cs2+positioning+guide",
      icon: "📹"
    });
  }

  // Fallback se não tiver recomendações específicas
  if (trainingPlan.length === 0) {
    trainingPlan.push({
      title: "Manutenção de Rotina",
      desc: "Seus stats estão sólidos. Mantenha o aquecimento diário.",
      link: "https://www.youtube.com/results?search_query=AQUECIMENTO+CS2",
      icon: "🔥"
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 max-w-6xl mx-auto">

      {/* Card de Estilo (Esquerda - Spans 6 cols) */}
      <div className="lg:col-span-6 bg-[#151922] border border-white/5 rounded-sm p-0 flex flex-col shadow-lg relative overflow-hidden group">
        <div className="p-4 border-b border-white/5 bg-[#1e232d]/50 flex justify-between items-center">
          <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <Brain size={16} /> ANÁLISE DE ESTILO
          </h3>
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500 border border-white/5">AI v2.0</span>
        </div>

        <div className="flex-1 flex flex-row items-center p-6 gap-4">
          <div className="flex-1 flex flex-col items-center text-center z-10">
            <h2 className="text-2xl font-bold text-white mb-2">{playstyleData.title}</h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">{playstyleData.desc}</p>

            <div className="flex gap-2">
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/20 uppercase">ROLE</span>
              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20 uppercase">IMPACT</span>
            </div>
          </div>

          <div className="w-48 h-48 flex-shrink-0 border-l border-white/5 pl-4">
            <PerformanceRadar stats={stats} />
          </div>
        </div>
      </div>

      {/* Pontos Fortes (Meio - Spans 3 cols) */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="bg-[#1e232d]/90 border-l-4 border-green-500 rounded-r-sm p-5 shadow-lg flex-1">
          <h3 className="text-green-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} /> PONTOS FORTES
          </h3>
          <ul className="space-y-3">
            {pros.map((text, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-3 items-start">
                <span className="text-green-500 mt-1 text-[10px]">●</span> {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#1e232d]/90 border-l-4 border-red-500 rounded-r-sm p-5 shadow-lg flex-1">
          <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
            <AlertOctagon size={16} /> ÁREAS DE MELHORIA
          </h3>
          <ul className="space-y-3">
            {cons.map((text, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-3 items-start">
                <span className="text-red-500 mt-1 text-[10px]">●</span> {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Plano de Treino (Direita - Spans 3 cols) */}
      <div className="lg:col-span-3 bg-[#151922] border border-white/5 rounded-sm p-0 flex flex-col shadow-lg">
        <div className="p-4 border-b border-white/5 bg-[#1e232d]/50">
          <h3 className="text-purple-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            🎯 PLANO DE TREINO
          </h3>
        </div>
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            {trainingPlan.map((plan, i) => (
              <a key={i} href={plan.link} target="_blank" rel="noopener noreferrer" className="block bg-[#1e232d] p-3 rounded border border-white/5 hover:border-purple-500/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{plan.icon}</span>
                  <div>
                    <h4 className="text-white text-sm font-bold group-hover:text-purple-400 transition-colors">{plan.title}</h4>
                    <p className="text-gray-500 text-[10px] mt-1 leading-tight">{plan.desc}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TacticalBriefing;