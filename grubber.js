var apiUrl = "https://grub-api.heroku.com/v1"

var latitude = 0.0;
var longitude = 0.0;
var isLogin = false;
var selectedPlaceId = 0;

var AlertTypeEnum = {
	success: { value: 0, name: "Success" },
	error: { value: 0, name: "Error" }
};

var RequestTypeEnum = {
	get: { value: 0, name: "GET" },
	post: { value: 1, name: "POST" },
	patch: { value: 2, name: "PATCH" }
};

var GenreEnum = {
	0: { value: 0, name: "Asian" },
	1: { value: 1, name: "Mexican" },
	2: { value: 2, name: "Italian" },
	3: { value: 3, name: "Indian" },
	4: { value: 4, name: "American" },
	5: { value: 5, name: "French" }
};

var ServiceTypeEnum = {
	0: { value: 0, name: "Fast-Food" },
	1: { value: 1, name: "Traditional" },
	2: { value: 2, name: "Fine Dining" },
	3: { value: 3, name: "Bar" },
	4: { value: 4, name: "Bistro" },
	5: { value: 5, name: "Cafe" },
	6: { value: 6, name: "Counter" }
};

/* 
	ONLOAD, MENU
*/

function init() {
	configureViewForLogin();
	configureViewForPlaces();
}

function configureViewForLogin() {
	var usernameFromStorage = localStorage.getItem("username");
	if (!checkIfLoggedIn()) {
		return;
	} else {
		document.getElementById('loginModalId').style.display = "none";
		document.getElementById("registerButtonId").style.display = 'none';
		document.getElementById("loginButtonId").style.display = 'none';
		var usernameText = document.getElementById("usernameTextId");
		usernameText.style.display = 'block';
		document.getElementById("logoutButtonId").style.display = 'block';
		usernameText.textContent = usernameFromStorage;
	}
}

function configureViewForPlaces(requestPath, callback) {
	if (!checkIfLoggedIn()) {
		return;
	} else {
		document.getElementsByClassName("addPlaceFormDiv")[0].style.display = 'none';
		var placeInfo = document.getElementsByClassName("placesDiv")[0];
		placeInfo.style.display = "none"
		var requestType = RequestTypeEnum.get.name;
		var urlString = "/places";
		if (requestPath) {
			urlString += requestPath;
		}
		var parameters = null;
		var places = new Array();
		executeRequest(requestType, urlString, parameters, function(json) {
			for (var i = 0; i < json.length; i++) {
				places.push(json[i]);
			}
			if (!!json && json.constructor !== Array) {
				places.push(json);
				if (callback) {
					callback(json);
					placeInfo.style.display = "block";
				}
			}
			createPlacesList(places);
		})
	}
}

function bottomBarPlacePressed(button) {
	var urlString = "/genre/"
	if (button === "Asian") {
		urlString += GenreEnum[0].value;
		configureViewForPlaces(urlString);
	} else if (button === "Mexican") {
		urlString += GenreEnum[1].value;
		configureViewForPlaces(urlString);
	} else if (button === "Italian") {
		urlString += GenreEnum[2].value;
		configureViewForPlaces(urlString);
	} else if (button === "Indian") {
		urlString += GenreEnum[3].value;
		configureViewForPlaces(urlString);
	} else if (button === "American") {
		urlString += GenreEnum[4].value;
		configureViewForPlaces(urlString);
	} else if (button === "French") {
		urlString += GenreEnum[5].value;
		configureViewForPlaces(urlString);
	} else if (button === "All") {
		configureViewForPlaces(null);
	} else if (button === "Random") {
		var randomUrl = "/random";
		configureViewForPlaces(randomUrl, function(place) {
			selectedPlace(place);
		});
	}
}


/* 
	SEARCH
*/

function searchButtonPressed() {
	if (!checkIfLoggedIn()) {
		showAlert(AlertTypeEnum.error.name, 'Login or create a user to begin');
		return
	}
	var searchInputValue = document.getElementById('searchInputId');
	if (typeof searchInputValue !== "undefined" && searchInputValue.value == '') {
		showAlert(AlertTypeEnum.error.name, 'Enter a keyword or a place');
	} else if (latitude === longitude) {
		showAlert(AlertTypeEnum.error.name, 'Set an area before searching');
	} else if (localStorage.getItem("access_token") === null) {
		showAlert(AlertTypeEnum.error.name, 'Log in to search');
	} else {
		searchPlaces(searchInputValue.value);
	}
}

function areaButtonPressed() {
	if (!checkIfLoggedIn()) {
		showAlert(AlertTypeEnum.error.name, 'Login or create a user to begin');
		return
	}
	var areaInputValue = document.getElementById('areaInputId');
	if (typeof areaInputValue !== "undefined" && areaInputValue.value == '') {
		showAlert(AlertTypeEnum.error.name, 'Enter an area or location');
	} else {
		geocodeAddress(areaInputValue.value, function() {
			document.getElementById('areaSubmitButton').style.backgroundColor = '#207cca';
		})
	}
}

function searchPlaces(searchKeyword) {
	var places = new Array();
	let requestType = RequestTypeEnum.post.name;
	let urlString = "/places/location/search";
	var data = JSON.stringify({
		"name": searchKeyword,
		"latitude": latitude,
		"longitude": longitude,
		"radius": 3218
	});
	executeRequest(requestType, urlString, data, function(json) {
		for (var i = 0; i < json.length; i++) {
			places.push(json[i]);
		}
		createSearchResultsList(places);
	});
}

function createSearchResultsList(places) {
	var table = document.getElementsByClassName("searchResultsDiv")[0];
	table.innerHTML = "";
	document.getElementsByClassName("placesDiv")[0].style.display = "none";
	for (var i = 0; i < places.length; i++) {
		var searchDataDiv = document.createElement("div");
		searchDataDiv.setAttribute("class", "searchDataDiv");
		table.appendChild(searchDataDiv);
	}
	configureSearchObject(places);
}

function configureSearchObject(places) {
	var arrayOfSearchDataDiv = document.getElementsByClassName("searchDataDiv");
	for (var i = 0; i < arrayOfSearchDataDiv.length; i++) {
		(function(index) {
			arrayOfSearchDataDiv[i].appendChild(buildSearchObject(places[i]));
			arrayOfSearchDataDiv[i].onclick = function() {
				selectedSearchResult(places[index]);
			}
		})(i);
	};
}

function buildSearchObject(place) {
	var searchObjectDiv = document.createElement("div");
	searchObjectDiv.id = "searchObject";
	searchObjectDiv.innerHTML += "<b>" + place.name + "</b><br>";
	searchObjectDiv.innerHTML += place.location;
	return searchObjectDiv;
}

/*
	SEARCH 
	ADD PLACE FORM
*/

function selectedSearchResult(place) {
	if (place.id) {
		document.getElementById("addPlaceButtonId").value = "Save Edit";
	}
	document.getElementsByClassName("placesDiv")[0].style.display = "none";
	document.getElementsByClassName("addPlaceFormDiv")[0].style.display = 'block';
	document.getElementById("addPlaceFormNameId").value = place.name;
	document.getElementById("addPlaceFormLocationId").value = place.location;
	if (place.website_url) {
		document.getElementById("addPlaceFormWebsiteId").value = place.website_url;
		if (place.menu_url) {
			document.getElementById("addPlaceFormMenuId").value = place.menu_url;
		}
	}
	if (place.genre) {
		document.getElementById("genreDropdownSelect").selectedIndex = place.genre;
		if (place.service_type) {
			document.getElementById("serviceTypeDropdownSelect").selectedIndex = place.genre;
		} 
	}
	var costRating = document.getElementsByName("price");
	for (var i = 0; i < costRating.length; i++) {
		if (place.cost === parseInt(costRating[i].value)) {
			costRating[i].checked = true;
		} else if (place.cost === null) {
			costRating[i].checked = false;
		}
	};
}

function addPlaceButtonPressed() {
	var name = document.getElementById("addPlaceFormNameId").value;
	var location = document.getElementById("addPlaceFormLocationId").value;
	var genre = document.getElementById("genreDropdownSelect").selectedIndex;
	var serviceType = document.getElementById("serviceTypeDropdownSelect").selectedIndex;
	var websiteUrl = document.getElementById("addPlaceFormWebsiteId").value;
	var menuUrl = document.getElementById("addPlaceFormMenuId").value;
	var cost = 0;
	var costRating = document.getElementsByName("price");
	var requestType = RequestTypeEnum.post.name;
	var urlString  = "/places";
	if (selectedPlaceId) {
		urlString = "/places/" + '' + selectedPlaceId;
		requestType = RequestTypeEnum.patch.name;
	} 
	for (var i = 0; i < costRating.length; i++) {
		if (costRating[i].checked === true) {
			cost = parseInt(costRating[i].value);
		}
	}
	var placeJson = JSON.stringify({
		"name": name,
		"location": location,
		"genre": genre,
		"service_type": serviceType,
		"website_url": websiteUrl,
		"menu_url": menuUrl,
		"cost": cost
	});
	executeRequest(requestType, urlString, placeJson, function(json) {
		configureViewForPlaces()
	})
}

function selectedGenre() {}

function selectedType() {}

/* 
	PLACES LIST 
*/

function createPlacesList(places) {
	var table = document.getElementsByClassName("searchResultsDiv")[0];

	table.innerHTML = "";
	for (var i = 0; i < places.length; i++) {
		var placeDataDiv = document.createElement("div");
		placeDataDiv.setAttribute("class", "placeDataDiv");
		table.appendChild(placeDataDiv);
	}
	configurePlaceObject(places);
}

function configurePlaceObject(places) {
	var arrayOfPlaceDataDiv = document.getElementsByClassName("placeDataDiv");
	for (var i = 0; i < arrayOfPlaceDataDiv.length; i++) {
		(function(index) {
			arrayOfPlaceDataDiv[i].appendChild(buildBackgroundRating(places[i]));
			arrayOfPlaceDataDiv[i].appendChild(buildPlaceInfoArea(places[i]));
			arrayOfPlaceDataDiv[i].appendChild(buildURLSection(places[i]));
			arrayOfPlaceDataDiv[i].onclick = function() {
				selectedPlace(places[index])
			}
		})(i);
	}
}

function buildPlaceInfoArea(place) {
	var mainWrapperDiv = document.createElement("div"); 
	mainWrapperDiv.id = "placeInfoWrapper";
	var textInfoDiv = document.createElement("div"); 
	textInfoDiv.id = "placeTextInfo";
	textInfoDiv.innerHTML += "<b>" + place.name + " </b></br>";
	textInfoDiv.innerHTML += place.location + "</br>";
	textInfoDiv.innerHTML += GenreEnum[place.genre].name + "</br>";
	textInfoDiv.innerHTML += ServiceTypeEnum[place.service_type].name + "</br>";
	var costString = "";
	for (var i = 0; i <= place.cost; i++) {
		costString += "<i class='fa fa-money fa-lg'></i> ";
	} 
	textInfoDiv.innerHTML += costString;
	mainWrapperDiv.appendChild(textInfoDiv);
	return mainWrapperDiv;
}

function buildBackgroundRating(place) {
	var mainWrapperDiv = document.createElement("div");
	if (place.service_average == null || place.food_average == null)  {
		return document.createDocumentFragment();
	}
	mainWrapperDiv.id = "backgroundRatingWrapper";
	var averageDiv = document.createElement("div");
	var rated = displayServiceAndFoodRating(Math.floor(place.service_average), Math.floor(place.food_average));
	rated[0].id = "placeServiceAverage";
	rated[1].id = "placeFoodAverage";
	averageDiv.appendChild(rated[0]);
	averageDiv.appendChild(rated[1]);
	mainWrapperDiv.appendChild(averageDiv);
	return mainWrapperDiv;
}

function buildURLSection(place) {
	var urlDiv = document.createElement("div");
	urlDiv.id = "urlDiv";

	if (place.website_url) {
		urlDiv.innerHTML += "<br><a title='Website' target='_blank' href='" + place.website_url.linkify() + "'>Website</a>";
		if (place.menu_url) {
			urlDiv.innerHTML += "<br><a title='Menu' target='_blank' href='" + place.menu_url.linkify() + "'>Menu</a>";
		}
		return urlDiv;
	} else {
		return document.createDocumentFragment();
	}
}

/* 
	PLACE OBJECT 
	MAP, RATE, RATINGS 
*/

function selectedPlace(place) {
	initMap(place)
	selectedPlaceId = place.id;
	var overlay = document.getElementById("overMap");
	overlay.innerHTML = "";
	overlay.innerHTML += "Service Type: " + ServiceTypeEnum[place.service_type].name + "<br>";
	overlay.innerHTML += "Genre: " + GenreEnum[place.genre].name;
	
	var editPlace = document.getElementById("editPlace"); 
	editPlace.onclick = function() {
		selectedSearchResult(place);
	};

	configureViewForRatings();
}

function initMap(place) {
	geocodeAddress(place.location, function(latitude, longitude) {
		var myLatLng = {
			lat: latitude,
			lng: longitude
		};
		var map = new google.maps.Map(document.getElementById('smallPlaceMap'), {
			zoom: 15,
			center: myLatLng
		});
		var marker = new google.maps.Marker({
			position: myLatLng,
			map: map,
			label: {
				color: 'black',
				fontWeight: 'bold',
				text: place.name,
			}
		});
	})
}

function geocodeAddress(address, callback) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({
		'address': address
	}, function(results, status) {
		if (status === 'OK') {
			latitude = results[0].geometry.location.lat();
			longitude = results[0].geometry.location.lng();
			callback(latitude, longitude);
		} else {
			showAlert(AlertTypeEnum.error.name, 'Geocode was not successful for the following reason: ' + status);
		}
	});
}

function placeRatingButtonPressed() {
	var serviceRatingNumber = 0;
	var serviceRating = document.getElementsByName("serviceRating");
	for (var i = 0; i < serviceRating.length; i++) {
		if (serviceRating[i].checked === true) {
			serviceRatingNumber = parseInt(serviceRating[i].value);
		}
	}
	var foodRatingNumber = 0;
	var foodRating = document.getElementsByName("foodRating");
	for (var i = 0; i < foodRating.length; i++) {
		if (foodRating[i].checked === true) {
			foodRatingNumber = parseInt(foodRating[i].value);
		}
	}
	var commentText = document.getElementById("placeRatingTextArea").value;
	var defaultText = "Comments? (Optional)";
	var ratingText = (commentText === defaultText || commentText === "") ? "" : commentText; 
	
	var requestType = RequestTypeEnum.post.name;
	var username = localStorage.getItem("username");
	var urlString = "/ratings";
	var data = JSON.stringify({ 
		"username": username,
		"place_id": selectedPlaceId,
		"food": foodRatingNumber,
		"service": serviceRatingNumber,
		"comment": ratingText
	});
	
	executeRequest(requestType, urlString, data, function(json) {
		//When I get Users tied to Ratings uncomment
		//document.getElementById("addPlaceRating").style.display = "none"
		configureViewForRatings(function() {
			configureViewForPlaces();
			resetPlaceRatingDiv();
		});
		document.getElementById("placeRatings").innerHTML = "";
	});
}


function resetPlaceRatingDiv() {
	var serviceRating = document.getElementsByName("serviceRating");
	var foodRating = document.getElementsByName("foodRating");
	for (var i = 0; i < foodRating.length; i++) {
		foodRating[i].checked = false;
	}
	for (var i = 0; i < serviceRating.length; i++) {
		serviceRating[i].checked = false;
	}
	document.getElementById("placeRatingTextArea").value = "Comments? (Optional)";
	var placeRatingDiv = document.getElementById("addPlaceRating");
	placeRatingDiv.style.cssText = "opacity: 0.4; pointer-events: none;";
}

function configureViewForRatings(callback) {
	document.getElementsByClassName("placesDiv")[0].style.display = "block";
	document.getElementsByClassName("addPlaceFormDiv")[0].style.display = "none";
	document.getElementById("placeRatings").innerHTML = "";
	var placeRatingDiv = document.getElementById("addPlaceRating");
	placeRatingDiv.style.cssText = "opacity: 1.0; pointer-events: auto;";
	var requestType = RequestTypeEnum.get.name;
	var urlString = "/places/" + '' + selectedPlaceId;
	var array = [];
	var data = JSON.stringify({});
	executeRequest(requestType, urlString, data, function(json) {
		if (json[1].ratings !== []) {
			createRatingsList(json[1].ratings);
			if (callback) callback(); 
		} else {
			return;
		}
	});
}

function createRatingsList(ratings) {
	var table = document.getElementById("placeRatings");
	if (ratings.length === 0) {
		table.style.display = "none";
	} else {
		table.style.display = "block";
	}
	for (var i = 0; i < ratings.length; i++) {
		var ratingDiv = document.createElement("div");
		ratingDiv.className = "ratingObject";
		ratingDiv.id = "ratingObject";
		table.appendChild(ratingDiv);
	}
	configureRatingObject(ratings);
}

function displayServiceAndFoodRating(serviceCount, foodCount) {
	var serviceDiv = document.createElement("div");
	serviceDiv.setAttribute("id", "serviceDiv");
	var foodDiv = document.createElement("div");
	foodDiv.setAttribute("id", "foodDiv");
	for (var i = 0; i <= 4; i++) {
		var service = document.createElement("i");
		service.className = "fa fa-diamond";
		if (i <= serviceCount) {
			service.style.color = "#207cca";
		} else {
			service.style.color = "rgba(162, 162, 162, 0.62)"; 
		}
		serviceDiv.append(service);
	}
	for (var i = 0; i <= 4; i++) {
		var food = document.createElement("i");
		food.className = "fa fa-cutlery";
		if (i <= foodCount) {
			food.style.color = "#207cca";
		} else {
			food.style.color = "rgba(162, 162, 162, 0.62)";
		}
		foodDiv.append(food);
	}
	return [serviceDiv, foodDiv];
}

function configureRatingObject(ratings) {
	var placeRatings = document.getElementById("placeRatings");
	if (ratings.length < 1) {
		placeRatings.innerHTML = "";
	};
	var arrayOfRatingDiv = document.getElementsByClassName("ratingObject");
	for (var i = 0; i < arrayOfRatingDiv.length; i++) {
		arrayOfRatingDiv[i].append(buildRatingObject(ratings[i]));
	};
}

function buildRatingObject(rating) {
	var mainWrapperDiv = document.createElement("div"); 
	mainWrapperDiv.id = "ratingInfoWrapper";
	var ratingInfoDiv = document.createElement("div"); 
	ratingInfoDiv.id = "ratingInfoObject";
	var serviceAndFoodRating = displayServiceAndFoodRating(rating.service, rating.food)
	serviceAndFoodRating[0].style.fontSize = "20px";
	serviceAndFoodRating[0].style.letterSpacing = "0px";
	serviceAndFoodRating[1].style.fontSize = "20px";
	serviceAndFoodRating[1].style.letterSpacing = "8px";

	ratingInfoDiv.style.cssFloat = "left";
	ratingInfoDiv.innerHTML += "<i>" + "Service Rating</i>";
	ratingInfoDiv.appendChild(serviceAndFoodRating[0]);
	ratingInfoDiv.innerHTML += "<i>" + "Food Rating</i>";
	ratingInfoDiv.appendChild(serviceAndFoodRating[1]);
	if (rating.comment) {
		ratingInfoDiv.innerHTML += "<br><i><b>" + rating.username + "</b> says, </i>'" + rating.comment + "'";
	}
	mainWrapperDiv.appendChild(ratingInfoDiv);
	return mainWrapperDiv;
}

/* 
	LOGIN & REGISTER
*/

function loginButtonPressed() {
	document.getElementById("loginModalText").textContent = "Login";
	document.getElementById("modalLoginButtonId").value = "Login";
	document.getElementById("confirmPasswordId").style.display = "none";
	document.getElementsByClassName("loginModalContent")[0].style.height = "250px";
	document.getElementsByClassName("loginInputList")[3].style.marginTop = "0px";
	document.getElementById('loginModalId').style.display = "block";
	isLogin = true;
}

function registerButtonPressed() {
	document.getElementById("loginModalText").textContent = "Register";
	document.getElementById("modalLoginButtonId").value = "Register";
	document.getElementById("confirmPasswordId").style.display = "block";
	document.getElementsByClassName("loginModalContent")[0].style.height = "300px";
	document.getElementsByClassName("loginInputList")[3].style.marginTop = "8px";
	document.getElementById('loginModalId').style.display = "block";
	isLogin = false;
}

function closeButtonPressed() {
	document.getElementById('loginModalId').style.display = "none";
}

function modalLoginButtonPressed() {
	var username = document.getElementById("usernameId");
	var password = document.getElementById("passwordId");
	var confirmPassword = document.getElementById("confirmPasswordId");
	if (typeof username !== "undefined" && username.value == '') {
		showAlert(AlertTypeEnum.error.name, 'Enter an username');
		return;
	} else if (typeof password !== "undefined" && password.value == '') {
		showAlert(AlertTypeEnum.error.name, 'Enter a password');
		return;
	} else if (password.value.length < 5) {
		showAlert(AlertTypeEnum.error.name, 'Password needs to be at least 6 characters');
		return;
	} else {
		if (!isLogin) {
			if (password.value !== confirmPassword.value) {
				showAlert(AlertTypeEnum.error.name, 'Re-entered password does not match password');
				return;
			}
		}
		attemptLogin(username.value, password.value);
		username.value = '';
		password.value = '';
		confirmPassword.value = '';
	}
}

function logoutButtonPressed() {
	localStorage.removeItem("username");
	localStorage.removeItem("access_token");
	document.getElementById("registerButtonId").style.display = 'block'
	document.getElementById("loginButtonId").style.display = 'block'
	document.getElementById("usernameTextId").style.display = 'none';
	document.getElementById("logoutButtonId").style.display = 'none';
	isLogin = false;
	reset();
}

function checkIfLoggedIn() {
	if (localStorage.getItem("username") === null || localStorage.getItem("access_token") === null) {
		return false;
	} 
	return true 
}

function reset() {
	document.getElementsByClassName("searchResultsDiv")[0].style.display = "none";
	document.getElementsByClassName("placesDiv")[0].style.display = "none";
	document.getElementsByClassName("addPlaceFormDiv")[0].style.display = "none";
}

function attemptLogin(username, password) {
	var requestType = RequestTypeEnum.post.name;
	var urlString = "";
	if (isLogin) {
		urlString = "/login";
	} else {
		urlString = "/register";
	}
	var data = JSON.stringify({
		"username": username,
		"password": password
	});
	executeRequest(requestType, urlString, data, function(json) {
		localStorage.setItem("username", json.user.username);
		localStorage.setItem("access_token", json.user.access_token);
		isLogin = true;
		configureViewForLogin();
		configureViewForPlaces();
		showAlert(AlertTypeEnum.success.name, "Successful Login or Registration");
	});
}

/*
	URLREQUEST, ALERT, REUSABLE FUNCTIONS
*/

function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
    console.log(url);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

function executeRequest(requestType, urlString, parameters, callback) {
	var accessToken = localStorage.getItem("access_token");
	var registerUrl = "https://grub-api.heroku.com/v1" + urlString;
	var xhr = createCORSRequest(requestType, registerUrl);
	xhr.setRequestHeader("Content-Type", "application/json");
	if (accessToken !== null) {
		xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
	} 
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				var json = JSON.parse(xhr.responseText);
				callback(json);
			} else {
				console.log("Request failed:" + requestType, registerUrl, parameters, xhr.responseText);
				showAlert(AlertTypeEnum.error.name, "Error: " + xhr.statusText)
			}
		}
	}
	if (requestType === "POST" || requestType === "PATCH") {
		xhr.send(parameters);
	} else {
		xhr.send();
	}
}

function dismissAlert() {
	var container = document.getElementById("alert");
	container.style.display = "none";
}

function showAlert(alertType, message) {
	var container = document.getElementById("alert");
	container.style.display = "block";
	var alert = document.getElementById("alertBanner");
	alert.setAttribute("class", "alertDrop");
	if (alertType === AlertTypeEnum.success.name) {
		alert.style.backgroundColor = "#009966";
		alert.innerHTML = "<i class='fa fa-check-circle'></i> " + message;
	} else if (alertType === AlertTypeEnum.error.name) {
		alert.style.backgroundColor = "#c4453c";
		alert.innerHTML = "<i class='fa fa-warning'></i> " + message;
	}
	setTimeout(function() {
		hideAlert()
	}, 3000);
}

function hideAlert() {
	var alert = document.getElementById("alertBanner");
	alert.setAttribute("class", "alertHide");
	setTimeout(function() {
		var container = document.getElementById("alert");
		container.style.display = "none";
	}, 1000);
}

window.onclick = function(event) {
	if (event.target == document.getElementById('loginModalId')) {
		document.getElementById('loginModalId').style.display = "none";
	}
}

if (!String.linkify) {
	String.prototype.linkify = function() {
		// http://, https://, ftp://
		var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
		// www. sans http:// or https://
		var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
		// Email addresses
		var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;
		return this.replace(urlPattern, '<a href="$&">$&<\/a>').replace(pseudoUrlPattern, '$1<a href="http://$2">$2<\/a>').replace(emailAddressPattern, '<a href="mailto:$&">$&<\/a>');
	};
} 