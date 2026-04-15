'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbyGqQr5dIPVdGO06ZJbLyFSJNoIUefntdTVNNEHhdkoKeD89WaT2kPaF_0ysWbnUGtDxQ/exec";

const PRODUCTOS = ['Botellones', 'Bolsas', 'Dispensadores', 'Botellas 6L'];

const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { id: 'nequi', label: 'Nequi', emoji: '🟣' },
  { id: 'nu', label: 'Nu', emoji: '🟪' },
  { id: 'daviplata', label: 'Daviplata', emoji: '🔴' },
  { id: 'llave', label: 'Llave', emoji: '🔑' },
];

const PROD_CFG = {
  'Botellones': { emoji: '🫧', color: '#38bdf8', glow: '#0ea5e933', icon: '💧' },
  'Bolsas': { emoji: '💧', color: '#34d399', glow: '#10b98133', icon: '💧' },
  'Dispensadores': { emoji: '⚙️', color: '#a78bfa', glow: '#8b5cf633', icon: '⚙️' },
  'Botellas 6L': { emoji: '🍶', color: '#fb923c', glow: '#f9731633', icon: '🍶' },
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

const toYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const TABS = [
  { id: 'inicio', emoji: '🏠', label: 'Inicio' },
  { id: 'ventas', emoji: '💰', label: 'Ventas' },
  { id: 'entradas', emoji: '📦', label: 'Stock' },
  { id: 'clientes', emoji: '👥', label: 'Clientes' },
  { id: 'informes', emoji: '📊', label: 'Informes' },
];

/* ─── Mini bar chart — optimizado para móvil ─────────────── */
function MiniBarChart({ data, color, height = 90, showValues = false }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const showAll = data.length <= 14;

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: data.length > 20 ? 2 : data.length > 10 ? 3 : 5, height }}>
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * (height - 28), d.value > 0 ? 5 : 0);
          const isLast = i === data.length - 1;
          const isToday = isLast;
          const isActive = tooltip === i;
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, cursor: 'pointer', minWidth: 0 }}
              onTouchStart={() => setTooltip(i)}
              onTouchEnd={() => setTimeout(() => setTooltip(null), 1200)}
              onMouseEnter={() => setTooltip(i)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Valor encima de la barra */}
              {(showValues || isActive) && d.value > 0 && (
                <div style={{
                  fontSize: data.length > 14 ? 8 : 10,
                  fontWeight: 800,
                  color: isLast ? color : `${color}bb`,
                  marginBottom: 3,
                  whiteSpace: 'nowrap',
                  fontFamily: '"DM Mono",monospace',
                  opacity: isActive || isLast ? 1 : 0.7,
                  transition: 'opacity 0.2s',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}>
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
                </div>
              )}
              {/* Tooltip popup al tocar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: height + 6,
                  background: 'rgba(3,14,30,0.97)',
                  border: `1px solid ${color}44`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  zIndex: 10,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.7)', marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(d.value)}</div>
                  {d.cant > 0 && <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 1 }}>{d.cant} unidades</div>}
                </div>
              )}
              {/* Barra */}
              <div style={{
                width: '100%',
                height: `${barH}px`,
                background: isLast
                  ? `linear-gradient(180deg, ${color}, ${color}99)`
                  : isActive
                    ? `${color}88`
                    : `${color}44`,
                borderRadius: '5px 5px 0 0',
                transition: 'height 0.6s cubic-bezier(.4,0,.2,1), background 0.2s',
                minHeight: d.value > 0 ? 5 : 0,
                boxShadow: isLast ? `0 0 12px ${color}44` : 'none',
                position: 'relative',
              }} />
              {/* Label fecha */}
              {showAll && (
                <div style={{
                  fontSize: data.length > 14 ? 8 : data.length > 7 ? 9 : 10,
                  color: isLast ? color : 'rgba(148,163,184,0.55)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  marginTop: 5,
                  fontWeight: isLast ? 800 : 500,
                  overflow: 'hidden',
                  maxWidth: '100%',
                  textOverflow: 'ellipsis',
                }}>
                  {d.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Eje X con etiquetas si hay muchos puntos */}
      {!showAll && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{data[0]?.label}</span>
          <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Donut chart — optimizado para móvil ────────────────── */
function DonutChart({ items, size = 130 }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', opacity: 0.4, fontSize: 13 }}>Sin datos</div>;
  const cx = size / 2, cy = size / 2, r = size * 0.40, innerR = size * 0.28;
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
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.92} />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize={size * 0.14} fontWeight="900">{items.length}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize={size * 0.095}>productos</text>
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
                borderRadius: 10, padding: '8px 13px', color: sel ? '#38bdf8' : 'rgba(148,163,184,0.8)',
                cursor: 'pointer', fontSize: 13, fontWeight: sel ? 800 : 600,
                fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 5,
                minHeight: 44,
              }}>
              <span style={{ fontSize: 16 }}>{m.emoji}</span>
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
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#7dd3fc',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {m.emoji} {m.label}
    </span>
  );
}

/* ─── Autocomplete de clientes ───────────────────────────── */
function AutocompleteCliente({ value, onChange, clientes }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [activo, setActivo] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const filtrados = clientes.filter(c =>
    c.NOMBRE && (!query.trim() || c.NOMBRE.toLowerCase().includes(query.toLowerCase().trim()))
  ).slice(0, 20);

  const seleccionar = (nombre) => {
    setQuery(nombre);
    onChange(nombre);
    setOpen(false);
    setActivo(-1);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
    setActivo(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo(a => Math.min(a + 1, filtrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo(a => Math.max(a - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activo >= 0 && filtrados[activo]) seleccionar(filtrados[activo].NOMBRE);
      else setOpen(false);
    }
    else if (e.key === 'Escape') { setOpen(false); setActivo(-1); }
  };

  useEffect(() => {
    if (activo >= 0 && listRef.current) {
      const item = listRef.current.children[activo];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [activo]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder="Toca para ver clientes o escribe para filtrar..."
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: open ? '1.5px solid rgba(56,189,248,0.6)' : '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '13px 44px 13px 14px',
            color: 'white', width: '100%', outline: 'none',
            fontSize: 16, fontFamily: 'inherit', transition: 'border-color 0.2s',
            boxShadow: open ? '0 0 0 3px rgba(56,189,248,0.08)' : 'none',
            minHeight: 50,
          }}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); seleccionar(''); setQuery(''); inputRef.current?.focus(); }}
            style={{
              position: 'absolute', right: 12, background: 'rgba(148,163,184,0.2)',
              border: 'none', borderRadius: 8, width: 28, height: 28,
              color: 'rgba(148,163,184,0.8)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
        )}
      </div>

      {open && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
            background: 'linear-gradient(180deg,#0d1f3c,#091829)',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: 14, maxHeight: 260, overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
          {filtrados.length === 0 ? (
            <div style={{ padding: '16px', fontSize: 13, color: 'rgba(148,163,184,0.5)', textAlign: 'center' }}>
              {query ? `Sin resultados para "${query}"` : 'No hay clientes guardados'}
            </div>
          ) : (
            filtrados.map((c, i) => {
              const isActive = i === activo;
              return (
                <div
                  key={c.ID_CLIENTE || i}
                  onMouseDown={(e) => { e.preventDefault(); seleccionar(c.NOMBRE); }}
                  style={{
                    padding: '13px 16px',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(56,189,248,0.12)' : 'transparent',
                    borderBottom: i < filtrados.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background 0.12s',
                    minHeight: 52,
                  }}
                  onMouseEnter={() => setActivo(i)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isActive ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isActive ? '#38bdf8' : 'white' }}>
                      {c.NOMBRE}
                    </div>
                    {(c.TELEFONO || c.DIRECCION) && (
                      <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.TELEFONO && `📞 ${c.TELEFONO}`}{c.TELEFONO && c.DIRECCION && ' · '}{c.DIRECCION && `📍 ${c.DIRECCION}`}
                      </div>
                    )}
                  </div>
                  {isActive && <div style={{ fontSize: 12, color: '#38bdf8', flexShrink: 0 }}>↵</div>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tarjeta de resumen diario (colapsable) ─────────────── */
function ResumenDiaCard({ dia }) {
  const [open, setOpen] = useState(false);

  const metodosPresentes = Object.entries(dia.metodoDia).sort((a, b) => b[1] - a[1]);
  const clientesPresentes = Object.entries(dia.clientesDia).sort((a, b) => b[1].total - a[1].total);
  const prodPresentes = Object.entries(dia.prodDia).sort((a, b) => b[1].total - a[1].total);

  return (
    <div style={{
      borderRadius: 16, marginBottom: 10, overflow: 'hidden',
      border: dia.esDiaHoy ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.07)',
      background: dia.esDiaHoy ? 'linear-gradient(135deg,rgba(14,165,233,0.1),rgba(3,105,161,0.05))' : 'rgba(255,255,255,0.03)',
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', color: 'white',
          padding: '16px 16px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 12, minHeight: 72,
        }}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 800, fontSize: 15, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dia.label}
            {dia.esDiaHoy && (
              <span style={{ background: '#0ea5e9', color: 'white', borderRadius: 6, fontSize: 9, fontWeight: 900, padding: '2px 7px', textTransform: 'uppercase' }}>Hoy</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span>{dia.movDia.length} venta{dia.movDia.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{dia.cantDia} uds.</span>
            <span>·</span>
            <span>{Object.keys(dia.clientesDia).length} cliente{Object.keys(dia.clientesDia).length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: dia.esDiaHoy ? '#38bdf8' : '#67e8f9', fontFamily: '"DM Mono",monospace' }}>
            {fmtCOP(dia.totalDia)}
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 5, flexWrap: 'wrap' }}>
            {metodosPresentes.map(([met]) => {
              const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
              return <span key={met} style={{ fontSize: 14 }} title={m.label}>{m.emoji}</span>;
            })}
          </div>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', marginLeft: 4 }}>▼</div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>📦 Productos vendidos</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {prodPresentes.map(([prod, datos]) => {
                const cfg = PROD_CFG[prod] || { emoji: '📦', color: '#94a3b8' };
                return (
                  <div key={prod} style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, borderRadius: 12, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{prod}</div>
                      <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{datos.cant} uds · {fmtCOP(datos.total)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {metodosPresentes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>💳 Cómo pagaron</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {metodosPresentes.map(([met, total]) => {
                  const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
                  const pct = Math.round((total / dia.totalDia) * 100);
                  return (
                    <div key={met} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 17 }}>{m.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(total)} <span style={{ color: 'rgba(148,163,184,0.5)' }}>({pct}%)</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>👥 Clientes ({clientesPresentes.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {clientesPresentes.map(([cli, datos], ci) => {
                const ventas = dia.movDia.filter(m => (m.CLIENTE || '—') === cli);
                const metCli = {};
                ventas.forEach(m => {
                  const met = m.METODO_PAGO || m.metodoPago || 'efectivo';
                  if (!metCli[met]) metCli[met] = 0;
                  metCli[met] += Number(m.TOTAL) || 0;
                });
                return (
                  <div key={ci} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cli}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {Object.entries(datos.productos).map(([prod, cant]) => {
                            const cfg = PROD_CFG[prod] || { emoji: '📦', color: '#94a3b8' };
                            return (
                              <span key={prod} style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                {cfg.emoji} {cant} {prod}
                              </span>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                          {Object.entries(metCli).map(([met, tot]) => {
                            const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
                            return (
                              <span key={met} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: '#7dd3fc', fontWeight: 700 }}>
                                {m.emoji} {m.label} · {fmtCOP(tot)}
                              </span>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {ventas.map((v, vi) => {
                            const cfg = PROD_CFG[v.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                            return (
                              <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>
                                <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                                <span>{v.PRODUCTO} × {v.CANTIDAD}</span>
                                <span style={{ color: '#67e8f9', fontWeight: 700, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(v.TOTAL)}</span>
                                <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{fmtHora(v.FECHA_HORA)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: 14, textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(datos.total)}</div>
                        <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{datos.cant} uds</div>
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

/* ─── Tarjeta de movimiento (reemplaza fila de tabla) ────── */
function MovCard({ m }) {
  const cfg = PROD_CFG[m.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
  const esSalida = m.TIPO === 'SALIDA';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${esSalida ? 'rgba(249,115,22,0.12)' : 'rgba(52,211,153,0.12)'}`,
      borderRadius: 14,
      padding: '13px 14px',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Icono */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${cfg.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{cfg.emoji}</div>

      {/* Info central */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            background: esSalida ? 'rgba(249,115,22,0.15)' : 'rgba(52,211,153,0.15)',
            color: esSalida ? '#fb923c' : '#34d399',
            border: `1px solid ${esSalida ? 'rgba(249,115,22,0.3)' : 'rgba(52,211,153,0.3)'}`,
            borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 800,
          }}>
            {esSalida ? '↑ VENTA' : '↓ ENTRADA'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{m.PRODUCTO}</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.CLIENTE || '—'} · ×{m.CANTIDAD}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)' }}>{fmtFechaCompleta(m.FECHA_HORA)}</span>
          {(m.METODO_PAGO || m.metodoPago) && <MetodoChip metodo={m.METODO_PAGO || m.metodoPago} />}
        </div>
      </div>

      {/* Total */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: esSalida ? '#67e8f9' : '#6ee7b7', fontFamily: '"DM Mono",monospace' }}>
          {fmtCOP(m.TOTAL)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function Home() {
  const [tab, setTab] = useState('inicio');
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [movs, setMovs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAddCli, setShowAddCli] = useState(false);
  const [editCli, setEditCli] = useState(null);
  const [newCli, setNewCli] = useState({ nombre: '', telefono: '', direccion: '' });
  const [searchCli, setSearchCli] = useState('');

  const ventaInicial = { cliente: '', producto: '', cantidad: '', precioUnit: '', metodoPago: 'efectivo' };
  const [venta, setVenta] = useState(ventaInicial);
  const [carrito, setCarrito] = useState([]);

  const [entrada, setEntrada] = useState({ producto: '', cantidad: '', precio: '', metodoPago: 'efectivo' });

  const [filtroFechaMov, setFiltroFechaMov] = useState('');
  const [filtroProdMov, setFiltroProdMov] = useState('');

  const hoy = toYMD(new Date());
  const hace30 = toYMD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [graficoDesde, setGraficoDesde] = useState(hace30);
  const [graficoHasta, setGraficoHasta] = useState(hoy);

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

  const agregarAlCarrito = () => {
    if (!venta.producto || !venta.cantidad || !venta.precioUnit) {
      mostrarToast('Completa producto, cantidad y precio ⚠️', 'err');
      return;
    }
    const cant = +venta.cantidad;
    const precio = +venta.precioUnit;
    setCarrito(prev => [...prev, { producto: venta.producto, cantidad: cant, precioUnit: precio, total: cant * precio }]);
    setVenta(v => ({ ...v, producto: '', cantidad: '', precioUnit: '' }));
  };

  const quitarDelCarrito = (idx) => setCarrito(prev => prev.filter((_, i) => i !== idx));

  const submitVenta = async (e) => {
    e.preventDefault();
    if (!venta.cliente) { mostrarToast('Selecciona un cliente ⚠️', 'err'); return; }
    if (carrito.length === 0) { mostrarToast('Agrega al menos un producto 🛒', 'err'); return; }
    setGuardando(true);
    try {
      for (const item of carrito) {
        await enviar({ tipo: 'SALIDA', cliente: venta.cliente, producto: item.producto, cantidad: item.cantidad, precio: item.precioUnit, metodoPago: venta.metodoPago || 'efectivo' });
      }
      mostrarToast(`¡${carrito.length > 1 ? carrito.length + ' productos vendidos' : 'Venta registrada'}! ✓`);
      setVenta(ventaInicial);
      setCarrito([]);
      cargar();
    } catch { mostrarToast('Error al guardar ❌', 'err'); }
    finally { setGuardando(false); }
  };

  const submitEntrada = (e) => {
    e.preventDefault();
    if (!entrada.producto || !entrada.cantidad) return;
    setGuardando(true);
    enviar({ tipo: 'ENTRADA', cliente: 'PROVEEDOR', producto: entrada.producto, cantidad: +entrada.cantidad, precio: +(entrada.precio || 0), metodoPago: entrada.metodoPago || 'efectivo' })
      .then(() => { mostrarToast('¡Guardado exitosamente! ✓'); setEntrada({ producto: '', cantidad: '', precio: '', metodoPago: 'efectivo' }); cargar(); })
      .catch(() => mostrarToast('Error al guardar ❌', 'err'))
      .finally(() => setGuardando(false));
  };

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

  const metricas = useMemo(() => {
    const salidas = movs.filter(m => m.TIPO === 'SALIDA');
    const entradas = movs.filter(m => m.TIPO === 'ENTRADA');
    const salidaHoy = salidas.filter(m => esHoy(m.FECHA_HORA));
    const entradaHoy = entradas.filter(m => esHoy(m.FECHA_HORA));
    const totalVentas = salidas.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
    const ventasHoy = salidaHoy.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
    const unidadesHoy = salidaHoy.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
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
      const cant = salidas.filter(m => dayMatch(m.FECHA_HORA)).reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
      return { label, value, cant };
    });
    const porProducto = {};
    salidas.forEach(m => {
      const p = m.PRODUCTO || 'Otros';
      if (!porProducto[p]) porProducto[p] = { cant: 0, total: 0 };
      porProducto[p].cant += Number(m.CANTIDAD) || 0;
      porProducto[p].total += Number(m.TOTAL) || 0;
    });
    const porCliente = {};
    salidas.forEach(m => {
      const c = m.CLIENTE || '—';
      if (!porCliente[c]) porCliente[c] = { cant: 0, total: 0 };
      porCliente[c].cant += Number(m.CANTIDAD) || 0;
      porCliente[c].total += Number(m.TOTAL) || 0;
    });
    return { totalVentas, ventasHoy, unidadesHoy, unidadesEntHoy, salidas, entradas, salidaHoy, entradaHoy, dias7, porProducto, porCliente };
  }, [movs]);

  const datosGrafico = useMemo(() => {
    if (!graficoDesde || !graficoHasta) return [];
    const desde = new Date(graficoDesde + 'T00:00:00');
    const hasta = new Date(graficoHasta + 'T23:59:59');
    if (isNaN(desde) || isNaN(hasta) || desde > hasta) return [];
    const salidas = movs.filter(m => {
      if (m.TIPO !== 'SALIDA') return false;
      const d = new Date(m.FECHA_HORA);
      return !isNaN(d) && d >= desde && d <= hasta;
    });
    const diffDias = Math.round((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDias <= 31) {
      return Array.from({ length: diffDias }, (_, i) => {
        const d = new Date(desde);
        d.setDate(d.getDate() + i);
        const ymd = toYMD(d);
        const label = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
        const movDia = salidas.filter(m => toYMD(new Date(m.FECHA_HORA)) === ymd);
        return { label, value: movDia.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0), cant: movDia.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0) };
      });
    } else {
      const semanas = [];
      let cur = new Date(desde);
      while (cur <= hasta) {
        const start = new Date(cur);
        const end = new Date(cur);
        end.setDate(end.getDate() + 6);
        if (end > hasta) end.setTime(hasta.getTime());
        const label = `${start.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`;
        const movSem = salidas.filter(m => { const d = new Date(m.FECHA_HORA); return !isNaN(d) && d >= start && d <= end; });
        semanas.push({ label, value: movSem.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0), cant: movSem.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0) });
        cur.setDate(cur.getDate() + 7);
      }
      return semanas;
    }
  }, [movs, graficoDesde, graficoHasta]);

  const resumenRango = useMemo(() => {
    if (!datosGrafico.length) return null;
    const totalV = datosGrafico.reduce((s, d) => s + d.value, 0);
    const totalU = datosGrafico.reduce((s, d) => s + d.cant, 0);
    const desde = new Date(graficoDesde + 'T00:00:00');
    const hasta = new Date(graficoHasta + 'T23:59:59');
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

  const reporteDias = useMemo(() => {
    if (!graficoDesde || !graficoHasta) return [];
    const desde = new Date(graficoDesde + 'T00:00:00');
    const hasta = new Date(graficoHasta + 'T23:59:59');
    if (isNaN(desde) || isNaN(hasta) || desde > hasta) return [];
    const diffDias = Math.round((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
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
      const esDiaHoy = toYMD(new Date()) === ymd;
      const movDia = salidas.filter(m => toYMD(new Date(m.FECHA_HORA)) === ymd);
      if (movDia.length === 0) return null;
      const totalDia = movDia.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
      const cantDia = movDia.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0);
      const clientesDia = {};
      movDia.forEach(m => {
        const c = m.CLIENTE || '—';
        if (!clientesDia[c]) clientesDia[c] = { cant: 0, total: 0, productos: {} };
        clientesDia[c].cant += Number(m.CANTIDAD) || 0;
        clientesDia[c].total += Number(m.TOTAL) || 0;
        const prod = m.PRODUCTO || 'Otros';
        if (!clientesDia[c].productos[prod]) clientesDia[c].productos[prod] = 0;
        clientesDia[c].productos[prod] += Number(m.CANTIDAD) || 0;
      });
      const prodDia = {};
      movDia.forEach(m => {
        const p = m.PRODUCTO || 'Otros';
        if (!prodDia[p]) prodDia[p] = { cant: 0, total: 0 };
        prodDia[p].cant += Number(m.CANTIDAD) || 0;
        prodDia[p].total += Number(m.TOTAL) || 0;
      });
      const metodoDia = {};
      movDia.forEach(m => {
        const met = m.METODO_PAGO || m.metodoPago || 'efectivo';
        if (!metodoDia[met]) metodoDia[met] = 0;
        metodoDia[met] += Number(m.TOTAL) || 0;
      });
      return { ymd, label, esDiaHoy, movDia, totalDia, cantDia, clientesDia, prodDia, metodoDia };
    }).filter(Boolean);
  }, [movs, graficoDesde, graficoHasta]);

  const historialFiltrado = useMemo(() => {
    return movs.filter(m => {
      if (filtroFechaMov) {
        const d = new Date(m.FECHA_HORA);
        if (!isNaN(d) && toYMD(d) !== filtroFechaMov) return false;
      }
      if (filtroProdMov && m.PRODUCTO !== filtroProdMov) return false;
      return true;
    });
  }, [movs, filtroFechaMov, filtroProdMov]);

  const resumenFiltro = useMemo(() => {
    if (!filtroFechaMov && !filtroProdMov) return null;
    const salidas = historialFiltrado.filter(m => m.TIPO === 'SALIDA');
    return { ventasTotal: salidas.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0), unidadesVendidas: salidas.reduce((s, m) => s + (Number(m.CANTIDAD) || 0), 0), txsVentas: salidas.length };
  }, [historialFiltrado, filtroFechaMov, filtroProdMov]);

  const totalItemActual = (+venta.cantidad || 0) * (+venta.precioUnit || 0);
  const totalCarrito = carrito.reduce((s, i) => s + i.total, 0);
  const clisFiltrados = clientes.filter(c => !searchCli || (c.NOMBRE && c.NOMBRE.toLowerCase().includes(searchCli.toLowerCase())));
  const cargaInicial = cargando && movs.length === 0;

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
        .tab-btn:active { transform: scale(0.94); }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .card-enter { animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.6 } }
        .carrito-item { animation: fadeUp 0.2s ease both; }
        .water-fill { animation: fillWater 1.5s infinite alternate ease-in-out; transform-origin: bottom; }
        @keyframes fillWater { 0% { transform: translateY(24px); } 100% { transform: translateY(2px); } }
        /* Mejoras táctiles para iOS */
        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        input, select { -webkit-tap-highlight-color: transparent; }
        input[type="date"] { color-scheme: dark; min-height: 44px; }
        input[type="date"]::-webkit-datetime-edit { padding: 0; }
        input[type="date"]::-webkit-datetime-edit-fields-wrapper { padding: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator { margin-left: 4px; opacity: 0.6; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: 'rgba(3,14,30,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(56,189,248,0.1)',
        padding: '14px 20px',
        paddingTop: 'calc(max(14px, env(safe-area-inset-top)))',
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg,#0ea5e9,#0369a1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 21, boxShadow: '0 0 20px rgba(14,165,233,0.4)',
          flexShrink: 0,
        }}>💧</div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1 }}>AguaControl</div>
          <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginTop: 2 }}>
            {tab === 'inicio' && 'Resumen del día'}
            {tab === 'ventas' && 'Registrar venta'}
            {tab === 'entradas' && 'Ingreso de stock'}
            {tab === 'clientes' && 'Directorio de clientes'}
            {tab === 'informes' && 'Análisis y estadísticas'}
          </div>
        </div>
        <button onClick={cargar} className="hover-lift" style={{
          marginLeft: 'auto', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)',
          borderRadius: 10, padding: cargando ? '8px' : '9px 13px', color: '#38bdf8', cursor: 'pointer', fontSize: 16,
          minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {cargando && !cargaInicial ? <LoaderGota size={22} showText={false} /> : '🔄'}
        </button>
      </header>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 99,
          background: toast.tipo === 'err' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)',
          color: 'white', padding: '13px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', animation: 'fadeUp 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <main style={{ padding: '16px', maxWidth: 500, margin: '0 auto' }}>

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
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 3 }}>Resumen de actividad de hoy</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(3,105,161,0.08))', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 18, padding: '18px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>💰 Ventas hoy</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.03em', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(metricas.ventasHoy)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 5 }}>{metricas.salidaHoy.length} {metricas.salidaHoy.length === 1 ? 'venta' : 'ventas'} · {metricas.unidadesHoy} uds.</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(5,150,105,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '18px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>📦 Entradas hoy</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', letterSpacing: '-0.03em', fontFamily: '"DM Mono",monospace' }}>{metricas.unidadesEntHoy}</div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 5 }}>{metricas.entradaHoy.length} {metricas.entradaHoy.length === 1 ? 'registro' : 'registros'}</div>
                  </div>
                </div>

                {/* Gráfico 7 días — optimizado */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Ventas — últimos 7 días</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(metricas.dias7.reduce((s, d) => s + d.value, 0))}</div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <MiniBarChart data={metricas.dias7} color="#38bdf8" height={96} showValues={true} />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>hace 6 días</span>
                    <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>hoy</span>
                  </div>
                </div>

                {/* Stock actual */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 16px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>🗂️ Stock actual</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {productos.filter(p => p.ID_PRODUCTO).map((p, i) => {
                      const stock = Number(p.STOCK_ACTUAL) || 0;
                      const cfg = PROD_CFG[p.NOMBRE_PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      const bajo = stock < 10;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: bajo ? 'rgba(239,68,68,0.08)' : `${cfg.glow || 'rgba(255,255,255,0.03)'}`, border: `1px solid ${bajo ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '12px 14px' }}>
                          <span style={{ fontSize: 24 }}>{cfg.emoji}</span>
                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>{p.NOMBRE_PRODUCTO}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: bajo ? '#f87171' : cfg.color, lineHeight: 1.1 }}>{stock}</div>
                          </div>
                          {bajo && <span style={{ marginLeft: 'auto', fontSize: 16 }}>⚠️</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {metricas.salidaHoy.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 16px' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>⚡ Actividad de hoy</div>
                    {[...metricas.salidaHoy].reverse().map((m, i) => {
                      const cfg = PROD_CFG[m.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < metricas.salidaHoy.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cfg.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.CLIENTE}</div>
                            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{m.PRODUCTO} × {m.CANTIDAD}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(m.TOTAL)}</div>
                            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{fmtHora(m.FECHA_HORA)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {metricas.salidaHoy.length === 0 && !cargando && (
                  <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🌊</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 7 }}>¡Listo para empezar!</div>
                    <div style={{ fontSize: 14, color: 'rgba(148,163,184,0.6)' }}>Aún no hay ventas registradas hoy</div>
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
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>👤 Cliente</label>
                      <AutocompleteCliente value={venta.cliente} onChange={nombre => setVenta(v => ({ ...v, cliente: nombre }))} clientes={clientes} />
                    </div>

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
                              style={{ background: selected ? `${cfg.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '12px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: 'inherit', minHeight: 76 }}>
                              <div style={{ fontSize: 22, marginBottom: 5 }}>{cfg.emoji}</div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{prod}</div>
                              <div style={{ fontSize: 11, color: stock < 10 ? '#f87171' : 'rgba(148,163,184,0.6)', marginTop: 3 }}>Stock: {stock} {stock < 10 ? '⚠️' : ''}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cantidad</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', color: 'white', width: '100%', outline: 'none', fontSize: 24, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center' }}
                          type="number" min="1" placeholder="0" value={venta.cantidad}
                          onChange={e => setVenta(v => ({ ...v, cantidad: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Precio unit.</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', color: 'white', width: '100%', outline: 'none', fontSize: 20, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center' }}
                          type="number" min="0" placeholder="$ 0" value={venta.precioUnit}
                          onChange={e => setVenta(v => ({ ...v, precioUnit: e.target.value }))} />
                      </div>
                    </div>

                    {totalItemActual > 0 && (
                      <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: '11px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'rgba(186,230,253,0.7)', fontWeight: 700 }}>Este ítem</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#67e8f9', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(totalItemActual)}</span>
                      </div>
                    )}

                    <button type="button" onClick={agregarAlCarrito} className="hover-lift" style={{ background: 'rgba(56,189,248,0.12)', border: '1.5px dashed rgba(56,189,248,0.4)', borderRadius: 14, padding: '15px 20px', color: '#38bdf8', fontWeight: 800, width: '100%', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', minHeight: 52 }}>
                      + Agregar al carrito
                    </button>
                  </div>

                  {carrito.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 20, padding: 18, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>🛒 Carrito</div>
                        <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>
                          {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
                          {venta.cliente && <span style={{ color: '#38bdf8' }}> · {venta.cliente}</span>}
                        </div>
                      </div>

                      {carrito.map((item, idx) => {
                        const cfg = PROD_CFG[item.producto] || { emoji: '📦', color: '#94a3b8' };
                        return (
                          <div key={idx} className="carrito-item" style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${cfg.color}0d`, border: `1px solid ${cfg.color}25`, borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{cfg.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.producto}</div>
                              <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{item.cantidad} × {fmtCOP(item.precioUnit)}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontWeight: 900, fontSize: 15, color: cfg.color, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(item.total)}</div>
                            </div>
                            <button type="button" onClick={() => quitarDelCarrito(idx)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, width: 36, height: 36, color: '#f87171', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>✕</button>
                          </div>
                        );
                      })}

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 10, paddingTop: 14 }}>
                        <MetodoPagoSelector value={venta.metodoPago} onChange={v => setVenta(prev => ({ ...prev, metodoPago: v }))} />
                      </div>

                      <div style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.15),rgba(3,105,161,0.1))', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, padding: '16px 18px', marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(186,230,253,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total a cobrar</div>
                          <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', marginTop: 3 }}>{carrito.reduce((s, i) => s + i.cantidad, 0)} unidades</div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#67e8f9', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(totalCarrito)}</div>
                      </div>

                      <button type="submit" disabled={guardando || !venta.cliente} className="hover-lift" style={{ background: guardando || !venta.cliente ? 'rgba(56,189,248,0.2)' : 'linear-gradient(135deg,#0ea5e9,#0369a1)', border: 'none', borderRadius: 14, padding: '17px 20px', color: 'white', fontWeight: 800, width: '100%', cursor: guardando || !venta.cliente ? 'not-allowed' : 'pointer', fontSize: 17, fontFamily: 'inherit', marginTop: 12, minHeight: 56, boxShadow: guardando || !venta.cliente ? 'none' : '0 4px 24px rgba(14,165,233,0.35)' }}>
                        {guardando ? '⏳ Procesando...' : !venta.cliente ? 'Escribe el cliente arriba ↑' : `✓ Confirmar · ${fmtCOP(totalCarrito)}`}
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
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '13px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{cfg.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{m.CLIENTE}</div>
                            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
                ENTRADAS
            ═══════════════════════════════════════════════════════ */}
            {tab === 'entradas' && (
              <div className="card-enter">
                <form onSubmit={submitEntrada}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
                    <div style={{ marginBottom: 6, fontSize: 13, color: 'rgba(167,243,208,0.7)', textAlign: 'center' }}>Registra unidades y costo de compra al proveedor</div>

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
                              style={{ background: selected ? `${cfg.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '13px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: 'inherit', minHeight: 82 }}>
                              <div style={{ fontSize: 24, marginBottom: 6 }}>{cfg.emoji}</div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{prod}</div>
                              <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 3 }}>Stock: <strong style={{ color: cfg.color }}>{stock}</strong></div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cantidad</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '15px', color: 'white', width: '100%', outline: 'none', fontSize: 28, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center' }}
                          type="number" min="1" required placeholder="0" value={entrada.cantidad}
                          onChange={e => setEntrada({ ...entrada, cantidad: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Costo total</label>
                        <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '15px', color: 'white', width: '100%', outline: 'none', fontSize: 20, fontFamily: '"DM Mono",monospace', fontWeight: 700, textAlign: 'center' }}
                          type="number" min="0" placeholder="$ 0" value={entrada.precio}
                          onChange={e => setEntrada({ ...entrada, precio: e.target.value })} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 12 }}>
                      <MetodoPagoSelector value={entrada.metodoPago} onChange={v => setEntrada(prev => ({ ...prev, metodoPago: v }))} />
                    </div>

                    {entrada.producto && entrada.cantidad && (
                      <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 14, padding: '15px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(167,243,208,0.7)', fontWeight: 700 }}>SE AGREGARÁN AL STOCK</div>
                          <div style={{ fontSize: 14, color: 'rgba(167,243,208,0.9)', marginTop: 2 }}>{entrada.producto}</div>
                          {entrada.precio && <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>Costo: {fmtCOP(entrada.precio)}</div>}
                        </div>
                        <div style={{ fontSize: 34, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>+{entrada.cantidad}</div>
                      </div>
                    )}

                    <button type="submit" disabled={guardando} className="hover-lift" style={{ background: guardando ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#34d399,#059669)', border: 'none', borderRadius: 14, padding: '16px 20px', color: 'white', fontWeight: 800, width: '100%', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: 16, fontFamily: 'inherit', minHeight: 56, boxShadow: guardando ? 'none' : '0 4px 24px rgba(52,211,153,0.3)' }}>
                      {guardando ? '⏳ Guardando...' : '+ Registrar Compra / Entrada'}
                    </button>
                  </div>
                </form>

                {metricas.entradas.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Últimas entradas</div>
                    {metricas.entradas.slice(-6).reverse().map((m, i) => {
                      const cfg = PROD_CFG[m.PRODUCTO] || { emoji: '📦', color: '#94a3b8' };
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '13px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{cfg.emoji}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{m.PRODUCTO}</div>
                            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {fmtFechaCompleta(m.FECHA_HORA)}
                              {(m.METODO_PAGO || m.metodoPago) && <MetodoChip metodo={m.METODO_PAGO || m.metodoPago} />}
                            </div>
                            {Number(m.TOTAL) > 0 && <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>Costo: {fmtCOP(m.TOTAL)}</div>}
                          </div>
                          <div style={{ fontWeight: 900, color: '#34d399', fontSize: 20, fontFamily: '"DM Mono",monospace' }}>+{m.CANTIDAD}</div>
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
                  <button onClick={() => { setEditCli(null); setNewCli({ nombre: '', telefono: '', direccion: '' }); setShowAddCli(true); }} className="hover-lift" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', border: 'none', borderRadius: 14, padding: '16px 20px', color: 'white', fontWeight: 800, width: '100%', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', marginBottom: 16, minHeight: 56, boxShadow: '0 4px 24px rgba(124,58,237,0.35)' }}>
                    + Agregar Nuevo Cliente
                  </button>
                )}
                {showAddCli && (
                  <form onSubmit={submitCliente}>
                    <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: '#c4b5fd' }}>{editCli ? '✏️ Editar cliente' : '👤 Nuevo cliente'}</div>
                      {[
                        { key: 'nombre', label: 'Nombre completo', placeholder: 'Ej: María García', type: 'text', required: true },
                        { key: 'telefono', label: 'Teléfono', placeholder: 'Ej: 3001234567', type: 'tel', required: false },
                        { key: 'direccion', label: 'Dirección', placeholder: 'Calle 15 # 8-22, Barrio El Centro', type: 'text', required: false },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 13 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(196,181,253,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{f.label}</label>
                          <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '13px 14px', color: 'white', width: '100%', outline: 'none', fontSize: 15, fontFamily: 'inherit', minHeight: 50 }}
                            type={f.type} required={f.required} placeholder={f.placeholder} value={newCli[f.key]}
                            onChange={e => setNewCli({ ...newCli, [f.key]: e.target.value })} />
                        </div>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                        <button type="button" onClick={cancelarEdicionCliente} style={{ background: 'rgba(100,116,139,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '15px', color: 'rgba(148,163,184,0.9)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, minHeight: 52 }}>Cancelar</button>
                        <button type="submit" disabled={guardando} style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', border: 'none', borderRadius: 12, padding: '15px', color: 'white', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, minHeight: 52 }}>{guardando ? '⏳...' : '✓ Guardar'}</button>
                      </div>
                    </div>
                  </form>
                )}
                <div style={{ marginBottom: 14 }}>
                  <input style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 16px', color: 'white', width: '100%', outline: 'none', fontSize: 15, fontFamily: 'inherit', minHeight: 50 }}
                    placeholder="🔍 Buscar cliente por nombre..." value={searchCli} onChange={e => setSearchCli(e.target.value)} />
                </div>
                {clisFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 50, opacity: 0.5 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                    <div style={{ fontSize: 15 }}>No hay clientes registrados</div>
                  </div>
                ) : clisFiltrados.map((c, i) => {
                  const comprasCli = metricas.salidas.filter(m => m.CLIENTE === c.NOMBRE);
                  const totalCli = comprasCli.reduce((s, m) => s + (Number(m.TOTAL) || 0), 0);
                  const ultimaVenta = comprasCli[comprasCli.length - 1];
                  return (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 18px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 5 }}>{c.NOMBRE}</div>
                          {c.TELEFONO && <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', marginBottom: 3 }}>📞 {c.TELEFONO}</div>}
                          {c.DIRECCION && <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {c.DIRECCION}</div>}
                          {ultimaVenta && <div style={{ fontSize: 12, color: 'rgba(100,116,139,0.7)' }}>Última: {fmtFechaCorta(ultimaVenta.FECHA_HORA)}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#67e8f9', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(totalCli)}</div>
                          <div style={{ fontSize: 12, color: 'rgba(100,116,139,0.8)', marginTop: 3 }}>{comprasCli.length} pedidos</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => iniciarEdicionCliente(c)} style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: 'none', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 1, minHeight: 44 }}>✏️ Editar</button>
                        <button onClick={() => eliminarCliente(c.ID_CLIENTE)} style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'none', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 1, minHeight: 44 }}>🗑️ Eliminar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                INFORMES — COMPLETAMENTE OPTIMIZADO PARA MÓVIL
            ═══════════════════════════════════════════════════════ */}
            {tab === 'informes' && (
              <div className="card-enter">

                {/* KPIs globales */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(3,105,161,0.08))', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 18, padding: '17px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(56,189,248,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>Total ventas</div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(metricas.totalVentas)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', marginTop: 5 }}>{metricas.salidas.length} transacciones</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(5,150,105,0.08))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '17px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(52,211,153,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>Hoy</div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(metricas.ventasHoy)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', marginTop: 5 }}>{metricas.salidaHoy.length} ventas · {metricas.unidadesHoy} uds.</div>
                  </div>
                </div>

                {/* ── GRÁFICO POR RANGO — OPTIMIZADO ──────────── */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 18, padding: '18px 16px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>📈 Ventas por período</div>

                  {/* Selector de rango */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Desde</label>
                      <input type="date" value={graficoDesde} onChange={e => setGraficoDesde(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 12, padding: '12px 10px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'inherit', minHeight: 48, colorScheme: 'dark', WebkitAppearance: 'none' }} />
                    </div>
                    <div style={{ flexShrink: 0, paddingBottom: 12, color: 'rgba(148,163,184,0.4)', fontSize: 13, fontWeight: 700 }}>→</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Hasta</label>
                      <input type="date" value={graficoHasta} onChange={e => setGraficoHasta(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 12, padding: '12px 10px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'inherit', minHeight: 48, colorScheme: 'dark', WebkitAppearance: 'none' }} />
                    </div>
                  </div>

                  {/* Accesos rápidos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Hoy', desde: hoy, hasta: hoy },
                      { label: '7d', desde: toYMD(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), hasta: hoy },
                      { label: '30d', desde: toYMD(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)), hasta: hoy },
                      { label: 'Mes', desde: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), hasta: hoy },
                    ].map(r => {
                      const activo = graficoDesde === r.desde && graficoHasta === r.hasta;
                      return (
                        <button key={r.label} type="button"
                          onClick={() => { setGraficoDesde(r.desde); setGraficoHasta(r.hasta); }}
                          style={{ background: activo ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${activo ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '11px 2px', color: activo ? '#38bdf8' : 'rgba(148,163,184,0.8)', cursor: 'pointer', fontSize: 13, fontWeight: activo ? 800 : 600, fontFamily: 'inherit', minHeight: 46, textAlign: 'center', transition: 'all 0.15s' }}>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumen del rango — 2 KPIs */}
                  {resumenRango && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                      <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Recaudado</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(resumenRango.totalV)}</div>
                      </div>
                      <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14, padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Unidades</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#34d399', fontFamily: '"DM Mono",monospace' }}>{resumenRango.totalU}</div>
                      </div>
                    </div>
                  )}

                  {/* Gráfico de barras — más alto y legible */}
                  {datosGrafico.length > 0 ? (
                    <div style={{ position: 'relative' }}>
                      <MiniBarChart
                        data={datosGrafico}
                        color="#0ea5e9"
                        height={110}
                        showValues={datosGrafico.length <= 10}
                      />
                      <div style={{ fontSize: 11, color: 'rgba(100,116,139,0.5)', textAlign: 'center', marginTop: 6 }}>
                        Toca una barra para ver el detalle
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.4, fontSize: 14 }}>Sin datos en el rango seleccionado</div>
                  )}

                  {/* Desglose por método de pago */}
                  {resumenRango && Object.keys(resumenRango.porMetodo).length > 0 && (
                    <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>💳 Por método de pago</div>
                      {Object.entries(resumenRango.porMetodo)
                        .sort((a, b) => b[1] - a[1])
                        .map(([met, total], i) => {
                          const m = METODOS_PAGO.find(x => x.id === met) || { emoji: '💰', label: met };
                          const maxV = Math.max(...Object.values(resumenRango.porMetodo), 1);
                          const pct = (total / maxV) * 100;
                          const pctReal = Math.round((total / resumenRango.totalV) * 100);
                          return (
                            <div key={i} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 16 }}>{m.emoji}</span> {m.label}
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>{fmtCOP(total)}</span>
                                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginLeft: 6 }}>{pctReal}%</span>
                                </div>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#a78bfa)', borderRadius: 8, transition: 'width 1s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* ── DESGLOSE POR DÍA ─────────────────────────── */}
                {reporteDias.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 2 }}>
                      🗓️ Detalle por día — {reporteDias.length} {reporteDias.length === 1 ? 'día con ventas' : 'días con ventas'}
                    </div>
                    {[...reporteDias].reverse().map((dia) => (
                      <ResumenDiaCard key={dia.ymd} dia={dia} />
                    ))}
                  </div>
                )}

                {/* ── POR PRODUCTO ─────────────────────────────── */}
                {Object.keys(metricas.porProducto).length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 16px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>📦 Por producto</div>
                    {/* Donut + leyenda lado a lado */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'nowrap' }}>
                      <div style={{ flexShrink: 0 }}>
                        <DonutChart size={130} items={PRODUCTOS.filter(p => metricas.porProducto[p]).map(p => ({ label: p, value: metricas.porProducto[p]?.cant || 0, color: PROD_CFG[p]?.color || '#94a3b8' }))} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {PRODUCTOS.filter(p => metricas.porProducto[p]).map((prod, i) => {
                          const datos = metricas.porProducto[prod];
                          const cfg = PROD_CFG[prod];
                          const totalAll = Object.values(metricas.porProducto).reduce((s, v) => s + v.cant, 0);
                          const pct = totalAll > 0 ? Math.round((datos.cant / totalAll) * 100) : 0;
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                              <div style={{ width: 11, height: 11, borderRadius: 3, background: cfg.color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod}</div>
                                <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{datos.cant} und · {pct}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Barras de ventas por producto */}
                    {(() => {
                      const maxT = Math.max(...Object.values(metricas.porProducto).map(v => v.total), 1);
                      return PRODUCTOS.filter(p => metricas.porProducto[p]).map((prod, i) => {
                        const datos = metricas.porProducto[prod];
                        const cfg = PROD_CFG[prod];
                        const pct = (datos.total / maxT) * 100;
                        return (
                          <div key={i} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 18 }}>{cfg.emoji}</span> {prod}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 900, color: cfg.color, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(datos.total)}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 8, transition: 'width 1s ease', boxShadow: `0 0 8px ${cfg.color}55` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* ── TOP 5 CLIENTES ───────────────────────────── */}
                {Object.keys(metricas.porCliente).length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 16px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>⭐ Top 5 clientes</div>
                    {Object.entries(metricas.porCliente).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([cli, datos], i) => {
                      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                      const maxT = Math.max(...Object.values(metricas.porCliente).map(v => v.total), 1);
                      const pct = (datos.total / maxT) * 100;
                      return (
                        <div key={i} style={{ marginBottom: i < 4 ? 16 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span style={{ fontSize: 18 }}>{medals[i]}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{cli}</div>
                                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{datos.cant} unidades · {metricas.salidas.filter(m => m.CLIENTE === cli).length} pedidos</div>
                              </div>
                            </div>
                            <div style={{ fontWeight: 900, color: '#67e8f9', fontSize: 15, fontFamily: '"DM Mono",monospace' }}>{fmtCOP(datos.total)}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 7, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)', borderRadius: 7, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── HISTORIAL — CARDS EN LUGAR DE TABLA ──────── */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 16px' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>📋 Historial completo</div>

                  {/* Filtros */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', marginBottom: 5 }}>Fecha exacta</label>
                      <input type="date" value={filtroFechaMov} onChange={(e) => setFiltroFechaMov(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 11px', color: 'white', outline: 'none', fontSize: 14, fontFamily: 'inherit', minHeight: 44, colorScheme: 'dark' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', marginBottom: 5 }}>Producto</label>
                      <select value={filtroProdMov} onChange={(e) => setFiltroProdMov(e.target.value)}
                        style={{ width: '100%', background: 'rgba(20,36,65,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 11px', color: 'white', outline: 'none', fontSize: 14, fontFamily: 'inherit', appearance: 'none', minHeight: 44 }}>
                        <option value="">Todos</option>
                        {PRODUCTOS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Botón limpiar filtros */}
                  {(filtroFechaMov || filtroProdMov) && (
                    <button onClick={() => { setFiltroFechaMov(''); setFiltroProdMov(''); }}
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14, width: '100%', minHeight: 44 }}>
                      ✕ Limpiar filtros
                    </button>
                  )}

                  {/* Resumen de búsqueda */}
                  {resumenFiltro && historialFiltrado.length > 0 && (
                    <div style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.1),rgba(3,105,161,0.05))', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Resumen búsqueda</div>
                        <div style={{ fontSize: 13, color: 'rgba(186,230,253,0.8)' }}>
                          {resumenFiltro.txsVentas} ventas · {resumenFiltro.unidadesVendidas} uds.
                        </div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', fontFamily: '"DM Mono",monospace' }}>
                        {fmtCOP(resumenFiltro.ventasTotal)}
                      </div>
                    </div>
                  )}

                  {/* Lista de movimientos como CARDS (sin tabla) */}
                  {historialFiltrado.length > 0 ? (
                    <div>
                      {[...historialFiltrado].reverse().map((m, i) => (
                        <MovCard key={i} m={m} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 20px', opacity: 0.5, fontSize: 14 }}>
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
      <nav style={{
        position: 'fixed', bottom: 0, width: '100%',
        background: 'rgba(3,14,30,0.97)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const badge = t.id === 'ventas' && carrito.length > 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn" style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '11px 4px 10px',
              background: active ? 'rgba(14,165,233,0.08)' : 'transparent',
              border: 'none',
              borderTop: active ? '2px solid #0ea5e9' : '2px solid transparent',
              color: active ? '#38bdf8' : 'rgba(100,116,139,0.8)',
              cursor: 'pointer', fontSize: 11, fontWeight: active ? 800 : 500, gap: 4,
              fontFamily: 'inherit', letterSpacing: active ? '0.02em' : '0',
              minHeight: 60,
            }}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontSize: 22, filter: active ? 'drop-shadow(0 0 6px rgba(56,189,248,0.6))' : 'none', transition: 'filter 0.2s' }}>{t.emoji}</span>
                {badge && (
                  <span style={{ position: 'absolute', top: -4, right: -7, background: '#0ea5e9', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 900, padding: '1px 5px', minWidth: 17, textAlign: 'center' }}>
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