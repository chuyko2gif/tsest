'use client';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterRole: string;
  setFilterRole: (value: string) => void;
  sortBy: string;
  setSortBy: (value: 'created_at' | 'email' | 'nickname' | 'role') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
}

export function UserFilters({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: UserFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Поиск */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Поиск по email, никнейму или ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 pl-10 text-sm"
        />
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {/* Фильтр по роли */}
      <select
        value={filterRole}
        onChange={(e) => setFilterRole(e.target.value)}
        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
      >
        <option value="all">Все роли</option>
        <option value="owner">Владельцы</option>
        <option value="admin">Администраторы</option>
        <option value="exclusive">Exclusive</option>
        <option value="basic">Basic</option>
      </select>
      
      {/* Сортировка */}
      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
        >
          <option value="created_at">Дата регистрации</option>
          <option value="email">Email</option>
          <option value="nickname">Никнейм</option>
          <option value="role">Роль</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition"
          title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}
