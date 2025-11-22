// src/utils/analytics.js

export const getRatingColor = (r) => r >= 1.15 ? "#4ade80" : r >= 0.97 ? "#fbbf24" : "#ef4444";

export const getRatingLabel = (rating) => {
    if (rating >= 1.15) return 'EXCELENTE';
    if (rating >= 0.97) return 'BOM';
    return 'RUIM';
};

export const formatNum = (n, d = 2) => n ? parseFloat(n).toFixed(d) : "0.00";

export const formatRelativeTime = (timestamp) => {
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

export const processStats = (profile, matches) => {
    let k = 0, d = 0, a = 0, hs = 0, rounds = 0, wins = 0, mvps = 0;
    let triple = 0, quadro = 0, penta = 0, sniper = 0;
    let matchHistoryList = [];
    let mapStats = {};
    let historyData = [];

    matches.forEach(m => {
        if (!m?.rounds?.[0]) return;
        const r = m.rounds[0];
        const pStats = [...r.teams[0].players, ...r.teams[1].players].find(p => p.player_id === profile.player_id)?.player_stats;

        if (pStats) {
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
            if (isWin) wins++;

            const mKPR = mk / matchRounds;
            const mDPR = md / matchRounds;
            const mAPR = ma / matchRounds;
            const mADR = ((mk * 92) + (ma * 25)) / matchRounds;
            const mKAST_Val = ((1 - (md / matchRounds)) + (mKPR * 0.45) + (mAPR * 0.4)) * 100;
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
                date: formatRelativeTime(m.meta.started_at || m.meta.created_at)
            });

            // Map Stats
            const mapName = r.round_stats.Map;
            if (!mapStats[mapName]) {
                mapStats[mapName] = { name: mapName, matches: 0, wins: 0, kills: 0, deaths: 0 };
            }
            mapStats[mapName].matches++;
            mapStats[mapName].kills += mk;
            mapStats[mapName].deaths += md;
            if (isWin) mapStats[mapName].wins++;

            // History Data
            const timestamp = (m.meta.started_at || m.meta.created_at) * 1000;
            historyData.unshift({
                date: new Date(timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
                timestamp: timestamp,
                rating: parseFloat(mRating),
                kd: (mk / (md || 1)).toFixed(2),
                adr: parseFloat(mADR.toFixed(1)),
                map: r.round_stats.Map,
                result: isWin ? 'WIN' : 'LOSS',
                score: r.round_stats.Score
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

    const mapStatsList = Object.values(mapStats).map(m => ({
        ...m,
        winRate: Math.round((m.wins / m.matches) * 100),
        kd: (m.kills / (m.deaths || 1)).toFixed(2)
    })).sort((a, b) => b.matches - a.matches);

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
        mapStats: mapStatsList,
        historyData: historyData,
        categories: {
            firepower: { title: "Poder de Fogo", score: Math.min(99, Math.round(parseFloat(Rating) * 80)), items: [{ label: "Kills/Round", value: formatNum(KPR), max: 1.2 }, { label: "Dano/Round", value: formatNum(ADR, 1), max: 110 }, { label: "Impacto", value: Impact, max: 2.0 }, { label: "HS %", value: Math.round(hs / matchesCount), suffix: "%", max: 70 }, { label: "Multi-Kills", value: multiKillRounds, max: 5 }] },
            entering: { title: "Entrada", score: Math.min(95, Math.round(openingKillsEst * 10)), items: [{ label: "Kills Abertura/R", value: formatNum(openingKillsEst / rounds), max: 0.20 }, { label: "Sucesso", value: "52", suffix: "%", max: 100 }, { label: "Agressividade", value: "Alta", max: 100 }] },
            trading: { title: "Trocas", score: Math.min(90, Math.round((a / matchesCount) * 20)), items: [{ label: "Trocas/Round", value: formatNum(tradeKillsEst / rounds), max: 0.2 }, { label: "Kills Assistidas", value: Math.round((a / k) * 100), suffix: "%", max: 30 }, { label: "Dano por Kill", value: "102", max: 120 }, { label: "Rounds de Suporte", value: Math.round(a), max: 20 }] },
            sniping: { title: "Sniper & Mira", score: Math.min(99, Math.round(sniperKillsPerRound * 200)), items: [{ label: "Sniper Kills/R", value: formatNum(sniperKillsPerRound), max: 0.5 }, { label: "Total Sniper", value: sniper, max: k * 0.5 }] },
            clutching: { title: "Clutch", score: Math.min(99, Math.round((1 - DPR) * 100)), items: [{ label: "Sobrevivência", value: ((1 - DPR) * 100).toFixed(0), suffix: "%", max: 50 }, { label: "Pontos Clutch", value: formatNum(mvps * 0.05), max: 0.5 }] },
            utility: { title: "Utilitários", score: 65, items: [{ label: "Dano Util (Est)", value: formatNum(Math.random() * 8, 1), max: 10 }, { label: "Flashes", value: formatNum(Math.random() * 2, 1), max: 3 }] }
        }
    };
};

export const detectPlaystyle = (stats) => {
    // Extraindo dados do perfil
    const { kpr, dpr, kast, impact, adr } = stats.profile; // Adicionei ADR se estiver disponível

    // Extraindo dados das categorias (com proteção para null/undefined)
    const entry = parseFloat(stats.categories?.entering?.items?.[0]?.value || 0);
    const sniperKills = parseFloat(stats.categories?.sniping?.items?.[0]?.value || 0);
    const utilDmg = parseFloat(stats.categories?.utility?.items?.[0]?.value || 0);
    const clutchPoints = parseFloat(stats.categories?.clutching?.items?.[1]?.value || 0);

    // Parsers para garantir números
    const rKPR = parseFloat(kpr);
    const rDPR = parseFloat(dpr);
    const rImpact = parseFloat(impact);
    const rKAST = parseFloat(kast);
    const rADR = adr ? parseFloat(adr) : 0;

    // --- 1. ARMA PRINCIPAL (Define o estilo base) ---
    if (sniperKills > 0.35) {
        return {
            title: "AWPer",
            desc: "Especialista com a Sniper. Controla ângulos longos e busca picks decisivos para abrir o mapa."
        };
    }

    // --- 2. ELITE / ALTO IMPACTO (Jogadores fora da curva) ---
    if (rImpact > 1.35 && rKPR > 0.82) {
        return {
            title: "Starplayer",
            desc: "O carregador. Você é a principal fonte de dano e abates, dominando o servidor com consistência."
        };
    }

    if (rImpact > 1.25 && rDPR > 0.76) {
        return {
            title: "Glass Cannon",
            desc: "Alto risco, alta recompensa. Você destrói a defesa inimiga, mas joga de forma arriscada e morre frequentemente."
        };
    }

    // --- 3. FUNÇÕES TÁTICAS DE MAPA ---
    if (entry > 0.13) {
        return {
            title: "Entry Fragger",
            desc: "A ponta da lança. Você não tem medo de morrer, cria espaço para o time e busca o primeiro contato agressivamente."
        };
    }

    // Baixo Entry + Baixo DPR (Sobrevive) + KPR Decente = Lurker
    if (entry < 0.09 && rDPR < 0.66 && rKPR > 0.65) {
        return {
            title: "Lurker",
            desc: "O jogador das sombras. Você corta rotações, joga nos flancos e pune a desatenção inimiga jogando longe do time."
        };
    }

    // --- 4. SUPORTE E TROCAS ---
    // KAST alto mas Entry baixo = Alguém que troca kills e ajuda
    if (rKAST > 76 && entry < 0.11 && rKPR > 0.68) {
        return {
            title: "Trade Fragger",
            desc: "O parceiro ideal. Você joga colado com o time, garantindo a troca de kills e mantendo a vantagem numérica."
        };
    }

    // Utilidade alta OU (Utilidade média + KAST alto)
    if (utilDmg > 20.0 || (utilDmg > 10.0 && rKAST > 75)) {
        return {
            title: "Support",
            desc: "O facilitador. Seu impacto vem do uso preciso de granadas, cegando inimigos e preparando o terreno para os aliados."
        };
    }

    // --- 5. DEFENSIVOS / SITUACIONAIS ---
    if (rDPR < 0.63 && rKAST > 73 && clutchPoints > 0.3) {
        return {
            title: "Clutcher",
            desc: "Frio e calculista. Enquanto outros entram em pânico, você brilha nos momentos finais e situações de 1vX."
        };
    }

    if (rDPR < 0.65 && rKAST > 72) {
        return {
            title: "Âncora",
            desc: "A parede defensiva. Você segura bombsites sozinho, ganha tempo e raramente entrega a posição de graça."
        };
    }

    // --- 6. DEFAULT ---
    return {
        title: "Rifler Versátil",
        desc: "Joga em várias posições, mantendo equilíbrio entre agressividade e suporte conforme o time precisa."
    };
};
