var download_msg;
var zipname;

$(document).ready(function(){
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
    toastContact.options.onclick = function() { window.open('https://discord.gg/C29hYvh', '_blank'); };
    toastContact["warning"]("If you need support or wanna suggest something, contact Just Riku on the Nintendo Homebrew Discord Server (click here to get the invite link)");
})

function progress(step,message,type){
    switch(type){
        case "progress":
            $("#" + step + "_progress").val(message);
            break;

        default:
            if(document.getElementById(step) !== null){
                document.getElementById(step).innerHTML = message;
            }else{
                $("#progress").append("<div id='" + step + "'>" + message + "</div>");
            }
            break;
    }

}

function soundhaxURL(){
    var req_data = consoleinfo();

    var console = req_data["0"].value;
    var region = req_data["5"].value;

    switch (console)
    {
        case "OLD":
            console = "o3ds";
            break;
            case "NEW":
            console = "n3ds";
            break;
    }

    switch (region)
    {
        case "E":
            region = "eur";
            break;
        case "U":
            region = "usa";
            break;
        case "J":
            region = "jpn";
            break;
        case "K":
            region = "kor";
            break;
    }

    return "https://raw.githubusercontent.com/nedwill/soundhax/master/soundhax-" + region + "-" + console + ".m4a";
}

function consoleinfo(){
    return $("#data_ver").serializeArray();
}

function startup_CFW(){
    var step_list = set_step_list();
    console.log(step_list);
    if(step_list){
        var data = {};
        zipname = "Stock to B9S";
        data.steps = step_list;
        download_msg = toastr["warning"]("Once all downloads finish, click 'Download Zip' and extract everything inside the given zip into your SD Card");
        $('html').addClass("bg_change");

        startSetup(data);
    }
}

function selector(elem,parent){
    switch(elem){
        case "normal":
            $("#normal").hide();
            $("#selector").show();
            $("#selector2").show();
            break;

        case "ntrboot":
            $(`#${parent}`).hide();
            $("#ntrboot").show();
            break;
    }
}

function consoleSelector(data){
    $("#normal").hide();
    $("#consoleSelector").show();

    $("#o3ds").click(function(){ modifyConsole(data,'OLD'); });

    $("#n3ds").click(function(){ modifyConsole(data,'NEW'); });

}

function modifyConsole(setup,type){
    $("#console").val(type);
    startSetup(setup);
}

function cfw114(){
    $("#normal").hide();
    $("#selector2").hide();
    $("#selector").hide();
    $("#cfw114").show();

    toastr["error"]("Select the firmware of the Target console and extract the files on the Source's console SD Card");
    start="";
}

function torrent(item){
    var toastorrent = toastr;
    torrent_used = true;
    toastorrent.options.onclick = function() { window.open('http://dev.deluge-torrent.org/wiki/Download', '_blank'); };
    toastorrent["warning"]("You need a torrent client like Deluge to download the torrent files, the white button links (Click here to go to Deluge's website)");

    $("#torrent_list").append("<div><a class='btn btn-lg btn-torrent' href='" + item.url + "'>" + item.name + " (" + item.step + ")</a></div>");

}

function checkReq(item){
    if(item === undefined){
        return true;
    }

    var info = consoleinfo();

    switch(item.type){
        case "console":
            if(item.data === info[0].value){
                return true;
            }
            break;

        case "fw":
            var firmware = parseInt(info[1].value + info[2].value +info[3].value);
            switch(item.comparator){
                case "<":
                    if(firmware < item.data){
                        return true
                    }
                    break;

                case "<=":
                    if(firmware <= item.data){
                        return true
                    }
                    break;

                case ">":
                    if(firmware > item.data){
                        return true
                    }
                    break;

                case ">=":
                    if(firmware >= item.data){
                        return true
                    }
                    break;

                case "<>":
                    if(firmware <= item.data1 && firmware >= item.data2){
                        return true
                    }
                    break;
            }
            break;
    }

    return false;
}

function timeNow(){
    var time = new Date().toISOString();
    return time.split("T")[0];
}
