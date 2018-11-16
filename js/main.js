// Declare all functions and Objects before loading content into page
var page, sections, menus;

//Declare Functions
function addItem() {
	sections.forEach(sectionElement => {
	// Adds items in section menu
		var menuHtml = '<a href="#' + sectionElement.id + '"><li><div class="btn-section"><p>' +  sectionElement.title + '</p></div></li></a>';
		$("#section-list ul").append(menuHtml);
		$('a[href$="#' + sectionElement.id + '"] li div').css("background-color", sectionElement.color);
	});
}
function addSection(){
	// Adds sections HTML structure 
	sections.forEach(sectionElement => {
		var sectionHtml = '<section id="' + sectionElement.id + '"><div class="tab full-height"><div><div class="tab-title"><h1></h1><p></p></div></div></div><div class="tab-frame tabcontent"><div class="tabcontent-card"></div></div></section>';
		$("#section-page").append(sectionHtml);
		if (typeof sectionElement.menu != "undefined" && sectionElement.menu != null && sectionElement.menu.length != null  && sectionElement.menu.length > 0) {
			var tabcontentSelector = '#' + sectionElement.id + ' .tabcontent-card';
			sectionElement.menu.forEach(menuElement => {
				console.log(menus[menuElement].url);
				var sectionMenusHtml = '<a target="_blank" href="' + menus[menuElement].url + '"><h3>' + menus[menuElement].title + '</h3></a>';
				$(tabcontentSelector).append(sectionMenusHtml);
			});
		}
	});
}
function loadTabs(){
	// Loads sections title and description into tabs
	$('.tab-title > h1').each(function(i){
		$(this).text(sections[i].title);
		$(this).next().text(sections[i].description);
	});
	$('.tab').each(function(i) {
		$(this).css("background-image", "url(" + sections[i].logo + ")"); // Adds logo within each section's left panel
		$(this).css("background-color", sections[i].color); // Adds section color from JSON
	});
}
function loadChildMenus(){
	if (typeof menu != "undefined" && menu != null && menu.length != null  && menu.length > 0) {	
		var tabcontentSelector = '#' + id + ' .tabcontent-card';
		menu.forEach(menuElement => {
			var childMenusHtml = '<a target="_blank" href="' + menus[menuElement].url + '"><h3>' + menus[menuElement].title + '</h3></a>';
			$(tabcontentSelector).append(childMenusHtml);
		});
	}
}
// Load content strucure
$(document).ready(function () {
	// Load content into page after all functions and Objects are declared
	$.getJSON("js/data.json", function(json) {
		page = json.page;
		sections = json.sections;
		menus = json.menus;
		
		// Set page properties
		function loadPageData() {
			$(document).attr("title", page.title);
			$("#home-title").text(page.title);
			$("#home-longtitle").text(page.longTitle);
			$("#home-description").text(page.description);
		}
		loadPageData();
		addItem();
		addSection();
		loadTabs();
	});
});