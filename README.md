# Club 22 — Sistema de Gestión Comercial (Vinería & Bar)

Sistema web de demostración para **Club 22**, vinería y bar con dos locales físicos en Córdoba, Argentina:
1. **Club 22 Yofre:** Solo bebidas y vinería (sin cocina).
2. **Club 22 General Paz:** Bebidas, coctelería y gastronomía (con cocina activa).

---

## 🚀 Requisitos y Pasos de Instalación

### Requisitos previos:
- **Node.js** v18 o superior instalado en la computadora.
- Terminal o PowerShell.

### 1. Instalar dependencias:
Abrir una terminal en la carpeta del proyecto (`club22-demo`) y ejecutar:
```bash
npm install
```

### 2. Iniciar servidor de desarrollo:
```bash
npm run dev
```

### 3. Abrir en el navegador:
Abrir `http://localhost:5173` (o el puerto indicado en la terminal).

---

## 👥 Usuarios y Credenciales de Demostración

La pantalla de Login incluye botones de **Acceso Rápido (1 Clic)** para cambiar de perfil instantáneamente durante la presentación:

| Rol | Usuario | Correo | Contraseña | Alcance y Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **Dueño / Admin** | Carlos Dueño | `admin@club22.com` | `admin` | Acceso global a ambos locales, selector en Header para cambiar de local activo, reportes consolidados, edición de precios y botón para restablecer demo. |
| **Empleado Yofre** | Martín Gómez | `yofre@club22.com` | `yofre` | Opera únicamente el local Club 22 Yofre (solo bebidas, sin acceso a cocina). |
| **Empleado Gral Paz** | Lucía Paz | `gpaz@club22.com` | `gpaz` | Opera únicamente el local Club 22 General Paz (bebidas, comida y comandera de cocina). |

---

## 🏗️ Arquitectura y Estructura del Código

El proyecto fue diseñado con estricta separación de responsabilidades para facilitar el paso a producción:

- **Catálogo Unificado y Estructura Relacional:**
  - Los productos pertenecen a un catálogo general (`productos`).
  - Precios (`precios_local`) y Stock (`stock_local`) se gestionan de manera relacional vinculados por `local_id`.
  - La comida solo existe y tiene precio en General Paz.
  - Los pagos (`pagos`) están desacoplados del pedido para permitir pagos divididos / mixtos.
- **Capa de Servicios (`/src/services`):**
  - Los componentes de React **NUNCA** acceden a `localStorage` directamente.
  - Toda la lógica reside en `productosService.js`, `pedidosService.js`, `stockService.js`, `mesasService.js`, etc.
  - Para migrar a una base de datos real (ej. **Supabase / PostgreSQL**), solo se modifican las funciones dentro de `/src/services`, manteniendo la interfaz y componentes 100% intactos.
- **Moneda:** Formato oficial argentino (`$12.500,00` ARS).

---

## ⏱️ Guión de Demostración para la Reunión (3 Minutos)

Para presentarle al profesor de forma fluida y contundente el valor del sistema:

### Minuto 1: Inicio de Turno y Operación en Salón (Empleado General Paz)
1. En la pantalla de Login, hacer clic en **"Entrar como Empleado (Lucía Paz - General Paz)"**.
2. Ir a **Mesas & Cuentas**. Mostrar la grilla de 8 mesas con sus estados (*Libre*, *Ocupada*, *Reservada*).
3. Seleccionar la **Mesa #2** (que ya tiene consumos acumulados de demo) y hacer clic en **"Cerrar y Cobrar Cuenta"**.
4. En el modal de cobro:
   - Aplicar la promoción **"10% Descuento Pago Efectivo"** y observar cómo el subtotal se descuenta en tiempo real.
   - Activar la casilla **"Habilitar Pago Mixto"** y dividir el cobro (ej: mitad en Efectivo y mitad con Mercado Pago).
   - Presionar **"Confirmar y Liberar Mesa"**.
   - Se abrirá el ticket/comprobante listo para imprimir y la Mesa #2 quedará inmediatamente en estado **Libre**.

### Minuto 2: Punto de Venta con Combos y Descuento de Stock
1. Dirigirse al **Punto de Venta (POS)**.
2. Seleccionar modalidad **"Para Llevar"** y agregar el **"Combo Fernetazo"** (1 Fernet Branca + 2 Coca-Cola).
3. Confirmar la venta.
4. Ir a la pestaña **Stock e Inventario**: verificar que el sistema descontó automáticamente **1 botella de Fernet** y **2 unidades de Coca-Cola** del local General Paz, demostrando la integridad de stock en combos.
5. Ir a la pantalla de **Cocina**: mostrar cómo las comandas de comida avanzan de forma interactiva en 3 columnas (*Pendiente* ➔ *En preparación* ➔ *Listo*).

### Minuto 3: Visión Global y Comparativa de Locales (Administrador / Dueño)
1. Cerrar sesión y hacer clic en **"Entrar como Dueño (Carlos Dueño)"**.
2. En el encabezado, mostrar cómo el Administrador puede alternar libremente entre **Club 22 General Paz** y **Club 22 Yofre**.
3. Al cambiar a **Club 22 Yofre**, ir al POS o Productos y señalar al profesor que el catálogo excluye las comidas automáticamente porque Yofre solo vende bebidas.
4. Ir al **Dashboard**: mostrar el filtro consolidado de *Ambos Locales* vs *Local individual*, exhibiendo las ventas de los últimos 7 días, el ticket promedio y las alertas de stock bajo.
5. (Opcional) Mostrar el botón **"Restablecer Demo"** en el encabezado, que permite reiniciar la base de datos a cero en caso de querer repetir la prueba.

---

## 🔮 3 Ideas de Próximos Pasos Técnicos

1. **Migración del Storage a Supabase (PostgreSQL + RLS):**
   Reemplazar la implementación de `db.js` por el cliente `@supabase/supabase-js`. Al estar todo el acceso encapsulado en `/src/services`, la migración solo requiere escribir las consultas SQL o llamadas RPC correspondientes sin tocar las páginas de React. Además, se pueden aplicar políticas de *Row Level Security* (RLS) para que la base de datos garantice a nivel servidor que un empleado solo pueda leer y escribir datos de su `local_id`.
2. **Sincronización en Tiempo Real de Cocina y Salón (WebSockets):**
   Implementar Supabase Realtime o WebSockets para que, cuando el cajero ingrese una hamburguesa o pizza en el POS de General Paz, aparezca instantáneamente en la pantalla de Cocina sin necesidad de recargar la página.
3. **Módulo de Remitos Digitales y Transferencias de Stock (Etapa 3):**
   Completar el módulo de logística entre Yofre y General Paz: cuando Yofre se quede sin Fernet o Gin, se genera un pedido de transferencia que descuenta el stock en General Paz en estado *"En tránsito"* y no ingresa al stock de Yofre hasta que el empleado de Yofre verifique y confirme la recepción física.
