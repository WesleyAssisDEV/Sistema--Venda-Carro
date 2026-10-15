export const STORE_CONFIG = {
  name: "VCar Automotiva",
  whatsapp: "5511945698237", // Coloque o seu WhatsApp aqui (apenas números)
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKM(value: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(value)} km`;
}

export function generateWhatsAppLink(vehicle: { make: string; model: string; version: string; year: number; price: number }): string {
  const text = `Olá! Vi o anúncio no site e tenho interesse no veículo:\n\n*${vehicle.make} ${vehicle.model} - ${vehicle.version}*\nAno: ${vehicle.year}\nValor: ${formatCurrency(vehicle.price)}\n\nPoderia me enviar mais informações?`;
  return `https://wa.me/${STORE_CONFIG.phone}?text=${encodeURIComponent(text)}`;
}