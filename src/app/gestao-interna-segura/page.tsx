'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { STORE_CONFIG, formatCurrency, formatKM } from '@/lib/utils';
import { compressImage } from '@/lib/imageOptimizer';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Estados da fechadura
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Formulário para novo veículo
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    version: '',
    year: 2026,
    price: '',
    mileage: '',
    transmission: 'Automático',
    fuel_type: 'Flex',
    description: '',
    is_featured: false,
    is_published: true,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVehicles(data);
    }
    setLoading(false);
  }

  // Manipular seleção de ficheiros (Máximo 6 fotos)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length > 6) {
        setErrorMsg('Pode selecionar no máximo 6 fotos por veículo.');
        return;
      }
      setErrorMsg('');
      setSelectedFiles(filesArray);
    }
  }

  // Criar novo veículo e enviar fotos otimizadas
  async function handleCreateVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Inserir dados do veículo
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([
          {
            make: formData.make.toUpperCase(),
            model: formData.model.toUpperCase(),
            version: formData.version,
            year: Number(formData.year),
            price: Number(formData.price),
            mileage: Number(formData.mileage),
            transmission: formData.transmission,
            fuel_type: formData.fuel_type,
            description: formData.description,
            is_featured: formData.is_featured,
            is_published: formData.is_published,
            status: 'available',
          },
        ])
        .select()
        .single();

      if (vehicleError || !vehicleData) throw new Error(vehicleError?.message || 'Erro ao criar veículo.');

      const vehicleId = vehicleData.id;

      // 2. Comprimir e enviar imagens (se houver)
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const compressed = await compressImage(file);
          
          const fileName = `${vehicleId}/${Date.now()}_${i}.webp`;
          
          const { error: uploadError } = await supabase.storage
            .from('vehicle-images')
            .upload(fileName, compressed);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('vehicle-images')
              .getPublicUrl(fileName);

            await supabase.from('vehicle_images').insert([
              {
                vehicle_id: vehicleId,
                public_url: publicUrlData.publicUrl,
                display_order: i,
              },
            ]);
          }
        }
      }

      setSuccessMsg('Veículo cadastrado e fotos otimizadas com sucesso!');
      setFormData({
        make: '',
        model: '',
        version: '',
        year: new Date().getFullYear(),
        price: '',
        mileage: '',
        transmission: 'Automático',
        fuel_type: 'Flex',
        description: '',
        is_featured: false,
        is_published: true,
      });
      setSelectedFiles([]);
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao salvar o veículo.');
    } finally {
      setSaving(false);
    }
  }

  // Apagar veículo e limpar as fotos do Storage
  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este veículo definitivamente?')) return;
    
    try {
      // 1. Procurar todas as fotos deste veículo na pasta dele no Supabase Storage
      const { data: files } = await supabase.storage.from('vehicle-images').list(id);
      
      // 2. Se houver fotos, mandar apagar fisicamente para libertar espaço (MBs)
      if (files && files.length > 0) {
        const pathsToRemove = files.map(file => `${id}/${file.name}`);
        await supabase.storage.from('vehicle-images').remove(pathsToRemove);
      }

      // 3. Depois das fotos apagadas, remove os dados de texto do banco de dados
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      
      if (error) throw error;
      
      fetchVehicles(); // Atualiza a lista na tela
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar o veículo e limpar as fotos.');
    }
  }

  // --- INÍCIO DA FECHADURA ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (password === 'vcar2026') {
              sessionStorage.setItem('wa_admin_auth', 'true');
              setIsAuthenticated(true);
            } else {
              alert('Senha incorreta!');
            }
          }} 
          className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-2">
            <img src="/logovcar.jpg" alt="Logo" className="h-12 mx-auto object-contain mb-4" />
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestão Interna</h1>
            <p className="text-gray-400 text-sm">Área exclusiva para gestão de veículos</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 transition"
          />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-red-600/20">
            Entrar no Painel
          </button>
        </form>
      </div>
    );
  }
  // --- FIM DA FECHADURA ---

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Header Admin */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sessionStorage.removeItem('wa_admin_auth');
                setIsAuthenticated(false);
              }}
              className="text-xs font-bold uppercase tracking-wider bg-gray-900 hover:bg-red-600/20 text-red-400 px-4 py-2.5 rounded-xl border border-gray-800 transition"
            >
              Sair
            </button>
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-wider bg-gray-900 hover:bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl border border-gray-800 transition"
            >
              Ver Site Público →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        
        {/* Formulário de Cadastro de Novo Veículo */}
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase text-white tracking-tight">Adicionar Novo Veículo</h2>
            <p className="text-gray-400 text-sm mt-1">Registe um novo seminovo na vitrine instantaneamente</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-600/10 border border-red-600/30 text-red-500 rounded-xl text-sm font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-600/10 border border-green-600/30 text-green-400 rounded-xl text-sm font-bold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleCreateVehicle} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Marca (Ex: HONDA)</label>
                <input
                  type="text"
                  required
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Ex: Honda"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Modelo (Ex: CIVIC)</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: Civic"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Versão</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="Ex: 2.0 EXL CVT"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Ano</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Preço (R$)</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Ex: 85000"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Quilometragem (KM)</label>
                <input
                  type="number"
                  required
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="Ex: 45000"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Câmbio</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                >
                  <option value="Automático">Automático</option>
                  <option value="Manual">Manual</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Combustível</label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition"
                >
                  <option value="Flex">Flex</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  Fotos do Veículo (Máx. 6 fotos)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-gray-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 transition cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Observações / Descrição</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 outline-none transition resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                Destacar no Topo da Vitrine
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 disabled:opacity-50"
            >
              {saving ? 'A processar e comprimir imagens...' : 'Publicar Veículo na Vitrine'}
            </button>
          </form>
        </section>

        {/* Lista de Veículos Existentes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase text-white tracking-tight">Veículos Cadastrados</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">A carregar inventário...</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-900 rounded-3xl border border-gray-800">
              Nenhum veículo registado na base de dados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => {
                const mainImg = v.vehicle_images?.[0]?.public_url || 'https://via.placeholder.com/400x300?text=Sem+Foto';
                return (
                  <div key={v.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-[16/10] bg-black">
                        <img src={mainImg} alt={v.model} className="w-full h-full object-cover" />
                        <span className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          {v.vehicle_images?.length || 0} / 6 fotos
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="text-xs font-bold text-red-500 uppercase">{v.make}</div>
                        <h3 className="text-lg font-black uppercase text-white">{v.model} - {v.year}</h3>
                        <div className="text-xl font-black text-white">{formatCurrency(v.price)}</div>
                        <div className="text-xs text-gray-400">KM: {formatKM(v.mileage)} | {v.transmission}</div>
                      </div>
                    </div>
                    <div className="p-5 pt-0 flex gap-2">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-red-600/20 transition"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}