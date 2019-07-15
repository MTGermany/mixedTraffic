



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
	console.log("after reader.readAsText(..)");
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
// slider*.value gives actual value (e.g. for use in html and sim js)


// timewarp slider

var sliderTimewarp = document.getElementById('sliderTimewarp');
var sliderTimewarpVal = document.getElementById("sliderTimewarpVal");
sliderTimewarp.oninput = function() {
    console.log("in sliderTimewarp.onchange: this.value="
		+ sliderTimewarp.value);
    sliderTimewarpVal.innerHTML = this.value+" times";
}

sliderTimewarpVal.innerHTML=sliderTimewarp.value+" times";

// speedmax slider

var slider_speedmax;
slider_speedmax = document.getElementById('slider_speedmax');
if(slider_speedmax!== null){ // not !== undefined since assignemnt with '='

    var slider_speedmaxVal = document.getElementById("slider_speedmaxVal");
    slider_speedmax.oninput = function() {
        console.log("in slider_speedmax.oninput: this.value="
		    + slider_speedmax.value);
        slider_speedmaxVal.innerHTML = this.value+" m/s";
    }
    slider_speedmaxVal.innerHTML=slider_speedmax.value+" m/s";
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



// politeness slider

var slider_politeness = document.getElementById('slider_politeness');
var slider_politenessVal = document.getElementById("slider_politenessVal");
slider_politeness.oninput = function() {
    console.log("in slider_politeness.oninput: this.value="
		+ slider_politeness.value);
    slider_politenessVal.innerHTML = this.value;
}

slider_politenessVal.innerHTML=slider_politeness.value;

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
