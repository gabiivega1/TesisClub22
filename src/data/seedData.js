/**
 * Base de datos inicial para Club 22 en blanco.
 * Mantiene únicamente la estructura base necesaria:
 * - 2 Locales físicos (Yofre y General Paz)
 * - Perfiles de acceso (Admin, Empleado Yofre, Empleado General Paz)
 * - Categorías estándar para poder clasificar productos
 * - 8 Mesas libres por local
 *
 * Catálogo, stock, combos, promociones, ventas y reservas inician COMPLETAMENTE VACÍOS
 * para que el usuario pueda cargarlos desde cero.
 */

export const INITIAL_DATA = {
  locales: [
    {
      id: 'loc_yofre',
      nombre: 'Club 22 Yofre',
      direccion: 'Av. Malvinas Argentinas 1240, B° Yofre, Córdoba',
      telefono: '0351-4512222',
      tiene_cocina: false
    },
    {
      id: 'loc_gpaz',
      nombre: 'Club 22 General Paz',
      direccion: '24 de Septiembre 920, B° General Paz, Córdoba',
      telefono: '0351-4523333',
      tiene_cocina: true
    }
  ],

  perfiles: [
    {
      id: 'usr_admin',
      nombre: 'Carlos Dueño',
      email: 'admin@club22.com',
      password: 'admin',
      rol: 'admin',
      local_id: null
    },
    {
      id: 'usr_yofre',
      nombre: 'Martín Gómez',
      email: 'yofre@club22.com',
      password: 'yofre',
      rol: 'empleado',
      local_id: 'loc_yofre'
    },
    {
      id: 'usr_gpaz',
      nombre: 'Lucía Paz',
      email: 'gpaz@club22.com',
      password: 'gpaz',
      rol: 'empleado',
      local_id: 'loc_gpaz'
    }
  ],

  categorias: [
    { id: 'cat_vinos', nombre: 'Vinos y Espumantes', descripcion: 'Vinos de Mendoza, Salta, Patagonia y Espumantes' },
    { id: 'cat_cervezas', nombre: 'Cervezas', descripcion: 'Cervezas industriales y artesanales' },
    { id: 'cat_tragos', nombre: 'Tragos y Coctelería', descripcion: 'Fernet, Gin, Aperitivos y Destilados' },
    { id: 'cat_sin_alcohol', nombre: 'Bebidas sin Alcohol', descripcion: 'Gaseosas, tónicas y aguas' },
    { id: 'cat_comidas', nombre: 'Cocina y Comidas', descripcion: 'Tablas, pizzas, hamburguesas y papas (solo General Paz)' }
  ],

  mesas: [
    // 8 Mesas libres Club 22 Yofre
    { id: 'mesa_y_1', local_id: 'loc_yofre', numero: 1, capacidad: 2, estado: 'libre' },
    { id: 'mesa_y_2', local_id: 'loc_yofre', numero: 2, capacidad: 4, estado: 'libre' },
    { id: 'mesa_y_3', local_id: 'loc_yofre', numero: 3, capacidad: 4, estado: 'libre' },
    { id: 'mesa_y_4', local_id: 'loc_yofre', numero: 4, capacidad: 6, estado: 'libre' },
    { id: 'mesa_y_5', local_id: 'loc_yofre', numero: 5, capacidad: 2, estado: 'libre' },
    { id: 'mesa_y_6', local_id: 'loc_yofre', numero: 6, capacidad: 4, estado: 'libre' },
    { id: 'mesa_y_7', local_id: 'loc_yofre', numero: 7, capacidad: 8, estado: 'libre' },
    { id: 'mesa_y_8', local_id: 'loc_yofre', numero: 8, capacidad: 2, estado: 'libre' },

    // 8 Mesas libres Club 22 General Paz
    { id: 'mesa_g_1', local_id: 'loc_gpaz', numero: 1, capacidad: 2, estado: 'libre' },
    { id: 'mesa_g_2', local_id: 'loc_gpaz', numero: 2, capacidad: 4, estado: 'libre' },
    { id: 'mesa_g_3', local_id: 'loc_gpaz', numero: 3, capacidad: 4, estado: 'libre' },
    { id: 'mesa_g_4', local_id: 'loc_gpaz', numero: 4, capacidad: 6, estado: 'libre' },
    { id: 'mesa_g_5', local_id: 'loc_gpaz', numero: 5, capacidad: 2, estado: 'libre' },
    { id: 'mesa_g_6', local_id: 'loc_gpaz', numero: 6, capacidad: 4, estado: 'libre' },
    { id: 'mesa_g_7', local_id: 'loc_gpaz', numero: 7, capacidad: 8, estado: 'libre' },
    { id: 'mesa_g_8', local_id: 'loc_gpaz', numero: 8, capacidad: 2, estado: 'libre' }
  ],

  // CATÁLOGOS, STOCK, VENTAS Y RESERVAS EN BLANCO
  productos: [],
  precios_local: [],
  stock_local: [],
  combos: [],
  combo_items: [],
  promociones: [],
  reservas: [],
  pedidos: [],
  pedido_items: [],
  pagos: [],
  movimientos_stock: [],
  transferencias_stock: [],
  clientes: []
};
