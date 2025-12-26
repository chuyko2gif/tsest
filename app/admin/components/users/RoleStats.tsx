'use client';

interface RoleStatsProps {
  ownersCount: number;
  adminsCount: number;
  exclusiveCount: number;
  basicCount: number;
}

export function RoleStats({ ownersCount, adminsCount, exclusiveCount, basicCount }: RoleStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 rounded-xl text-center">
        <div className="text-3xl font-black text-[#a78bfa]">{ownersCount}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Владельцев</div>
      </div>
      <div className="p-4 bg-[#ff4757]/5 border border-[#ff4757]/20 rounded-xl text-center">
        <div className="text-3xl font-black text-[#ff6b81]">{adminsCount}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Администраторов</div>
      </div>
      <div className="p-4 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl text-center">
        <div className="text-3xl font-black text-[#fbbf24]">{exclusiveCount}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Exclusive</div>
      </div>
      <div className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl text-center">
        <div className="text-3xl font-black text-zinc-400">{basicCount}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Basic</div>
      </div>
    </div>
  );
}
