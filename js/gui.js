//####################################################################
// TrafficObjects global state variables
//####################################################################
var xUser, yUser;       // physical coordinates 
var xUserDown, yUserDown; // physical coordinates at mousedown/touchStart evt
var mousedown=false; //true if onmousedown event fired, but not yet onmouseup


var distDragCrit=10;   // drag function if dragged more [m]; otherwise click
var distDrag=0;        // physical distance[m] of the dragging

function formd0(x){return parseFloat(x).toFixed(0);}

//####################################################################
// mouse callbacks
//####################################################################

function handleMouseEnter(event){
  //console.log("mouse entered");
  activateCoordDisplay(event);
}

function handleMouseDown(event){
  //console.log("mouse down");
  mousedown=true;
  getMouseCoordinates(event); //=> xUser, yUser, xPixUser, yPixUser
  xUserDown=xUser; // memorize starting point of mouse drag
  yUserDown=yUser;
  pickObject(xUser,yUser); // here only trafficObject
}

function handleMouseMove(event){
  //console.log("mouse moved");
  getMouseCoordinates(event); //=> xUser, yUser, xPixUser, yPixUser
  doDragging(xUser,yUser,xUserDown,yUserDown); 
  drawSim(); // to be able to move objects during stopped simulation
}

function handleMouseUp(event){
  //console.log("mouse up");
  getMouseCoordinates(event); // => xUser, yUser, xPixUser, yPixUser
  dropObject(xUser, yUser); // from simulation.de's finishDistortOrDropObject
  drawSim;
  if(false){console.log("  end handleMouseUp(evt):",
			" speedlBoxActive=",speedlBoxActive);}
}



//#####################################################
// canvas onclick and part of touchEnd callback
// do at most one of the following actions
// [(1) traffic light editor (only traffic-simulation.de)
// (2) change speed limits
// (3) switch traffic lights
// (4) slow down vehicles
// (2)-(4) only if isDragged=false (real click)
//#####################################################

function handleClick(event){
  //console.log("mouse clicked");
  getMouseCoordinates(event); //=> xPixUser, yPixUser, xUser, yUser;
  var isDragged=(distDrag>distDragCrit);
  
  // only if clicked w/o drag:
  // deal with either speedlimit changes, TL, or slow vehicles
  // (drop vehicles/drag them away etc only if isDragged)

  if(!isDragged){
    
    // (2) speedlimit changes if applicable
    
    var changingSpeedl=false; 

    // change speedlimit if speeldBoxActive
    
    if(speedlBoxActive){
      changingSpeedl=true;
      changeSpeedl(xPixUser,yPixUser); 
    }

    // check if click should activate speedlimit box for manip at next click 

    else{ 
      changingSpeedl=activateSpeedlBox(xPixUser,yPixUser);
    }

    // (3) if no speedlimit-changing related action, 
    // change TL if applicable or otherwise slow down vehicle if applicable
    
    if(!changingSpeedl){
      console.log("change TL or slow down vehicles");
      influenceTL(xUser,yUser);
    }
  }
}



function handleMouseOut(event){
  //console.log("mouse out");
  deactivateCoordDisplay(event);
  mousedown=false;
  touchdown=false;
  roadPicked=false;
}




//####################################################################
// functions called in the top-level mouse callbacks
//####################################################################


// get physical and pixel coordinates for all mouse events
// for touch events: getTouchCoordinates(event)


function getMouseCoordinates(event){

  // always use canvas-related pixel and physical coordinates

  var rect = canvas.getBoundingClientRect();
  var xPixLeft=rect.left; // left-upper corner of the canvas 
  var yPixTop=rect.top;   // in browser reference system
  xPixUser= event.clientX-xPixLeft; //pixel coords in canvas reference
  yPixUser= event.clientY-yPixTop; 
  xUser=xPixUser/scale;   //scale from main js onramp.js etc
  yUser=-yPixUser/scale;   //scale from main js onramp.js etc (! factor -1)

  if(false){
	console.log("getMouseCoordinates: xUser=",xUser," yUser=",yUser);
  }
}

// activate display in simulator "log coords u= ..., v= ..."

function activateCoordDisplay(event){
  getMouseCoordinates(event); // => xPixUser, xPixUser, xUser, yUser
  showMouseCoords=true; // => sim-straight.showLogicalCoords
}


// called in html file whenever onmouseout=true

function deactivateCoordDisplay(event){
    showMouseCoords=false;
}




// do drag actions if onmousemove&&mousedown or if touchdown=true
// which action(s) (onmousdown drag road or trafficObject)
// is determined by onmousedown/touchStart  callback


function doDragging(xUser,yUser,xUserDown,yUserDown){

  trafficObjIsDragged=false;
  
  if(mousedown){

	distDrag=Math.sqrt(Math.pow(xUser-xUserDown,2)
			   + Math.pow(yUser-yUserDown,2));

	if(false){
	  console.log("mousemove && mousedown: trafficObjPicked=",
		      trafficObjPicked,
		    " xUser=",xUser,"xUserDown=",xUserDown,
		    " distDrag=",distDrag,
		    " distDragCrit=",distDragCrit);
	}

	if(distDrag>distDragCrit){ // !! do no dragging actions if only click
	  if(trafficObjPicked){// drag an object
	    trafficObjIsDragged=true;
	      if(trafficObject.isActive){
		trafficObjs.deactivate(trafficObject); // detach obj from road
	      }

	      trafficObject.isDragged=true;
	      trafficObject.xPix=xPixUser;
	      trafficObject.yPix=yPixUser;
	    }
	}
  }// mouse down


    // reset dragged distance to zero if mouse is up

  else{distDrag=0;}
}





// #########################################################
// do the action 1: pick an active or passive trafficObject
// if one is nearby (adapted from pickRoadOrObject of traffic-simulation.de)
// #########################################################

function pickObject(xUser,yUser){


  if(true){
    console.log("itime=",itime," in pickObject: xUser=",
		formd0(xUser)," yUser=",formd0(yUser));
  }

  if(!(typeof trafficObjs === 'undefined')){ // just check for scenarios w/o
    var distCrit_m=20; //[m] !! make it rather large  
    var pickResults=trafficObjs.pickObject(xPixUser, yPixUser, 
				      distCrit_m*scale);
    console.log("  pickObject: pickResults=",pickResults);
    if(pickResults[0]){ // pickResults=[success, trafficObject]
      trafficObject=pickResults[1];
      trafficObjPicked=true;
      if(false){
        console.log("  end pickRoadOrObject: success! picked trafficObject id=",
		    trafficObject.id," type ",
		    trafficObject.type,
		    " isActive=",trafficObject.isActive,
		    " inDepot=",trafficObject.inDepot," end");
      }
      return;
    }
  }

} // canvas onmousedown or touchStart: pickRoadOrObject



// #########################################################
// do the action 2: drop=finalize dragging action 
// Notice: klicking action influenceClickedVehOrTL(..) is separately below 
// while both called in handleTouchEnd(evt)
// from traffic-simulation.de's finishDistortOrDropObject
// #########################################################

function dropObject(xUser, yUser){
  if(true){
    console.log("itime=",itime," in dropObject (canvas_gui):",
    		" trafficObjPicked=",trafficObjPicked,
  		"");
  }

  mousedown=false;
  
  if(distDrag<distDragCrit){
    if(true){
      console.log("  end dropObject: dragging crit",
		  " distDrag =",distDrag,"< distDragCrit=",distDragCrit,
		  " not satisfied (only click) => do nothing)");
    }
    return;
  }


  if(trafficObjPicked){

    var distCrit_m=20;  // optimize!!
    var distCritPix=distCrit_m*scale;
    trafficObjs.dropObject(trafficObject, mainroad, 
			   xUser, yUser, distCritPix, scale);
    trafficObjPicked=false;
    console.log("  end dropObject: dropped object!");
  }

  
} // handleMouseUp -> dropObject


//##################################################
// one of the onclick callback functions:
// change lights if a traffic light is nearby
// (from traffic-simulation.de influenceClickedVehOrTL)
//##################################################

function influenceTL(xUser,yUser){
  //console.log("\n\nitime=",itime," onclick: in influenceClickedVehOrTL");
  //console.log("yUser=",yUser," yPixUser=",yPixUser);
  if(distDrag<distDragCrit){ // only do actions if click, no drag
    var success=trafficObjs.changeTrafficLightByUser(xPixUser,yPixUser);
  }

  // reset drag distance recorder

  distDrag=0;

} // influenceTL




// if applicable, sets speedlBoxActive=true; and updates speedlBoxAttr

var speedlBoxAttr={
  obj: "null",
  limits: [10,20,30,40,50,60,80,100,120,1000],
  sizePix: 42,
  xPixLeft: 42,
  yPixTop: 42,
  wPix: 42,
  hPix: 42,
  textsize: 42,
  hBoxPix: 42
}


function activateSpeedlBox(xPixUser,yPixUser){

  var sizePix=Math.min(canvas.width, canvas.height);


  speedlBoxActive=false;

  var relWidth=0.10;  // rel size and position of the graphical select box
  var relHeight=0.025*speedlBoxAttr.limits.length; // rel to the smaller dim
  var relDistx=0.10;  // center-center
  var relDisty=0.00;
  var relTextsize_vmin= 0.02;

  var results=trafficObjs.selectSignOrTL(xPixUser,yPixUser);
  var obj=results[1];
  console.log("\n\nitime=",itime," in activateSpeedlBox (canvas_gui)",
	      " results=",results," type=",obj.type);

  if(results[0]){
    if(obj.type==='speedLimit'){
      speedlBoxAttr.obj=obj;
      speedlBoxActive=true; // then, drawSpeedlSelectBox drawn

      speedlBoxAttr.sizePix=sizePix;
      speedlBoxAttr.xPixLeft=xPixUser+sizePix*(relDistx-0.5*relWidth);
      speedlBoxAttr.yPixTop=yPixUser+sizePix*(relDisty-0.5*relHeight);
      if(xPixUser>0.8*canvas.width){
	speedlBoxAttr.xPixLeft -=2*sizePix*relDistx;
      }
      if(yPixUser>0.8*canvas.height){
	speedlBoxAttr.yPixTop -=0.5*sizePix*relHeight;
      }
      if(yPixUser<0.2*canvas.height){
	speedlBoxAttr.yPixTop +=0.5*sizePix*relHeight;
      }
      speedlBoxAttr.wPix=sizePix*relWidth;
      speedlBoxAttr.hPix=sizePix*relHeight;
      speedlBoxAttr.hBoxPix=speedlBoxAttr.hPix/speedlBoxAttr.limits.length;

      var nLimit=speedlBoxAttr.limits.length;
      var hPix=speedlBoxAttr.hPix;
      var yPixTop=speedlBoxAttr.yPixTop;

      speedlBoxAttr.textsize=relTextsize_vmin*sizePix;
    }
  }
  var returnVal=results[0]&&(obj.type==='speedLimit');
  console.log("  end activateSpeedlBox: speedlBoxActive=",speedlBoxActive,
	      " returnVal=",returnVal);
  return returnVal;
}


function changeSpeedl(xPixUser,yPixUser){

  console.log("\n\nitime=",itime," in changeSpeedl (canvas_gui):",
	      " speedlBoxActive=",speedlBoxActive);
  if(speedlBoxActive){
 
    if( (xPixUser>speedlBoxAttr.xPixLeft)
	&& (xPixUser<speedlBoxAttr.xPixLeft+speedlBoxAttr.wPix)
	&& (yPixUser>speedlBoxAttr.yPixTop)
	&& (yPixUser<speedlBoxAttr.yPixTop+speedlBoxAttr.hPix)){
     
      console.log("  speedlBoxActive and clicked inside box!");
 
      var obj=speedlBoxAttr.obj;
      var nLimit=speedlBoxAttr.limits.length;

      var iSelect=Math.floor(nLimit*(yPixUser-speedlBoxAttr.yPixTop)/
			     speedlBoxAttr.hPix);
      obj.value=speedlBoxAttr.limits[iSelect];
      var fileIndex=(0.1*obj.value<13)
	? Math.round(0.1*obj.value) : 0;
      obj.image.src = "figs/speedLimit_"+(fileIndex)+"0.svg";
      //console.log("  traffic object of id=",obj.id,
//		  " has new speed limit ",obj.value);
    }
  }
  speedlBoxActive=false; // apply only once
  hasChanged=true;  // to draw the green background the next timestep
  console.log("  end changeSpeedl: traffic object of id=",
	      speedlBoxAttr.obj.id,
	      " type=",speedlBoxAttr.obj.type,
	      " has new speed limit ",speedlBoxAttr.obj.value,
	      " using image file ",speedlBoxAttr.obj.image.src);
 // a=gieskanne;
}


function drawSpeedlBox(){
  if(speedlBoxActive){
    //console.log("itime=",itime," in drawSpeedlBox (canvas)");
    //console.log("yUser=",yUser," yPixUser=",yPixUser);

    var sizePix=speedlBoxAttr.sizePix;

    var xPixLeft=speedlBoxAttr.xPixLeft;
    var yPixTop=speedlBoxAttr.yPixTop;
    var wPix=speedlBoxAttr.wPix;
    var hPix=speedlBoxAttr.hPix;

    // (1) draw the white rectangular background box

    ctx.setTransform(1,0,0,1,0,0); 
    ctx.fillStyle="rgb(255,255,255)";
    ctx.fillRect(xPixLeft,yPixTop,wPix,hPix);

   // (2) draw the speedlimit options

    ctx.fillStyle="rgb(0,0,0)";
    ctx.font=speedlBoxAttr.textsize+'px Arial';
    var limits=speedlBoxAttr.limits;

    for(var i=0; i<limits.length; i++){
      var textStr=(limits[i]<200) ? limits[i]+" km/h" : "free";
      ctx.fillText(textStr,xPixLeft+0.01*sizePix,
  		   yPixTop+(i+0.7)*hPix/limits.length);
    }
  }
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



function myRestartFunction(){ 
  time=0;
  itime=0;
  hasChanged=true;
  macroProperties=[]; // to reset data for the scatterplot commands
  mainroad=new road(roadID, isRing, roadLen,
		    widthLeft, widthRight, axis_x, axis_y,
		    densityInit, speedInit, fracTruck, fracBike,
		    v0max, dvdumax);
  //plot1=new plotxy(wPix,hPix,xPixLeft,yPixTop);
  //plot2=new plotxy(wPix,hPix,xPixLeft,yPixTop-hPix-vertSpacePix);

  // activate thread if stopped

  if(isStopped){
    isStopped=false;
    document.getElementById("startStop").src="figs/buttonStop3_small.png";
    myRun=init();
  }

}



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
  time=0; // HEINEOUS ERROR !! if define itime<1 as well, DOS in drawing cars!
  // is, however, not needed since itime only controls def order at
  // actual reload of whole sim

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

// value in units displayed by slider, generally not SI
// round => commaDigits=0

function setSlider(slider, sliderHTMLval, value, commaDigits, str_units){
  var formattedValue=value.toFixed(commaDigits);
  slider.value=value;
  sliderHTMLval.innerHTML=formattedValue+" "+str_units; // +" " DOS=>str_units
  console.log("setSlider: value=",value
	      ," innerHTML=",sliderHTMLval.innerHTML);
}



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
var dt_export=0.01;          // every dt_export seconds stored in exportString

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

// writes trajectories recorded every gui.dt_export to file

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


