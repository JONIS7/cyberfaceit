import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer 
} from 'recharts';

const PerformanceRadar = ({ stats }) => {
  if (!stats) return null;
  
  const { kpr, adr, kast, impact } = stats.profile;
  // Tenta pegar HS% (pode estar aninhado dependendo da estrutura)
  const hs = stats.categories?.firepower?.items?.[3]?.value || 50; 

  // Dados para o gráfico (Normalizados para base 100)
  // Base para Lvl 10: KPR 0.75, ADR 80, KAST 70, Impact 1.1, HS 50
  const data = [
    { subject: 'K/D', A: Math.min(100, (kpr/0.75)*100), B: 100, fullMark: 150 }, 
    { subject: 'Dano', A: Math.min(100, (adr/80)*100), B: 100, fullMark: 150 },   
    { subject: 'KAST', A: Math.min(100, (kast/70)*100), B: 100, fullMark: 150 },  
    { subject: 'Impacto', A: Math.min(100, (impact/1.1)*100), B: 100, fullMark: 150 }, 
    { subject: 'Mira', A: Math.min(100, (hs/50)*100), B: 100, fullMark: 150 },    
  ];

  return (
    <div className="h-64 w-full flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 140]} tick={false} axisLine={false} />
          
          {/* Jogador (Azul) */}
          <Radar name="Você" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
          
          {/* Média Lvl 10 (Amarelo Tracejado) */}
          <Radar name="Nível 10 (Média)" dataKey="B" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} strokeDasharray="3 3" />
          
          <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceRadar;