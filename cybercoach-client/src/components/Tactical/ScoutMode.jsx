import React, { useState } from 'react';
import { Search, Shield, Swords, AlertTriangle, Crosshair, Skull } from 'lucide-react';

const ScoutMode = ({ fetchData, userStats, onBack }) => {
    const [enemyNicks, setEnemyNicks] = useState(['', '', '', '', '']);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (index, value) => {
        const newNicks = [...enemyNicks];
        newNicks[index] = value;
        setEnemyNicks(newNicks);
    };

    const analyzeLobby = async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const enemies = [];
            const validNicks = enemyNicks.filter(n => n.trim() !== '');

            if (validNicks.length === 0) throw new Error("Insira pelo menos um nick.");

            for (const nick of validNicks) {
                try {
                    // 1. Fetch Profile
                    const player = await fetchData(`players?nickname=${nick}`);
                    if (!player.player_id) continue;

                    // 2. Fetch Stats (Last 20 matches for consistency)
                    const history = await fetchData(`players/${player.player_id}/history?game=cs2&limit=20`);

                    // Calculate simple stats from history metadata if available, or fetch deep stats
                    // To save requests, we'll try to get summary stats if possible, but history is better for recent form
                    // Let's fetch general stats for speed
                    const stats = await fetchData(`players/${player.player_id}/stats/cs2`);

                    enemies.push({
                        nick: player.nickname,
                        avatar: player.avatar || "https://assets.faceit-cdn.net/avatars/placeholder.jpg",
                        level: player.games?.cs2?.skill_level || 1,
                        elo: player.games?.cs2?.faceit_elo || 1000,
                        kd: parseFloat(stats.lifetime?.['Average K/D Ratio'] || 0),
                        winRate: parseInt(stats.lifetime?.['Win Rate %'] || 0),
                        recentResults: history.items?.map(m => m.results?.score?.winner === m.teams?.faction1?.roster?.some(p => p.player_id === player.player_id) ? 'W' : 'L').slice(0, 5) || []
                    });

                } catch (e) {
                    console.warn(`Failed to fetch ${nick}`, e);
                }
            }

            if (enemies.length === 0) throw new Error("Nenhum jogador encontrado.");

            // Calculate Team Stats
            const avgElo = Math.round(enemies.reduce((acc, curr) => acc + curr.elo, 0) / enemies.length);
            const avgKd = (enemies.reduce((acc, curr) => acc + curr.kd, 0) / enemies.length).toFixed(2);

            // Identify Threats
            const boss = enemies.reduce((prev, current) => (prev.kd > current.kd) ? prev : current);
            const weakLink = enemies.reduce((prev, current) => (prev.kd < current.kd) ? prev : current);

            // Win Probability (Simple Heuristic vs User)
            // Assuming User Elo is available, otherwise default to 1500
            const userElo = userStats?.profile?.elo || 1500; // We might need to pass this prop correctly
            const eloDiff = userElo - avgElo;
            let winProb = 50 + (eloDiff / 10);
            winProb = Math.min(95, Math.max(5, winProb));

            setAnalysis({
                enemies,
                teamStats: { avgElo, avgKd, winProb: Math.round(winProb) },
                threats: { boss, weakLink }
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0e13] text-gray-200 p-8 font-sans animate-fade-in">
            <button onClick={onBack} className="mb-6 text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
                ← Voltar para Dashboard
            </button>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="text-blue-500" /> SCOUT MODE <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">LOBBY SIMULATOR</span>
                </h1>
                <p className="text-gray-400 mb-8">Cole os nicks do time inimigo para receber uma análise tática instantânea.</p>

                {/* Input Section */}
                <div className="bg-[#151922] p-6 rounded-sm border border-white/5 shadow-lg mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        {enemyNicks.map((nick, i) => (
                            <div key={i} className="relative">
                                <input
                                    type="text"
                                    placeholder={`Enemy #${i + 1}`}
                                    value={nick}
                                    onChange={(e) => handleInputChange(i, e.target.value)}
                                    className="w-full bg-[#0b0e13] border border-white/10 rounded p-3 text-white focus:border-blue-500 focus:outline-none text-center font-mono"
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={analyzeLobby}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <span className="animate-spin">⏳</span> : <Search size={20} />}
                        {loading ? "ANALISANDO DADOS..." : "ANALISAR LOBBY"}
                    </button>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                </div>

                {/* Results Section */}
                {analysis && (
                    <div className="space-y-6 animate-slide-up">

                        {/* Header Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#1e232d] p-4 rounded border-l-4 border-purple-500 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-widest">Média de Elo</p>
                                <p className="text-2xl font-bold text-white">{analysis.teamStats.avgElo}</p>
                            </div>
                            <div className="bg-[#1e232d] p-4 rounded border-l-4 border-blue-500 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-widest">K/D Médio</p>
                                <p className="text-2xl font-bold text-white">{analysis.teamStats.avgKd}</p>
                            </div>
                            <div className="bg-[#1e232d] p-4 rounded border-l-4 border-green-500 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-widest">Probabilidade de Vitória</p>
                                <p className="text-2xl font-bold text-green-400">{analysis.teamStats.winProb}%</p>
                            </div>
                        </div>

                        {/* Threats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded flex items-center gap-4">
                                <div className="bg-red-500/20 p-3 rounded-full"><AlertTriangle className="text-red-500" size={32} /></div>
                                <div>
                                    <h3 className="text-red-400 font-bold uppercase text-sm">AMEAÇA PRINCIPAL (BOSS)</h3>
                                    <p className="text-white text-xl font-bold">{analysis.threats.boss.nick}</p>
                                    <p className="text-gray-400 text-sm">K/D: {analysis.threats.boss.kd} • Elo: {analysis.threats.boss.elo}</p>
                                </div>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 p-6 rounded flex items-center gap-4">
                                <div className="bg-green-500/20 p-3 rounded-full"><Crosshair className="text-green-500" size={32} /></div>
                                <div>
                                    <h3 className="text-green-400 font-bold uppercase text-sm">ELO MAIS FRACO</h3>
                                    <p className="text-white text-xl font-bold">{analysis.threats.weakLink.nick}</p>
                                    <p className="text-gray-400 text-sm">K/D: {analysis.threats.weakLink.kd} • Elo: {analysis.threats.weakLink.elo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Player List */}
                        <div className="bg-[#151922] border border-white/5 rounded-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#1e232d] text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Jogador</th>
                                        <th className="p-4">Nível</th>
                                        <th className="p-4">Elo</th>
                                        <th className="p-4">K/D (Lifetime)</th>
                                        <th className="p-4">Win Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {analysis.enemies.map((enemy, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                <img src={enemy.avatar} alt={enemy.nick} className="w-8 h-8 rounded-full" />
                                                <span className="font-bold text-white">{enemy.nick}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-orange-500 text-black font-bold px-2 py-0.5 rounded text-xs">LVL {enemy.level}</span>
                                            </td>
                                            <td className="p-4 text-gray-300 font-mono">{enemy.elo}</td>
                                            <td className={`p-4 font-bold ${enemy.kd >= 1.2 ? 'text-green-400' : enemy.kd < 0.9 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {enemy.kd.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-gray-300">{enemy.winRate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ScoutMode;
