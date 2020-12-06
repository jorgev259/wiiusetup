var finalZip = new JSZip();
var rateLimit = null;
var rateLimited = false;
var totalSteps = 0;
var finishedSteps = 0;
var setupList;

$.get("data/setup.json", function(list) {
	if(list.length === undefined){
		setupList = list;
	}else{
		setupList = JSON.parse(list);
	}

});

function downloadZip() {
	if(!totalSteps > 0 && finishedSteps >= totalSteps) {
		return;
	}

	finalZip.generateAsync({ type:"blob" ,compression:"DEFLATE"})
		.then(function (blob) {
		try{
			download_msg.find(".toast-message").text( "Once all downloads finish, click 'Download Zip' and extract everything inside " + zipname + ".zip into your SD Card");
		}finally{
			if(window.navigator.userAgent.indexOf("Edge") > -1){
				window.navigator.msSaveBlob(blob, zipname + " (" + timeNow() + ").zip");
			}else{
				saveAs(blob, zipname + " (" + timeNow() + ").zip");
			}
		}
	});
}

function startSetup(data){
	updateRateLimit();
	if(data.start){
		start = data.start;
	}
	if(zipname == undefined && data.zipname){
		zipname = data.zipname;
	}
	download_msg = toastr["warning"]("Once all downloads finish, click 'Download Zip' and extract everything inside the given zip into your SD Card");

	try{
		$('#guide_btn').attr("href",start);
		setupList["otherapp"].url = updatePayload();
		setupList["Soundhax"].url = soundhaxURL();
	}finally{

		$("#inner1").hide();
		$("#inner2").show();

		readList(data.steps);
	}
}

function readList(list){
	for(var i=0;i<list.length;i++){
		var itemName = list[i];
		if(itemName && setupList.hasOwnProperty(itemName)) {
			evaluateItem(itemName);
		}
	}
}

function evaluateItem(itemName) {
	var item = setupList[itemName];
	if(checkReq(item.require)){
		switch(item.type) {
			case "github":
				runGithub(item,itemName);
				break;
			case "direct":
				runDirect(item,itemName);
				break;
			case "torrent":
				if(item.urls){

				}else{
					torrent(item);
				}
				break;
			case "list":
				if(zipname == undefined && item.zipname == undefined){
					zipname = item.zipname;
				}
				readList(item.steps);
				break;
		}
	}
}

function evaluateStep(step, data, name) {
	switch(step.type){
		case "extractFile":
			if(step.fileExtract) {
				if(step.newName == undefined){
					step.newName = step.fileExtract;
				}
				getFileBuffer_zip(data, step.fileExtract, step.path, step.newName);
			} else if(step.files) {
				step.files.forEach(function(fileStep) {
					if(fileStep.newName == undefined){
						fileStep.newName = fileStep.file;
					}
					getFileBuffer_zip(data, fileStep.file, fileStep.path, fileStep.newName);
				});
			} else {
				if(step.fileDelete){
					if(step.fileDelete.files){
						step.fileDelete.files.forEach(function (fileStep){
							deletefile_zip(data, fileStep);
						})
					}else{
						deletefile_zip(data, step.fileDelete);
					}
				}
				extractZip(data, step.path, step.removePath);
			}
			break;

		case "extractFolder":
			extractFolder(data, step.folder, step.path);
			break;

		case "addFile":
			if(step.name){
				addFile(data, step.path, step.name);
			}else{
				addFile(data, step.path, step.file);
			}

			break;

		case "folder":
			folder(step.name);
			break;
			// add more
	}
	progress(name, name + " : Added (∩ ͡° ͜ʖ ͡°)⊃━☆ﾟ");

	finishedSteps++; // kinda
	if(totalSteps === finishedSteps) {
		$('#download_btn').text("Download");
		$('#download_btn').click(function() {
			downloadZip();
		});
	}

	//element.childNodes[element.childNodes.length -1].innerText = "(Added!)";
}

// Prepares files and runs each step passing the downloaded files.
function runGithub(item,name) {
	getGithubRelease(item, function(err, info) {
		item.steps.forEach(function(step) {
			totalSteps++;
			if(step.type==="folder"){
				evaluateStep(step, null, name);
				return;
			};
			var asset = getGithubAsset(info.assets, step.file);
			if(asset === null) {
				console.log("no asset found for " + step.file);
				return;
			}

			getFileBuffer_url(corsURL(asset.browser_download_url), name, function(data) {
				evaluateStep(step, data, name);
			});
		});
	});
}

function runDirect(item,name) {
	totalSteps++;

	getFileBuffer_url(corsURL(item.url), name, function(data) {
		item.steps.forEach(function(step) {
			evaluateStep(step, data, name);
		});
	});
}

function getGithubRelease(options, callback) {
	callback = callback || function(){};

	if(rateLimited) {
		callback(new Error("Rate limited lol :p"));
		return;
	}

	var defaults = {
		repo: "",
		version: "latest"
	};

	options = $.extend(defaults, options);
	if(!options.repo) {
		callback(new Error("Repo name is required"), null);
		return;
	}

	var url = "https://api.github.com/repos/" + options.repo + "/releases";
	if(options.version === "latest") {
		url += "/latest";
	} else if(options.version !== "") {
		url += "/tags/" + options.version;
	}

	$.getJSON(url, function(data) {
		if(options.version === ""){
			var versionCount = 0;
			while(data[versionCount].assets.length == 0){
				versionCount += 1;
			}
			data = data[versionCount];
		}

		callback(null, data);
	}).fail(function(jqXHR) {
		//rateLimit(jqXHR);
	});
}

function getFileBuffer_url(url, name, callback) {
	console.log("Downloading " + url);
	callback = callback || function(){};

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.responseType = "arraybuffer";

	xhr.onload = function () {
		if(this.status !== 200) {
			console.log(this.status);
			// TODO: handle error with callback
			return;
		}

		var fileBlob = new Blob([xhr.response]);

		console.log("Downloaded " + url);
		progress(name,name + ": Download Finished");
		if(url.endsWith('.zip')){
			JSZip.loadAsync(fileBlob).then(function (data) {
				callback(data);
			});
		} else {
			callback(fileBlob);
		}
	};

	xhr.onprogress = function (e) {
		if (e.lengthComputable) {
			var percent = Math.floor((e.loaded / e.total) * 100);
			progress(name,percent,"progress");
			//element.childNodes[element.childNodes.length -1].innerText = "(" + percent + ")";
		}
	};

	xhr.onerror = function(){
		console.log(this.status);
		getFileBuffer_url(url,name);
	};

	xhr.send();
	progress(name,name + ": <progress max=100 value=0 id='" + name + "_progress'></progress>");
}

function getFileBuffer_zip(data, originalName, path, newName){
	//should work with relative and not absolute names (not implemented)
	newName = newName || originalName;

	try {
		data.file(originalName).async("arraybuffer").then(function(content){
			addFile(content, path, newName);
		});
	} catch(e) {
		console.log("Could not get " + originalName + " from some zip file");
		console.log(data);
	}

}

function extractFolder(data, folder, path){
	var file_count2 = 0;

	Object.keys(data.files).forEach(function(filename){
		var file = data.files[filename];
		if (file.dir || !filename.startsWith(folder)) {
			file_count2++;
			return;
		}

		file.async("arraybuffer").then(function(content) {
			file_count2++;
			addFile(content, path, filename);
		});
	});
}

function extractZip(data, path, removePath){
	//progress(bufferName, bufferName + ": Extracting");
	var fileCount = 0;

	Object.keys(data.files).forEach(function(key){
		var file = data.files[key];
		var filename = file.name;
		if(removePath != ""){
			filename = filename.replace(removePath + "/", "");
		};

		if (file.dir) {
			fileCount++;
			return;
		}

		file.async("arraybuffer").then(function(content) {
			fileCount++;
			addFile(content, path, filename);
		});
	});
}

function addFile(buffer, path, filename) {
	if(path === ""){
		finalZip.file(filename, buffer);
	} else {
		finalZip.folder(path).file(filename, buffer);
	}
}

function deletefile_zip(data, filename){
	data.remove(filename);
}

function folder(name){
	finalZip.file(name + "/dummy.txt", "i love ice cream");
	finalZip.remove(name + "/dummy.txt");
}

function loadRateLimit() {
	$.getJSON("https://api.github.com/rate_limit", function(data){
		rateLimit = data.resources.core;
		updateRateLimit(true);
		setTimeout(loadRateLimit, 20000);
	});
}

function updateRateLimit(noTimeout) {
	if(typeof noTimeout === "undefined") {
		noTimeout = false;
	}

	if(!rateLimit) {
		loadRateLimit();
		return;
	}

	var reset = (new Date(rateLimit.reset * 1000));
	var now = (new Date()) * 1;
	var delta = Math.floor((reset - now) / 1000);
	/*$('#rl').text("Rate limit: " + delta + " seconds until reset. ")
            .append(rateLimit.remaining + "/" + rateLimit.limit + " remaining");*/

	rateLimited = rateLimit.remaining === 0;
	if(delta <= 0) {
		loadRateLimit();
	}

	if(!noTimeout) {
		setTimeout(updateRateLimit, 500);
	}
}

function corsURL(url) {
	return "https://cors-anywhere.herokuapp.com/" + url;
}

function getGithubAsset(assets, filename) {
	if(assets === null) {
		return null;
	}

	var keys = Object.keys(assets);
	for(var key in keys) {
		if(!keys.hasOwnProperty(key)) continue;

		var asset = assets[key];
		if(asset.name.indexOf(filename) > -1 || asset.name === filename){
			return asset;
		}
	}

	return null;
}
