// Declare all functions and Objects before loading content into page
var page, sections;

$.getJSON("js/data.json", function(json) {
	page = json.page;
	sections = json.sections;
	loadPageData();
});

// Load content into page after all functions and Objects are declared
// Set page properties
function loadPageData() {
	$(document).attr("title", page.title);
	$("#home-title").text(page.title);
	$("#home-longtitle").text(page.longTitle);
	$("#home-description").text(page.description);
}

// Load content strucure
$(document).ready(function () {
	$("#section-page").load( "./contenido.html", function(){
		// Load title into tabs
		$('.tab-title > h1').each(function(i){
			$(this).text(sections[i].title);
			$(this).next().text(sections[i].description);
		});
		$('.tab').each(function(i) {
			$(this).css("background-image", "url(" + sections[i].logo + ")"); // Adds logo within each section's left panel
		});

		// Load sections into sections tabs
		/*
		$(".tab").append("<div class='secciones'></div>");
		$('.secciones').load( "./secciones.html" );
		*/
	});
});