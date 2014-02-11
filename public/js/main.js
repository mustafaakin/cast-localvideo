$(document).ready(function() {
	var currentFolder = $("#currentPathInput").val();

	function loadFiles(folder) {
		var formValues = "dir=" + encodeURIComponent(folder);
		$.post("/files", formValues, function(data) {
			$("#fileList").html(data);
			currentFolder = folder;
			$("#currentPathInput").val(currentFolder);
		});
	}

	function loadMetaData(file) {
		var formValues = "file=" + file;
		$.post("/metadata", formValues, function(data) {
			$("#metadata").html(data);
		});
	}

	$("#setFolderBtn").click(function(){
		var currentFolder = $("#currentPathInput").val();
		loadFiles(currentFolder);
	});


	$(".folder").live("click", function() {
		var path = $(this).data("path");
		loadFiles(path);
	});

	$(".file").live("click", function() {
		var path = $(this).data("path");
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

	loadFiles(currentFolder);

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