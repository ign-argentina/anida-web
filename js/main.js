function toggleResponsiveNavbar() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

function toggleDropdown(btn) {
  if (window.innerWidth <= 600) {
    var dropdownContent = btn.nextElementSibling;
    dropdownContent.classList.toggle('show');
  }
}

function toggleSubmenu(link, event) {
  if (window.innerWidth <= 600) {
    event.preventDefault();
    var submenu = link.nextElementSibling;
    submenu.classList.toggle('show');
  }
}

// Cerrar menús cuando se hace clic fuera
window.onclick = function (event) {
  if (!event.target.matches('.dropbtn') && !event.target.matches('.dropdown-submenu a')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var submenus = document.getElementsByClassName("dropdown-subcontent");

    for (var i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('show');
    }

    for (var i = 0; i < submenus.length; i++) {
      submenus[i].classList.remove('show');
    }
  }
}

// Crear un objeto con las rutas permitidas
const allowedRoutes = {
  '/': 'index.html',
  '/acercade': 'pages/acercade.html',
  '/contacto': 'pages/contacto.html',
  '/equipo': 'pages/equipo.html',
  '/estructura': 'pages/estructura.html',
  '/recursos': 'pages/recursos.html',
  '/tutoriales': 'pages/tutoriales.html',
  '/argentina_mundo': 'pages/arg_mundo.html',
  '/argentina_ambiental': 'pages/arg_ambiental.html',
  '/argentina_economica': 'pages/arg_econ.html',
  '/argentina_sociodemografica': 'pages/arg_socio_demo.html',
  '/argentina_fisico_natural': 'pages/arg_fisico_natural.html',
};

// Función para manejar el ruteo
function handleRouting() {
  const currentPath = window.location.pathname;

  // Verificar si la ruta está permitida
  if (!allowedRoutes[currentPath]) {
    // Redirigir a página 404 o inicio
    window.location.href = '/404.html';
    return;
  }

// Cargar la página correspondiente
  loadPage(allowedRoutes[currentPath]);
}

// Función para cargar contenido de la página
function loadPage(url) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      document.getElementById('content').innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading page:', error);
    });
}

// Implementar history API para navegación sin recarga
window.addEventListener('popstate', handleRouting);