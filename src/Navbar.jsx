import React, { useState } from "react";

const Navbar = ({
  onAddCustom,
  onAddInactive,
  onAddVacaciones,
  onConfig,
  expandAll,
  onToggleExpand,
  selectedYear,
  availableYears = [],
  onYearChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.brandIcon}>⏱</span>
        <span style={styles.brandText}>Horarios<span style={styles.brandAccent}>MDA</span></span>
      </div>

      {availableYears.length > 0 && <label className="navbar-year" style={styles.yearGroup}><span>Año</span><select aria-label="Año" value={selectedYear} onChange={e=>onYearChange?.(Number(e.target.value))} style={styles.yearSelect}>{availableYears.map(year=><option key={year} value={year}>{year}</option>)}</select></label>}

      {/* Desktop actions */}
      <div className="navbar-actions" style={styles.actions}>
        <button style={styles.toggleBtn} onClick={onToggleExpand}>
          <span style={styles.toggleIcon}>{expandAll ? "▲" : "▼"}</span>
          {expandAll ? "Contraer" : "Expandir"} semanas
        </button>
        <div style={styles.divider} />
        <button style={{ ...styles.actionBtn, ...styles.btnPrimary }} onClick={onAddCustom}>
          <span>＋</span> Custom
        </button>
        <button style={{ ...styles.actionBtn, ...styles.btnSecondary }} onClick={onAddInactive}>
          <span>⊘</span> Inactivo
        </button>
        <button style={{ ...styles.actionBtn, ...styles.btnVac }} onClick={onAddVacaciones}>
          <span>✈</span> Vacaciones
        </button>
        <button style={{ ...styles.actionBtn, ...styles.btnConfig }} onClick={onConfig}>
          <span>⚙</span>
        </button>
      </div>

      {/* Mobile hamburger */}
      <button className="navbar-hamburger" aria-label="Menú" aria-expanded={menuOpen} style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        <span style={styles.hamLine} />
        <span style={styles.hamLine} />
        <span style={styles.hamLine} />
      </button>

      {menuOpen && (
        <div style={styles.mobileMenu}>
          <button style={styles.mobileToggleBtn} onClick={() => { onToggleExpand(); setMenuOpen(false); }}>
            {expandAll ? "▲ Contraer semanas" : "▼ Expandir semanas"}
          </button>
          <button style={styles.mobileMenuBtn} onClick={() => { onAddCustom(); setMenuOpen(false); }}>＋ Custom Schedule</button>
          <button style={styles.mobileMenuBtn} onClick={() => { onAddInactive(); setMenuOpen(false); }}>⊘ Inactivo</button>
          <button style={styles.mobileMenuBtn} onClick={() => { onAddVacaciones(); setMenuOpen(false); }}>✈ Vacaciones</button>
          <button style={styles.mobileMenuBtn} onClick={() => { onConfig(); setMenuOpen(false); }}>⚙ Configuración</button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "56px",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
    borderBottom: "2px solid #00d4ff33",
    boxShadow: "0 4px 20px rgba(0,212,255,0.15)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    flexWrap: "nowrap",
    gap: "6px",
    padding: "0 12px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  brandIcon: {
    fontSize: "20px",
  },
  brandText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#e0e0ff",
    letterSpacing: "0.5px",
  },
  brandAccent: {
    color: "#00d4ff",
  },
  yearGroup: { display:"inline-flex", alignItems:"center", gap:6, color:"#aab4c8", fontSize:12, whiteSpace:"nowrap", marginLeft:"auto", marginRight:12 },
  yearSelect: { font:"inherit", fontWeight:600, color:"#e0e0ff", background:"#1a1a2e", colorScheme:"dark", border:"1px solid #ffffff26", borderRadius:7, padding:"5px 8px", cursor:"pointer", outlineOffset:3 },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  divider: {
    width: "1px",
    height: "24px",
    background: "#ffffff22",
    margin: "0 4px",
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #ffffff33",
    borderRadius: "20px",
    color: "#aab4c8",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  toggleIcon: {
    fontSize: "10px",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #00d4ff, #0099cc)",
    color: "#000",
  },
  btnSecondary: {
    background: "#2a2a3e",
    color: "#aab4c8",
    border: "1px solid #ffffff22",
  },
  btnVac: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#000",
  },
  btnConfig: {
    background: "#2a2a3e",
    color: "#aab4c8",
    border: "1px solid #ffffff22",
    fontSize: "14px",
  },
  hamburger: {
    display: "none",
    flexDirection: "column",
    gap: "4px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px",
  },
  hamLine: {
    display: "block",
    width: "22px",
    height: "2px",
    background: "#aab4c8",
    borderRadius: "2px",
  },
  mobileMenu: {
    position: "absolute",
    top: "56px",
    right: 0,
    left: 0,
    background: "#1a1a2e",
    borderBottom: "2px solid #00d4ff33",
    padding: "8px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 200,
  },
  mobileToggleBtn: {
    padding: "10px 14px",
    background: "transparent",
    border: "1px solid #ffffff22",
    borderRadius: "8px",
    color: "#aab4c8",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
  },
  mobileMenuBtn: {
    padding: "10px 14px",
    background: "#2a2a3e",
    border: "1px solid #ffffff11",
    borderRadius: "8px",
    color: "#e0e0ff",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
  },
};

// Inject responsive CSS for hamburger
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    @media (max-width: 900px) {
      .navbar-actions { display: none !important; }
      .navbar-hamburger { display: flex !important; }
      .navbar-year { margin-right: 8px !important; }
    }
    @media (max-width: 360px) {
      .navbar-year { gap: 3px !important; margin-right: 4px !important; }
      .navbar-year select { padding: 4px !important; }
    }
    .navbar-year select:focus-visible { outline: 2px solid #00d4ff; }
    .navbar-year select:hover { border-color: #00d4ff66 !important; }
    .navbar-toggleBtn:hover { background: rgba(255,255,255,0.08) !important; color: #00d4ff !important; }
    .navbar-actionBtn:hover { filter: brightness(1.15); transform: translateY(-1px); }
  `;
  document.head.appendChild(style);
}

export default Navbar;
