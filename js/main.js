// Declare all functions and Objects before loading content into page
var page, sections, menus;

//Declare Functions
		
// Set page properties
function loadPageData() {
	$(document).attr("title", page.title);
	$("#home-title").text(page.title);
	$("#home-longtitle").text(page.longTitle);
	$("#home-description").text(page.description);
}
function addItem() {
	sections.forEach(sectionElement => {
	// Adds items in section menu
		var menuHtml = '<a href="#' + sectionElement.id + '"><li><div class="btn-section"><p>' +  sectionElement.title + '</p></div></li></a>';
		$("#section-list ul").append(menuHtml);
		$('a[href$="#' + sectionElement.id + '"] li div').css("background-color", sectionElement.color);
	// Adds items to sidebar (dots)
		var sideItem = '<li><a href="#' + sectionElement.id + '"><code>&#9679</code></a><div class="sideTooltip">' + sectionElement.title + '</div></li>';
		$(".sidebarList").append(sideItem);
	});
}
function addSections(){
	// Adds sections HTML structure 
	sections.forEach(sectionElement => {
		var sectionHtml = '<section id="' + sectionElement.id + '"><div class="tab full-height"><div><div class="tab-title"><h1></h1><p></p></div></div></div><div class="tab-frame tabcontent full-height"><div class="tabcontent-card full-height"></div></div></section>';
		$("#section-page").append(sectionHtml);
		if (typeof sectionElement.menu != "undefined" && sectionElement.menu != null && sectionElement.menu.length != null  && sectionElement.menu.length > 0) {
			var tabcontentSelector = '#' + sectionElement.id + ' .tabcontent-card';
			sectionElement.menu.forEach(menuElement => {
				var sectionMenusHtml = '<a target="_blank" href="' + menus[menuElement].url + '"><h3 id="' + menuElement + '">' + menus[menuElement].title + '</h3></a>';
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
	// Adds child menus
	if (menus !== 'undefined' && menus !== null && menus != null) {
		// Iterate over menus and add each child to it's parent		
		var lastParentMenu = ''; // watch parent menu iteration
		Object.keys(menus).forEach(function(menuElement){
			if(typeof menus[menuElement].parent !== 'undefined'){
				var childMenusSelector = '#' + menus[menuElement].parent;
				if (lastParentMenu != menus[menuElement].parent) { // if this parent menu has no <ul>
					lastParentMenu = menus[menuElement].parent;
					$(childMenusSelector).parent().append('<ul id="ul-' + lastParentMenu + '" class= "no-li-style"></ul>');
				}
				var childMenusHtml = '<li><a target="_blank" href="' + menus[menuElement].url + '"><h3 id="' + menuElement +'">' + menus[menuElement].title + '</h3></a></li>';
				var childMenuUl = '#ul-' + lastParentMenu;
				$(childMenuUl).append(childMenusHtml);
			}
		});
	};
}
function toggleMenu(x) {
    x.classList.toggle("change");
    $('#colaboradores').toggleClass('hide');
} 
// Load content strucure
$(document).ready(function () {
	// Load content into page after all functions and Objects are declared
	$.getJSON("js/data.json", function(json) {
		page = json.page;
		sections = json.sections;
		menus = json.menus;

		loadPageData();
		addItem();
		addSections();
		loadTabs();
		loadChildMenus();
	});
});