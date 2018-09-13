// Declare all functions and Objects before loading content into page
var page = {
	title: "ANIDA",
	longTitle: "Atlas Nacional Interactivo de Argentina",
	description: "Cartografía temática e información georreferenciada con textos explicativos de los temas realizados por especialistas, enriquecidos con contenidos gráficos y multimedia, para consultar y visualizar la información de manera detallada pero atractiva y sencilla de leer e interpretar."
}
var sections = [
	{
		title : "Argentina y el Mundo",
		description : "Presenta a Argentina en su condición de Estado desde la óptica de la geografía política, proporcionando la información básica necesaria para conocer y comprender la realidad internacional del país, en el pasado y en la actualidad." ,
		menus: ["Rasgos básicos", "Porciones de territorio", "Límites y fronteras internacionales", "Organización política del territorio", "Formación del territorio", "Malvinas e islas del Atlántico Sur", "Antártida", "Inserción internacional"]
	},
	{
		title: "Argentina físico y natural",
		description: "Presenta la gran diversidad de condiciones físicas y naturales de Argentina. Esta sección describe las características de los elementos y procesos físico-naturales del territorio argentino.",
		menus: []
	},
	{
		title: "Argentina ambiental",
		description: "Realiza una aproximación al carácter complejo e interrelacionado del ambiente en el que viven los habitantes de Argentina, dado por las múltiples dimensiones que abarca, tanto en el plano de la realidad social como del sistema natural, y las múltiples combinaciones entre estas dos dimensiones, variables en cada momento y lugar de nuestro país.",
		menus: []
	},
	{
		title: "Argentina económica",
		description: "Describe las características cuantitativas, cualitativas y territoriales de la economía argentina, proporcionando la información necesaria para la comprensión y análisis crítico de su enorme potencial, alcances y limitaciones.",
		menus: []
	},
	{
		title: "Argentina socio-demográfica",
		description: "Describe las características socio-demográficas más destacadas de los habitantes de Argentina, brindando información detallada y actualizada de la población y la sociedad del país de modo que el usuario pueda comprender su situación y realizar un análisis crítico de la temática.",
		menus: []
	},
	{
		title: "Argentina político-administrativa",
		description: "Describe el sistema político-administrativo del país y las provincias, proporcionando la información necesaria para la comprensión del sistema de gobierno nacional y provincial y sus principales políticas.",
		menus: []
	}
]

// Load content into page after all functions and Objects are declared
// Set page properties
$(function(){
	$(document).attr("title", page.title);
	$("#home-title").text(page.title);
	$("#home-longtitle").text(page.longTitle);
	$("#home-description").text(page.description);
});
// Load content strucure
$(document).ready(function () {
	$("#section-page").load( "./contenido.html", function(){
		// Load title into tabs
		$('.tab-title > h1').each(function(i){
			$(this).text(sections[i].title);
			$(this).next().text(sections[i].description);
		});

		// Load sections into sections tabs
		$(".tab").append("<div class='secciones'></div>");
		$('.secciones').load( "./secciones.html" );
	} );
});

