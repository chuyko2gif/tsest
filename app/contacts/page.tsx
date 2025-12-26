"use client";
import AnimatedBackground from '@/components/AnimatedBackground';

export default function ContactsPage() {
  return (
    <div className="min-h-screen pt-28 px-6 pb-24 bg-[#0d0d0f] text-white">
      <AnimatedBackground />
      <div className="max-w-[1000px] mx-auto p-8 relative z-20">
        <h1 className="text-3xl font-black mb-4">РљРѕРЅС‚Р°РєС‚С‹</h1>
        <p className="text-zinc-400 mb-6">РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё РїРѕ Р»СЋР±РѕРјСѓ РІРѕРїСЂРѕСЃСѓ вЂ” С‚РµС…РїРѕРґРґРµСЂР¶РєР°, СЃРѕС‚СЂСѓРґРЅРёС‡РµСЃС‚РІРѕ, РІРѕРїСЂРѕСЃС‹ РїРѕ СЂРµР»РёР·Р°Рј.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <h2 className="font-bold mb-2">РћР±С‰РёРµ РІРѕРїСЂРѕСЃС‹</h2>
            <p className="text-zinc-400 mb-4">Email: hello@thqlabel.example</p>
            <p className="text-zinc-400">РўРµР»РµС„РѕРЅ: +7 (999) 000-00-00 (РїСЂРёРјРµСЂ)</p>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <h2 className="font-bold mb-2">РўРµС…РЅРёС‡РµСЃРєР°СЏ РїРѕРґРґРµСЂР¶РєР°</h2>
            <p className="text-zinc-400 mb-4">Р•СЃР»Рё Сѓ РІР°СЃ РїСЂРѕР±Р»РµРјС‹ СЃ Р·Р°РіСЂСѓР·РєРѕР№ СЂРµР»РёР·Р° РёР»Рё Р°РєРєР°СѓРЅС‚РѕРј вЂ” РЅР°РїРёС€РёС‚Рµ РІ РїРѕРґРґРµСЂР¶РєСѓ.</p>
            <p className="text-zinc-400">support@thqlabel.example</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <h3 className="font-bold mb-3">РћС„РёСЃ</h3>
          <p className="text-zinc-400">Город, улица, дом — примерный адрес</p>
        </div>
      </div>
    </div>
  );
}
