import React from 'react';

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
        <div 
          style={{ width: `${percentage}%` }} 
          className="h-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.4)] absolute top-0 left-0"
        ></div>
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
      {items && items.map((stat, idx) => (
        <DetailRow key={idx} {...stat} />
      ))}
    </div>
  </div>
);

export default DetailCard;
