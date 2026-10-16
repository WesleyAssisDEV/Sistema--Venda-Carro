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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          
          {/* Logo Maior e Sem Texto */}
          <div className="flex items-center">
            <img 
              src="/logovcar.jpg" 
              alt="Logotipo VCAR" 
              className="h-20 sm:h-24 w-auto object-contain" 
            />
          </div>
          
          {/* Menu Mais Chamativo */}
          <nav className="flex items-center gap-4 text-sm font-extrabold uppercase tracking-wider">
            <a 
              href="#estoque" 
              className="text-gray-300 hover:text-white px-4 py-2 hover:bg-gray-900 rounded-lg transition"
            >
              Estoque
            </a>
            <a 
              href="#contato" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transform hover:-translate-y-0.5 transition"
            >
              Contato
            </a>
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
              
              // Aqui está a correção com o seu número:
              const whatsappMessage = `Olá! Tenho interesse no ${v.make} ${v.model} ${v.year} que vi no site.`;
              const whatsappUrl = `https://wa.me/5511945698237?text=${encodeURIComponent(whatsappMessage)}`;

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

      {/* Footer / Secção de Contacto */}
      <footer id="contato" className="bg-black text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
          
          {/* Coluna 1: Sobre a Loja */}
          <div className="space-y-4">
            <h4 className="text-white text-base font-black uppercase tracking-wider">{STORE_CONFIG.name}</h4>
            <p className="text-gray-400 leading-relaxed">
              Especialistas em seminovos de alta qualidade. Garantimos procedência, transparência e as melhores condições para o seu próximo carro.
            </p>
          </div>

          {/* Coluna 2: Ação de Contacto Direto */}
          <div className="space-y-4">
            <h4 className="text-white text-base font-black uppercase tracking-wider">Fale Connosco</h4>
            <p className="text-gray-400">Tem alguma dúvida ou procura um modelo específico? Fale diretamente com a nossa equipa.</p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Botão WhatsApp */}
              <a 
                href={`https://wa.me/${STORE_CONFIG.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-green-600/20 transform hover:-translate-y-0.5 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
                WhatsApp
              </a>

              {/* Botão Instagram */}
              <a 
                href="https://instagram.com/vcarconsultoriaautomotiva" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-pink-500/20 transform hover:-translate-y-0.5 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.036 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                </svg>
                Instagram
              </a>
            </div>
          </div>

          {/* Coluna 3: Endereço / Localização */}
          <div className="space-y-4">
            <h4 className="text-white text-base font-black uppercase tracking-wider">Localização</h4>
            <p className="text-gray-400">
              {(STORE_CONFIG as any).address || "R: bezerra da silva N:48, Residencial santo antonio"}
            </p>
          </div>

        </div>
        
        {/* Direitos de Autor */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-900 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {STORE_CONFIG.name}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}