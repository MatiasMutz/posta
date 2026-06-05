'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AperturaCajaSchema, CierreCajaSchema, MovimientoCajaSchema,
  PagoClienteSchema, PagoProveedorSchema,
} from '@posta/validation';
import { apiClient } from '@/lib/api-client';
import { ABtn, APrice, APill } from '@/components/ui';
import { esPositivo } from '@/lib/money';

interface Movimiento {
  id: string;
  tipo: string;
  metodo_pago?: string | null;
  monto: string;
  concepto: string;
  created_at: string;
}

interface Totales {
  ventas: string;
  compras: string;
  ingresos: string;
  egresos: string;
  pagos_cliente: string;
  pagos_proveedor: string;
  por_metodo: Record<string, string>;
}

interface Sesion {
  id: string;
  monto_apertura: string;
  abierta_at: string;
}

interface CuentaCorriente {
  id: string;
  nombre: string;
  saldo: string;
  tipo: 'cliente' | 'proveedor';
}

interface FlujoCaja {
  facturacion_bruta: string;
  cobros_recibidos: string;
  pagos_realizados: string;
  costo_mercaderia: string;
  iva_estimado: string;
  dinero_neto: string;
}

interface EstadoCaja {
  sesion: Sesion | null;
  saldo_actual: string;
  totales: Totales | null;
  movimientos: Movimiento[];
}

interface PanelCajaProps {
  token: string;
  rol: string;
  estadoInicial: EstadoCaja;
  cuentasCorrientes: { clientes: CuentaCorriente[]; proveedores: CuentaCorriente[] };
  flujoCaja: FlujoCaja;
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferencia',
};

const TIPO_TONE: Record<string, 'ok' | 'warn' | 'err' | 'accent' | 'neutral'> = {
  venta: 'ok',
  compra: 'err',
  ingreso: 'accent',
  egreso: 'err',
  pago_cliente: 'ok',
  pago_proveedor: 'warn',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function PanelCaja({
  token, rol, estadoInicial, cuentasCorrientes, flujoCaja,
}: PanelCajaProps) {
  const router = useRouter();
  const esDueno = rol === 'dueno';
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [movTipo, setMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movMonto, setMovMonto] = useState('');
  const [movConcepto, setMovConcepto] = useState('');

  const [pagoTipo, setPagoTipo] = useState<'cliente' | 'proveedor'>('cliente');
  const [pagoEntidadId, setPagoEntidadId] = useState('');
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState<'efectivo' | 'debito' | 'credito' | 'transferencia'>('efectivo');

  const { sesion, saldo_actual, totales, movimientos } = estadoInicial;
  const cuentas = [...cuentasCorrientes.clientes, ...cuentasCorrientes.proveedores];

  async function ejecutar(accion: () => Promise<void>) {
    setError('');
    setCargando(true);
    try {
      await accion();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setCargando(false);
    }
  }

  async function abrirCaja() {
    const parsed = AperturaCajaSchema.safeParse({ monto_apertura: montoApertura.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Monto inválido.');
      return;
    }
    await ejecutar(async () => {
      await apiClient('/tesoreria/caja/apertura', {
        method: 'POST', body: JSON.stringify(parsed.data), token,
      });
      setMontoApertura('');
    });
  }

  async function cerrarCaja() {
    const parsed = CierreCajaSchema.safeParse({ monto_cierre: montoCierre.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Monto inválido.');
      return;
    }
    await ejecutar(async () => {
      await apiClient('/tesoreria/caja/cierre', {
        method: 'POST', body: JSON.stringify(parsed.data), token,
      });
      setMontoCierre('');
    });
  }

  async function registrarMovimiento() {
    const parsed = MovimientoCajaSchema.safeParse({
      tipo: movTipo,
      monto: movMonto.trim(),
      concepto: movConcepto.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }
    await ejecutar(async () => {
      await apiClient('/tesoreria/caja/movimientos', {
        method: 'POST', body: JSON.stringify(parsed.data), token,
      });
      setMovMonto('');
      setMovConcepto('');
    });
  }

  async function registrarPago() {
    if (pagoTipo === 'cliente') {
      const parsed = PagoClienteSchema.safeParse({
        cliente_id: pagoEntidadId,
        monto: pagoMonto.trim(),
        metodo_pago: pagoMetodo,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
        return;
      }
      await ejecutar(async () => {
        await apiClient('/tesoreria/pagos/cliente', {
          method: 'POST', body: JSON.stringify(parsed.data), token,
        });
        setPagoMonto('');
        setPagoEntidadId('');
      });
    } else {
      const parsed = PagoProveedorSchema.safeParse({
        proveedor_id: pagoEntidadId,
        monto: pagoMonto.trim(),
        metodo_pago: pagoMetodo,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
        return;
      }
      await ejecutar(async () => {
        await apiClient('/tesoreria/pagos/proveedor', {
          method: 'POST', body: JSON.stringify(parsed.data), token,
        });
        setPagoMonto('');
        setPagoEntidadId('');
      });
    }
  }

  const inputClass = 'w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent';
  const labelClass = 'block font-mono text-[10px] uppercase tracking-wider text-muted mb-1';

  if (!sesion) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-rule rounded-[2px] p-6" style={{ boxShadow: 'var(--shadow-flat)' }}>
          <h2 className="font-serif text-xl text-ink mb-2">Caja cerrada</h2>
          <p className="font-sans text-sm text-muted mb-4">
            Abrí la caja del día para registrar movimientos y cobros.
          </p>
          {error && (
            <div className="bg-err-soft border border-err rounded-[2px] px-3 py-2 mb-4">
              <p className="font-sans text-sm text-err">{error}</p>
            </div>
          )}
          {esDueno ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="monto-apertura" className={labelClass}>Monto de apertura</label>
                <input
                  id="monto-apertura"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  className={inputClass}
                />
              </div>
              <ABtn variant="primary" className="w-full" onClick={abrirCaja} disabled={cargando}>
                {cargando ? 'Abriendo…' : 'Abrir caja'}
              </ABtn>
            </div>
          ) : (
            <p className="font-sans text-sm text-muted">No hay caja abierta en este momento.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl text-ink">Caja del día</h2>
            <p className="font-sans text-sm text-muted mt-1">
              Abierta {formatFecha(sesion.abierta_at)} · {formatHora(sesion.abierta_at)}
            </p>
          </div>
          {esDueno && (
            <div className="flex gap-2 items-end">
              <div>
                <label className={labelClass}>Arqueo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  className={`${inputClass} w-32`}
                />
              </div>
              <ABtn variant="secondary" onClick={cerrarCaja} disabled={cargando}>
                Cerrar caja
              </ABtn>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3">
            <p className="font-sans text-sm text-err">{error}</p>
          </div>
        )}

        <div className="bg-ink text-paper rounded-[2px] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/60 mb-2">
              Saldo actual en caja
            </p>
            <APrice value={saldo_actual} className="text-4xl md:text-5xl text-paper" />
          </div>
          {totales && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-paper/50">Apertura</p>
                <APrice value={sesion.monto_apertura} className="text-paper" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-paper/50">Ventas</p>
                <APrice value={totales.ventas} className="text-pos" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-paper/50">Egresos</p>
                <APrice value={totales.egresos} className="text-neg" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-paper/50">Compras</p>
                <APrice value={totales.compras} className="text-neg" />
              </div>
            </div>
          )}
        </div>

        {totales && Object.keys(totales.por_metodo).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(totales.por_metodo).map(([metodo, monto]) => (
              <div key={metodo} className="bg-card border border-rule rounded-[2px] p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                  {METODO_LABEL[metodo] ?? metodo}
                </p>
                <APrice value={monto} className="text-lg" />
              </div>
            ))}
          </div>
        )}

        <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
          <div className="px-4 py-3 border-b border-rule bg-paper-warm flex justify-between items-center">
            <h3 className="font-serif text-lg text-ink">Movimientos del día</h3>
            <span className="font-mono text-[10px] text-muted uppercase">{movimientos.length} registros</span>
          </div>
          {movimientos.length === 0 ? (
            <p className="px-4 py-8 text-center font-sans text-sm text-muted">Sin movimientos todavía.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Hora</th>
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Concepto</th>
                    <th className="text-center py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Tipo</th>
                    <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => {
                    const negativo = m.monto.startsWith('-') || m.tipo === 'compra' || m.tipo === 'egreso';
                    return (
                      <tr key={`${m.tipo}-${m.id}`} className="border-b border-rule-soft">
                        <td className="py-2 px-4 font-mono text-xs text-muted">{formatHora(m.created_at)}</td>
                        <td className="py-2 px-4 font-sans text-sm text-ink">{m.concepto}</td>
                        <td className="py-2 px-4 text-center">
                          <APill tone={TIPO_TONE[m.tipo] ?? 'neutral'}>{m.tipo}</APill>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <APrice
                            value={negativo ? `-${m.monto.replace(/^-/, '')}` : m.monto}
                            className={`text-sm ${negativo ? 'text-ink' : 'text-pos'}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card border border-rule rounded-[2px] p-5" style={{ boxShadow: 'var(--shadow-flat)' }}>
          <h3 className="font-serif text-lg text-ink mb-4">Flujo de caja del mes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Facturación bruta</p>
              <APrice value={flujoCaja.facturacion_bruta} className="text-lg" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Cobros recibidos</p>
              <APrice value={flujoCaja.cobros_recibidos} className="text-lg text-pos" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Pagos realizados</p>
              <APrice value={flujoCaja.pagos_realizados} className="text-lg text-neg" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Costo mercadería</p>
              <APrice value={flujoCaja.costo_mercaderia} className="text-lg" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">IVA estimado</p>
              <APrice value={flujoCaja.iva_estimado} className="text-lg" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Dinero neto</p>
              <APrice value={flujoCaja.dinero_neto} className="text-xl font-semibold" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {esDueno && (
          <>
            <div className="bg-card border border-rule rounded-[2px] p-4" style={{ boxShadow: 'var(--shadow-flat)' }}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-3">Movimiento manual</p>
              <div className="space-y-2">
                <select value={movTipo} onChange={(e) => setMovTipo(e.target.value as 'ingreso' | 'egreso')} className={inputClass}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
                <input
                  id="mov-monto"
                  type="text"
                  inputMode="decimal"
                  placeholder="1234.56"
                  aria-label="Monto del movimiento"
                  value={movMonto}
                  onChange={(e) => setMovMonto(e.target.value)}
                  className={inputClass}
                />
                <input
                  id="mov-concepto"
                  type="text"
                  placeholder="Concepto"
                  aria-label="Concepto del movimiento"
                  value={movConcepto}
                  onChange={(e) => setMovConcepto(e.target.value)}
                  className={inputClass}
                />
                <ABtn variant="secondary" className="w-full" onClick={registrarMovimiento} disabled={cargando}>
                  Registrar
                </ABtn>
              </div>
            </div>

            <div className="bg-card border border-rule rounded-[2px] p-4" style={{ boxShadow: 'var(--shadow-flat)' }}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-3">Cobro / pago</p>
              <div className="space-y-2">
                <select value={pagoTipo} onChange={(e) => { setPagoTipo(e.target.value as 'cliente' | 'proveedor'); setPagoEntidadId(''); }} className={inputClass}>
                  <option value="cliente">Cobro a cliente</option>
                  <option value="proveedor">Pago a proveedor</option>
                </select>
                <select value={pagoEntidadId} onChange={(e) => setPagoEntidadId(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar…</option>
                  {(pagoTipo === 'cliente' ? cuentasCorrientes.clientes : cuentasCorrientes.proveedores).map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} — ${c.saldo}</option>
                  ))}
                </select>
                <input
                  id="pago-monto"
                  type="text"
                  inputMode="decimal"
                  placeholder="1234.56"
                  aria-label="Monto del cobro"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                  className={inputClass}
                />
                <select value={pagoMetodo} onChange={(e) => setPagoMetodo(e.target.value as typeof pagoMetodo)} className={inputClass}>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <ABtn variant="primary" className="w-full" onClick={registrarPago} disabled={cargando || !pagoEntidadId}>
                  {pagoTipo === 'cliente' ? 'Registrar cobro' : 'Registrar pago'}
                </ABtn>
              </div>
            </div>
          </>
        )}

        <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
          <div className="px-4 py-3 border-b border-rule bg-paper-warm">
            <h3 className="font-serif text-base text-ink">Cuentas corrientes</h3>
            <p className="font-sans text-xs text-muted mt-0.5">
              {cuentas.length} con saldo pendiente
            </p>
          </div>
          {cuentas.length === 0 ? (
            <p className="px-4 py-6 text-center font-sans text-sm text-muted">Sin saldos pendientes.</p>
          ) : (
            cuentas.map((c) => (
              <Link
                key={`${c.tipo}-${c.id}`}
                href={c.tipo === 'cliente' ? `/clientes/${c.id}` : `/proveedores/${c.id}`}
                className="block px-4 py-3 border-b border-rule-soft hover:bg-paper-warm transition-colors"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-sans text-sm text-ink">{c.nombre}</span>
                  {esPositivo(c.saldo) ? (
                    <APrice value={c.saldo} className="text-sm text-neg" />
                  ) : (
                    <span className="font-mono text-sm text-muted">$0</span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-muted uppercase mt-0.5">
                  {c.tipo === 'cliente' ? 'Cliente' : 'Proveedor'}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
