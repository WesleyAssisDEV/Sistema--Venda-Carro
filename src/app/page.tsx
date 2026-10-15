import { createServerSupabaseClient } from '../lib/supabase/server';
import { STORE_CONFIG, formatCurrency, formatKM, generateWhatsAppLink } from '../lib/utils';
import Link from 'next/link';



export default async function HomePage({
  searchParams,
}: {
  searchParams: any;
}) {
  // O erro estava aqui: retirou-se o "await", pois não é necessário e causava erro
  const supabase = createServerSupabaseClient();
  const params = searchParams;

  let query = supabase
    .from('vehicles')
    .select('*, vehicle_images(*)')
    .eq('is_published', true)
    .eq('status', 'available')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (params?.search) {
    query = query.or(`make.ilike.%${params.search}%,model.ilike.%${params.search}%,version.ilike.%${params.search}%`);
  }

  const { data: vehicles } = await query;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/30">
              AP
            </div>
            <span className="text-2xl font-black tracking-tight text-white uppercase">
              {STORE_CONFIG.name}
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-semibold">
            <a href="#estoque" className="text-gray-300 hover:text-red-500 transition">Estoque</a>
            <a href="#contato" className="text-gray-300 hover:text-red-500 transition">Contato</a>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-b from-black via-gray-900 to-gray-950 py-24 px-4 text-center border-b border-gray-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-red-600/10 text-red-500 border border-red-600/20 uppercase tracking-wider">
            Seminovos de Alta Performance
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
            A Experiência Definitiva em Seminovos
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Veículos inspecionados, garantia de procedência e facilidade na negociação.
          </p>
          <div className="pt-4">
            <a
              href="#estoque"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-4 rounded-xl shadow-xl shadow-red-600/20 transition transform hover:-translate-y-0.5 uppercase tracking-wide text-sm"
            >
              Explorar Estoque
            </a>
          </div>
        </div>
      </section>

      {/* Vitrine de Estoque */}
      <main id="estoque" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black uppercase text-white tracking-tight">Estoque Disponível</h2>
            <p className="text-gray-400 text-sm mt-1">Confira nossas ofertas exclusivas</p>
          </div>
        </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles && vehicles.length > 0 ? (
            vehicles?.map((v: any) => {
              const sortedImages = [...(v.vehicle_images || [])].sort((a: any, b: any) => a.display_order - b.display_order);
              const mainImage = sortedImages?.[0]?.public_url || 'https://via.placeholder.com/600x400?text=Sem+Foto';
              const whatsappUrl = generateWhatsAppLink(v);

              return (
                <div key={v.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-red-600/50 transition duration-300 flex flex-col group">
                  <div className="relative aspect-[16/10] bg-black overflow-hidden">
                    <img
                      src={mainImage}
                      alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {v.is_featured && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-md shadow">
                        Destaque
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-xs font-bold text-red-500 uppercase tracking-widest">{v.make}</div>
                      <h3 className="text-xl font-black text-white mt-1 uppercase">{v.model}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{v.version}</p>

                      <div className="grid grid-cols-2 gap-2 my-4 pt-4 border-t border-gray-800 text-xs text-gray-300">
                        <div><span className="text-gray-500">Ano:</span> {v.year}</div>
                        <div><span className="text-gray-500">KM:</span> {formatKM(v.mileage)}</div>
                        <div><span className="text-gray-500">Câmbio:</span> {v.transmission}</div>
                        <div><span className="text-gray-500">Combustível:</span> {v.fuel_type}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-2xl font-black text-white mb-4">
                        {formatCurrency(v.price)}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/veiculo/${v.id}`}
                          className="w-full text-center py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition"
                        >
                          Detalhes
                        </Link>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/20"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-gray-500 bg-gray-900 rounded-2xl border border-dashed border-gray-800">
              Nenhum veículo disponível no momento.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer id="contato" className="bg-black text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="text-white text-base font-black uppercase mb-3">{STORE_CONFIG.name}</h4>
            <p className="text-gray-400">Qualidade, procedência e garantia na compra do seu seminovo.</p>
          </div>
          <div>
            <h4 className="text-white text-base font-black uppercase mb-3">Atendimento</h4>
            <p>Atendimento presencial e online via WhatsApp.</p>
          </div>
          <div>
            <h4 className="text-white text-base font-black uppercase mb-3">Localização</h4>
            <p>Atendendo com transparência e rapidez.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-900 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {STORE_CONFIG.name}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}