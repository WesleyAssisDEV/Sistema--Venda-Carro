-- 1. TABELA DE VEÍCULOS
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  version VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  mileage INTEGER NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  transmission VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'available' -- 'available' ou 'sold'
);

-- 2. TABELA DE IMAGENS DOS VEÍCULOS
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_vehicles_published ON public.vehicles (is_published, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images (vehicle_id);

-- 3. FUNCTION E TRIGGER: TRAVA DE NO MÁXIMO 6 FOTOS POR VEÍCULO
CREATE OR REPLACE FUNCTION check_vehicle_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.vehicle_images WHERE vehicle_id = NEW.vehicle_id) >= 6 THEN
    RAISE EXCEPTION 'Limite máximo atingido: Cada veículo só pode ter até 6 fotos cadastradas.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_six_images ON public.vehicle_images;
CREATE TRIGGER enforce_max_six_images
BEFORE INSERT ON public.vehicle_images
FOR EACH ROW EXECUTE FUNCTION check_vehicle_image_limit();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Políticas para Vehicles
CREATE POLICY "Leitura pública de veículos publicados" 
ON public.vehicles FOR SELECT 
USING (is_published = true);

CREATE POLICY "Acesso total de leitura para admin" 
ON public.vehicles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Inserção restrita a admin" 
ON public.vehicles FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Atualização restrita a admin" 
ON public.vehicles FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Exclusão restrita a admin" 
ON public.vehicles FOR DELETE 
TO authenticated 
USING (true);

-- Políticas para Vehicle Images
CREATE POLICY "Leitura pública de imagens" 
ON public.vehicle_images FOR SELECT 
USING (true);

CREATE POLICY "Gerenciamento total de imagens para admin" 
ON public.vehicle_images FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. BUCKET DE IMAGENS E POLÍTICAS DE STORAGE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Acesso público para leitura das fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Upload restrito a administradores"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Exclusão restrita a administradores"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-photos');