var page = {
	title: "ANIDA",
	longTitle: "Atlas Nacional Interactivo de Argentina",
	description: "Cartografía temática e información georreferenciada con textos explicativos de los temas realizados por especialistas, enriquecidos con contenidos gráficos y multimedia, para consultar y visualizar la información de manera detallada pero atractiva y sencilla de leer e interpretar."
}
var sections = {
	mundo: {
		title : "Argentina y el Mundo",
		description : "Presenta a Argentina en su condición de Estado desde la óptica de la geografía política, proporcionando la información básica necesaria para conocer y comprender la realidad internacional del país, en el pasado y en la actualidad." ,
		menus: ["Rasgos básicos", "Porciones de territorio", "Límites y fronteras internacionales", "Organización política del territorio", "Formación del territorio", "Malvinas e islas del Atlántico Sur", "Antártida", "Inserción internacional"]
	},
	natural: {
		title: "Argentina físico y natural",
		description: "Presenta la gran diversidad de condiciones físicas y naturales de Argentina. Esta sección describe las características de los elementos y procesos físico-naturales del territorio argentino.",
		menus: []
	},
	ambiental: {
		title: "Argentina ambiental",
		description: "Realiza una aproximación al carácter complejo e interrelacionado del ambiente en el que viven los habitantes de Argentina, dado por las múltiples dimensiones que abarca, tanto en el plano de la realidad social como del sistema natural, y las múltiples combinaciones entre estas dos dimensiones, variables en cada momento y lugar de nuestro país.",
		menus: []
	},
	economica: {
		title: "Argentina económica",
		description: "Describe las características cuantitativas, cualitativas y territoriales de la economía argentina, proporcionando la información necesaria para la comprensión y análisis crítico de su enorme potencial, alcances y limitaciones.",
		menus: []
	},
	demografica: {
		title: "Argentina socio-demográfica",
		description: "Describe las características socio-demográficas más destacadas de los habitantes de Argentina, brindando información detallada y actualizada de la población y la sociedad del país de modo que el usuario pueda comprender su situación y realizar un análisis crítico de la temática.",
		menus: []
	},
	administrativa: {
		title: "Argentina político-administrativa",
		description: "Describe el sistema político-administrativo del país y las provincias, proporcionando la información necesaria para la comprensión del sistema de gobierno nacional y provincial y sus principales políticas.",
		menus: []
	}
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