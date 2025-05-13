function loadMenuColaboradores() {
	$('#menu-toggle-container').load('menu_colaboradores.html');
}

function toggleMenu(x) {
    x.classList.toggle("change");
    $('#colaboradores').toggleClass('hide');
} 

$(document).ready(function () {
	// Load colaboradores menu
	loadMenuColaboradores();
});