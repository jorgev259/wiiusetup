$("#inner2").hide();
var guide = "wiiu.guide"

function startup_CFW(){
    toastr["info"]("Once all downloads finish, click 'Download Zip' and extract everything inside plairekt.zip into your SD Card");

    $("#inner1").hide();
    $("#inner2").show();
    $('body').css("background-image", "url(img/bg2.png)"); 
    
    getLatestRelease("vgmoose","hbas",".zip","Homebrew App Store");
    extractZip("Homebrew App Store","wiiu","");
    
    getLatestRelease("dimok789","homebrew_launcher","homebrew_launcher.v1.4.zip","Homebrew Launcher 1.4");
    extractZip("Homebrew Launcher 1.4","","");
    
    getLatestRelease("FIX94","haxchi","CBHC","CBHC");
    extractZip("CBHC","","");

    getLatestRelease("FIX94","haxchi","Haxchi","Haxchi");
    deletefile_zip("Haxchi","haxchi/config.txt");
    extractZip("Haxchi","","");
    
    getFileBuffer_url("https://wiiu.guide/images/config.txt", "Config.txt");       
    addFile("Config.txt","haxchi","config.txt","list");    
    getLatestRelease("dimok789","homebrew_launcher","channel","Homebrew Launcher Channel");
    extractZip("Homebrew Launcher Channel","install/hbc","");
    
    notLatestRelease("dimok789","mocha",".zip","Mocha CFW");
    getFileBuffer_zip("Mocha CFW","mocha.elf","mocha.elf","wiiu/apps/mocha");
             
    getLatestRelease("Ryuzaki-MrL","savemii",".zip","savemii")
    extractZip("savemii","wiiu/apps","")
    
    getLatestRelease("Yardape8000","wupinstaller",".zip","WUP installer");
    extractZip("WUP installer","","");
    
    getLatestRelease("koolkdev","disc2app",".zip","disc2app");
    extractZip("disc2app","","");
    
    getLatestRelease("Maschell","hid_to_vpad",".zip","HiD to VPad");
    extractZip("HiD to VPad","","");
    
    getFileBuffer_url("https://cors-anywhere.herokuapp.com/http://wiiubru.com/appstore/zips/nnupatcher.zip", "NNU-Patcher");
    extractZip("NNU-Patcher","","");
    
    getFileBuffer_url("https://cors-anywhere.herokuapp.com/http://wiiubru.com/appstore/zips/wuphax.zip", "WUPhax");
    extractZip("WUPhax","","");
     getFileBuffer_url("https://wiiu.guide/images/vWii_cIOS_apps_20131218.zip", "vWii cIOS apps");
    extractZip("vWii cIOS apps","","");
    
    getFileBuffer_url("https://wiiu.guide/images/Patched_IOS80_Installer_for_vWii.zip","Patched IOS80 installer"); 
    extractFolder("Patched IOS80 installer","apps","");
    
    //getFileBuffer_url("https://cors-anywhere.herokuapp.com/https://bootmii.org/get.php?file=hackmii_installer_v1.2.zip", "BootMii");
    //getFileBuffer_zip("BootMii","boot.elf","boot.elf","");

}
