export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - только здесь! */}
      <aside className="w-64 fixed left-0 top-0 h-screen border-r border-white/5 pt-24 px-6 bg-black/20 backdrop-blur-md">
        <div className="space-y-4">
          <div className="text-neon-blue border-l-2 border-neon-blue pl-4 bg-neon-blue/5 py-2 text-[11px] font-bold uppercase tracking-widest">Analytics</div>
          <div className="pl-4 text-gray-500 hover:text-white cursor-pointer text-[11px] font-bold uppercase tracking-widest transition">Payouts</div>
          <div className="pl-4 text-gray-500 hover:text-white cursor-pointer text-[11px] font-bold uppercase tracking-widest transition">My Releases</div>
        </div>
      </aside>

      {/* Контент профиля */}
      <main className="ml-64 pt-32 px-12 w-full">
        <div className="flex items-center gap-8 mb-16">
          <div className="w-32 h-32 rounded-full border-2 border-neon-blue p-1 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xs text-gray-500">PHOTO</div>
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic italic">THQ Artist</h1>
            <p className="text-gray-500 text-sm mb-4">artist@thqlabel.com</p>
            <button className="px-6 py-2 border border-neon-blue text-neon-blue rounded-full text-[10px] font-bold uppercase hover:bg-neon-blue hover:text-black transition">Edit Profile</button>
          </div>
        </div>

        {/* Секция статистики */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {['Monthly Listeners', 'Total Streams', 'Revenue'].map((label) => (
            <div key={label} className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{label}</div>
              <div className="text-2xl font-black text-neon-blue">-- --</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}