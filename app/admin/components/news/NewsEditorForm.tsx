'use client';

interface NewsEditorFormProps {
  editingId: number | null;
  title: string;
  setTitle: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  image: string;
  setImage: (value: string) => void;
  scheduledFor: string;
  setScheduledFor: (value: string) => void;
  showPreview: boolean;
  setShowPreview: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  renderPreview: () => React.ReactNode;
}

export function NewsEditorForm({
  editingId,
  title,
  setTitle,
  content,
  setContent,
  category,
  setCategory,
  image,
  setImage,
  scheduledFor,
  setScheduledFor,
  showPreview,
  setShowPreview,
  saving,
  onSave,
  onCancel,
  renderPreview,
}: NewsEditorFormProps) {
  return (
    <div className="p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl">
      <h3 className="font-black mb-2">{editingId ? 'Редактируешь новость' : 'Создать новость'}</h3>
      <p className="text-xs text-zinc-500 mb-6">Заполни форму ниже и нажми кнопку "Опубликовать"</p>
      
      <div className="space-y-5">
        {/* Заголовок и категория */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              ЗАГОЛОВОК <span className="text-red-400">*</span>
            </label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Например: Новый релиз от thqlabel" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition" 
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-zinc-600">Главный заголовок - обязательное поле</p>
              <p className="text-[10px] text-zinc-500">{title.length} символов</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              КАТЕГОРИЯ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition cursor-pointer"
            >
              <option value="Новость">Новость - обычная новость лейбла</option>
              <option value="Обновление">Обновление - изменения на платформе</option>
            </select>
            <p className="text-[10px] text-zinc-600 mt-1">Тип новости - влияет на иконку</p>
          </div>

          {/* Планирование публикации */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              ЗАПЛАНИРОВАТЬ ПУБЛИКАЦИЮ (необязательно)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition [color-scheme:dark]"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              {scheduledFor ? `Новость будет опубликована ${new Date(scheduledFor).toLocaleString('ru-RU')}` : 'Оставьте пустым для немедленной публикации'}
            </p>
          </div>
        </div>
        
        {/* Картинка */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2">
            КАРТИНКА (необязательно)
          </label>
          <input 
            value={image} 
            onChange={(e) => setImage(e.target.value)} 
            placeholder="URL картинки" 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#6050ba] transition" 
          />
        </div>
        
        {/* Текст новости */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-zinc-400">
              ТЕКСТ НОВОСТИ
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] px-3 py-1 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg font-bold transition"
            >
              {showPreview ? 'Редактор' : 'Предпросмотр'}
            </button>
          </div>
          
          {!showPreview ? (
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="Основной текст новости..." 
              rows={10}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-[#6050ba] focus:bg-black/60 font-mono transition" 
            />
          ) : (
            <div className="bg-black/20 border border-white/10 rounded-xl p-6 min-h-[200px]">
              {content ? renderPreview() : <p className="text-zinc-600 text-center">Введите текст для предпросмотра</p>}
            </div>
          )}
        </div>
        
        {/* Кнопки действий */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button 
            onClick={onSave} 
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] rounded-xl text-sm font-bold hover:from-[#7060ca] hover:to-[#8070da] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6050ba]/20"
          >
            {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Опубликовать новость'}
          </button>
          {editingId && (
            <button 
              onClick={onCancel}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition"
            >
              ✕ Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
