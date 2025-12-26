'use client';

import { User } from './types';

interface UserSelectorProps {
  selectedUser: User | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: User[];
  showDropdown: boolean;
  onSelectUser: (user: User) => void;
  onClearSelection: () => void;
}

export function UserSelector({
  selectedUser,
  searchQuery,
  setSearchQuery,
  searchResults,
  showDropdown,
  onSelectUser,
  onClearSelection,
}: UserSelectorProps) {
  if (selectedUser) {
    return (
      <div className="p-4 bg-[#6050ba]/10 border border-[#6050ba]/30 rounded-xl mb-4 flex items-center gap-3">
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${selectedUser.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
          style={{ backgroundImage: selectedUser.avatar ? `url(${selectedUser.avatar})` : 'none' }}
        >
          {!selectedUser.avatar && (selectedUser.nickname?.charAt(0)?.toUpperCase() || '?')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{selectedUser.nickname || 'Без никнейма'}</div>
          <div className="text-xs text-zinc-500 truncate">{selectedUser.email}</div>
        </div>
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative mb-4">
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
        placeholder="Поиск по email, никнейму или ID..." 
        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]" 
      />
      
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1f] border border-white/10 rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
          {searchResults.map(user => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="w-full p-3 hover:bg-white/5 flex items-center gap-3 text-left transition"
            >
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${user.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
                style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
              >
                {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{user.nickname || 'Без никнейма'}</div>
                <div className="text-xs text-zinc-500 truncate">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
