'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbyGqQr5dIPVdGO06ZJbLyFSJNoIUefntdTVNNEHhdkoKeD89WaT2kPaF_0ysWbnUGtDxQ/exec";

const PRODUCTOS = ['Botellones', 'Bolsas', 'Dispensadores', 'Botellas 6L'];

const METODOS_PAGO = [
  { id: 'efectivo',  label: 'Efectivo',  emoji: '💵' },
  { id: 'nequi',    label: 'Nequi',     emoji: '🟣' },
  { id: 'nu',       label: 'Nu',        emoji: '🟪' },
  { id: 'daviplata',label: 'Daviplata', emoji: '🔴' },
  { id: 'llave',    label: 'Llave',     emoji: '🔑' },
];

const PROD_CFG = {
  'Botellones':    { emoji: '🫧', color: '#38bdf8', glow: '#0ea5e933', icon: '💧' },
  'Bolsas':        { emoji: '💧', color: '#34d399', glow: '#10b98133', icon: '💧' },
  'Dispensadores': { emoji: '⚙️', color: '#a78bfa', glow: '#8b5cf633', icon: '⚙️' },
  'Botellas 6L':   { emoji: '🍶', color: '#fb923c', glow: '#f9731633', icon: '🍶' },
};

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

const fmtHora = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const fmtFechaCorta = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const fmtFechaCompleta = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const esHoy = (str) => {
  if (!str) return false;
  const d = new Date(str);
  const hoy = new Date();
  return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
};

// Fecha YYYY-MM-DD de un Date
const toYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const TABS = [
  { id: 'inicio',   emoji: '🏠', label: 'Inicio' },
  { id: 'ventas',   emoji: '💰', label: 'Ventas' },
  { id: 'entradas', emoji: '📦', label: 'Stock' },
  { id: 'clientes', emoji: '👥', label: 'Clientes' },
  { id: 'informes', emoji: '📊', label: 'Informes' },
];

/* ─── Mini bar chart ─────────────────────────────────────── */
function MiniBarChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: '100%', height: `${Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0)}px`,
              background: i === data.length - 1 ? color : `${color}55`,
              borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease',
              minHeight: d.value > 0 ? 4 : 0,
            }} />
            <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.6)', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut chart ────────────────────────────────────────── */
function DonutChart({ items, size = 120 }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', opacity: 0.4, fontSize: 13 }}>Sin datos</div>;
  const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.26;
  const slices = items.map((item, index, array) => {
    const pct = item.value / total;
    const sumPrevios = array.slice(0, index).reduce((sum, curr) => sum + curr.value, 0);
    const startAngle = -90 + ((sumPrevios / total) * 360);
    const endAngle = startAngle + (pct * 360);
    const toRad = a => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle - 0.1));
    const y2 = cy + r * Math.sin(toRad(endAngle - 0.1));
    const ix1 = cx + innerR * Math.cos(toRad(endAngle - 0.1));
    const iy1 = cy + innerR * Math.sin(toRad(endAngle - 0.1));
    const ix2 = cx + innerR * Math.cos(toRad(startAngle));
    const iy2 = cy + innerR * Math.sin(toRad(startAngle));
    const largeArc = pct > 0.5 ? 1 : 0;
    return {
      ...item,
      path: `M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${largeArc},0 ${ix2},${iy2} Z`,
      pct,
    };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={size * 0.13} fontWeight="900">{items.length}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize={size * 0.09}>productos</text>
    </svg>
  );
}

/* ─── Loader Gota ────────────────────────────────────────── */
function LoaderGota({ size = 60, showText = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))' }}>
        <defs>
          <clipPath id="dropClip">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </clipPath>
        </defs>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="rgba(14,165,233,0.15)" stroke="#38bdf8" strokeWidth="1" />
        <g clipPath="url(#dropClip)">
          <rect x="0" y="0" width="24" height="24" fill="#38bdf8" className="water-fill" />
        </g>
      </svg>
      {showText && (
        <div style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>
          Cargando
        </div>
      )}
    </div>
  );
}

/* ─── Selector de método de pago ─────────────────────────── */
function MetodoPagoSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
        💳 Método de pago
      </label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {METODOS_PAGO.map(m => {
          const sel = value === m.id;
          return (
            <button key={m.id} type="button" onClick={() => onChange(m.id)}
              style={{
                background: sel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${sel ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, padding: '7px 12px', color: sel ? '#38bdf8' : 'rgba(148,163,184,0.8)',
                cursor: 'pointer', fontSize: 12, fontWeight: sel ? 800 : 600,
                fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <span style={{ fontSize: 15 }}>{m.emoji}</span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Chip de método de pago ─────────────────────────────── */
function MetodoChip({ metodo }) {
  if (!metodo) return null;
  const m = METODOS_PAGO.find(x => x.id === metodo);
  if (!m) return null;
  return (
    <span style={{
      background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.22)',
      borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 700, color: '#7dd3fc',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {m.emoji} {m.label}
    </span>
  );
}

/* ─── Tarjeta de resumen diario (colapsable) ─────────────── */
function ResumenDiaCard({ dia }) {
  const [open, setOpen] = useState(false);
  const MEDAL_COLORES = ['#f59e0b','#94a3b8','#b45309'];

  const metodosPresentes = Object.entries(dia.metodoDia).sort((a, b) => b[1] - a[1]);
  const clientesPresentes = Object.entries(dia.clientesDia).sort((a, b) => b[1].total - a[1].total);
  const prodPresentes = Object.entries(dia.prodDia).sort((a, b) => b[1].total - a[1].total);

  return (
    <div style={{
      borderRadius: 16, marginBottom: 10, overflow: 'hidden',
      border: dia.esDiaHoy ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.07)',
      background: dia.esDiaHoy ? 'linear-gradient(135deg,rgba(14,165,233,0.1),rgba(3,105,161,0.05))' : 'rgba(255,255,255,0.03)',
    }}>
      {/* Cabecera siempre visible */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', color: 'white',
          padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
        {/* Fecha */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 800, fontSize: 14, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dia.label}
            {dia.esDiaHoy && (
              <span style={{ background: '#0ea5e9', color: 'white', borderRadius: 6, fontSize: 9, fontWeight: 900, padding: '1px 6px', textTransform: 'uppercase' }}>Hoy</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span>{dia.movDia.length} venta{dia.movDia.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{dia.cantDia} unidades</span>
            <span>·</span>
            <span>{Object.keys(dia.clientesDia).length} cliente{Object.keys(dia.clientesDia).length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {/* Total del día */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: dia.esDiaHoy ? '#38bdf8' : '#67e8f9', fontFamily: '"DM Mono",monospace' }}>
            {fmtCOP(dia.totalDia)}
          </div>
          {/* Chips de métodos de pago */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
            {metodosPresentes.map(([met]) => {
              const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
              return (
                <span key={met} style={{ fontSize: 12 }} title={m.label}>{m.emoji}</span>
              );
            })}
          </div>
        </div>
        {/* Chevron */}
        <div style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {/* Detalle expandido */}
      {open && (
        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Productos del día */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>📦 Productos vendidos</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {prodPresentes.map(([prod, datos]) => {
                const cfg = PROD_CFG[prod] || { emoji: '📦', color: '#94a3b8' };
                return (
                  <div key={prod} style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{prod}</div>
                      <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>{datos.cant} uds · {fmtCOP(datos.total)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métodos de pago del día */}
          {metodosPresentes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>💳 Cómo pagaron</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {metodosPresentes.map(([met, total]) => {
                  const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
                  const pct = Math.round((total / dia.totalDia) * 100);
                  return (
                    <div key={met} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 15 }}>{m.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(total)} <span style={{ color: 'rgba(148,163,184,0.5)' }}>({pct}%)</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clientes del día */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>👥 Clientes ({clientesPresentes.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clientesPresentes.map(([cli, datos], ci) => {
                const ventas = dia.movDia.filter(m => (m.CLIENTE || '—') === cli);
                const metCli = {};
                ventas.forEach(m => {
                  const met = m.METODO_PAGO || m.metodoPago || 'efectivo';
                  if (!metCli[met]) metCli[met] = 0;
                  metCli[met] += Number(m.TOTAL) || 0;
                });
                return (
                  <div key={ci} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{cli}</div>
                        {/* Productos que compró */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {Object.entries(datos.productos).map(([prod, cant]) => {
                            const cfg = PROD_CFG[prod] || { emoji: '📦', color: '#94a3b8' };
                            return (
                              <span key={prod} style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                {cfg.emoji} {cant} {prod}
                              </span>
                            );
                          })}
                        </div>
                        {/* Métodos que usó */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {Object.entries(metCli).map(([met, tot]) => {
                            const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
                            return (
                              <span key={met} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 5, padding: '1px 6px', fontSize: 10, color: '#7dd3fc', fontWeight: 700 }}>
                                {m.emoji} {m.label} · {fmtCOP(tot)}
                              </span>
                            );
                          })}
                        </div>
                        {/* Línea de cada venta */}
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {ventas.map((v, vi) => {
                            const cfg = PROD_CFG[v.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                            return (
                              <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>
                                <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
                                <span>{v.PRODUCTO} × {v.CANTIDAD}</span>
                                <span style={{ color: '#67e8f9', fontWeight: 700, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(v.TOTAL)}</span>
                                <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{fmtHora(v.FECHA_HORA)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: 12, textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(datos.total)}</div>
                        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 1 }}>{datos.cant} uds</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function Home() {
  const [tab, setTab]               = useState('inicio');
  const [clientes, setClientes]     = useState([]);
  const [productos, setProductos]   = useState([]);
  const [movs, setMovs]             = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [guardando, setGuardando]   = useState(false);
  const [toast, setToast]           = useState(null);

  // ── Estado de clientes ───────────────────────────────────────
  const [showAddCli, setShowAddCli] = useState(false);
  const [editCli, setEditCli]       = useState(null);
  const [newCli, setNewCli]         = useState({ nombre: '', telefono: '', direccion: '' });
  const [searchCli, setSearchCli]   = useState('');

  // ── Estado de venta con carrito ──────────────────────────────
  const ventaInicial = { cliente: '', producto: '', cantidad: '', precioUnit: '', metodoPago: 'efectivo' };
  const [venta, setVenta]     = useState(ventaInicial);
  const [carrito, setCarrito] = useState([]);

  // ── Estado de stock ──────────────────────────────────────────
  const [entrada, setEntrada]   = useState({ producto: '', cantidad: '', precio: '', metodoPago: 'efectivo' });

  // ── Filtros historial ────────────────────────────────────────
  const [filtroFechaMov, setFiltroFechaMov] = useState('');
  const [filtroProdMov, setFiltroProdMov]   = useState('');

  // ── Filtros gráfico informes (rango de fecha) ────────────────
  const hoy = toYMD(new Date());
  const hace30 = toYMD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [graficoDesde, setGraficoDesde] = useState(hace30);
  const [graficoHasta, setGraficoHasta] = useState(hoy);
  const [graficoTipo, setGraficoTipo]   = useState('ventas'); // 'ventas' | 'unidades' | 'pagos'

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await fetch(API_URL);
      const d = await r.json();
      setClientes(d.clientes || []);
      setProductos(d.productos || []);
      setMovs(d.movimientos || []);
    } catch { mostrarToast('Sin conexión 😔', 'err'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const enviar = async (payload) => {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (d.status !== 'success') throw new Error(d.message);
  };

  // ── Carrito ──────────────────────────────────────────────────
  const agregarAlCarrito = () => {
    if (!venta.producto || !venta.cantidad || !venta.precioUnit) {
      mostrarToast('Completa producto, cantidad y precio ⚠️', 'err');
      return;
    }
    const cant = +venta.cantidad;
    const precio = +venta.precioUnit;
    setCarrito(prev => [...prev, {
      producto: venta.producto,
      cantidad: cant,
      precioUnit: precio,
      total: cant * precio,
    }]);
    setVenta(v => ({ ...v, producto: '', cantidad: '', precioUnit: '' }));
  };

  const quitarDelCarrito = (idx) => {
    setCarrito(prev => prev.filter((_, i) => i !== idx));
  };

  const submitVenta = async (e) => {
    e.preventDefault();
    if (!venta.cliente) { mostrarToast('Selecciona un cliente ⚠️', 'err'); return; }
    if (carrito.length === 0) { mostrarToast('Agrega al menos un producto 🛒', 'err'); return; }
    setGuardando(true);
    try {
      for (const item of carrito) {
        await enviar({
          tipo: 'SALIDA',
          cliente: venta.cliente,
          producto: item.producto,
          cantidad: item.cantidad,
          precio: item.precioUnit,
          metodoPago: venta.metodoPago || 'efectivo',
        });
      }
      mostrarToast(`¡${carrito.length > 1 ? carrito.length + ' productos vendidos' : 'Venta registrada'}! ✓`);
      setVenta(ventaInicial);
      setCarrito([]);
      cargar();
    } catch (err) {
      console.error(err);
      mostrarToast('Error al guardar ❌', 'err');
    } finally {
      setGuardando(false);
    }
  };

  const submitEntrada = (e) => {
    e.preventDefault();
    if (!entrada.producto || !entrada.cantidad) return;
    setGuardando(true);
    enviar({
      tipo: 'ENTRADA',
      cliente: 'PROVEEDOR',
      producto: entrada.producto,
      cantidad: +entrada.cantidad,
      precio: +(entrada.precio || 0),
      metodoPago: entrada.metodoPago || 'efectivo',
    })
      .then(() => { mostrarToast('¡Guardado exitosamente! ✓'); setEntrada({ producto: '', cantidad: '', precio: '', metodoPago: 'efectivo' }); cargar(); })
      .catch(() => mostrarToast('Error al guardar ❌', 'err'))
      .finally(() => setGuardando(false));
  };

  // ── Gestión de Clientes ──────────────────────────────────────
  const iniciarEdicionCliente = (c) => {
    setEditCli(c);
    setNewCli({ nombre: c.NOMBRE || '', telefono: c.TELEFONO || '', direccion: c.DIRECCION || '' });
    setShowAddCli(true);
  };

  const cancelarEdicionCliente = () => {
    setEditCli(null);
    setNewCli({ nombre: '', telefono: '', direccion: '' });
    setShowAddCli(false);
  };

  const submitCliente = (e) => {
    e.preventDefault();
    setGuardando(true);
    const payload = editCli
      ? { tipo: 'EDITAR_CLIENTE', id: editCli.ID_CLIENTE, nombre: newCli.nombre, telefono: newCli.telefono, direccion: newCli.direccion }
      : { tipo: 'NUEVO_CLIENTE', nombre: newCli.nombre, telefono: newCli.telefono, direccion: newCli.direccion };

    enviar(payload)
      .then(() => { mostrarToast(editCli ? '¡Cliente actualizado! ✓' : '¡Cliente guardado! ✓'); cancelarEdicionCliente(); cargar(); })
      .catch(() => mostrarToast('Error al guardar ❌', 'err'))
      .finally(() => setGuardando(false));
  };

  const eliminarCliente = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return;
    setGuardando(true);
    enviar({ tipo: 'ELIMINAR_CLIENTE', id })
      .then(() => { mostrarToast('Cliente eliminado 🗑️'); cargar(); })
      .catch(() => mostrarToast('Error al eliminar ❌', 'err'))
      .finally(() => setGuardando(false));
  };

  // ── Métricas e Historial ──────────────────────────────────────
  const metricas = useMemo(() => {
    const salidas  = movs.filter(m => m.TIPO === 'SALIDA');
    const entradas = movs.filter(m => m.TIPO === 'ENTRADA');
    const salidaHoy  = salidas.filter(m => esHoy(m.FECHA_HORA));
    const entradaHoy = entradas.filter(m => esHoy(m.FECHA_HORA));
    const totalVentas   = salidas.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
    const ventasHoy     = salidaHoy.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
    const unidadesHoy   = salidaHoy.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
    const unidadesEntHoy = entradaHoy.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
    const dias7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString('es-CO', { weekday: 'short' }).slice(0, 3);
      const dayMatch = (str) => {
        const x = new Date(str);
        return x.getDate() === d.getDate() && x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
      };
      const value = salidas.filter(m => dayMatch(m.FECHA_HORA)).reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
      const cant  = salidas.filter(m => dayMatch(m.FECHA_HORA)).reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
      return { label, value, cant };
    });
    const porProducto = {};
    salidas.forEach(m => {
      const p = m.PRODUCTO || 'Otros';
      if (!porProducto[p]) porProducto[p] = { cant: 0, total: 0 };
      porProducto[p].cant  += Number(m.CANTIDAD) || 0;
      porProducto[p].total += Number(m.TOTAL) || 0;
    });
    const porCliente = {};
    salidas.forEach(m => {
      const c = m.CLIENTE || '—';
      if (!porCliente[c]) porCliente[c] = { cant: 0, total: 0 };
      porCliente[c].cant  += Number(m.CANTIDAD) || 0;
      porCliente[c].total += Number(m.TOTAL) || 0;
    });
    return { totalVentas, ventasHoy, unidadesHoy, unidadesEntHoy, salidas, entradas, salidaHoy, entradaHoy, dias7, porProducto, porCliente };
  }, [movs]);

  // ── Datos del gráfico por rango de fecha ─────────────────────
  const datosGrafico = useMemo(() => {
    if (!graficoDesde || !graficoHasta) return [];
    const desde = new Date(graficoDesde + 'T00:00:00');
    const hasta  = new Date(graficoHasta + 'T23:59:59');
    if (isNaN(desde) || isNaN(hasta) || desde > hasta) return [];

    const salidas = movs.filter(m => {
      if (m.TIPO !== 'SALIDA') return false;
      const d = new Date(m.FECHA_HORA);
      return !isNaN(d) && d >= desde && d <= hasta;
    });

    // Número de días en el rango
    const diffDias = Math.round((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDias <= 31) {
      // Agrupación diaria
      return Array.from({ length: diffDias }, (_, i) => {
        const d = new Date(desde);
        d.setDate(d.getDate() + i);
        const ymd = toYMD(d);
        const label = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
        const movDia = salidas.filter(m => toYMD(new Date(m.FECHA_HORA)) === ymd);
        return {
          label,
          value: movDia.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0),
          cant:  movDia.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0),
        };
      });
    } else {
      // Agrupación semanal
      const semanas = [];
      let cur = new Date(desde);
      while (cur <= hasta) {
        const start = new Date(cur);
        const end   = new Date(cur);
        end.setDate(end.getDate() + 6);
        if (end > hasta) end.setTime(hasta.getTime());
        const label = `${start.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`;
        const movSem = salidas.filter(m => {
          const d = new Date(m.FECHA_HORA);
          return !isNaN(d) && d >= start && d <= end;
        });
        semanas.push({
          label,
          value: movSem.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0),
          cant:  movSem.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0),
        });
        cur.setDate(cur.getDate() + 7);
      }
      return semanas;
    }
  }, [movs, graficoDesde, graficoHasta]);

  // Resumen del rango seleccionado
  const resumenRango = useMemo(() => {
    if (!datosGrafico.length) return null;
    const totalV = datosGrafico.reduce((s, d) => s + d.value, 0);
    const totalU = datosGrafico.reduce((s, d) => s + d.cant, 0);
    const desde = new Date(graficoDesde + 'T00:00:00');
    const hasta  = new Date(graficoHasta + 'T23:59:59');
    const salidaRango = movs.filter(m => {
      if (m.TIPO !== 'SALIDA') return false;
      const d = new Date(m.FECHA_HORA);
      return !isNaN(d) && d >= desde && d <= hasta;
    });
    const porMetodo = {};
    salidaRango.forEach(m => {
      const met = m.METODO_PAGO || m.metodoPago || 'efectivo';
      if (!porMetodo[met]) porMetodo[met] = 0;
      porMetodo[met] += Number(m.TOTAL) || 0;
    });
    return { totalV, totalU, porMetodo };
  }, [datosGrafico, movs, graficoDesde, graficoHasta]);

  // Reporte detallado por cada día del rango
  const reporteDias = useMemo(() => {
    if (!graficoDesde || !graficoHasta) return [];
    const desde = new Date(graficoDesde + 'T00:00:00');
    const hasta  = new Date(graficoHasta + 'T23:59:59');
    if (isNaN(desde) || isNaN(hasta) || desde > hasta) return [];
    const diffDias = Math.round((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
    // Solo mostrar a nivel diario si el rango es razonable (<= 31 días)
    if (diffDias > 31) return [];
    const salidas = movs.filter(m => {
      if (m.TIPO !== 'SALIDA') return false;
      const d = new Date(m.FECHA_HORA);
      return !isNaN(d) && d >= desde && d <= hasta;
    });
    return Array.from({ length: diffDias }, (_, i) => {
      const d = new Date(desde);
      d.setDate(d.getDate() + i);
      const ymd = toYMD(d);
      const label = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
      const labelCorto = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
      const esDiaHoy = toYMD(new Date()) === ymd;
      const movDia = salidas.filter(m => toYMD(new Date(m.FECHA_HORA)) === ymd);
      if (movDia.length === 0) return null;
      const totalDia  = movDia.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
      const cantDia   = movDia.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
      const clientesDia = {};
      movDia.forEach(m => {
        const c = m.CLIENTE || '—';
        if (!clientesDia[c]) clientesDia[c] = { cant: 0, total: 0, productos: {} };
        clientesDia[c].cant  += Number(m.CANTIDAD) || 0;
        clientesDia[c].total += Number(m.TOTAL) || 0;
        const prod = m.PRODUCTO || 'Otros';
        if (!clientesDia[c].productos[prod]) clientesDia[c].productos[prod] = 0;
        clientesDia[c].productos[prod] += Number(m.CANTIDAD) || 0;
      });
      const prodDia = {};
      movDia.forEach(m => {
        const p = m.PRODUCTO || 'Otros';
        if (!prodDia[p]) prodDia[p] = { cant: 0, total: 0 };
        prodDia[p].cant  += Number(m.CANTIDAD) || 0;
        prodDia[p].total += Number(m.TOTAL) || 0;
      });
      const metodoDia = {};
      movDia.forEach(m => {
        const met = m.METODO_PAGO || m.metodoPago || 'efectivo';
        if (!metodoDia[met]) metodoDia[met] = 0;
        metodoDia[met] += Number(m.TOTAL) || 0;
      });
      return { ymd, label, labelCorto, esDiaHoy, movDia, totalDia, cantDia, clientesDia, prodDia, metodoDia };
    }).filter(Boolean);
  }, [movs, graficoDesde, graficoHasta]);

  // Filtro de historial
  const historialFiltrado = useMemo(() => {
    return movs.filter(m => {
      if (filtroFechaMov) {
        const d = new Date(m.FECHA_HORA);
        if (!isNaN(d)) {
          if (toYMD(d) !== filtroFechaMov) return false;
        }
      }
      if (filtroProdMov && m.PRODUCTO !== filtroProdMov) return false;
      return true;
    });
  }, [movs, filtroFechaMov, filtroProdMov]);

  const resumenFiltro = useMemo(() => {
    if (!filtroFechaMov && !filtroProdMov) return null;
    const salidas = historialFiltrado.filter(m => m.TIPO === 'SALIDA');
    return {
      ventasTotal: salidas.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0),
      unidadesVendidas: salidas.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0),
      txsVentas: salidas.length,
    };
  }, [historialFiltrado, filtroFechaMov, filtroProdMov]);

  const totalItemActual = (+venta.cantidad || 0) * (+venta.precioUnit || 0);
  const totalCarrito    = carrito.reduce((s, i) => s + i.total, 0);

  const clisFiltrados = clientes.filter(c =>
    !searchCli || (c.NOMBRE && c.NOMBRE.toLowerCase().includes(searchCli.toLowerCase())));

  const cargaInicial = cargando && movs.length === 0;

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg,#030d1a 0%,#071428 50%,#040b18 100%)',
      color: '#f1f5f9',
      fontFamily: '"DM Sans",system-ui,sans-serif',
      paddingBottom: 86,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(148,163,184,0.4); }
        select option { background: #0f1e38; color: white; }
        input[type=number]::-webkit-inner-spin-button { display: none; }
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.7; }
        .hover-lift:hover { transform: translateY(-1px); opacity: 0.92; }
        .tab-btn { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .tab-btn:active { transform: scale(0.96); }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .card-enter { animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.6 } }
        .carrito-item { animation: fadeUp 0.2s ease both; }
        .water-fill { animation: fillWater 1.5s infinite alternate ease-in-out; transform-origin: bottom; }
        @keyframes fillWater { 0% { transform: translateY(24px); } 100% { transform: translateY(2px); } }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: 'rgba(3,14,30,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(56,189,248,0.1)',
        padding: '14px 20px',
        paddingTop: 'calc(max(14px, env(safe-area-inset-top)))',
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg,#0ea5e9,#0369a1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 0 20px rgba(14,165,233,0.4)',
        }}>💧</div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em', lineHeight: 1 }}>AguaControl</div>
          <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', marginTop: 2 }}>
            {tab === 'inicio'    && 'Resumen del día'}
            {tab === 'ventas'    && 'Registrar venta'}
            {tab === 'entradas'  && 'Ingreso de stock'}
            {tab === 'clientes'  && 'Directorio de clientes'}
            {tab === 'informes'  && 'Análisis y estadísticas'}
          </div>
        </div>
        <button onClick={cargar} className="hover-lift" style={{
          marginLeft: 'auto', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)',
          borderRadius: 10, padding: cargando ? '6px' : '7px 10px', color: '#38bdf8', cursor: 'pointer', fontSize: 15,
        }}>
          {cargando && !cargaInicial ? <LoaderGota size={22} showText={false} /> : '🔄'}
        </button>
      </header>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 99,
          background: toast.tipo === 'err' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)',
          color: 'white', padding: '12px 22px', borderRadius: 14, fontWeight: 700, fontSize: 14,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', animation: 'fadeUp 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <main style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>

        {cargaInicial ? (
          <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <LoaderGota size={80} showText={true} />
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════
                INICIO
            ═══════════════════════════════════════════════════════ */}
            {tab === 'inicio' && (
              <div className="card-enter">
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                      {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>Resumen de actividad de hoy</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(3,105,161,0.08))', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 18, padding: '16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>💰 Ventas hoy</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.03em' }}>{fmtCOP(metricas.ventasHoy)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>{metricas.salidaHoy.length} {metricas.salidaHoy.length === 1 ? 'venta' : 'ventas'} · {metricas.unidadesHoy} unidades</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(5,150,105,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>📦 Entradas hoy</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', letterSpacing: '-0.03em' }}>{metricas.unidadesEntHoy}</div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>{metricas.entradaHoy.length} {metricas.entradaHoy.length === 1 ? 'registro' : 'registros'} de stock</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Ventas — últimos 7 días</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>{fmtCOP(metricas.dias7.reduce((s, d) => s + d.value, 0))}</div>
                  </div>
                  <MiniBarChart data={metricas.dias7} color="#38bdf8" />
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>hace 6 días</span>
                    <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>hoy</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>🗂️ Stock actual</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {productos.filter(p => p.ID_PRODUCTO).map((p, i) => {
                      const stock = Number(p.STOCK_ACTUAL) || 0;
                      const cfg = PROD_CFG[p.NOMBRE_PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      const bajo = stock < 10;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: bajo ? 'rgba(239,68,68,0.08)' : `${cfg.glow || 'rgba(255,255,255,0.03)'}`, border: `1px solid ${bajo ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '10px 12px' }}>
                          <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                          <div>
                            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>{p.NOMBRE_PRODUCTO}</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: bajo ? '#f87171' : cfg.color, lineHeight: 1.1 }}>{stock}</div>
                          </div>
                          {bajo && <span style={{ marginLeft: 'auto', fontSize: 14 }}>⚠️</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {metricas.salidaHoy.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>⚡ Actividad de hoy</div>
                    {[...metricas.salidaHoy].reverse().map((m, i) => {
                      const cfg = PROD_CFG[m.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < metricas.salidaHoy.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cfg.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.CLIENTE}</div>
                            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{m.PRODUCTO} × {m.CANTIDAD}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#34d399' }}>{fmtCOP(m.TOTAL)}</div>
                            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{fmtHora(m.FECHA_HORA)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {metricas.salidaHoy.length === 0 && !cargando && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18 }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🌊</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>¡Listo para empezar!</div>
                    <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>Aún no hay ventas registradas hoy</div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                VENTAS
            ═══════════════════════════════════════════════════════ */}
            {tab === 'ventas' && (
              <div className="card-enter">
                <form onSubmit={submitVenta}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
                    {/* Cliente */}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>👤 Cliente</label>
                      <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: 'white', width: '100%', outline: 'none', fontSize: 15, fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                        type="text" list="lista-clientes" placeholder="Escribe el nombre del cliente..." value={venta.cliente}
                        onChange={e => setVenta(v => ({ ...v, cliente: e.target.value }))}
                        onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      <datalist id="lista-clientes">
                        {clientes.map((c, i) => c.NOMBRE && <option key={i} value={c.NOMBRE} />)}
                      </datalist>
                    </div>

                    {/* Producto */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>🫧 Producto</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {PRODUCTOS.map(prod => {
                          const cfg = PROD_CFG[prod];
                          const stockItem = productos.find(p => p.NOMBRE_PRODUCTO === prod);
                          const stock = Number(stockItem?.STOCK_ACTUAL) || 0;
                          const selected = venta.producto === prod;
                          return (
                            <button key={prod} type="button" onClick={() => setVenta(v => ({ ...v, producto: prod }))}
                              style={{ background: selected ? `${cfg.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '10px 12px', color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: 'inherit' }}>
                              <div style={{ fontSize: 20, marginBottom: 4 }}>{cfg.emoji}</div>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>{prod}</div>
                              <div style={{ fontSize: 10, color: stock < 10 ? '#f87171' : 'rgba(148,163,184,0.6)', marginTop: 2 }}>Stock: {stock} {stock < 10 ? '⚠️' : ''}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cantidad y precio */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cantidad</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: 'white', width: '100%', outline: 'none', fontSize: 22, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center', transition: 'border-color 0.2s' }}
                          type="number" min="1" placeholder="0" value={venta.cantidad}
                          onChange={e => setVenta(v => ({ ...v, cantidad: e.target.value }))}
                          onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Precio unitario</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: 'white', width: '100%', outline: 'none', fontSize: 18, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center', transition: 'border-color 0.2s' }}
                          type="number" min="0" placeholder="$ 0" value={venta.precioUnit}
                          onChange={e => setVenta(v => ({ ...v, precioUnit: e.target.value }))}
                          onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                    </div>

                    {totalItemActual > 0 && (
                      <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'rgba(186,230,253,0.7)', fontWeight: 700 }}>Este ítem</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#67e8f9', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(totalItemActual)}</span>
                      </div>
                    )}

                    <button type="button" onClick={agregarAlCarrito} className="hover-lift" style={{ background: 'rgba(56,189,248,0.12)', border: '1.5px dashed rgba(56,189,248,0.4)', borderRadius: 12, padding: '13px 20px', color: '#38bdf8', fontWeight: 800, width: '100%', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', letterSpacing: '0.01em' }}>
                      + Agregar al carrito
                    </button>
                  </div>

                  {carrito.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 20, padding: 18, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>🛒 Carrito</div>
                        <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>
                          {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
                          {venta.cliente && <span style={{ color: '#38bdf8' }}> · {venta.cliente}</span>}
                        </div>
                      </div>

                      {carrito.map((item, idx) => {
                        const cfg = PROD_CFG[item.producto] || { emoji: '📦', color: '#94a3b8' };
                        return (
                          <div key={idx} className="carrito-item" style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${cfg.color}0d`, border: `1px solid ${cfg.color}25`, borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                            <span style={{ fontSize: 22, flexShrink: 0 }}>{cfg.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{item.producto}</div>
                              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{item.cantidad} × {fmtCOP(item.precioUnit)}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontWeight: 900, fontSize: 15, color: cfg.color, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(item.total)}</div>
                            </div>
                            <button type="button" onClick={() => quitarDelCarrito(idx)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, width: 28, height: 28, color: '#f87171', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>✕</button>
                          </div>
                        );
                      })}

                      {/* Método de pago */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 10, paddingTop: 14 }}>
                        <MetodoPagoSelector value={venta.metodoPago} onChange={v => setVenta(prev => ({ ...prev, metodoPago: v }))} />
                      </div>

                      <div style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.15),rgba(3,105,161,0.1))', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, padding: '14px 18px', marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(186,230,253,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total a cobrar</div>
                          <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{carrito.reduce((s, i) => s + i.cantidad, 0)} unidades</div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#67e8f9', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(totalCarrito)}</div>
                      </div>

                      <button type="submit" disabled={guardando || !venta.cliente} className="hover-lift" style={{ background: guardando || !venta.cliente ? 'rgba(56,189,248,0.2)' : 'linear-gradient(135deg,#0ea5e9,#0369a1)', border: 'none', borderRadius: 14, padding: '15px 20px', color: 'white', fontWeight: 800, width: '100%', cursor: guardando || !venta.cliente ? 'not-allowed' : 'pointer', fontSize: 16, fontFamily: 'inherit', letterSpacing: '0.01em', marginTop: 12, boxShadow: guardando || !venta.cliente ? 'none' : '0 4px 24px rgba(14,165,233,0.35)' }}>
                        {guardando ? '⏳ Procesando...' : !venta.cliente ? 'Escribe el cliente arriba ↑' : `✓ Confirmar Venta · ${fmtCOP(totalCarrito)}`}
                      </button>
                    </div>
                  )}
                </form>

                {metricas.salidas.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Últimas ventas</div>
                    {metricas.salidas.slice(-6).reverse().map((m, i) => {
                      const cfg = PROD_CFG[m.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.CLIENTE}</div>
                            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {m.PRODUCTO} × {m.CANTIDAD} · {fmtFechaCompleta(m.FECHA_HORA)}
                              {(m.METODO_PAGO || m.metodoPago) && <MetodoChip metodo={m.METODO_PAGO || m.metodoPago} />}
                            </div>
                          </div>
                          <div style={{ fontWeight: 900, color: '#34d399', fontSize: 15, fontFamily: '"DM Mono",monospace', flexShrink: 0 }}>{fmtCOP(m.TOTAL)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ENTRADAS DE STOCK (COMPRAS)
            ═══════════════════════════════════════════════════════ */}
            {tab === 'entradas' && (
              <div className="card-enter">
                <form onSubmit={submitEntrada}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
                    <div style={{ marginBottom: 6, fontSize: 13, color: 'rgba(167,243,208,0.7)', textAlign: 'center' }}>Registra unidades y costo de compra al proveedor</div>

                    {/* Producto */}
                    <div style={{ marginBottom: 20, marginTop: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>📦 Producto</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {PRODUCTOS.map(prod => {
                          const cfg = PROD_CFG[prod];
                          const stockItem = productos.find(p => p.NOMBRE_PRODUCTO === prod);
                          const stock = Number(stockItem?.STOCK_ACTUAL) || 0;
                          const selected = entrada.producto === prod;
                          return (
                            <button key={prod} type="button" onClick={() => setEntrada({ ...entrada, producto: prod })}
                              style={{ background: selected ? `${cfg.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '12px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: 'inherit' }}>
                              <div style={{ fontSize: 22, marginBottom: 6 }}>{cfg.emoji}</div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{prod}</div>
                              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>Stock actual: <strong style={{ color: cfg.color }}>{stock}</strong></div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cantidad + Precio */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cantidad</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', color: 'white', width: '100%', outline: 'none', fontSize: 26, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center', transition: 'border-color 0.2s' }}
                          type="number" min="1" required placeholder="0" value={entrada.cantidad}
                          onChange={e => setEntrada({ ...entrada, cantidad: e.target.value })}
                          onFocus={e => e.target.style.borderColor = 'rgba(52,211,153,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Costo total</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', color: 'white', width: '100%', outline: 'none', fontSize: 18, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center', transition: 'border-color 0.2s' }}
                          type="number" min="0" placeholder="$ 0" value={entrada.precio}
                          onChange={e => setEntrada({ ...entrada, precio: e.target.value })}
                          onFocus={e => e.target.style.borderColor = 'rgba(52,211,153,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 12 }}>
                      <MetodoPagoSelector value={entrada.metodoPago} onChange={v => setEntrada(prev => ({ ...prev, metodoPago: v }))} />
                    </div>

                    {entrada.producto && entrada.cantidad && (
                      <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(167,243,208,0.7)', fontWeight: 700 }}>SE AGREGARÁN AL STOCK</div>
                          <div style={{ fontSize: 13, color: 'rgba(167,243,208,0.9)', marginTop: 2 }}>{entrada.producto}</div>
                          {entrada.precio && <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>Costo: {fmtCOP(entrada.precio)}</div>}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>+{entrada.cantidad}</div>
                      </div>
                    )}

                    <button type="submit" disabled={guardando} className="hover-lift" style={{ background: guardando ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#34d399,#059669)', border: 'none', borderRadius: 14, padding: '15px 20px', color: 'white', fontWeight: 800, width: '100%', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: 16, fontFamily: 'inherit', letterSpacing: '0.01em', boxShadow: guardando ? 'none' : '0 4px 24px rgba(52,211,153,0.3)' }}>
                      {guardando ? '⏳ Guardando...' : '+ Registrar Compra / Entrada de Stock'}
                    </button>
                  </div>
                </form>

                {metricas.entradas.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Últimas entradas</div>
                    {metricas.entradas.slice(-6).reverse().map((m, i) => {
                      const cfg = PROD_CFG[m.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.emoji}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.PRODUCTO}</div>
                            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {fmtFechaCompleta(m.FECHA_HORA)}
                              {(m.METODO_PAGO || m.metodoPago) && <MetodoChip metodo={m.METODO_PAGO || m.metodoPago} />}
                            </div>
                            {Number(m.TOTAL) > 0 && <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 1 }}>Costo: {fmtCOP(m.TOTAL)}</div>}
                          </div>
                          <div style={{ fontWeight: 900, color: '#34d399', fontSize: 18, fontFamily: '"DM Mono",monospace' }}>+{m.CANTIDAD}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                CLIENTES
            ═══════════════════════════════════════════════════════ */}
            {tab === 'clientes' && (
              <div className="card-enter">
                {!showAddCli && (
                  <button onClick={() => { setEditCli(null); setNewCli({ nombre: '', telefono: '', direccion: '' }); setShowAddCli(true); }} className="hover-lift" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', border: 'none', borderRadius: 14, padding: '14px 20px', color: 'white', fontWeight: 800, width: '100%', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', marginBottom: 16, letterSpacing: '0.01em', boxShadow: '0 4px 24px rgba(124,58,237,0.35)' }}>
                    + Agregar Nuevo Cliente
                  </button>
                )}
                {showAddCli && (
                  <form onSubmit={submitCliente}>
                    <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: '#c4b5fd' }}>{editCli ? '✏️ Editar cliente' : '👤 Nuevo cliente'}</div>
                      {[
                        { key: 'nombre', label: 'Nombre completo', placeholder: 'Ej: María García', type: 'text', required: true },
                        { key: 'telefono', label: 'Teléfono', placeholder: 'Ej: 3001234567', type: 'tel', required: false },
                        { key: 'direccion', label: 'Dirección', placeholder: 'Calle 15 # 8-22, Barrio El Centro', type: 'text', required: false },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(196,181,253,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>{f.label}</label>
                          <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '12px 14px', color: 'white', width: '100%', outline: 'none', fontSize: 14, fontFamily: 'inherit' }}
                            type={f.type} required={f.required} placeholder={f.placeholder} value={newCli[f.key]}
                            onChange={e => setNewCli({ ...newCli, [f.key]: e.target.value })} />
                        </div>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                        <button type="button" onClick={cancelarEdicionCliente} style={{ background: 'rgba(100,116,139,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px', color: 'rgba(148,163,184,0.9)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                        <button type="submit" disabled={guardando} style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', border: 'none', borderRadius: 12, padding: '13px', color: 'white', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>{guardando ? '⏳...' : '✓ Guardar'}</button>
                      </div>
                    </div>
                  </form>
                )}
                <div style={{ marginBottom: 14 }}>
                  <input style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', color: 'white', width: '100%', outline: 'none', fontSize: 14, fontFamily: 'inherit' }}
                    placeholder="🔍 Buscar cliente por nombre..." value={searchCli} onChange={e => setSearchCli(e.target.value)} />
                </div>
                {clisFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 50, opacity: 0.5 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                    <div>No hay clientes registrados</div>
                  </div>
                ) : clisFiltrados.map((c, i) => {
                  const comprasCli = metricas.salidas.filter(m => m.CLIENTE === c.NOMBRE);
                  const totalCli   = comprasCli.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
                  const ultimaVenta = comprasCli[comprasCli.length - 1];
                  return (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 18px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{c.NOMBRE}</div>
                          {c.TELEFONO && <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginBottom: 2 }}>📞 {c.TELEFONO}</div>}
                          {c.DIRECCION && <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {c.DIRECCION}</div>}
                          {ultimaVenta && <div style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)' }}>Última compra: {fmtFechaCorta(ultimaVenta.FECHA_HORA)}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#67e8f9', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(totalCli)}</div>
                          <div style={{ fontSize: 11, color: 'rgba(100,116,139,0.8)', marginTop: 2 }}>{comprasCli.length} pedidos</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => iniciarEdicionCliente(c)} style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: 1 }}>✏️ Editar</button>
                        <button onClick={() => eliminarCliente(c.ID_CLIENTE)} style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: 1 }}>🗑️ Eliminar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                INFORMES
            ═══════════════════════════════════════════════════════ */}
            {tab === 'informes' && (
              <div className="card-enter">

                {/* KPIs globales */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(3,105,161,0.08))', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 18, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(56,189,248,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Total ventas</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(metricas.totalVentas)}</div>
                    <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 4 }}>{metricas.salidas.length} transacciones</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(5,150,105,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Hoy</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(metricas.ventasHoy)}</div>
                    <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 4 }}>{metricas.salidaHoy.length} ventas · {metricas.unidadesHoy} uds.</div>
                  </div>
                </div>

                {/* ── GRÁFICO POR RANGO DE FECHA ────────────────── */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 18, padding: 18, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📈 Ventas por período</div>

                  {/* Selector de rango */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
                      <input type="date" value={graficoDesde} onChange={e => setGraficoDesde(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '8px 10px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
                      <input type="date" value={graficoHasta} onChange={e => setGraficoHasta(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '8px 10px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  </div>

                  {/* Accesos rápidos */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Hoy', desde: hoy, hasta: hoy },
                      { label: '7 días', desde: toYMD(new Date(Date.now() - 6*24*60*60*1000)), hasta: hoy },
                      { label: '30 días', desde: toYMD(new Date(Date.now() - 29*24*60*60*1000)), hasta: hoy },
                      { label: 'Mes actual', desde: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), hasta: hoy },
                    ].map(r => {
                      const activo = graficoDesde === r.desde && graficoHasta === r.hasta;
                      return (
                        <button key={r.label} type="button"
                          onClick={() => { setGraficoDesde(r.desde); setGraficoHasta(r.hasta); }}
                          style={{ background: activo ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${activo ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '5px 10px', color: activo ? '#38bdf8' : 'rgba(148,163,184,0.8)', cursor: 'pointer', fontSize: 12, fontWeight: activo ? 800 : 600, fontFamily: 'inherit' }}>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumen del rango */}
                  {resumenRango && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Total recaudado</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(resumenRango.totalV)}</div>
                      </div>
                      <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Unidades vendidas</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{resumenRango.totalU}</div>
                      </div>
                    </div>
                  )}

                  {/* Gráfico de barras */}
                  {datosGrafico.length > 0 ? (
                    <>
                      <MiniBarChart data={datosGrafico} color="#0ea5e9" />
                      {/* Valor de cada barra */}
                      <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: `repeat(${datosGrafico.length},1fr)`, gap: 0 }}>
                        {datosGrafico.map((d, i) => (
                          <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: i === datosGrafico.length - 1 ? '#38bdf8' : 'rgba(148,163,184,0.5)', fontWeight: i === datosGrafico.length - 1 ? 800 : 500 }}>
                              {d.cant > 0 ? d.cant : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(100,116,139,0.6)', textAlign: 'center', marginTop: 4 }}>unidades vendidas por período</div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.4, fontSize: 13 }}>Sin datos en el rango seleccionado</div>
                  )}

                  {/* Desglose por método de pago en el rango */}
                  {resumenRango && Object.keys(resumenRango.porMetodo).length > 0 && (
                    <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>💳 Por método de pago</div>
                      {Object.entries(resumenRango.porMetodo)
                        .sort((a, b) => b[1] - a[1])
                        .map(([met, total], i) => {
                          const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
                          const maxV = Math.max(...Object.values(resumenRango.porMetodo), 1);
                          const pct = (total / maxV) * 100;
                          return (
                            <div key={i} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{m.emoji} {m.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(total)}</span>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#a78bfa)', borderRadius: 6, transition: 'width 1s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* ── DESGLOSE DETALLADO POR DÍA ────────────────── */}
                {reporteDias.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 2 }}>
                      🗓️ Detalle por día — {reporteDias.length} {reporteDias.length === 1 ? 'día con ventas' : 'días con ventas'}
                    </div>
                    {[...reporteDias].reverse().map((dia) => (
                      <ResumenDiaCard key={dia.ymd} dia={dia} />
                    ))}
                  </div>
                )}

                {/* Por producto */}
                {Object.keys(metricas.porProducto).length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20, marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>📦 Por producto</div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
                      <DonutChart size={110} items={PRODUCTOS.filter(p => metricas.porProducto[p]).map(p => ({ label: p, value: metricas.porProducto[p]?.cant || 0, color: PROD_CFG[p]?.color || '#94a3b8' }))} />
                      <div style={{ flex: 1, minWidth: 140 }}>
                        {PRODUCTOS.filter(p => metricas.porProducto[p]).map((prod, i) => {
                          const datos = metricas.porProducto[prod];
                          const cfg = PROD_CFG[prod];
                          const totalAll = Object.values(metricas.porProducto).reduce((s, v) => s + v.cant, 0);
                          const pct = totalAll > 0 ? Math.round((datos.cant / totalAll) * 100) : 0;
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.color, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{prod}</div>
                                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>{datos.cant} und · {pct}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {(() => {
                      const maxT = Math.max(...Object.values(metricas.porProducto).map(v => v.total), 1);
                      return PRODUCTOS.filter(p => metricas.porProducto[p]).map((prod, i) => {
                        const datos = metricas.porProducto[prod];
                        const cfg = PROD_CFG[prod];
                        const pct = (datos.total / maxT) * 100;
                        return (
                          <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{cfg.emoji} {prod}</span>
                              <span style={{ fontSize: 13, fontWeight: 900, color: cfg.color, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(datos.total)}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 6, transition: 'width 1s ease' }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Top 5 clientes */}
                {Object.keys(metricas.porCliente).length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20, marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>⭐ Top 5 clientes</div>
                    {Object.entries(metricas.porCliente).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([cli, datos], i) => {
                      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
                      const maxT = Math.max(...Object.values(metricas.porCliente).map(v => v.total), 1);
                      const pct = (datos.total / maxT) * 100;
                      return (
                        <div key={i} style={{ marginBottom: i < 4 ? 14 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{medals[i]}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{cli}</div>
                                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>{datos.cant} unidades · {metricas.salidas.filter(m => m.CLIENTE === cli).length} pedidos</div>
                              </div>
                            </div>
                            <div style={{ fontWeight: 900, color: '#67e8f9', fontSize: 14, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(datos.total)}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 5, height: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)', borderRadius: 5, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Historial con filtros */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📋 Historial Completo</div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', marginBottom: 4 }}>Fecha Exacta</label>
                      <input type="date" value={filtroFechaMov} onChange={(e) => setFiltroFechaMov(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', marginBottom: 4 }}>Producto</label>
                      <select value={filtroProdMov} onChange={(e) => setFiltroProdMov(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'inherit', appearance: 'none' }}>
                        <option value="">Todos los prod.</option>
                        {PRODUCTOS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    {(filtroFechaMov || filtroProdMov) && (
                      <button onClick={() => { setFiltroFechaMov(''); setFiltroProdMov(''); }}
                        style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#fca5a5', borderRadius: 8, padding: '0 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 18 }}>
                        X
                      </button>
                    )}
                  </div>

                  {resumenFiltro && historialFiltrado.length > 0 && (
                    <div style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.1),rgba(3,105,161,0.05))', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#7dd3fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Resumen Búsqueda</div>
                        <div style={{ fontSize: 12, color: 'rgba(186,230,253,0.8)' }}>
                          {resumenFiltro.txsVentas} ventas · {resumenFiltro.unidadesVendidas} uds.
                        </div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>
                        {fmtCOP(resumenFiltro.ventasTotal)}
                      </div>
                    </div>
                  )}

                  {historialFiltrado.length > 0 ? (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ color: 'rgba(148,163,184,0.6)' }}>
                            {['Fecha', 'Tipo', 'Producto', 'Cliente', 'Cant.', 'Total', 'Pago'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...historialFiltrado].reverse().map((m, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px', color: 'rgba(148,163,184,0.7)', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtFechaCompleta(m.FECHA_HORA)}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ background: m.TIPO === 'SALIDA' ? 'rgba(249,115,22,0.15)' : 'rgba(52,211,153,0.15)', color: m.TIPO === 'SALIDA' ? '#fb923c' : '#34d399', border: `1px solid ${m.TIPO === 'SALIDA' ? 'rgba(249,115,22,0.3)' : 'rgba(52,211,153,0.3)'}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  {m.TIPO === 'SALIDA' ? '↑ SALIDA' : '↓ ENTRADA'}
                                </span>
                              </td>
                              <td style={{ padding: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.PRODUCTO}</td>
                              <td style={{ padding: '8px', color: 'rgba(148,163,184,0.7)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.CLIENTE || '—'}</td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, fontFamily: '"DM Mono",monospace' }}>{m.CANTIDAD}</td>
                              <td style={{ padding: '8px', fontWeight: 800, color: m.TIPO === 'SALIDA' ? '#67e8f9' : '#6ee7b7', whiteSpace: 'nowrap', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(m.TOTAL)}</td>
                              <td style={{ padding: '8px' }}>
                                {(m.METODO_PAGO || m.metodoPago)
                                  ? <MetodoChip metodo={m.METODO_PAGO || m.metodoPago} />
                                  : <span style={{ color: 'rgba(148,163,184,0.3)', fontSize: 10 }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13 }}>
                      No se encontraron movimientos con estos filtros.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── NAVEGACIÓN INFERIOR ── */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: 'rgba(3,14,30,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', zIndex: 40, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const badge = t.id === 'ventas' && carrito.length > 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px 9px', background: active ? 'rgba(14,165,233,0.08)' : 'transparent', border: 'none', borderTop: active ? '2px solid #0ea5e9' : '2px solid transparent', color: active ? '#38bdf8' : 'rgba(100,116,139,0.8)', cursor: 'pointer', fontSize: 10, fontWeight: active ? 800 : 500, gap: 3, fontFamily: 'inherit', letterSpacing: active ? '0.02em' : '0' }}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontSize: 20, filter: active ? 'drop-shadow(0 0 6px rgba(56,189,248,0.6))' : 'none', transition: 'filter 0.2s' }}>{t.emoji}</span>
                {badge && (
                  <span style={{ position: 'absolute', top: -4, right: -6, background: '#0ea5e9', color: 'white', borderRadius: 10, fontSize: 9, fontWeight: 900, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>
                    {carrito.length}
                  </span>
                )}
              </span>
              <span style={{ transition: 'color 0.2s' }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}