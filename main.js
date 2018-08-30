var page = {
	title: "ANIDA",
	longTitle: "Atlas Nacional Interactivo de la Argentina",
	description: "Cartografía temática"
}

$(function(){
	$(document).attr("title", page.title);
	$("#home-title").text(page.title);
	$("#home-longtitle").text(page.longTitle);
	$("#home-description").text(page.description);
});

$(document).ready(function () {
	$("#section-page").load( "./contenido.html" );
});