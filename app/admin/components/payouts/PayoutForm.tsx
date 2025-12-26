'use client';

interface PayoutFormProps {
  year: number;
  setYear: (value: number) => void;
  quarter: number;
  setQuarter: (value: number) => void;
  amount: string;
  setAmount: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  loading: boolean;
  selectedUser: any;
  onSubmit: (e: React.FormEvent) => void;
}

export function PayoutForm({
  year,
  setYear,
  quarter,
  setQuarter,
  amount,
  setAmount,
  note,
  setNote,
  loading,
  selectedUser,
  onSubmit,
}: PayoutFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Выбор периода */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Период выплаты</label>
        <div className="grid grid-cols-2 gap-3">
          <select 
            value={String(year)} 
            onChange={(e) => setYear(Number(e.target.value))} 
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm cursor-pointer"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y} год</option>;
            })}
          </select>
          <select 
            value={String(quarter)} 
            onChange={(e) => setQuarter(Number(e.target.value))} 
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm cursor-pointer"
          >
            <option value="1">Q1 (янв-мар)</option>
            <option value="2">Q2 (апр-июн)</option>
            <option value="3">Q3 (июл-сен)</option>
            <option value="4">Q4 (окт-дек)</option>
          </select>
        </div>
      </div>
      
      {/* Сумма */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Сумма выплаты</label>
        <input 
          value={amount} 
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
          placeholder="Введите сумму" 
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]" 
        />
      </div>
      
      {/* Примечание */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Примечание (необязательно)</label>
        <input 
          value={note} 
          onChange={(e) => setNote(e.target.value)} 
          placeholder="Например: Роялти за 4 квартал" 
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]" 
        />
      </div>
      
      <button 
        type="submit"
        disabled={loading || !selectedUser} 
        className={`w-full py-3 rounded-xl text-sm font-bold transition ${
          loading || !selectedUser 
            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
            : 'bg-[#6050ba] hover:bg-[#7060ca]'
        }`}
      >
        {loading ? 'Сохранение...' : 'Сохранить выплату'}
      </button>
    </form>
  );
}
