import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { FormCompra } from '@/components/compras/FormCompra';

export default async function NuevaCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ proveedor?: string }>;
}) {
  const sesion = await requireSesion();
  if (sesion.rol !== 'dueno') redirect('/compras/historial');

  const { proveedor } = await searchParams;

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Registrar compra o gasto</h1>
        <FormCompra token={sesion.accessToken} proveedorIdInicial={proveedor} />
      </div>
    </div>
  );
}
