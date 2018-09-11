var page = {
	title: "ANIDA",
	longTitle: "Atlas Nacional Interactivo de Argentina",
	description: "Cartografía temática e información georreferenciada con textos explicativos de los temas realizados por especialistas, enriquecidos con contenidos gráficos y multimedia, para consultar y visualizar la información de manera detallada pero atractiva y sencilla de leer e interpretar."
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