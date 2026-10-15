import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STORE_CONFIG, formatCurrency, formatKM, generateWhatsAppLink } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Galeria from './galeria';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = createServerSupabaseClient();

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_images(*)')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error || !vehicle) {
    notFound();
  }

  const sortedImages = [...(vehicle.vehicle_images || [])].sort(
    (a: any, b: any) => a.display_order - b.display_order
  );
  
  const whatsappMessage = `Olá! Tenho interesse no ${vehicle.make} ${vehicle.model} ${vehicle.year} que vi no site.`;
  const whatsappUrl = `https://wa.me/5511945698237?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
           <img src="/logovcar.jpg" alt="Logótipo" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-black tracking-tight text-white uppercase">
              {STORE_CONFIG.name}
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-wider bg-gray-900 hover:bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl border border-gray-800 transition"
          >
            ← Voltar ao Estoque
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Coluna da Esquerda: Galeria de Imagens e Descrição */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Componente Galeria Interativa */}
            <Galeria images={sortedImages} altText={`${vehicle.make} ${vehicle.model}`} />

            {/* Descrição do Veículo */}
            {vehicle.description && (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mt-8 space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Observações do Veículo</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {vehicle.description}
                </p>
              </div>
            )}
          </div>

          {/* Coluna da Direita: Informações e Ação */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6 sticky top-28">
              <div>
                <span className="text-xs font-black text-red-500 uppercase tracking-widest">{vehicle.make}</span>
                <h1 className="text-3xl font-black text-white mt-1 uppercase">{vehicle.model}</h1>
                <p className="text-sm text-gray-400 mt-1">{vehicle.version}</p>
              </div>

              <div className="text-3xl font-black text-white pt-4 border-t border-gray-800">
                {formatCurrency(vehicle.price)}
              </div>

              {/* Especificações Técnicas */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800 text-xs text-gray-300">
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-900">
                  <span className="block text-gray-500 text-[10px] uppercase font-bold">Ano</span>
                  <span className="font-bold text-sm text-white">{vehicle.year}</span>
                </div>
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-900">
                  <span className="block text-gray-500 text-[10px] uppercase font-bold">Quilometragem</span>
                  <span className="font-bold text-sm text-white">{formatKM(vehicle.mileage)}</span>
                </div>
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-900">
                  <span className="block text-gray-500 text-[10px] uppercase font-bold">Câmbio</span>
                  <span className="font-bold text-sm text-white capitalize">{vehicle.transmission}</span>
                </div>
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-900">
                  <span className="block text-gray-500 text-[10px] uppercase font-bold">Combustível</span>
                  <span className="font-bold text-sm text-white capitalize">{vehicle.fuel_type}</span>
                </div>
              </div>

              {/* Botão WhatsApp */}
              <div className="pt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30"
                >
                  Negociar via WhatsApp
                </a>
                <p className="text-[11px] text-center text-gray-500 mt-3">
                  Atendimento rápido e seguro com a nossa equipa de vendas.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-12 border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {STORE_CONFIG.name}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}