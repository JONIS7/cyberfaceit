import React from 'react';
import { Map as MapIcon } from 'lucide-react';

const MapStats = ({ mapStats }) => {
    if (!mapStats || mapStats.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
            {mapStats.slice(0, 4).map((map) => (
                <div key={map.name} className="bg-[#1e232d] border border-white/5 rounded-sm p-4 shadow-lg hover:border-white/10 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MapIcon size={64} />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-white font-bold text-lg uppercase mb-1">{map.name}</h3>
                        <div className="text-xs text-gray-500 mb-4">{map.matches} Partidas</div>

                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase">Win Rate</div>
                                <div className={`text-xl font-bold ${map.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {map.winRate}%
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 uppercase">K/D Ratio</div>
                                <div className={`text-xl font-bold ${parseFloat(map.kd) >= 1 ? 'text-blue-400' : 'text-orange-400'}`}>
                                    {map.kd}
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${map.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${map.winRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MapStats;
