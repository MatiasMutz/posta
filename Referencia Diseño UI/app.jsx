// app.jsx — POC de Posta · Hub de Gestión PyME
// Dirección visual: Editorial cálido. Cero comparaciones — esto es el producto.

(() => {
  const { DesignCanvas, DCSection, DCArtboard } = window;

  function App() {
    return (
      <DesignCanvas minScale={0.05} maxScale={3}>

        {/* PORTADA */}
        <DCSection id="cover" title="Posta · Hub de Gestión PyME" subtitle="Gestión comercial y financiera para PyMEs argentinas — POC mayo 2026">
          <DCArtboard id="portada" label="Portada del producto" width={1380} height={720}>
            <window.IntroOverview />
          </DCArtboard>
        </DCSection>

        {/* PANTALLAS PRINCIPALES */}
        <DCSection id="screens" title="Pantallas del producto" subtitle="Flujo completo: dashboard · POS · inventario · caja · importación · contador">
          <DCArtboard id="a-dashboard" label="Dashboard principal" width={1280} height={800}>
            <window.A_Dashboard />
          </DCArtboard>
          <DCArtboard id="a-pos-desktop" label="POS · punto de venta" width={1280} height={800}>
            <window.A_POS_Desktop />
          </DCArtboard>
          <DCArtboard id="a-pos-mobile" label="POS · móvil" width={420} height={800}>
            <window.A_POS_Mobile />
          </DCArtboard>
          <DCArtboard id="a-inventory" label="Inventario" width={1280} height={800}>
            <window.A_Inventory />
          </DCArtboard>
          <DCArtboard id="a-cash" label="Caja y Tesorería" width={1280} height={800}>
            <window.A_Cash />
          </DCArtboard>
          <DCArtboard id="a-import" label="Migración · Asistente Excel" width={1280} height={800}>
            <window.A_Import />
          </DCArtboard>
          <DCArtboard id="a-accountant" label="Vista contador · AFIP" width={1280} height={800}>
            <window.A_Accountant />
          </DCArtboard>
        </DCSection>

        {/* SISTEMA DE DISEÑO */}
        <DCSection id="design" title="Sistema de diseño" subtitle="Identidad editorial · paleta cálida · tipografía · componentes">
          <DCArtboard id="a-identity" label="Identidad y tokens" width={1080} height={760}>
            <window.A_Identity />
          </DCArtboard>
          <DCArtboard id="a-components" label="Biblioteca de componentes" width={1080} height={900}>
            <window.A_Components />
          </DCArtboard>
        </DCSection>

        {/* CIERRE */}
        <DCSection id="closing" title="Alcance del POC y hoja de ruta" subtitle="Qué se muestra hoy · qué viene en el MVP">
          <DCArtboard id="roadmap" label="Módulos y próximos pasos" width={1380} height={820}>
            <window.ClosingRecommendation />
          </DCArtboard>
        </DCSection>

      </DesignCanvas>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
