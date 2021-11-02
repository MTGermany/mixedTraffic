


//####################################################################
// control displaying of logical coordinates at actual mouse position
// if inside window (html->onmousemove=true)
//####################################################################



// called/updated in html file whenever onmousemove=true
// sets showMouseCoords=true, so  sim-straight.showLogicalCoords 
// is called in sim-straight in every timestep

function activateCoordDisplay(event){

    // mouse position in client window pixel coordinates

    var rect = canvas.getBoundingClientRect();
    var xPixLeft=rect.left;
    var yPixTop=rect.top;
    xMouse = event.clientX-xPixLeft; 
    yMouse = event.clientY-yPixTop; 

    // activate 

    showMouseCoords=true; // initially set in sim-straight.js
}


// called in html file whenever onmouseout=true

function deactivateCoordDisplay(event){
    showMouseCoords=false;
}

//################################################################
// Start/Stop button action as images
// (triggered by "onclick" callback in html file)
//#################################################################

// in any case need first to stop;
// otherwise multiple processes after clicking 2 times start
// define no "var myRun "; otherwise new local instance started
// whenever myRun is inited

var isStopped=false; // only initialization

function myStartStopFunction(){ 

    clearInterval(myRun);
    console.log("in myStartStopFunction: isStopped=",isStopped);

    if(isStopped){
	isStopped=false;
	document.getElementById("startStop").src="figs/buttonStop3_small.png";
	myRun=init();
    }
    else{
	document.getElementById("startStop").src="figs/buttonGo_small.png";
	isStopped=true;
    }

    // just test "misusing" start/stop to trigger it: 
    // write the model's  acceleration fields to the console

    if(false){
	console.log("before mixedModelCar.calcAccTable1_dxvx");
	mixedModelCar.calcAccTable1_dxvx(0,10,0,0,
					 car_length,car_length,car_width); 
	//console.log("\nbefore longModelCar.calcAccTable1_dxvx");
	//longModelCar.calcAccTable_dxvx(10,0,car_length);
    }

    console.log("end of myStartStopFunction: isStopped=",isStopped);


    
} // end Start/Stop button callback as images

/*
//################################################################
// Start/Stop button callback as text
// (triggered by "onclick" callback in html file)
//#################################################################

// in any case need first to stop;
// otherwise multiple processes after clicking 2 times start
// define no "var myRun" but use that of sim_straight.js; 
// otherwise new local instance started whenever myRun is inited

// isStopped is defined/initialized in sim-straight.js


document.getElementById('startStop').innerHTML=
    (isStopped) ? "Start" : "Stop";


function myStartStopFunction(){ 

    clearInterval(myRun);

    if(isStopped){
	isStopped=false;
	document.getElementById('startStop').innerHTML="Stop";
	myRun=init();
    }
    else{
	document.getElementById('startStop').innerHTML="Resume";
	isStopped=true;
    }

}
// end Start/Stop button callback as text
*/



//####################################################################
// control displaying of the forcefield
//####################################################################

var displayForcefield=false; //displayForcefield defined/init: sim-straight.js
document.getElementById('forcefieldToggle').innerHTML=
    (displayForcefield) ? "Forcefield off" : "Display Forces";




//####################################################################
// "Restart with IC from file" callback routines
//   adapted from general demo-reader program 
//  ../readerDemo.html, ../js_demo/file2string.js
// also seed the random number generator by Math.seedrandom(42)
// needs seedrandom.min.js to do this
//!!! BUG: Cannot call same file twice!!!
//####################################################################

function readTextFile(filePath){
    console.log("\n\n\n\nentering readTextFile, filePath=",filePath,
		" filePath.files[0].name=",filePath.files[0].name);
    var output="start"; // resulting string containing the text
    var reader; //File Reader object
    //console.log("txtarray.length=",txtarray.length);


    // check for the various File API support

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
    } 
    else {
        alert('The File APIs are not supported by your browser.');
        return false;
    }


     // read text (html5 filelist support required)

    if(filePath.files && filePath.files[0]) {           
        reader.onload = function (e) {
            output = e.target.result;
	    console.log("in reader onload: output=",output);
             // for some strange reason the following is the last statement 
             // of readText and displayContents needed to save output to 
             // outside the function 
               
            // for another (related? strange reason this.handleContents
            // is not found when defined inside pseudoclass; need to
            //define it as independent function handleContents


	    //<GRMPF!!!>
            // only onchange works, not "onload", "onclick", "onsubmit" etc
	    // onchange loads file only one ("on change")
            // reset ocument.getElementById("microICalt") 
            //       as command in html fails 
	    // give up, bad job?? 
            // 
            // (2019-07-15) finally success programmatically reset !
            // reset document.getElementById("microICalt").value 
            // at end of readTextFile
	    //</GRMPF!>

	    
	    handleContents(output); 
        };//end onload()

        reader.readAsText(filePath.files[0]);
    }


    else {
	alert( 'file reading not possible with this browser/setting');
	return false;
    }  
 
    console.log("before return: output=",output);

    if(true){
	Math.seedrandom(42); //!! start reproducibly (see docu at onramp.js)
	console.log("Warning: Using seeded random number generator for debugging");
	console.log("see https://github.com/davidbau/seedrandom");
	console.log(Math.random());  // Always 0.0016341939679719736 with 42
    }

    // reset restricted outflow
    
  slider_outflow.value=1;
  slider_outflowVal.innerHTML=parseInt(100*slider_outflow.value)+" %";
  document.getElementById("microICalt").value = ""; //success!!
  document.getElementById("startStop").src="figs/buttonStop3_small.png";
  console.log("end of function readTextFile (f... garbled time order; this NOT executed last");

  return true;
}


// For some obscure reason INSIDE THIS function is the only possibility 
// to access textstring. VERY obscure timeline of actions

function handleContents(txt) {

    // split sequence if one or more \s characters:
    // js regexp denoted by /<regexp>/

    console.log("entering handleContents");
    var linearray=txt.split(/\n/);
    var nlines=linearray.length;
    console.log("linearray=",linearray);
    if(nlines<1){console.log("nlines=0: no useful input provided"); 
		 return false;}
    var types=[];
    var lenvals=[];
    var widthvals=[];
    var uvals=[];
    var vvals=[];
    var speedvals=[];
    var speedLatvals=[];

    var i=0;
    for (var il=0; il<nlines; il++){

	var line=linearray[il];

        // check line for a comment line starting with "#"

	console.log("il=",il," line=",line," nlines=",nlines);
	if( (line[0]=="#")||(line.length<7)){ // comment sign or empty/not valid line
	    console.log("il=",il," is comment line");
	}

        // else parse line 
        // (!essential!! Number converts string to number or NaN)


	else{
	    values=line.split(/\s+/);
	    console.log("il=",il," values=",values);
	    types[i]       =values[0];
	    lenvals[i]     =Number(values[1]);
	    widthvals[i]   =Number(values[2]);
	    uvals[i]       =Number(values[3]);
	    vvals[i]       =Number(values[4]);
	    speedvals[i]   =Number(values[5]);
	    speedLatvals[i]=Number(values[6]);
	    for(var j=1; j<7; j++){
                if(!isNumeric(values[j])){
		    console.log("error: veh ",i," property ",j,"=",values[j],
			    "  is not numeric!");
	        return false;
		}
	    }
	
	    if (typeof values[0] != 'string'){
	        console.log("error: the type of veh ",i,"=",values[4],
			"  is not a string!");
		return false;
	    }
	    i++; 
	}
    }
    var nveh=i;

    console.log("read ",nveh," vehicles, types=",types,
		" uvals=",uvals," lenvals=",lenvals);

    if(isStopped){ 
	isStopped=false;
	myRun=init();
	document.getElementById('startStop').innerHTML="Stop";
    }
    mainroad.initializeMicro(types,lenvals,widthvals,uvals,vvals,
			     speedvals,speedLatvals);

    return true;
}  


function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


//################################################################
// "Display Forces" callback
//################################################################

function myForcefieldToggle(){ 

    if(displayForcefield){
	displayForcefield=false;
	document.getElementById('forcefieldToggle').innerHTML="Display Forces";
    }
    else{
	displayForcefield=true;
	document.getElementById('forcefieldToggle').innerHTML="Forcefield off";
    }
    console.log("end of myForcefieldToggle: displayForcefield=",displayForcefield);

}

//################################################################
// "Var. width left" callback
//################################################################

function myVarWidthLeftToggle(){ 

    console.log("in myVarWidthLeftToggle: varWidthLeft=",varWidthLeft);
    if(varWidthLeft){
	varWidthLeft=false;
	document.getElementById('varWidthLeftToggle').innerHTML="Var. width left";
    }
    else{
	varWidthLeft=true;
	document.getElementById('varWidthLeftToggle').innerHTML="Var. width left off";
    }
    console.log("end of myVarWidthLeftToggle: varWidthLeft=",varWidthLeft);
}


//################################################################
// "Var. width right" callback
//################################################################

function myVarWidthRightToggle(){ 

    console.log("in myVarWidthRightToggle: varWidthRight=",varWidthRight);
    if(varWidthRight){
	varWidthRight=false;
	document.getElementById('varWidthRightToggle').innerHTML="Var. width right";
    }
    else{
	varWidthRight=true;
	document.getElementById('varWidthRightToggle').innerHTML="Var. width right off";
    }
    console.log("end of myVarWidthRightToggle: varWidthRight=",varWidthRight);
}


//################################################################
// "Floor field" callback
//################################################################

function myFloorFieldToggle(){ 

    console.log("in myFloorFieldToggle: floorField=",floorField);
    if(floorField){
	floorField=false;
	document.getElementById('floorFieldToggle').innerHTML="Floor field";
    }
    else{
	floorField=true;
	document.getElementById('floorFieldToggle').innerHTML="Floor field off";
    }
    console.log("end of myFloorFieldToggle: floorField=",floorField);
}



//################################################################
// html5 sliders callback routines
//#################################################################

// html5 sliders initialized in html file by "value" field of html5 input tag
// oninput fires whenever value changed
// onchange fires whenever value changed and mouse drag button released
// slider*.value gives actual value (e.g. for init/use in html and sim js)


// timewarp slider (variable parseFloat(slider
// sim-straight: var dt=parseFloat(sliderTimewarp.value)/fps;

var sliderTimewarp = document.getElementById('sliderTimewarp');
var sliderTimewarpVal = document.getElementById("sliderTimewarpVal");
sliderTimewarp.oninput = function() {
    console.log("in sliderTimewarp.onchange: this.value="
		+ sliderTimewarp.value);
    sliderTimewarpVal.innerHTML = this.value+" times";
}

sliderTimewarpVal.innerHTML=sliderTimewarp.value+" times";

// speedmax slider (actually not in use)

var slider_speedmax;
slider_speedmax = document.getElementById('slider_speedmax');
if(slider_speedmax!== null){ // not !== undefined since assignment with '='

    var slider_speedmaxVal = document.getElementById("slider_speedmaxVal");
    slider_speedmax.oninput = function() {
        console.log("in slider_speedmax.oninput: this.value="
		    + slider_speedmax.value);
        slider_speedmaxVal.innerHTML = this.value+" m/s";
    }
    slider_speedmaxVal.innerHTML=slider_speedmax.value+" m/s";
}


// roadWidth slider
// sim-straight: var roadWidthRef=parseFloat(slider_roadWidth.value);

var slider_roadWidth;
slider_roadWidth = document.getElementById('slider_roadWidth');
if(slider_roadWidth!== null){ // not !== undefined since assignment with '='

    var slider_roadWidthVal = document.getElementById("slider_roadWidthVal");
    slider_roadWidth.oninput = function() {
        console.log("in slider_roadWidth.oninput: this.value="
		    + slider_roadWidth.value);
        slider_roadWidthVal.innerHTML = this.value+" m";
    }
    slider_roadWidthVal.innerHTML=slider_roadWidth.value+" m";
}


// inflow slider

var slider_inflow = document.getElementById('slider_inflow');
var slider_inflowVal = document.getElementById("slider_inflowVal");
slider_inflow.oninput = function() {
    console.log("in slider_inflow.oninput: this.value="
		+ slider_inflow.value);
    slider_inflowVal.innerHTML = this.value+" veh./s";
}

slider_inflowVal.innerHTML=slider_inflow.value+" veh./s";


// outflow slider

var slider_outflow = document.getElementById('slider_outflow');
var slider_outflowVal = document.getElementById("slider_outflowVal");
slider_outflow.oninput = function() {
    console.log("in slider_outflow.oninput: this.value="
		+ slider_outflow.value);
    slider_outflowVal.innerHTML = parseInt(100*this.value)+" %";
}

slider_outflowVal.innerHTML=parseInt(100*slider_outflow.value)+" %";


// fracTruck slider

var slider_fracTruck = document.getElementById('slider_fracTruck');
var slider_fracTruckVal = document.getElementById("slider_fracTruckVal");
slider_fracTruck.oninput = function() {
    console.log("in slider_fracTruck.oninput: this.value="
		+ slider_fracTruck.value);
    slider_fracTruckVal.innerHTML = this.value;
}

slider_fracTruckVal.innerHTML=slider_fracTruck.value;


// fracBike slider

var slider_fracBike = document.getElementById('slider_fracBike');
var slider_fracBikeVal = document.getElementById("slider_fracBikeVal");
slider_fracBike.oninput = function() {
    console.log("in slider_fracBike.oninput: this.value="
		+ slider_fracBike.value);
    slider_fracBikeVal.innerHTML = this.value;
}

slider_fracBikeVal.innerHTML=slider_fracBike.value;



// tauLatOVM slider

var slider_tauLatOVM = document.getElementById('slider_tauLatOVM');
var slider_tauLatOVMVal = document.getElementById("slider_tauLatOVMVal");
slider_tauLatOVM.oninput = function() {
    console.log("in slider_tauLatOVM.oninput: this.value="
		+ slider_tauLatOVM.value);
    slider_tauLatOVMVal.innerHTML = this.value+" s";
}

slider_tauLatOVMVal.innerHTML=slider_tauLatOVM.value+" s";

// sensDvy slider

var slider_sensDvy = document.getElementById('slider_sensDvy');
var slider_sensDvyVal = document.getElementById("slider_sensDvyVal");
slider_sensDvyVal.innerHTML = slider_sensDvy.value+" s/m";
slider_sensDvy.oninput = function() {
    console.log("in slider_sensDvy.oninput: this.value="
		+ slider_sensDvy.value);
    slider_sensDvyVal.innerHTML = slider_sensDvy.value+" s/m";
}

slider_sensDvyVal.innerHTML=slider_sensDvy.value+" s/m";


// longitudinal pushing slider

var slider_pushLong = document.getElementById('slider_pushLong');
var slider_pushLongVal = document.getElementById("slider_pushLongVal");
slider_pushLong.oninput = function() {
    console.log("in slider_pushLong.oninput: this.value="
		+ slider_pushLong.value);
    slider_pushLongVal.innerHTML = this.value;
}

slider_pushLongVal.innerHTML=slider_pushLong.value;


// latitudinal pushing slider

var slider_pushLat = document.getElementById('slider_pushLat');
var slider_pushLatVal = document.getElementById("slider_pushLatVal");
slider_pushLat.oninput = function() {
    console.log("in slider_pushLat.oninput: this.value="
		+ slider_pushLat.value);
    slider_pushLatVal.innerHTML = this.value;
}

slider_pushLatVal.innerHTML=slider_pushLat.value;






// speedProbe (probe vehicle for vectorfield)  slider
// only useful if displayForcefield=true and displayForceStyle=0

// programatically add/remove from html info:
// http://www.w3schools.com/jsref/met_table_insertrow.asp
// (lines below do not harm (firefox) if slider not in html)
// !! but they issue one nullpointer error message, test in other browsers 



/*
var slider_speedProbe = document.getElementById('slider_speedProbe');
var slider_speedProbeVal = document.getElementById("slider_speedProbeVal");
slider_speedProbe.oninput = function() {
    console.log("in slider_speedProbe.oninput: this.value="
		+ slider_speedProbe.value);
    slider_speedProbeVal.innerHTML = this.value;
}

slider_speedProbeVal.innerHTML=slider_speedProbe.value;
*/




//################################################################
// Start/Finish Download button callback and performDownload
// see also ~/versionedProjects/demo_js/writeFileDemo.html, .js
// and ~/versionedProjects/trafficSimulation/js/control_gui.js
//#################################################################

var downloadActive=false; // initialisation
var dt_export=1;          // every dt_export seconds stored in exportString

function downloadCallback(){ // MT 2021-11
  if(downloadActive){
    performDownload();
    downloadActive=false;
    document.getElementById("download").src="figs/iconDownloadStart_small.png";
  }
  
  else{
    mainroad.exportString
        ="#time\tid\ttype\tlen[m]\tw[m]\tx[m]\ty[m]\tvx[m/s]\tvy[m/s]\tax[ms2]\tay[ms2]";
    downloadActive=true;
    document.getElementById("download").src="figs/iconDownloadFinish_small.png";
  }
}


function performDownload(){
  var present=new Date();
  var day=("0" + present.getDate()).slice(-2);// prepend 0 if single-digit day
  var month=("0" + (present.getMonth()+1)).slice(-2);// months start with 0
  var hours=("0" + (present.getHours()+0)).slice(-2);
  var minutes=("0" + (present.getMinutes()+0)).slice(-2);
  var seconds=("0" + (present.getSeconds()+0)).slice(-2);
  var filename="mixedTrafficRecord_"
      +present.getFullYear()+"-"
      +month+"-"
      +day+"_"
      +hours+"h"  // for some strange reason, colons : are transformed into _
      +minutes+"m"
      +seconds+"s"
    +".txt";
  var msg="wrote file "+filename+" to default folder (Downloads)";
  mainroad.writeVehiclesToFile(filename);
  downloadActive=false;
  console.log("filename=",filename);
  alert(msg);
}


//######################################################################
// write (JSON or normal) string to file (automatically in download folder)
// see also ~/versionedProjects/demo_js/writeFileDemo.html, .js
// and ~/versionedProjects/trafficSimulation/js/control_gui.js
//######################################################################
  
function download(data, filename) {
    // data is the string type, that contains the contents of the file.
    // filename is the default file name, some browsers allow the user to change this during the save dialog.

    // Note that we use octet/stream as the mimetype
    // this is to prevent some browsers from displaying the 
    // contents in another browser tab instead of downloading the file
    var blob = new Blob([data], {type:'octet/stream'});

    //IE 10+
    if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        //Everything else
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = filename;
      console.log("a.download=",a.download);
        setTimeout(() => {
            //setTimeout hack is required for older versions of Safari

            a.click();

            //Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 1);
    }
}


