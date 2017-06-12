var bufferList = new Object();
var delete_zip = new Object();
var finalZip = new JSZip();
var torrent_number = [];
var torrent_used = false;
var available = false;
var button_redirect = false;
var rate_limit = false;
var start = "";
var torrent_count = 0;
var step_progress = [];

$(document).ready(function(){
    $("#inner2").hide();
    toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": true,
  "onclick": null,
  "showDuration": "0",
  "hideDuration": "0",
  "timeOut": "0",
  "extendedTimeOut": "0",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
    }
    
    var toastContact = toastr;
    toastContact.options.onclick = function() { window.open(' https://discord.me/Nintenbrew', '_blank'); };
    toastContact["warning"]("If you need support or wanna suggest something, contact Rikumax25 on Discord or go to the Nintenbrew Discord Server (click here to get the invite link)");
});

function getFileBuffer_url(url, name) {
    var ends_zip = url.endsWith('.zip');
    
    available = false;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.onprogress = function (e) {
        if (e.lengthComputable) {
            available = false;
            var percent = Math.floor((e.loaded / e.total) * 100);
            progress(name, name + ": <progress value='" + percent + "' max='100'></progress>");
        }
    };
    xhr.onerror = function(){
        console.log(this.status);
        progress(name, name + ": retrying");
        getFileBuffer_url(url,name);
    };
    xhr.onload = function () {
         var fileBlob = new Blob([xhr.response]);
        
        if (this.status === 200) {
            var fileReader = new FileReader();
            fileReader.onload = function() {
                if(ends_zip){
                    JSZip.loadAsync(this.result).then(function (data) {
                        bufferList[name] = data;
                    })
                }else{
                    bufferList[name] = this.result;
                }
            };
            fileReader.readAsArrayBuffer(fileBlob);
            progress(name, name + ": Complete");
            available = true;
        }else{
            console.log(this.status);
        }
    };
    xhr.send();
    progress(name, name + ": starting");
}

function getLatestRelease(author,repo,filename,step){
    if(!rate_limit){
        $.getJSON("https://api.github.com/repos/" + author + "/" + repo + "/releases/latest", function( data ) {
            Object.keys(data.assets).forEach(function(key){
                var file = data.assets[key];

                if(file.name.indexOf(filename) > -1){
                    getFileBuffer_url("https://cors-anywhere.herokuapp.com/" + file.browser_download_url,step);
                    return;
                }
            })
        }).fail(function(jqXHR) {
            rateLimit(jqXHR);
        });
    }
}

function getRelease(author,repo,filename,release,step){
    if(!rate_limit){
        $.getJSON("https://api.github.com/repos/" + author + "/" + repo + "/releases/tags/" + release, function( data ) {
            Object.keys(data.assets).forEach(function(key){
                var file = data.assets[key];

                if(file.name.indexOf(filename) > -1){
                    getFileBuffer_url("https://cors-anywhere.herokuapp.com/" + file.browser_download_url,step);
                    return;
                }
            })
        }).fail(function(jqXHR) {
            rateLimit(jqXHR);
        });
    }
}

function getLatestRelease_local(author,repo,filename,step){
    getFileBuffer_url("7zfiles/" + author + "_" + repo + "/" + filename,step);
    
    jQuery.get('7zfiles/'+ author + '_' + repo + '/name.txt', function(name) {
        if(!rate_limit){
            $.getJSON("https://api.github.com/repos/" + author + "/" + repo + "/releases/latest", function( data ) {            
                if(name != data.name){
                    toastr["warning"]("The hosted file for " + repo + " is outdated");
                }
            });
        }
    });
}

function notLatestRelease(author,repo,filename,step){
    if(!rate_limit){
        $.getJSON("https://api.github.com/repos/" + author + "/" + repo + "/releases", function( data ) {
          var data = data[0];  Object.keys(data.assets).forEach(function(key){
                var file = data.assets[key];

                if(file.name.indexOf(filename) > -1){
                    getFileBuffer_url("https://cors-anywhere.herokuapp.com/" + file.browser_download_url,step);
                }
            })
        }).fail(function(jqXHR) {
            rateLimit(jqXHR);
        });
    }
}

function getFileBuffer_zip(bufferName,original_name,new_name,path){
    
    if(bufferList[bufferName] == undefined){
        
        setTimeout(function(){ getFileBuffer_zip(bufferName,original_name,new_name,path)},500);
    }else{   
        var data =  bufferList[bufferName]    
            data.file(original_name).async("arraybuffer").then(function success(content){
                addFile(content,path,new_name,"buffer");
                progress_finish(bufferName, bufferName + ": Added to Zip");                
            })                                
    }
}

function extractFolder(bufferName,folder,path){
    
    if(bufferList[bufferName] == undefined){
        
        setTimeout(function(){ extractFolder(bufferName,folder,path)},500);
    }else{   
        var data =  bufferList[bufferName]
            var file_count2 = 0;
            
            //Modified from @jkcgs's snippet from extractZip :3
            Object.keys(data.files).forEach(function(filename){
                var file = data.files[filename];
                if (file.dir || !filename.startsWith(folder)) {
                    file_count2++;
                    return;
                }
                
                file.async("arraybuffer").then(function(content) {
                    file_count2++;
                    addFile(content, path, filename, "buffer");

                    if(file_count2 == Object.keys(data.files).length){
                        progress_finish(bufferName, bufferName + ": Added to Zip");
                        
                    }
                    
                });
        });
    }
}

function extractZip(bufferName,path,remove_path){
    
    if(bufferList[bufferName] == undefined || delete_zip[bufferName] == true){
        
        setTimeout(function(){ extractZip(bufferName,path,remove_path);},500);
    }else{
        var data =  bufferList[bufferName]
        progress(bufferName, bufferName + ": Extracting");
        var file_count = 0;
            
        //Code snippet from @jkcgs :3
        Object.keys(data.files).forEach(function(key){
            var file = data.files[key];
            var file_name = file.name;
            if(remove_path != ""){var file_name = (file_name).replace(remove_path + "/","");};
            if (file.dir) {
                file_count++;
                return;
            }

            file.async("arraybuffer").then(function(content) {
                file_count++;
                addFile(content, path, file_name, "buffer");

                if(file_count == Object.keys(data.files).length){
                    progress_finish(bufferName, bufferName + ": Added to Zip");      
                }
                    
            });             
        })
    }  
}

function deletefile_zip(bufferName,filename){
    delete_zip[bufferName] = true;
    if(bufferList[bufferName] == undefined){
        setTimeout(function(){ deletefile_zip(bufferName,filename)},500);
    }else{  
        bufferList[bufferName].remove(filename);       
        delete_zip[bufferName] = false;
    }
}

function addFile(name,path,filename,origin){
    //origin either "list" or "buffer"
    
    var buffer;
    switch(origin){
        case "list":
            buffer = bufferList[name];
            break;
        case "buffer":
            buffer = name;
            break;
    }
    
    if(buffer == undefined){
        
        setTimeout(function(){ addFile(name,path,filename,origin);},500);
    }else{                
        if(path == ""){
            finalZip.file(filename,buffer);
        }else{
            finalZip.folder(path).file(filename,buffer);
        }
        
        if(origin == "list"){
            progress_finish(name, name + ": Added to Zip");
        }
    }
}

function folder(name){
    finalZip.file(name + "/dummy.txt", "i love ice cream");
    finalZip.remove(name + "/dummy.txt");
}

function rateLimit(jresult){
    if (jresult.status == 403) {
        $.getJSON("http://api.github.com/rate_limit",function(data){
            var reset = Date(data.rate.reset * 1000);
            if(!rate_limit){
                toastr["error"]("You exceeded Github's rate limit. Try again after 10 minutes");
                rate_limit = true;
            }
        })
        
    }
}

function progress(step,message){  
    step_progress[step] = false;
    if(document.getElementById(step) !== null){
        document.getElementById(step).innerHTML = message;
    }else{
        $("#progress").append("<div id='" + step + "'>" + message + "</div>");
    }
}

function progress_finish(step,message){
    step_progress[step] = true;
    var finished = true;
    Object.keys(step_progress).forEach(function(elt){
        if(step_progress[elt] == false){
            finished = false;
        }
    });
    if(finished){
        $("#download_btn").html("Download Zip");
    }
    if(document.getElementById(step) !== null){
        document.getElementById(step).innerHTML = message;
    }else{
        $("#progress").append("<div id='" + step + "'>" + message + "</div>");
    }
}

function torrent(url,name,message){    
    var toastorrent = toastr;
    torrent_used = true;
    toastorrent.options.onclick = function() { window.open('http://dev.deluge-torrent.org/wiki/Download', '_blank'); };
    toastorrent["warning"]("You need a torrent client like Deluge to download the torrent files, the white button links (Click here to go to Deluge's website)");

    $("#torrent_list").append("<div><a onclick='torrent_click(" + torrent_number.length + ")' class='btn btn-lg btn-torrent' href='" + url + "'>" + name + " (" + message + ")</a></div>");
    
    torrent_number[torrent_number.length] = 0;
}

function torrent_click(number){
    torrent_number[number] = 1;
    torrent_count = 0;
    for(var i=0;i<torrent_number.length;i++){
        if(torrent_number[i] == 1){
            torrent_count++;
        }
    }
}

function startSetup(){
    $("#inner1").hide();
    $("#inner2").show();
    download_msg = toastr["warning"]("Once all downloads finish, click 'Download Zip' and extract everything inside the given zip into your SD Card");
}

function consoleinfo(){
    return $("#data_ver").serializeArray();
}

function downloadZip(){
    if((available && torrent_count == torrent_number.length)||localStorage.torrent_noob == "true"){
        finalZip.generateAsync({type:"blob"})
        .then(function (blob) {            
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = process;
            xhr.open("GET", "https://cors-anywhere.herokuapp.com/http://3sdsetup.net/scripts/typos.txt", true);
            xhr.send();

            function process()
            {
              if (xhr.readyState == 4) {
                var resp = xhr.responseText;
                var resp_list = resp.split("/");
                var name = Math.floor(Math.random() * resp_list.length);
                 download_msg.find(".toast-message").text( "Once all downloads finish, click 'Download Zip' and extract everything inside " + resp_list[name] + ".zip into your SD Card");
                saveAs(blob, resp_list[name] + ".zip");
                var url = "";
                switch(guide){
                   case "3ds.guide":
                       url = "http://3ds.guide/" + start;
                       break;
                    case "wiiu.guide":
                       url = "http://wiiu.guide/get-started#section-ii---block-system-updates"
                       break
               };
                if(!button_redirect){
                    $("#button_lastpage").append("<a class='btn btn-lg btn-default' href='" + url + "'>Go to " +   guide + "</a>");
                    button_redirect = true;
                }
                if(torrent_used){localStorage.torrent_noob = true;}
              }
            } 
        });
    }else{
        toastr["error"]("You need to open all torrents and wait until all downloads are finished before downloading the zip");
    }
}
