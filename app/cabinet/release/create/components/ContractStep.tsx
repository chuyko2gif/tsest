import React from 'react';

interface ContractStepProps {
  agreedToContract: boolean;
  setAgreedToContract: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ContractStep({ agreedToContract, setAgreedToContract, onNext, onBack }: ContractStepProps) {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-300">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Договор</h2>
            <p className="text-sm text-zinc-500 mt-1">Ознакомьтесь с условиями распространения</p>
          </div>
        </div>
      </div>
      <div className="relative p-10 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 border border-green-500/20 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-50"/>
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center ring-1 ring-green-400/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-300" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p className="text-center text-zinc-300 mb-6 text-lg font-medium">Отправляя релиз, вы соглашаетесь с условиями thqlabel</p>
          <label className="flex items-center gap-4 p-5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-white/10 hover:border-green-500/40 hover:shadow-xl hover:shadow-green-500/10 group">
            <input 
              type="checkbox" 
              checked={agreedToContract}
              onChange={(e) => setAgreedToContract(e.target.checked)}
              className="w-6 h-6 rounded-lg accent-green-500" 
            />
            <span className="text-sm font-medium group-hover:text-white transition-colors">Я принимаю условия пользовательского соглашения</span>
          </label>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={onNext}
          disabled={!agreedToContract}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
