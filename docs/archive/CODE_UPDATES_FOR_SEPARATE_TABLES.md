# Обновления кода для работы с отдельными таблицами релизов

## 1. Basic Release - SendStep.tsx

**Файл:** `app/cabinet/release-basic/create/components/SendStep.tsx`

### Изменения:

1. **Строка ~238** - Изменить название таблицы:
```typescript
// БЫЛО:
const { error: insertError } = await supabase
  .from('releases')
  .insert(releaseData);

// СТАЛО:
const { error: insertError } = await supabase
  .from('releases_basic')
  .insert(releaseData);
```

2. **Строка ~224** - Удалить поле `user_role` из объекта `releaseData`:
```typescript
// БЫЛО:
const releaseData: any = {
  user_id: user.id,
  user_role: 'basic',  // ← УДАЛИТЬ ЭТУ СТРОКУ
  title: releaseTitle,
  // ...
};

// СТАЛО:
const releaseData: any = {
  user_id: user.id,
  // user_role больше не нужен - тип определяется таблицей
  title: releaseTitle,
  // ...
};
```

## 2. Exclusive Release - SendStep.tsx

**Файл:** `app/cabinet/release/create/components/SendStep.tsx`

### Изменения:

1. **Строка ~239** - Изменить название таблицы:
```typescript
// БЫЛО:
const { error: insertError } = await supabase
  .from('releases')
  .insert(releaseData);

// СТАЛО:
const { error: insertError } = await supabase
  .from('releases_exclusive')
  .insert(releaseData);
```

2. **Строка ~224** - Удалить поля `user_role` и `payment_status`:
```typescript
// БЫЛО:
const releaseData = {
  user_id: user.id,
  user_role: 'exclusive',  // ← УДАЛИТЬ
  title: releaseTitle,
  // ... другие поля ...
  status: 'pending',
  payment_status: null,  // ← УДАЛИТЬ
};

// СТАЛО:
const releaseData = {
  user_id: user.id,
  // user_role и payment_status больше не нужны
  title: releaseTitle,
  // ... другие поля ...
  status: 'pending',
  // payment_status удален
};
```

## 3. Админ панель - ReleasesModeration.tsx

**Файл:** `app/admin/components/ReleasesModeration.tsx`

### Изменения:

1. **Обновить интерфейс Release:**
```typescript
interface Release {
  id: string;
  user_id: string;
  title: string;
  artist_name: string;
  cover_url: string | null;
  status: string;
  release_type: 'basic' | 'exclusive';  // ← ДОБАВИТЬ
  payment_status?: string | null;
  payment_receipt_url?: string | null;
  payment_amount?: number | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}
```

2. **Функция загрузки релизов:**
```typescript
// БЫЛО:
const { data, error } = await supabase.rpc('get_pending_releases');

// СТАЛО:
const { data, error } = await supabase.rpc('get_all_pending_releases');
```

3. **Функция утверждения релиза:**
```typescript
// БЫЛО:
const { error } = await supabase.rpc('approve_release', {
  release_id: selectedRelease.id,
  admin_id: user.id
});

// СТАЛО:
const functionName = selectedRelease.release_type === 'basic' 
  ? 'approve_basic_release' 
  : 'approve_exclusive_release';

const { error } = await supabase.rpc(functionName, {
  release_id: selectedRelease.id,
  admin_id: user.id
});
```

4. **Функция отклонения релиза:**
```typescript
// БЫЛО:
const { error } = await supabase.rpc('reject_release', {
  release_id: selectedRelease.id,
  admin_id: user.id,
  reason: rejectionReason
});

// СТАЛО:
const functionName = selectedRelease.release_type === 'basic' 
  ? 'reject_basic_release' 
  : 'reject_exclusive_release';

const { error } = await supabase.rpc(functionName, {
  release_id: selectedRelease.id,
  admin_id: user.id,
  reason: rejectionReason
});
```

5. **Функция подтверждения оплаты (только для Basic):**
```typescript
const handleVerifyPayment = async () => {
  if (!supabase || !selectedRelease) return;
  if (selectedRelease.release_type !== 'basic') return; // Проверка типа
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc('verify_basic_payment', {
      release_id: selectedRelease.id,
      admin_id: user.id
    });
    
    if (error) throw error;
    
    alert('Оплата подтверждена!');
    loadReleases();
  } catch (error) {
    console.error('Ошибка при подтверждении оплаты:', error);
    alert('Ошибка при подтверждении оплаты');
  }
};
```

6. **Отображение типа релиза в списке:**
```tsx
<div className="space-y-3">
  {releases.map((release) => (
    <div key={release.id} className="p-4 bg-white/5 rounded-lg">
      <div className="flex items-center gap-3">
        <img 
          src={release.cover_url || '/placeholder.png'} 
          alt={release.title}
          className="w-16 h-16 rounded object-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold">{release.title}</h3>
          <p className="text-sm text-zinc-400">{release.artist_name}</p>
          <p className="text-xs text-zinc-500">{release.user_email}</p>
        </div>
        {/* ДОБАВИТЬ: Бейдж типа релиза */}
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          release.release_type === 'basic' 
            ? 'bg-blue-500/20 text-blue-300' 
            : 'bg-purple-500/20 text-purple-300'
        }`}>
          {release.release_type === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
        </span>
        <button 
          onClick={() => loadFullRelease(release.id)}
          className="px-4 py-2 bg-[#9d8df1] text-black rounded-lg"
        >
          Просмотр
        </button>
      </div>
      
      {/* ДОБАВИТЬ: Информация об оплате только для Basic */}
      {release.release_type === 'basic' && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-zinc-500">Статус оплаты:</span>
              <span className={`ml-2 font-bold ${
                release.payment_status === 'verified' ? 'text-green-400' :
                release.payment_status === 'rejected' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {release.payment_status === 'verified' ? 'Подтверждена' :
                 release.payment_status === 'rejected' ? 'Отклонена' :
                 'На проверке'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Сумма:</span>
              <span className="ml-2 font-bold">{release.payment_amount} ₽</span>
            </div>
          </div>
        </div>
      )}
    </div>
  ))}
</div>
```

## 4. Админ панель - page.tsx

**Файл:** `app/admin/page.tsx`

### Аналогичные изменения:

```typescript
// Функция loadReleases
const { data, error } = await supabase.rpc('get_all_pending_releases');

// Функция handleApprove
const functionName = selectedRelease.release_type === 'basic' 
  ? 'approve_basic_release' 
  : 'approve_exclusive_release';

// Функция handleReject
const functionName = selectedRelease.release_type === 'basic' 
  ? 'reject_basic_release' 
  : 'reject_exclusive_release';
```

## 5. Личный кабинет - Отображение релизов пользователя

**Файл:** `app/cabinet/page.tsx` (или компонент отображения релизов)

### Добавить логику загрузки из правильной таблицы:

```typescript
const loadUserReleases = async () => {
  if (!supabase) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Получаем профиль для определения роли
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let releases = [];

    if (profile?.role === 'basic') {
      // Загружаем Basic релизы
      const { data, error } = await supabase
        .from('releases_basic')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      releases = data || [];
    } else if (profile?.role === 'exclusive') {
      // Загружаем Exclusive релизы
      const { data, error } = await supabase
        .from('releases_exclusive')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      releases = data || [];
    }

    setReleases(releases);
  } catch (error) {
    console.error('Ошибка загрузки релизов:', error);
  }
};
```

## 6. Функция загрузки полного релиза в модерации

```typescript
const loadFullRelease = async (releaseId: string, releaseType: 'basic' | 'exclusive') => {
  if (!supabase) return;
  
  try {
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', releaseId)
      .single();
    
    if (error) throw error;
    setSelectedRelease({ ...data, release_type: releaseType });
    setShowModal(true);
  } catch (error) {
    console.error('Ошибка загрузки релиза:', error);
  }
};
```

## Итоговый чеклист изменений:

- [ ] ✅ Выполнить SQL скрипт `CREATE_SEPARATE_RELEASES_TABLES.sql`
- [ ] ✅ Обновить `app/cabinet/release-basic/create/components/SendStep.tsx`
- [ ] ✅ Обновить `app/cabinet/release/create/components/SendStep.tsx`
- [ ] ✅ Обновить `app/admin/components/ReleasesModeration.tsx`
- [ ] ✅ Обновить `app/admin/page.tsx`
- [ ] ✅ Обновить отображение релизов в личном кабинете
- [ ] ✅ Протестировать создание Basic релиза
- [ ] ✅ Протестировать создание Exclusive релиза
- [ ] ✅ Протестировать модерацию
- [ ] ✅ Проверить отображение в кабинете
