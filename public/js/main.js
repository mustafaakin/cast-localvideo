$(document).ready(function() {
	var currentFolder = "";
	var homeFolder = "";

	function init(){
		currentFolder = $("#currentPathInput").val();
		homeFolder = currentFolder;
		getDirFromHash();
		History.replaceState(null,null,"/dir/"+currentFolder);
		// Chrome deviates from the spec and fires this immediately. :( No harm done though. Fixed in Chrome 34.
		History.Adapter.bind(window, 'popstate', getDirFromHash);
	}

	function getDirFromHash(){
		var State = History.getState();
		var url = State.hash;
		console.log(url);
		var dir = ""
		if(url.indexOf("/dir/")===0){
			dir = decodeURI(url.substring(5));
		} else {
			dir = homeFolder;
		}
		loadFoldersAndFiles(dir);
	}

	function loadFoldersAndFiles(folder) {
		var formValues = "dir=" + encodeURIComponent(folder);
		console.log(formValues);
		$.post("/folders", formValues, function(data) {
			$("#folderList").html(data);
			currentFolder = folder;
			$("#currentPathInput").val(currentFolder);
			History.pushState(null,null,"/dir/"+currentFolder);
		});
		$.post("/files", formValues, function(data) {
			$("#fileList").html(data);
		});
	}

	function loadMetaData(file) {
		var formValues = "file=" + encodeURIComponent(file);
		$.post("/metadata", formValues, function(data) {
			$("#metadata").html(data);
		});
	}

	function cdAction() {
		var folder = $("#currentPathInput").val();
		cdFolder(folder);
	}

	function cdFolder(folder) {
		if (typeof folder === "undefined"){
			var folder = $("#currentPathInput").val();
		}
		History.pushState(null,null,"/dir/"+folder);
		loadFoldersAndFiles(folder);
	}

	init();

	$("#setFolderBtn").click(cdAction);

	$('#currentPathInput').keyup(function(e){
		if(e.keyCode == 13)
		{
			cdAction();
		}
	});

	$(".folder").live("click", function(e) {
		e.preventDefault();
		var path = $(this).attr("href");
		cdFolder(path);
	});

	$(".file").live("click", function(e) {
		e.preventDefault();
		var path = $(this).attr("href");
		loadMetaData(path);
	})

	$("#playHere").live("click", function() {
		var path = $(this).data("path");
		var video = $("#vid").attr("src", "/video/" + btoa(path));
	});

	$("#playCast").live("click", function(){
		var session = null;
		var path = btoa($(this).data("path"));
		var port = 8000;
		var prefix = "/video/";
		var ip = $("input:radio[name=networkInterface]").val();

		function onRequestSessionSuccess(e){
			console.log(e);
			
			session = e;
			var URL = "http://" + ip + ":" + port + prefix + path;
			var mediaInfo = new chrome.cast.media.MediaInfo(URL);
			mediaInfo.contentType = 'video/mp4';
			// Maybe set the duration here

			var request = new chrome.cast.media.LoadRequest(mediaInfo);			
			
			session.loadMedia(request, function(how,media){
				// 
				/*
				media.play(null, function(){
					updateCastStatus("Playing succesfully");
				}, function() {
					updateCastStatus("Cannot play media");					
				});
				*/
			}, function(err){
				updateCastStatus("Media load error: " + err);
			});
		}
		function onLaunchError(e){
			updateCastStatus("Cannot launch: " + e.code);
			console.log(e);
		}
		chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
	});

	function initializeCastApi() {
		var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
		var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
			sessionListener,
			receiverListener);
		chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
	};

	function sessionListener(){
		// I don't care for session now
	}

	function receiverListener(e){
		if ( e == 'available'){
			updateCastStatus("A cast device is enabled");
		} else {
			updateCastStatus("Cast devices not avaiable: " + e);
		}
	}

	function onInitSuccess(){
		updateCastStatus("Cast API initialized properly.")
	}


	function onInitError(err){
		updateCastStatus("Cast API cannot be initialized!! " + err);
	}

	$("input:radio[name=networkInterface]:eq(0)").prop("checked",true);

	if (!chrome.cast || !chrome.cast.isAvailable) {
		setTimeout(initializeCastApi, 1000);
	}

	function updateCastStatus(text){
		$("#castStatus").text(text);
	}
});
