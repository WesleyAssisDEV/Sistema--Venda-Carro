'use client';

import { useState } from 'react';

export default function Galeria({ images, altText }: { images: any[], altText: string }) {
  const [mainImage, setMainImage] = useState(
    images?.[0]?.public_url || 'https://via.placeholder.com/800x600?text=Sem+Foto'
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- LÓGICA PARA PASSAR AS FOTOS ---
  // Descobre a posição (índice) da foto que estamos a ver agora
  const currentIndex = images?.findIndex((img: any) => img.public_url === mainImage) || 0;

  // Função para ir para a PRÓXIMA foto
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique feche a tela cheia
    if (!images || images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    setMainImage(images[nextIdx].public_url);
  };

  // Função para ir para a foto ANTERIOR
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique feche a tela cheia
    if (!images || images.length <= 1) return;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setMainImage(images[prevIdx].public_url);
  };

  return (
    <div className="flex-1 space-y-4">
      {/* Container da Imagem Principal */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="relative aspect-[16/10] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center cursor-pointer group"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-105 pointer-events-none transition-opacity group-hover:opacity-60"
          style={{ backgroundImage: `url(${mainImage})` }}
        />
        
        <img 
          src={mainImage} 
          alt={altText} 
          className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
          <span className="bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md">
            🔍 Clicar para ampliar
          </span>
        </div>
      </div>
      
      {/* Miniaturas */}
      {images && images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img: any) => (
            <button 
              key={img.id} 
              onClick={() => setMainImage(img.public_url)}
              className={`relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 bg-black transition-all duration-300 ${
                mainImage === img.public_url ? 'border-red-600 opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img src={img.public_url} alt="Miniatura" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* MODAL / TELA CHEIA */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-8"
          onClick={() => setIsModalOpen(false)} 
        >
          {/* Botão Fechar (X) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(false);
            }}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-black transition-colors z-[110]"
          >
            ✕
          </button>

          {/* Seta Esquerda */}
          {images && images.length > 1 && (
            <button 
              onClick={prevImage}
              className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-2xl sm:text-4xl font-black transition-colors z-[110] border border-white/10 backdrop-blur-md"
            >
              ‹
            </button>
          )}

          {/* Imagem Gigante */}
          <img 
            src={mainImage} 
            alt={`${altText} Ampliada`} 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-full max-h-full object-contain shadow-2xl px-12 sm:px-0"
          />

          {/* Seta Direita */}
          {images && images.length > 1 && (
            <button 
              onClick={nextImage}
              className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-2xl sm:text-4xl font-black transition-colors z-[110] border border-white/10 backdrop-blur-md"
            >
              ›
            </button>
          )}

          {/* Contador de Fotos (Ex: 1 / 4) */}
          {images && images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full z-[110] border border-white/10">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}