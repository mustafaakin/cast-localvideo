var express = require("express");
var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;
var Metalib = require('fluent-ffmpeg').Metadata;
var os = require("os");
var app = express();
app.set('view engine', 'jade');
app.set('view options', {layout: false});
app.use(express.json());
app.use(express.urlencoded());
app.use( express.cookieParser() );
app.use(express.logger("dev"));
app.use(express.static(__dirname + '/public'));

app.get("/", function(req,res){
	var interfaces = os.networkInterfaces();
	res.render("index", {interfaces: interfaces});
});

app.get("/sample", function(req,res){
	res.render("sample");
});

app.post("/files", function(req,res){
	var dir = req.body.dir;
	var entries = fs.readdirSync(dir);
	
	var files = [];
	var folders = [];

	folders.push({
		path: path.join(dir, ".."),
		name: "Up"
	});

	for(var i in entries){
		try {
			var p = path.join(dir, entries[i]);
			var stat = fs.statSync(p);
			if ( stat.isDirectory() ){
				folders.push({
					path: p,
					name: require("path").basename(p)
				});
			} else if ( stat.isFile()){
				files.push({
					path: p,
					name: require("path").basename(p)
				});
			}	
		} catch (ex){
		
		}
	}
	res.render("files", {folders: folders, files: files});
});

app.post("/getFile", function(req,res){
	var dir = req.body.dir;
	res.sendFile(dir);
});

app.get("/video/*", function(req,res){
	res.writeHead(200, {
		'Content-Type': 'video/mp4'
	});

	// It may be wiser to encode it, since we can hit GET path limit
	var dir = req.url.split("/").splice(2).join("/");
	var buf = new Buffer(dir, 'base64');
	var src = buf.toString();

    var Transcoder = require('./transcoder.js');
    // Start ffmpeg    
    var stream = fs.createReadStream(src);
	
	// Feel free to change those, but libx264 is faster than vp8
	// A resize mechanism can be used
	new Transcoder(stream)
        .videoCodec('libx264')
        .audioCodec("libvo_aacenc")
        .sampleRate(44100)
        .channels(2)
        .audioBitrate(128 * 1000)
        .format('mp4')
        .on('finish', function() {
        	console.log("ffmpeg process finished");
        })
        .stream().pipe(res);
});

app.post("/metadata", function(req,res){
	var file = req.body.file;
	console.log("Metadata of", file, "requested");
	var metaObject = new Metalib(file, function(metadata, err) {
		metadata.path = file;
		res.render("metadata", metadata);
	});
});


console.log("Open http://localhost:8000/ at your Chrome browser.");
app.listen(8000);