import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#1e232d] p-3 border border-white/10 rounded shadow-xl backdrop-blur-sm">
                <p className="text-white font-bold text-sm mb-1">{data.map}</p>
                <p className={`text-xs font-bold mb-2 ${data.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                    {data.result} ({data.score})
                </p>
                <p className="text-gray-500 text-[10px] mb-2">{label}</p>
                <div className="space-y-1 border-t border-white/5 pt-2">
                    <div className="flex justify-between gap-4">
                        <span className="text-blue-400 text-xs">Rating:</span>
                        <span className="text-white text-xs font-mono">{data.rating}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-purple-400 text-xs">K/D:</span>
                        <span className="text-white text-xs font-mono">{data.kd}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-green-400 text-xs">ADR:</span>
                        <span className="text-white text-xs font-mono">{data.adr}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const color = payload.result === 'WIN' ? '#4ade80' : '#ef4444';

    return (
        <circle cx={cx} cy={cy} r={3} stroke="#1e232d" strokeWidth={2} fill={color} />
    );
};

const EvolutionChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-[#151922] border border-white/5 rounded-sm p-6 shadow-lg mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20"></div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">EVOLUÇÃO DE PERFORMANCE</h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Rating</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> K/D</div>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorKd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="date"
                            stroke="#4b5563"
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#4b5563"
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'white', strokeOpacity: 0.1 }} />

                        <ReferenceLine y={1} stroke="#ffffff20" strokeDasharray="3 3" />

                        <Area
                            type="monotone"
                            dataKey="rating"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRating)"
                            dot={<CustomDot />}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="kd"
                            stroke="#a855f7"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorKd)"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EvolutionChart;
