import React from 'react';
import { Map as MapIcon } from 'lucide-react';
import { getRatingColor } from '../../utils/analytics'; // Importa a função de cor

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

export default MatchRow;