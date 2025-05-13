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
