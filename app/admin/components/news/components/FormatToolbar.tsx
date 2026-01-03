'use client';

import React from 'react';

interface FormatToolbarProps {
  content: string;
  setContent: (content: string) => void;
  onOpenLinkDialog: () => void;
}

export function FormatToolbar({ content, setContent, onOpenLinkDialog }: FormatToolbarProps) {
  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    const newContent = before + prefix + selected + suffix + after;
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + selected.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const buttons = [
    { label: 'H1', title: 'Заголовок H1', onClick: () => insertFormat('# ', '') },
    { label: 'H2', title: 'Заголовок H2', onClick: () => insertFormat('## ', '') },
    { type: 'divider' },
    { label: <strong>B</strong>, title: 'Жирный текст', onClick: () => insertFormat('**', '**') },
    { label: <em>I</em>, title: 'Курсив', onClick: () => insertFormat('*', '*') },
    { label: '</>', title: 'Код', onClick: () => insertFormat('`', '`'), className: 'font-mono' },
    { type: 'divider' },
    { label: <LinkIcon />, title: 'Вставить ссылку', onClick: onOpenLinkDialog },
    { label: '•', title: 'Список', onClick: () => insertFormat('- ', '') },
    { label: '" "', title: 'Цитата', onClick: () => insertFormat('> ', '') },
    { label: '─', title: 'Разделитель', onClick: () => insertFormat('\n---\n', '') },
    { label: '↵', title: 'Новый абзац', onClick: () => insertFormat('\n\n', '') },
  ];

  return (
    <div className="mb-2 p-2 bg-black/20 border border-white/5 rounded-xl flex flex-wrap gap-1">
      {buttons.map((btn, i) => {
        if (btn.type === 'divider') {
          return <div key={i} className="w-px bg-white/10 mx-1" />;
        }
        return (
          <button
            key={i}
            type="button"
            onClick={btn.onClick}
            className={`px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition ${btn.className || ''}`}
            title={btn.title}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

// Рендер предпросмотра
export function renderPreview(content: string) {
  return content.split('\n').map((paragraph: string, i: number) => {
    if (paragraph.trim() === '---') return <hr key={i} className="border-t border-white/20 my-8" />;
    if (paragraph.startsWith('# ')) return <h1 key={i} className="text-3xl font-black uppercase tracking-tight text-white mt-10 mb-6">{paragraph.replace('# ', '')}</h1>;
    if (paragraph.startsWith('## ')) return <h2 key={i} className="text-xl font-black uppercase tracking-tight text-[#9d8df1] mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
    if (paragraph.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[#6050ba] pl-4 py-2 my-4 text-white/70 italic bg-white/5 rounded-r-lg">{paragraph.replace('> ', '')}</blockquote>;
    if (paragraph.startsWith('- ')) return <li key={i} className="text-white/90 ml-4">{paragraph.replace('- ', '')}</li>;
    if (paragraph.trim()) {
      let processed = paragraph;
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
      processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>');
      processed = processed.replace(/`(.+?)`/g, '<code class="bg-black/40 px-2 py-1 rounded text-[#9d8df1] text-sm font-mono">$1</code>');
      processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
        const href = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#9d8df1] underline hover:text-[#b8a8ff]">${text}</a>`;
      });
      return <p key={i} className="text-white/80 mb-4" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    return null;
  });
}
