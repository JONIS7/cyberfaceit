import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Search, Loader2, Calendar, TrendingUp, Share2,
  Zap, Swords, Activity, Skull, Bomb, Crosshair
} from 'lucide-react';

import { getRatingColor, getRatingLabel, formatNum, formatRelativeTime, processStats } from './utils/analytics';
import DetailCard from './components/Visuals/DetailCard';
import MatchRow from './components/Visuals/MatchRow';

import TacticalBriefing from './components/Tactical/TacticalBriefing';
import MapStats from './components/Visuals/MapStats';
import EvolutionChart from './components/Charts/EvolutionChart';
import ScoutMode from './components/Tactical/ScoutMode';

// --- CONFIGURAÇÃO ---
const LOCAL_PROXY_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/faceit"
  : "/.netlify/functions/faceit";

const CyberCoach = () => {
  const [loading, setLoading] = useState(false);
  const [searchNick, setSearchNick] = useState('');
  const [stats, setStats] = useState(null);
  const [, setConnectionStatus] = useState('checking');
  const [timeRange, setTimeRange] = useState('last');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'scout'
  const dashboardRef = useRef(null);

  const fetchData = async (endpoint) => {
    try {
      const res = await fetch(`${LOCAL_PROXY_URL}/${endpoint}`);
      if (res.ok) {
        setConnectionStatus('local');
        return await res.json();
      }
    } catch (e) { }
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

  const handleShare = () => {
    if (!stats) return;
    const text = `Confira minhas stats no CyberCoach!\nPlayer: ${stats.profile.nick}\nRating: ${stats.profile.rating}\nK/D: ${stats.profile.kpr}/${stats.profile.dpr}`;
    navigator.clipboard.writeText(text).then(() => alert("Resumo copiado!"));
  };

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

      const processedStats = processStats(player, fullMatches);
      processedStats.categories.firepower.icon = Zap;
      processedStats.categories.entering.icon = Swords;
      processedStats.categories.trading.icon = Activity;
      processedStats.categories.sniping.icon = Crosshair;
      processedStats.categories.clutching.icon = Skull;
      processedStats.categories.utility.icon = Bomb;

      setStats(processedStats);

    } catch (err) {
      console.warn("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAnalysis('dxtzin', 'last'); }, []);

  if (viewMode === 'scout') {
    return <ScoutMode fetchData={fetchData} userStats={stats} onBack={() => setViewMode('dashboard')} />;
  }

  if (loading) return <div className="min-h-screen bg-[#0b0e13] flex flex-col items-center justify-center text-blue-500 font-mono"><Loader2 className="animate-spin mb-4" size={48} /><p className="tracking-widest text-white text-xs">PROCESSANDO DADOS...</p></div>;
  if (!stats) return null;

  return (
    <div ref={dashboardRef} className="min-h-screen bg-[#0b0e13] text-gray-200 font-sans p-4 md:p-8 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto relative z-10 mb-8 bg-[#151922] border border-white/5 rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2 z-30">
          <button onClick={() => setViewMode('scout')} className="p-2 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-full transition-all bg-black/20 backdrop-blur-sm border border-blue-500/30" title="Scout Mode"><Swords size={20} /></button>
          <button onClick={handleShare} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all bg-black/20 backdrop-blur-sm border border-white/10"><Share2 size={20} /></button>
        </div>

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
            {/* Seção de Gráficos: Pie + Radar */}
            <div className="flex flex-col gap-4 items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.profile.ratingData} innerRadius={50} outerRadius={60} startAngle={180} endAngle={0} dataKey="value" stroke="none"><Cell key="val" fill={getRatingColor(stats.profile.rating)} /><Cell key="bg" fill="#374151" /></Pie></PieChart></ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-15px]"><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: getRatingColor(stats.profile.rating) }}>{getRatingLabel(stats.profile.rating)}</span><span className="text-5xl font-bold text-white tracking-tighter">{stats.profile.rating}</span></div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.dpr}</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{ width: `${(1 - parseFloat(stats.profile.dpr)) * 100}%` }} className="h-full bg-blue-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">DPR</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.kast}%</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{ width: `${stats.profile.kast}%` }} className="h-full bg-orange-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">KAST</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.adr}</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{ width: `${Math.min(100, parseFloat(stats.profile.adr))}%` }} className="h-full bg-green-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">ADR</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-gray-200">{stats.profile.kpr}</div><div className="h-1 w-12 mx-auto bg-gray-700 rounded my-1 overflow-hidden"><div style={{ width: `${parseFloat(stats.profile.kpr) * 80}%` }} className="h-full bg-green-500"></div></div><div className="text-[10px] font-bold text-gray-500 uppercase">KPR</div></div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-2 border-t border-white/5 pt-4">
            <button onClick={() => handleRangeChange('last')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange === 'last' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>ÚLTIMA PARTIDA</button>
            <button onClick={() => handleRangeChange('week')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange === 'week' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>MÉDIA SEMANAL</button>
            <button onClick={() => handleRangeChange('month')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange === 'month' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>MÉDIA MENSAL</button>
            <button onClick={() => handleRangeChange('all')} className={`text-xs px-3 py-1 rounded transition-colors ${timeRange === 'all' ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'}`}>GERAL</button>
          </div>
        </div>
      </div>
      <TacticalBriefing stats={stats} />

      <div className="max-w-6xl mx-auto space-y-8 mb-8">
        <MapStats mapStats={stats.mapStats} />
        <EvolutionChart data={stats.historyData} />
      </div>

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