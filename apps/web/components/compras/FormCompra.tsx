'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateCompraSchema, type CreateCompraDto } from '@posta/validation';
import { apiClient } from '@/lib/api-client';
import { ABtn } from '@/components/ui';
import type { ApiResponse } from '@posta/shared-types';

interface Proveedor {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  stock_actual: number;
}

interface FormCompraProps {
  token: string;
  proveedorIdInicial?: string;
}

export function FormCompra({ token, proveedorIdInicial }: FormCompraProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [categoria, setCategoria] = useState<'compra' | 'gasto'>('compra');
  const [proveedorId, setProveedorId] = useState(proveedorIdInicial ?? '');
  const [metodoPago, setMetodoPago] = useState<CreateCompraDto['metodo_pago']>('efectivo');
  const [tipoComprobante, setTipoComprobante] = useState<CreateCompraDto['tipo_comprobante']>('factura_b');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [productoId, setProductoId] = useState('');
  const [descuento, setDescuento] = useState('0');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    apiClient<ApiResponse<Proveedor[]>>('/proveedores?pagina=1&limite=200', { token })
      .then((res) => setProveedores(res.data))
      .catch(() => {});
    apiClient<ApiResponse<Producto[]>>('/inventario/productos?pagina=1&limite=200', { token })
      .then((res) => setProductos(res.data))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (categoria === 'gasto') {
      setProductoId('');
      if (tipoComprobante === 'factura_a') setTipoComprobante('sin_comprobante');
    }
  }, [categoria, tipoComprobante]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const item = {
      descripcion: descripcion.trim(),
      cantidad: Number(cantidad),
      precio_unitario: precioUnitario.trim(),
      ...(categoria === 'compra' && productoId ? { producto_id: productoId } : {}),
    };

    const body: CreateCompraDto = {
      categoria,
      tipo_comprobante: tipoComprobante,
      metodo_pago: metodoPago,
      descuento: descuento || '0',
      items: [item],
      ...(proveedorId ? { proveedor_id: proveedorId } : {}),
      ...(observaciones ? { observaciones } : {}),
    };

    const parsed = CreateCompraSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Revisá los datos de la compra.';
      setError(msg);
      setCargando(false);
      return;
    }

    try {
      await apiClient('/compras', { method: 'POST', body: JSON.stringify(parsed.data), token });
      router.push('/compras/historial');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la compra.');
    } finally {
      setCargando(false);
    }
  }

  const inputClass = 'w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent';
  const labelClass = 'block font-mono text-[11px] uppercase tracking-wider text-muted mb-1';

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className={labelClass}>Tipo</label>
        <div className="flex gap-2">
          {(['compra', 'gasto'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={[
                'px-4 py-2 font-sans text-sm rounded-[2px] border',
                categoria === c ? 'bg-ink text-card border-ink' : 'bg-card text-muted border-rule',
              ].join(' ')}
            >
              {c === 'compra' ? 'Compra' : 'Gasto'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Proveedor {metodoPago === 'cuenta_corriente' ? '*' : ''}</label>
        <select
          value={proveedorId}
          onChange={(e) => setProveedorId(e.target.value)}
          className={inputClass}
        >
          <option value="">Sin proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Comprobante</label>
          <select
            value={tipoComprobante}
            onChange={(e) => setTipoComprobante(e.target.value as CreateCompraDto['tipo_comprobante'])}
            className={inputClass}
          >
            <option value="factura_b">Factura B</option>
            <option value="factura_a">Factura A</option>
            <option value="ticket">Ticket</option>
            <option value="sin_comprobante">Sin comprobante</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Pago</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as CreateCompraDto['metodo_pago'])}
            className={inputClass}
          >
            <option value="efectivo">Efectivo</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
            <option value="transferencia">Transferencia</option>
            <option value="cuenta_corriente">Cuenta corriente</option>
          </select>
        </div>
      </div>

      {categoria === 'compra' && (
        <div>
          <label className={labelClass}>Producto (opcional — actualiza stock)</label>
          <select value={productoId} onChange={(e) => {
            setProductoId(e.target.value);
            const prod = productos.find((p) => p.id === e.target.value);
            if (prod) setDescripcion(prod.nombre);
          }} className={inputClass}>
            <option value="">Sin vincular</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock_actual})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Descripción *</label>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={inputClass}
          placeholder="Ej: Insumos de oficina"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cantidad *</label>
          <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Precio unitario *</label>
          <input value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} className={inputClass} placeholder="1234.56" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Descuento</label>
        <input value={descuento} onChange={(e) => setDescuento(e.target.value)} className={inputClass} placeholder="0" />
      </div>

      <div>
        <label className={labelClass}>Observaciones</label>
        <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className={inputClass} />
      </div>

      {error && (
        <p className="font-sans text-sm text-err bg-err-soft px-3 py-2 rounded-[2px]">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <ABtn type="submit" variant="primary" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Registrar'}
        </ABtn>
        <ABtn type="button" variant="ghost" onClick={() => router.back()}>Cancelar</ABtn>
      </div>
    </form>
  );
}
