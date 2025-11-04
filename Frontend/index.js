// ============================================
// CONFIGURACIÓN DE LA API
// ============================================

// URL del backend (cambia esto cuando deploys tu servidor)
const API_URL = 'http://localhost:5000/api';
const USUARIO_ID = 'default-user'; // Puedes cambiarlo por un ID único de usuario

// ============================================
// VARIABLES GLOBALES
// ============================================

let database = {
  usuarios: [
    { id: 1, nombre: "Agustín", email: "agustin@nexo.com", password: "1234" }
  ],
  reseñas: [],
  biblioteca: {
    videojuegos: [],
    anime: [],
    peliculas: [],
    series: []
  }
};

let usuarioActual = null;

// ============================================
// FUNCIONES DE API (BACKEND)
// ============================================

// Cargar reseñas desde el backend
async function cargarReseñas() {
  try {
    const response = await fetch(`${API_URL}/resenas`);
    const data = await response.json();
    
    if (data.success) {
      database.reseñas = data.data;
      console.log('✅ Reseñas cargadas desde MongoDB:', database.reseñas.length);
    }
  } catch (error) {
    console.error('❌ Error al cargar reseñas:', error);
    mostrarNotificacion('⚠️ No se pudieron cargar las reseñas', 'warning');
  }
}

// Guardar reseña en el backend
async function guardarReseña(reseña) {
  try {
    const response = await fetch(`${API_URL}/resenas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reseña)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Reseña guardada en MongoDB');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al guardar reseña:', error);
    return false;
  }
}

// Cargar biblioteca desde el backend
async function cargarBiblioteca() {
  try {
    const response = await fetch(`${API_URL}/biblioteca/${USUARIO_ID}`);
    const data = await response.json();
    
    if (data.success) {
      database.biblioteca = {
        videojuegos: data.data.videojuegos || [],
        anime: data.data.anime || [],
        peliculas: data.data.peliculas || [],
        series: data.data.series || []
      };
      console.log('✅ Biblioteca cargada desde MongoDB');
      actualizarEstadisticasBiblioteca();
    }
  } catch (error) {
    console.error('❌ Error al cargar biblioteca:', error);
  }
}

// Guardar biblioteca en el backend
async function guardarBiblioteca() {
  try {
    const response = await fetch(`${API_URL}/biblioteca/${USUARIO_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(database.biblioteca)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Biblioteca guardada en MongoDB');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al guardar biblioteca:', error);
    return false;
  }
}

// ============================================
// FUNCIONES DE INICIO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  inicializarApp();
});

async function inicializarApp() {
  // Mostrar mensaje de carga
  console.log('⏳ Cargando datos desde MongoDB...');

  // Cargar datos desde el backend
  await cargarReseñas();
  await cargarBiblioteca();

  // Inicializar eventos de formularios
  const formsReseña = document.querySelectorAll('.review-form');
  formsReseña.forEach((form, index) => {
    hacerIDsUnicos(form, index);
    form.addEventListener('submit', manejarEnvioReseña);
  });

  // Inicializar botones "Ver Reseñas"
  const botonesVerReseñas = document.querySelectorAll('.btn-primary');
  botonesVerReseñas.forEach(boton => {
    if (boton.textContent === 'Ver Reseñas') {
      boton.addEventListener('click', mostrarModalReseñas);
    }
  });

  // Inicializar botones de biblioteca
  const btnAgregar = document.querySelector('.biblioteca-actions .btn-primary');
  const btnVerTodo = document.querySelector('.biblioteca-actions .btn-secondary');
  
  if (btnAgregar) {
    btnAgregar.addEventListener('click', mostrarModalAgregar);
  }
  
  if (btnVerTodo) {
    btnVerTodo.addEventListener('click', mostrarBibliotecaCompleta);
  }

  // Desplazamiento suave para navegación
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('🎮 El Nexo Digital iniciado correctamente');
  mostrarNotificacion('✅ Conectado a la base de datos', 'success');
}

// Hacer únicos los IDs de los formularios
function hacerIDsUnicos(form, index) {
  const elementos = form.querySelectorAll('[id]');
  elementos.forEach(elemento => {
    const idOriginal = elemento.id;
    const nuevoId = `${idOriginal}-${index}`;
    elemento.id = nuevoId;
    
    const label = form.querySelector(`label[for="${idOriginal}"]`);
    if (label) {
      label.setAttribute('for', nuevoId);
    }
  });
  
  const radioButtons = form.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    const nameOriginal = radio.name;
    radio.name = `${nameOriginal}-${index}`;
  });
}

// ============================================
// SISTEMA DE RESEÑAS
// ============================================

async function manejarEnvioReseña(e) {
  e.preventDefault();
  
  const form = e.target;
  const seccion = form.closest('section').id;
  
  const inputNombre = form.querySelector('input[type="text"]');
  const selectCategoria = form.querySelector('select');
  const puntuacion = form.querySelector('input[name^="rating"]:checked');
  const textoReseña = form.querySelector('textarea');

  if (!inputNombre || !inputNombre.value.trim()) {
    mostrarNotificacion('⚠️ Por favor ingresa el nombre', 'warning');
    return;
  }

  if (!selectCategoria || !selectCategoria.value) {
    mostrarNotificacion('⚠️ Por favor selecciona una categoría', 'warning');
    return;
  }

  if (!puntuacion) {
    mostrarNotificacion('⚠️ Por favor selecciona una puntuación', 'warning');
    return;
  }

  if (!textoReseña || !textoReseña.value.trim()) {
    mostrarNotificacion('⚠️ Por favor escribe tu reseña', 'warning');
    return;
  }

  const nuevaReseña = {
    nombreJuego: inputNombre.value.trim(),
    categoria: selectCategoria.value,
    puntuacion: parseInt(puntuacion.value),
    texto: textoReseña.value.trim(),
    fecha: new Date().toLocaleDateString('es-ES'),
    autor: usuarioActual ? usuarioActual.nombre : 'Anónimo',
    likes: 0,
    tipo: seccion
  };

  // Guardar localmente
  database.reseñas.push(nuevaReseña);

  // Guardar en MongoDB
  const guardado = await guardarReseña(nuevaReseña);
  
  if (guardado) {
    mostrarNotificacion('✅ ¡Reseña publicada en la base de datos!', 'success');
    // Recargar reseñas para obtener el ID de MongoDB
    await cargarReseñas();
  } else {
    mostrarNotificacion('⚠️ Reseña publicada localmente, error al sincronizar', 'warning');
  }

  form.reset();
  console.log('Nueva reseña agregada:', nuevaReseña);
}

function mostrarModalReseñas(e) {
  const card = e.target.closest('.card');
  const titulo = card.querySelector('h3').textContent;
  
  const reseñasDelItem = database.reseñas.filter(r => 
    r.nombreJuego.toLowerCase() === titulo.toLowerCase()
  );

  let contenidoReseñas = '';
  
  if (reseñasDelItem.length === 0) {
    contenidoReseñas = '<p style="text-align: center; color: #b0b0b0;">Aún no hay reseñas para este título. ¡Sé el primero en opinar!</p>';
  } else {
    reseñasDelItem.forEach(reseña => {
      const estrellas = '★'.repeat(reseña.puntuacion) + '☆'.repeat(5 - reseña.puntuacion);
      contenidoReseñas += `
        <div style="background: rgba(22, 33, 62, 0.6); padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border-left: 3px solid #e94560;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #e94560;">${reseña.autor}</strong>
            <span style="color: #ffd700; font-size: 1.2rem;">${estrellas}</span>
          </div>
          <p style="color: #c0c0c0; margin-bottom: 0.5rem;">${reseña.texto}</p>
          <small style="color: #808080;">${reseña.fecha} • ${reseña.likes} me gusta</small>
        </div>
      `;
    });
  }

  mostrarModal(`Reseñas de ${titulo}`, contenidoReseñas);
}

// ============================================
// SISTEMA DE BIBLIOTECA
// ============================================

function mostrarModalAgregar() {
  const contenido = `
    <form id="form-agregar-biblioteca" style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Tipo de contenido:</label>
        <select id="tipo-contenido-modal" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
          <option value="videojuegos">Videojuego</option>
          <option value="anime">Anime</option>
          <option value="peliculas">Película</option>
          <option value="series">Serie</option>
        </select>
      </div>
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Nombre:</label>
        <input type="text" id="nombre-item-modal" placeholder="Ej: The Witcher 3" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;" required>
      </div>
      <div id="campo-horas-modal" style="display: none;">
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Horas jugadas:</label>
        <input type="number" id="horas-jugadas-modal" placeholder="Ej: 50" min="0" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
      </div>
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Estado:</label>
        <select id="estado-item-modal" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
          <option value="completado">Completado</option>
          <option value="jugando">Jugando/Viendo</option>
          <option value="pendiente">Pendiente</option>
          <option value="abandonado">Abandonado</option>
        </select>
      </div>
      <button type="submit" style="padding: 1rem; background: #e94560; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
        Agregar a Biblioteca
      </button>
    </form>
  `;

  mostrarModal('📚 Agregar a Mi Biblioteca', contenido);

  setTimeout(() => {
    const form = document.getElementById('form-agregar-biblioteca');
    const tipoSelect = document.getElementById('tipo-contenido-modal');
    const campoHoras = document.getElementById('campo-horas-modal');
    
    if (form && tipoSelect && campoHoras) {
      tipoSelect.addEventListener('change', function() {
        if (this.value === 'videojuegos') {
          campoHoras.style.display = 'block';
        } else {
          campoHoras.style.display = 'none';
        }
      });
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        agregarABiblioteca();
      });
    }
  }, 100);
}

async function agregarABiblioteca() {
  const tipo = document.getElementById('tipo-contenido-modal').value;
  const nombre = document.getElementById('nombre-item-modal').value;
  const estado = document.getElementById('estado-item-modal').value;
  const horas = document.getElementById('horas-jugadas-modal')?.value || null;

  if (!nombre.trim()) {
    mostrarNotificacion('⚠️ Por favor ingresa un nombre', 'warning');
    return;
  }

  const nuevoItem = {
    nombre: nombre.trim(),
    estado: estado,
    fechaAgregado: new Date().toLocaleDateString('es-ES'),
    ...(tipo === 'videojuegos' && horas ? { horasJugadas: parseInt(horas) } : {})
  };

  database.biblioteca[tipo].push(nuevoItem);
  
  const guardado = await guardarBiblioteca();
  
  if (guardado) {
    mostrarNotificacion(`✅ ${nombre} guardado en MongoDB!`, 'success');
  } else {
    mostrarNotificacion(`⚠️ ${nombre} agregado localmente, error al sincronizar`, 'warning');
  }
  
  cerrarModal();
  actualizarEstadisticasBiblioteca();
  console.log('Item agregado:', nuevoItem);
}

function mostrarBibliotecaCompleta() {
  let contenido = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

  ['videojuegos', 'anime', 'peliculas', 'series'].forEach(categoria => {
    const items = database.biblioteca[categoria];
    const categoriaCapitalizada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    
    contenido += `
      <div>
        <h3 style="color: #e94560; margin-bottom: 1rem; border-bottom: 2px solid rgba(233, 69, 96, 0.3); padding-bottom: 0.5rem;">
          ${categoriaCapitalizada} (${items.length})
        </h3>
    `;

    if (items.length === 0) {
      contenido += '<p style="color: #808080;">No tienes ningún item en esta categoría.</p>';
    } else {
      items.forEach((item, index) => {
        const iconoEstado = {
          'completado': '✅',
          'jugando': '▶️',
          'pendiente': '⏳',
          'abandonado': '❌'
        };

        const infoHoras = item.horasJugadas ? 
          `<br><small style="color: #ffd700;">⏱️ ${item.horasJugadas} horas</small>` : '';

        contenido += `
          <div style="background: rgba(22, 33, 62, 0.6); padding: 1rem; margin-bottom: 0.8rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <strong style="color: #e0e0e0;">${item.nombre}</strong>
              <br>
              <small style="color: #808080;">Agregado: ${item.fechaAgregado}</small>
              ${infoHoras}
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span style="font-size: 1.5rem; margin-right: 0.5rem;">${iconoEstado[item.estado]}</span>
              <button onclick="editarItemBiblioteca('${categoria}', ${index})" style="background: #2196f3; color: white; border: none; padding: 0.5rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                ✏️ Editar
              </button>
              <button onclick="eliminarItemBiblioteca('${categoria}', ${index})" style="background: #f44336; color: white; border: none; padding: 0.5rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        `;
      });
    }

    contenido += '</div>';
  });

  contenido += '</div>';
  mostrarModal('📚 Mi Biblioteca Completa', contenido);
}

// Eliminar item de la biblioteca
async function eliminarItemBiblioteca(categoria, index) {
  const item = database.biblioteca[categoria][index];
  
  if (confirm(`¿Estás seguro de eliminar "${item.nombre}"?`)) {
    database.biblioteca[categoria].splice(index, 1);
    
    const guardado = await guardarBiblioteca();
    
    if (guardado) {
      mostrarNotificacion('✅ Item eliminado correctamente', 'success');
    } else {
      mostrarNotificacion('⚠️ Error al eliminar de la base de datos', 'warning');
    }
    
    actualizarEstadisticasBiblioteca();
    cerrarModal();
    
    // Reabrir el modal actualizado
    setTimeout(() => mostrarBibliotecaCompleta(), 300);
  }
}

// Editar item de la biblioteca
function editarItemBiblioteca(categoria, index) {
  const item = database.biblioteca[categoria][index];
  
  const mostrarCampoHoras = categoria === 'videojuegos';
  const campoHoras = mostrarCampoHoras ? `
    <div>
      <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Horas jugadas:</label>
      <input type="number" id="horas-edit-modal" value="${item.horasJugadas || ''}" placeholder="Ej: 50" min="0" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
    </div>
  ` : '';
  
  const contenido = `
    <form id="form-editar-biblioteca" style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Nombre:</label>
        <input type="text" id="nombre-edit-modal" value="${item.nombre}" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;" required>
      </div>
      ${campoHoras}
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Estado:</label>
        <select id="estado-edit-modal" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
          <option value="completado" ${item.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="jugando" ${item.estado === 'jugando' ? 'selected' : ''}>Jugando/Viendo</option>
          <option value="pendiente" ${item.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="abandonado" ${item.estado === 'abandonado' ? 'selected' : ''}>Abandonado</option>
        </select>
      </div>
      <div style="display: flex; gap: 1rem;">
        <button type="button" onclick="cerrarModal(); setTimeout(() => mostrarBibliotecaCompleta(), 300);" style="flex: 1; padding: 1rem; background: #808080; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
          Cancelar
        </button>
        <button type="submit" style="flex: 1; padding: 1rem; background: #e94560; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
          Guardar Cambios
        </button>
      </div>
    </form>
  `;
  
  mostrarModal('✏️ Editar Item', contenido);
  
  setTimeout(() => {
    const form = document.getElementById('form-editar-biblioteca');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await guardarEdicionBiblioteca(categoria, index);
      });
    }
  }, 100);
}

// Guardar la edición del item
async function guardarEdicionBiblioteca(categoria, index) {
  const nombre = document.getElementById('nombre-edit-modal').value;
  const estado = document.getElementById('estado-edit-modal').value;
  const horasInput = document.getElementById('horas-edit-modal');
  const horas = horasInput ? horasInput.value : null;
  
  if (!nombre.trim()) {
    mostrarNotificacion('⚠️ Por favor ingresa un nombre', 'warning');
    return;
  }
  
  // Actualizar el item
  database.biblioteca[categoria][index].nombre = nombre.trim();
  database.biblioteca[categoria][index].estado = estado;
  
  if (categoria === 'videojuegos' && horas) {
    database.biblioteca[categoria][index].horasJugadas = parseInt(horas);
  }
  
  const guardado = await guardarBiblioteca();
  
  if (guardado) {
    mostrarNotificacion('✅ Cambios guardados en MongoDB!', 'success');
  } else {
    mostrarNotificacion('⚠️ Error al guardar en la base de datos', 'warning');
  }
  
  actualizarEstadisticasBiblioteca();
  cerrarModal();
  
  // Reabrir el modal actualizado
  setTimeout(() => mostrarBibliotecaCompleta(), 300);
}

function actualizarEstadisticasBiblioteca() {
  const statCards = document.querySelectorAll('.stat-card');
  const categorias = ['videojuegos', 'anime', 'peliculas', 'series'];

  statCards.forEach((card, index) => {
    const cantidad = database.biblioteca[categorias[index]].length;
    card.querySelector('.stat-number').textContent = cantidad;
  });
}

// ============================================
// SISTEMA DE MODALES
// ============================================

function mostrarModal(titulo, contenido) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    `;
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
      border-radius: 10px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 2px solid #e94560;
    ">
      <div style="padding: 1.5rem; border-bottom: 2px solid rgba(233, 69, 96, 0.3); display: flex; justify-content: space-between; align-items: center;">
        <h2 style="color: #e94560; margin: 0;">${titulo}</h2>
        <button onclick="cerrarModal()" style="
          background: transparent;
          border: none;
          color: #e94560;
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="padding: 1.5rem;">
        ${contenido}
      </div>
    </div>
  `;

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      cerrarModal();
    }
  });
}

function cerrarModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

function mostrarNotificacion(mensaje, tipo = 'info') {
  const colores = {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  };

  const notificacion = document.createElement('div');
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colores[tipo]};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  notificacion.textContent = mensaje;

  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

// Animaciones CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);