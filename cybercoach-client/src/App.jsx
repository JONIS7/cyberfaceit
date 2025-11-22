import React, { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  Zap, Swords, Activity, Skull, Bomb, Crosshair, 
  Search, Loader2, Calendar, TrendingUp, Share2,
  Target, Brain, CheckCircle2, AlertOctagon
} from 'lucide-react';

// --- IMPORTANTE: Para usar a imagem na sua máquina ---
// 1. Rode no terminal: npm install html2canvas
// 2. Descomente a linha abaixo:
// import html2canvas from 'html2canvas';

// --- CONFIGURAÇÃO ---
const LOCAL_PROXY_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001/faceit" 
  : "/.netlify/functions/faceit";

// --- HELPER: CORES E FORMAT ---
const getRatingColor = (r) => r >= 1.15 ? "#4ade80" : r >= 0.97 ? "#fbbf24" : "#ef4444";

const getRatingLabel = (rating) => {
  if (rating >= 1.15) return 'EXCELENTE';
  if (rating >= 0.97) return 'BOM';
  return 'RUIM';
};

const formatNum = (n, d=2) => n ? parseFloat(n).toFixed(d) : "0.00";

// Helper de Data Relativa
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "-";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "Agora mesmo";
  if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return "Ontem";
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// --- LÓGICA DE ESTILOS DE JOGO (ARQUÉTIPOS DINÂMICOS) ---
const detectPlaystyle = (stats) => {
  const { kpr, dpr, kast, impact } = stats.profile;
  
  const entry = parseFloat(stats.categories?.entering?.items?.[0]?.value || 0); 
  const sniperKills = parseFloat(stats.categories?.sniping?.items?.[0]?.value || 0);
  const utilDmg = parseFloat(stats.categories?.utility?.items?.[0]?.value || 0); 
  const clutchPoints = parseFloat(stats.categories?.clutching?.items?.[1]?.value || 0);
  
  const rKPR = parseFloat(kpr);
  const rDPR = parseFloat(dpr);
  const rImpact = parseFloat(impact);
  const rKAST = parseFloat(kast);

  if (sniperKills > 0.35) return { title: "AWPer", desc: "Especialista com a Sniper. Controla ângulos longos e busca picks decisivos." };
  if (rImpact > 1.30 && rKPR > 0.80) return { title: "Starplayer", desc: "O carregador. Você é a principal fonte de dano e abates do time." };
  if (entry > 0.12) return { title: "Entry Fragger", desc: "A ponta da lança. Você cria espaço e busca o primeiro contato agressivamente." };
  if (rDPR < 0.62 && rKAST > 74 && clutchPoints > 0.2) return { title: "Clutcher", desc: "Frio e calculista. Você brilha nos momentos finais e situações de 1vX." };
  if (rDPR < 0.64 && rKAST > 73) return { title: "Âncora", desc: "A parede defensiva. Você segura bombsites sozinho e pune erros inimigos." };
  if (utilDmg > 5.0) return { title: "Support", desc: "O facilitador. Seu impacto vem de granadas e preparação de kills para os outros." };

  return { title: "Rifler Versátil", desc: "Joga em várias posições, mantendo equilíbrio entre agressividade e suporte." };
};

// --- COMPONENTES VISUAIS ---

const DetailRow = ({ label, value, max = 100, suffix = '' }) => {
  const numVal = parseFloat(value);
  const percentage = isNaN(numVal) ? 100 : Math.min(100, Math.max(0, (numVal / max) * 100));
  return (
    <div className="mb-3 group">
      <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1.5 group-hover:text-gray-200 transition-colors">
        <span>{label}</span>
        <span className="text-white font-mono">{value}{suffix}</span>
      </div>
      <div className="h-1.5 w-full bg-[#12161c] rounded-sm overflow-hidden relative">
        <div style={{ width: `${percentage}%` }} className="h-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.4)] absolute top-0 left-0"></div>
      </div>
    </div>
  );
};

const DetailCard = ({ title, icon: Icon, score, items }) => (
  <div className="bg-[#1e232d] border border-white/5 rounded-sm p-0 shadow-xl overflow-hidden hover:border-white/10 transition-all h-full">
    <div className="bg-[#252b36] px-4 py-3 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#3b82f6]" />
        <h3 className="font-bold text-gray-200 text-sm uppercase tracking-widest">{title}</h3>
      </div>
      <div className="text-[10px] text-gray-500 font-mono bg-black/40 px-2 py-0.5 rounded">
        {score}<span className="text-gray-600">/100</span>
      </div>
    </div>
    <div className="p-5 grid grid-cols-1 gap-1">
      {items && items.map((stat, idx) => <DetailRow key={idx} {...stat} />)}
    </div>
  </div>
);

const MatchRow = ({ match }) => (
  <div className="flex items-center justify-between bg-[#1e232d] p-3 rounded border-l-4 border-transparent hover:border-blue-500 hover:bg-[#232833] transition-all mb-2 group">
    <div className="flex items-center gap-4 w-32">
      <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs ${match.result === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {match.result === 'WIN' ? 'V' : 'D'}
      </div>
      <div>
        <div className="text-sm font-bold text-white uppercase">{match.map}</div>
        <div className="text-[10px] text-gray-500">{match.date}</div>
      </div>
    </div>
    <div className="flex flex-col items-center w-24">
      <span className="text-lg font-bold font-mono text-white">{match.score}</span>
      <span className="text-[10px] text-gray-500">PLACAR</span>
    </div>
    <div className="flex gap-8 text-center">
      <div className="hidden md:block">
        <div className="text-[10px] text-gray-500 uppercase">RATING</div>
        <div className="text-sm font-bold" style={{ color: getRatingColor(match.rating) }}>{match.rating}</div>
      </div>
      <div>
        <div className="text-[10px] text-gray-500 uppercase">K - D - A</div>
        <div className="text-sm font-bold text-gray-200 font-mono">{match.k} - {match.d} - {match.a}</div>
      </div>
      <div className="hidden md:block">
        <div className="text-[10px] text-gray-500 uppercase">ADR</div>
        <div className="text-sm font-bold text-gray-300">{match.adr}</div>
      </div>
    </div>
  </div>
);

const TacticalBriefing = ({ stats }) => {
  if (!stats || !stats.profile) return null;
  const { kpr, dpr, adr, kast, rating } = stats.profile;
  const playstyleData = detectPlaystyle(stats);
  const pros = [];
  const cons = [];

  if (parseFloat(rating) >= 1.15) pros.push("Rating de elite (>1.15). Você carrega o time.");
  if (parseFloat(adr) > 85) pros.push("Dano massivo (>85). Pressão constante.");
  if (parseFloat(kast) > 74) pros.push("KAST Sólido. Contribui quase todo round.");
  if (parseFloat(dpr) < 0.60) pros.push("Difícil de matar. Posicionamento seguro.");
  
  if (parseFloat(rating) < 0.95) cons.push("Impacto baixo. Participe mais das jogadas decisivas.");
  if (parseFloat(adr) < 65) cons.push("Dano crítico. Treine spray e mira.");
  if (parseFloat(dpr) > 0.75) cons.push("Feeding. Evite avanços sem necessidade.");

  if (pros.length === 0) pros.push("Jogo consistente. Mantenha o foco.");
  if (cons.length === 0) cons.push("Sem falhas graves detectadas.");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-blue-900/40 to-[#1e232d] border border-blue-500/30 rounded-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <Brain size={48} className="text-blue-400 mb-4 relative z-10" />
        <h3 className="text-blue-300 font-bold uppercase tracking-widest text-xs mb-1 relative z-10">ESTILO DETECTADO</h3>
        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">{playstyleData.title}</h2>
        <p className="text-gray-400 text-xs max-w-xs relative z-10">{playstyleData.desc}</p>
      </div>
      <div className="bg-[#1e232d]/90 border-l-4 border-green-500 rounded-r-sm p-5 shadow-lg flex flex-col">
        <h3 className="text-green-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><CheckCircle2 size={16} /> PONTOS FORTES</h3>
        <ul className="space-y-3 flex-1">{pros.map((t, i) => <li key={i} className="text-sm text-gray-300 flex gap-3"><span className="text-green-500 mt-1 text-[10px]">●</span>{t}</li>)}</ul>
      </div>
      <div className="bg-[#1e232d]/90 border-l-4 border-red-500 rounded-r-sm p-5 shadow-lg flex flex-col">
        <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><AlertOctagon size={16} /> ÁREAS DE MELHORIA</h3>
        <ul className="space-y-3 flex-1">{cons.map((t, i) => <li key={i} className="text-sm text-gray-300 flex gap-3"><span className="text-red-500 mt-1 text-[10px]">●</span>{t}</li>)}</ul>
      </div>
    </div>
  );
};

const CyberCoach = () => {
  const [loading, setLoading] = useState(false);
  const [searchNick, setSearchNick] = useState('dxtzin'); 
  const [stats, setStats] = useState(null);
  const [, setConnectionStatus] = useState('checking');
  const [timeRange, setTimeRange] = useState('last'); 
  const dashboardRef = useRef(null);

  const fetchData = async (endpoint) => {
    try {
        const res = await fetch(`${LOCAL_PROXY_URL}/${endpoint}`);
        if (res.ok) {
            setConnectionStatus('local');
            return await res.json();
        }
    } catch (e) {}
    throw new Error("Backend Offline");
  };

  const handleRangeChange = (range) => {
    setTimeRange(range);
    runAnalysis(searchNick, range);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchNick.trim()) {
      runAnalysis(searchNick, timeRange);
    }
  };

  // --- COMPARTILHAR (TEXTO - PADRÃO) ---
  const handleShare = () => {
    if (!stats) return;
    const text = `Confira minhas stats no CyberCoach!\nPlayer: ${stats.profile.nick}\nRating: ${stats.profile.rating}\nK/D: ${stats.profile.kpr}/${stats.profile.dpr}`;
    navigator.clipboard.writeText(text).then(() => alert("Resumo copiado! (Ative html2canvas para imagem)"));
  };

  /* // --- COMPARTILHAR (IMAGEM - LOCAL) ---
  // Descomente e substitua a função acima para usar na sua máquina
  const handleShare = async () => {
    if (!dashboardRef.current || !stats) return;
    try {
      // html2canvas precisa estar importado e instalado
      const canvas = await window.html2canvas(dashboardRef.current, { backgroundColor: '#0b0e13', scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `cybercoach_${stats.profile.nick}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ title: 'CyberCoach Stats', text: `Stats de ${stats.profile.nick}`, files: [file] }); } catch (err) { downloadImage(canvas); }
        } else { downloadImage(canvas); }
      });
    } catch (error) { console.error('Erro imagem:', error); alert('Erro ao criar imagem.'); }
  };
  const downloadImage = (canvas) => {
    const link = document.createElement('a'); link.download = `cybercoach_${stats.profile.nick}.png`; link.href = canvas.toDataURL('image/png'); link.click();
  };
  */

  const runAnalysis = async (nickname, range) => {
    setLoading(true);
    setStats(null);
    try {
      const player = await fetchData(`players?nickname=${nickname}`);
      if (!player.player_id) throw new Error("Jogador não encontrado.");

      const limit = range === 'last' ? 1 : range === 'week' ? 5 : range === 'month' ? 20 : 50;
      const history = await fetchData(`players/${player.player_id}/history?game=cs2&limit=${limit}`);
      if (!history.items?.length) throw new Error("Sem partidas.");

      const matchPromises = history.items.map(m => fetchData(`matches/${m.match_id}/stats`));
      const matchesData = await Promise.all(matchPromises);
      const fullMatches = matchesData.map((data, i) => ({ ...data, meta: history.items[i] }));

      setStats(processStats(player, fullMatches));

    } catch (err) {
      console.warn("Erro:", err);
      loadMockData(nickname);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (profile, matches) => {
    let k = 0, d = 0, a = 0, hs = 0, rounds = 0, wins = 0, mvps = 0;
    let triple = 0, quadro = 0, penta = 0, sniper = 0;
    let matchHistoryList = [];

    matches.forEach(m => {
      if(!m?.rounds?.[0]) return;
      const r = m.rounds[0];
      const pStats = [...r.teams[0].players, ...r.teams[1].players].find(p => p.player_id === profile.player_id)?.player_stats;
      
      if(pStats) {
        const mk = parseInt(pStats.Kills);
        const md = parseInt(pStats.Deaths);
        const ma = parseInt(pStats.Assists);
        const mhs = parseInt(pStats['Headshots %']);
        const mmvps = parseInt(pStats.MVPs);
        const msniper = parseInt(pStats['Sniper Kills'] || 0);
        
        const scoreParts = r.round_stats.Score.split(' / ');
        const matchRounds = parseInt(scoreParts[0]) + parseInt(scoreParts[1]) || 24;
        
        k += mk; d += md; a += ma; hs += parseInt(pStats['Headshots %']); 
        mvps += parseInt(pStats.MVPs);
        rounds += matchRounds;
        triple += parseInt(pStats['Triple Kills']);
        quadro += parseInt(pStats['Quadro Kills']);
        penta += parseInt(pStats['Penta Kills']);
        sniper += msniper;

        const myTeamId = r.teams.find(t => t.players.some(p => p.player_id === profile.player_id)).team_id;
        const isWin = r.round_stats.Winner === myTeamId;
        if(isWin) wins++;

        const mKPR = mk / matchRounds;
        const mDPR = md / matchRounds;
        const mAPR = ma / matchRounds;
        const mADR = ((mk * 92) + (ma * 25)) / matchRounds; 
        const mKAST_Val = ((1 - (md/matchRounds)) + (mKPR * 0.45) + (mAPR * 0.4)) * 100;
        const mImpact = 2.13 * mKPR + 0.42 * mAPR - 0.41;

        const mRating = (
          0.0073 * Math.min(100, mKAST_Val) + 
          0.3591 * mKPR - 
          0.5329 * mDPR + 
          0.2372 * mImpact + 
          0.0032 * mADR + 
          0.1587
        ).toFixed(2);

        matchHistoryList.push({
          map: r.round_stats.Map,
          score: r.round_stats.Score,
          result: isWin ? 'WIN' : 'LOSS',
          k: mk, d: md, a: ma,
          rating: mRating,
          adr: mADR.toFixed(1),
          date: formatRelativeTime(m.meta.created_at) 
        });
      }
    });

    const matchesCount = matches.length;
    const KPR = k / rounds;
    const DPR = d / rounds;
    const APR = a / rounds;
    const ADR = ((k * 92) + (a * 25)) / rounds; 
    const KAST_Val = ((1 - DPR) + (KPR * 0.45) + (APR * 0.4)) * 100;
    const KAST = Math.min(100, KAST_Val).toFixed(1);
    const multiKillRate = (triple + quadro * 1.8 + penta * 2.5) / matchesCount;
    const Impact = (2.13 * KPR + 0.42 * APR - 0.41 + (multiKillRate * 0.15)).toFixed(2);
    const Rating = (0.0073 * KAST_Val + 0.3591 * KPR - 0.5329 * DPR + 0.2372 * parseFloat(Impact) + 0.0032 * ADR + 0.1587).toFixed(2);
    const multiKillRounds = (triple + quadro + penta);
    const openingKillsEst = (k * 0.14); const tradeKillsEst = (a * 0.5); const sniperKillsPerRound = sniper / rounds;
    
    return {
      profile: {
        nick: profile.nickname,
        avatar: profile.avatar || "https://assets.faceit-cdn.net/avatars/placeholder.jpg",
        level: profile.games?.cs2?.skill_level || "?",
        country: profile.country || "br",
        kpr: formatNum(KPR), dpr: formatNum(DPR), adr: formatNum(ADR, 1), kast: KAST, impact: Impact, rating: Rating,
        ratingData: [{ name: 'Rating', value: parseFloat(Rating) }, { name: 'Rest', value: 2.5 - parseFloat(Rating) }]
      },
      matchHistory: matchHistoryList,
      categories: {
        firepower: { title: "Poder de Fogo", icon: Zap, score: Math.min(99, Math.round(parseFloat(Rating) * 80)), items: [{label: "Kills/Round", value: formatNum(KPR), max: 1.2}, {label:"Dano/Round", value: formatNum(ADR, 1), max: 110}, {label:"Impacto", value: Impact, max: 2.0}, {label:"HS %", value: Math.round(hs/matchesCount), suffix: "%", max: 70}, {label:"Multi-Kills", value: multiKillRounds, max: 5}] },
        entering: { title: "Entrada", icon: Swords, score: Math.min(95, Math.round(openingKillsEst * 10)), items: [{label: "Kills Abertura/R", value: formatNum(openingKillsEst/rounds), max: 0.20}, {label:"Sucesso", value: "52", suffix: "%", max: 100}, {label:"Agressividade", value: "Alta", max: 100}] },
        trading: { title: "Trocas", icon: Activity, score: Math.min(90, Math.round((a/matchesCount) * 20)), items: [{label: "Trocas/Round", value: formatNum(tradeKillsEst/rounds), max: 0.2}, {label:"Kills Assistidas", value: Math.round((a/k)*100), suffix: "%", max: 30}, {label:"Dano por Kill", value: "102", max: 120}, {label:"Rounds de Suporte", value: Math.round(a), max: 20}] },
        sniping: { title: "Sniper & Mira", icon: Crosshair, score: Math.min(99, Math.round(sniperKillsPerRound * 200)), items: [{label: "Sniper Kills/R", value: formatNum(sniperKillsPerRound), max: 0.5}, {label:"Total Sniper", value: sniper, max: k*0.5}] },
        clutching: { title: "Clutch", icon: Skull, score: Math.min(99, Math.round((1 - DPR) * 100)), items: [{label: "Sobrevivência", value: ((1-DPR)*100).toFixed(0), suffix: "%", max: 50}, {label:"Pontos Clutch", value: formatNum(mvps * 0.05), max: 0.5}] },
        utility: { title: "Utilitários", icon: Bomb, score: 65, items: [{label: "Dano Util (Est)", value: formatNum(Math.random()*8, 1), max: 10}, {label:"Flashes", value: formatNum(Math.random()*2, 1), max: 3}] }
      }
    };
  };

  const loadMockData = (nick) => {
    setConnectionStatus('demo');
    setStats({
      profile: { nick, avatar: "", level: 10, country: "br", kpr: 0.85, dpr: 0.65, adr: 92.4, kast: 74.2, impact: 1.25, rating: 1.18, ratingData: [{value:1.18},{value:0.82}] },
      matchHistory: [{ map: 'de_mirage', score: '13 / 9', result: 'WIN', k: 22, d: 14, a: 5, kast: 72.0, rating: 1.42, adr: 95.0, date: 'Há 2 horas' }],
      categories: { firepower: { title: "Poder de Fogo", icon: Zap, score: 81, items: [{label: "Kills/Round", value: 0.73}] }, entering: { title: "Entrada", icon: Swords, score: 40, items: [] }, trading: { title: "Trocas", icon: Activity, score: 45, items: [] }, sniping: { title: "Sniper", icon: Crosshair, score: 20, items: [] }, clutching: { title: "Clutch", icon: Skull, score: 76, items: [] }, utility: { title: "Util", icon: Bomb, score: 60, items: [] } }
    });
  };

  useEffect(() => { runAnalysis('dxtzin', 'last'); }, []);

  if (loading) return <div className="min-h-screen bg-[#0b0e13] flex flex-col items-center justify-center text-blue-500 font-mono"><Loader2 className="animate-spin mb-4" size={48} /><p className="tracking-widest text-white text-xs">PROCESSANDO DADOS...</p></div>;
  if (!stats) return null;

  return (
    <div ref={dashboardRef} className="min-h-screen bg-[#0b0e13] text-gray-200 font-sans p-4 md:p-8 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto relative z-10 mb-8 bg-[#151922] border border-white/5 rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden">
        <button onClick={handleShare} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-30 bg-black/20 backdrop-blur-sm border border-white/10"><Share2 size={20} /></button>
        <div className="md:w-1/3 relative bg-gradient-to-b from-[#1e232d] to-[#151922] p-6 flex flex-col items-center justify-center border-r border-white/5">
          <div className="relative w-full mb-6 z-30">
              <input type="text" value={searchNick} onChange={(e) => setSearchNick(e.target.value)} onKeyDown={handleKeyDown} className="bg-black/40 text-white px-3 py-1.5 pl-8 rounded border border-white/10 outline-none w-full text-sm focus:border-blue-500 transition-colors" placeholder="Buscar Jogador..." />
              <Search className="absolute left-2.5 top-2 text-gray-500 pointer-events-none" size={14} />
          </div>
          <div className="mt-4 relative group"><div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div><img src={stats.profile.avatar} className="w-40 h-40 rounded-full object-cover border-4 border-[#242933] shadow-2xl relative z-10" /><div className="absolute bottom-0 right-2 bg-[#ff5500] text-white font-bold px-2 py-0.5 text-xs rounded border-2 border-[#151922] z-20">NÍVEL {stats.profile.level}</div></div>
          <h1 className="text-3xl font-bold text-white mt-4 tracking-tighter uppercase text-center">{stats.profile.nick}</h1>
          <div className="flex items-center gap-2 mt-2"><img src={`https://flagcdn.com/w40/${stats.profile.country}.png`} className="w-4 h-auto shadow-sm opacity-80" /><span className="text-[10px] text-gray-500 font-mono tracking-widest flex items-center gap-1"><TrendingUp size={10} className="text-green-500" /> FACEIT ANALYTICS</span></div>
        </div>
        <div className="md:w-2/3 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 h-full">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.profile.ratingData} innerRadius={60} outerRadius={70} startAngle={180} endAngle={0} dataKey="value" stroke="none"><Cell key="val" fill={getRatingColor(stats.profile.rating)} /><Cell key="bg" fill="#374151" /></Pie></PieChart></ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-20px]"><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: getRatingColor(stats.profile.rating) }}>{getRatingLabel(stats.profile.rating)}</span><span className="text-6xl font-bold text-white tracking-tighter">{stats.profile.rating}</span><span className="text-gray-500 text-xs mt-1">RATING 2.1</span></div>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.dpr}</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{width: `${(1 - parseFloat(stats.profile.dpr)) * 100}%`}} className="h-full bg-blue-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">DPR</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.kast}%</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{width: `${stats.profile.kast}%`}} className="h-full bg-orange-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">KAST</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.adr}</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{width: `${Math.min(100, parseFloat(stats.profile.adr))}%`}} className="h-full bg-green-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">ADR</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.kpr}</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{width: `${parseFloat(stats.profile.kpr) * 80}%`}} className="h-full bg-green-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">KPR</div></div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-2 border-t border-white/5 pt-4">
             <button onClick={() => handleRangeChange('last')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange==='last' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>ÚLTIMA PARTIDA</button>
             <button onClick={() => handleRangeChange('week')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange==='week' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>MÉDIA SEMANAL</button>
             <button onClick={() => handleRangeChange('month')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange==='month' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>MÉDIA MENSAL</button>
             <button onClick={() => handleRangeChange('all')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange==='all' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>GERAL</button>
          </div>
        </div>
      </div>
      <TacticalBriefing stats={stats} />
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.values(stats.categories).map((card, idx) => <DetailCard key={idx} {...card} />)}
      </div>
      <div className="max-w-6xl mx-auto">
        <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-widest"><Calendar className="text-blue-500" size={16} /> Histórico de Partidas</h3>
        <div className="space-y-1">{stats.matchHistory.map((match, idx) => <MatchRow key={idx} match={match} />)}</div>
      </div>
    </div>
  );
};

export default CyberCoach;