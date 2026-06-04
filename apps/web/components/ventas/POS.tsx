'use client';
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { calcularSubtotalItem, calcularTotalCarrito } from '@/lib/money';
import { validarVentaPos, mensajeErrorVenta } from '@/lib/ventas-pos';
import { ABtn, APrice, APill } from '@/components/ui';

interface Producto {
  id: string;
  nombre: string;
  sku?: string | null;
  precio: string;
  stock_actual: number;
}

interface Cliente {
  id: string;
  nombre: string;
  cuit?: string | null;
  saldo_deudor: string;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface ResultadoVenta {
  id: string;
  estado: string;
  total: string;
  cae?: string | null;
  numero_comprobante?: number | null;
}

interface POSProps {
  productos: Producto[];
  clientes: Cliente[];
  token: string;
  buscarInicial?: string;
}

const ESTADO_INFO: Record<string, { label: string; tone: 'ok' | 'warn' | 'err' }> = {
  facturado: { label: 'Facturado', tone: 'ok' },
  pendiente_facturacion: { label: 'Pendiente de facturación', tone: 'warn' },
  error_afip: { label: 'Error AFIP', tone: 'err' },
  remito: { label: 'Remito', tone: 'ok' },
  presupuesto: { label: 'Presupuesto', tone: 'ok' },
};

export function POS({ productos, clientes, token, buscarInicial = '' }: POSProps) {
  const [buscar, setBuscar] = useState(buscarInicial);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [tipo, setTipo] = useState('factura_b');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [clienteId, setClienteId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ResultadoVenta | null>(null);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (p.sku?.toLowerCase().includes(buscar.toLowerCase())),
  );

  const agregar = useCallback((producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        // No superar el stock disponible
        if (existente.cantidad >= producto.stock_actual) return prev;
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      if (producto.stock_actual === 0) return prev;
      return [...prev, { producto, cantidad: 1 }];
    });
  }, []);

  function cambiarCantidad(productoId: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((i) => {
          if (i.producto.id !== productoId) return i;
          const nueva = i.cantidad + delta;
          if (nueva > i.producto.stock_actual) return i;
          return { ...i, cantidad: nueva };
        })
        .filter((i) => i.cantidad > 0),
    );
  }

  const total = calcularTotalCarrito(
    carrito.map((i) => ({ precio: i.producto.precio, cantidad: i.cantidad })),
  );

  const ctaCteError = metodoPago === 'cuenta_corriente' && !clienteId;
  const facturaAError = tipo === 'factura_a' && !clienteId;

  async function confirmar() {
    if (carrito.length === 0) return;

    const validacion = validarVentaPos({
      tipo,
      metodoPago,
      clienteId,
      items: carrito.map((i) => ({
        productoId: i.producto.id,
        descripcion: i.producto.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.producto.precio,
      })),
    });

    if (!validacion.ok) {
      setError(mensajeErrorVenta(validacion));
      return;
    }

    setEnviando(true);
    setError('');
    try {
      const res = await apiClient<{ data: ResultadoVenta }>('/ventas', {
        method: 'POST',
        token,
        body: JSON.stringify(validacion.data),
      });
      setResultado(res.data);
      setCarrito([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la venta.');
    } finally {
      setEnviando(false);
    }
  }

  function nuevaVenta() {
    setResultado(null);
    setError('');
    setBuscar('');
    setClienteId('');
  }

  // ── Ticket post-venta ────────────────────────────────────────────────────
  if (resultado) {
    const info = ESTADO_INFO[resultado.estado] ?? { label: resultado.estado, tone: 'ok' as const };
    return (
      <div className="max-w-sm mx-auto text-center space-y-4 py-8">
        <div className="font-serif text-5xl text-ok">✓</div>
        <h2 className="font-serif text-2xl text-ink">Venta registrada</h2>
        <APrice value={resultado.total} className="text-3xl" />
        <APill tone={info.tone}>{info.label}</APill>
        {resultado.cae && (
          <div className="bg-card border border-rule rounded-[2px] px-4 py-3 text-left space-y-1">
            <p className="font-mono text-[11px] text-muted uppercase tracking-wider">CAE</p>
            <p className="font-mono text-sm text-ink">{resultado.cae}</p>
            {resultado.numero_comprobante && (
              <p className="font-mono text-xs text-muted">Comprobante #{resultado.numero_comprobante}</p>
            )}
          </div>
        )}
        {resultado.estado === 'pendiente_facturacion' && (
          <p className="font-sans text-xs text-muted">
            AFIP no respondió. La factura se procesará automáticamente en los próximos minutos.
          </p>
        )}
        <ABtn variant="primary" onClick={nuevaVenta}>Nueva venta</ABtn>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
      {/* ── Catálogo ── */}
      <div className="space-y-4">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar producto por nombre o SKU..."
          className="w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {productosFiltrados.map((p) => (
            <button
              key={p.id}
              onClick={() => agregar(p)}
              disabled={p.stock_actual === 0}
              className="flex items-center justify-between bg-card border border-rule rounded-[2px] px-3 py-2 text-left hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="min-w-0">
                <p className="font-sans text-sm text-ink truncate">{p.nombre}</p>
                {p.sku && <p className="font-mono text-[10px] text-muted">{p.sku}</p>}
              </div>
              <div className="text-right ml-3 shrink-0">
                <APrice value={p.precio} className="text-sm" />
                <p className="font-mono text-[10px] text-muted">stock: {p.stock_actual}</p>
              </div>
            </button>
          ))}
          {productosFiltrados.length === 0 && (
            <p className="font-sans text-sm text-muted col-span-2 py-8 text-center">
              {buscar ? 'Sin resultados.' : 'No hay productos.'}
            </p>
          )}
        </div>
      </div>

      {/* ── Carrito ── */}
      <div className="flex flex-col gap-3">
        <div className="bg-card border border-rule rounded-[2px] flex-1 overflow-y-auto" style={{ boxShadow: 'var(--shadow-flat)' }}>
          {carrito.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-sans text-sm text-muted">Agregá productos al carrito</p>
            </div>
          ) : (
            <ul className="divide-y divide-rule-soft">
              {carrito.map((item) => (
                <li key={item.producto.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs text-ink truncate">{item.producto.nombre}</p>
                    <APrice
                      value={calcularSubtotalItem(item.producto.precio, item.cantidad)}
                      className="text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => cambiarCantidad(item.producto.id, -1)} className="w-6 h-6 font-sans text-sm bg-paper border border-rule rounded-[2px] hover:bg-paper-warm">−</button>
                    <span className="font-mono text-sm w-6 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.producto.id, 1)}
                      disabled={item.cantidad >= item.producto.stock_actual}
                      className="w-6 h-6 font-sans text-sm bg-paper border border-rule rounded-[2px] hover:bg-paper-warm disabled:opacity-40"
                    >+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Opciones + total */}
        <div className="bg-card border border-rule rounded-[2px] p-3 space-y-3" style={{ boxShadow: 'var(--shadow-flat)' }}>
          <div className="flex justify-between items-baseline">
            <span className="font-sans text-sm text-muted">Total</span>
            <APrice value={total} className="text-2xl" />
          </div>

          {/* Cliente */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
              Cliente {(metodoPago === 'cuenta_corriente' || tipo === 'factura_a') && <span className="text-err">*</span>}
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-2 py-1.5 font-sans text-xs text-ink bg-paper border border-rule rounded-[2px] focus:outline-none focus:border-accent"
            >
              <option value="">— Consumidor final —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.cuit ? ` (${c.cuit})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-2 py-1.5 font-sans text-xs text-ink bg-paper border border-rule rounded-[2px] focus:outline-none focus:border-accent">
                <option value="factura_b">Factura B</option>
                <option value="factura_a">Factura A</option>
                <option value="factura_c">Factura C</option>
                <option value="ticket">Ticket</option>
                <option value="remito">Remito</option>
                <option value="presupuesto">Presupuesto</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Pago</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full px-2 py-1.5 font-sans text-xs text-ink bg-paper border border-rule rounded-[2px] focus:outline-none focus:border-accent">
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="transferencia">Transferencia</option>
                <option value="cuenta_corriente">Cta. Cte.</option>
              </select>
            </div>
          </div>

          {(error || ctaCteError || facturaAError) && (
            <p className="font-sans text-xs text-err">
              {error || (ctaCteError
                ? 'Seleccioná un cliente para usar cuenta corriente.'
                : 'Seleccioná un cliente con CUIT para Factura A.')}
            </p>
          )}

          <ABtn
            variant="primary"
            className="w-full"
            onClick={confirmar}
            disabled={carrito.length === 0 || enviando || ctaCteError || facturaAError}
          >
            {enviando ? 'Procesando...' : 'Confirmar venta'}
          </ABtn>
        </div>
      </div>
    </div>
  );
}
