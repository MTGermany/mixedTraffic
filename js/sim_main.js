

//#############################################################
// Gloal var definitions and initial settings
//#############################################################

// (1) running the simulation


var fps=30;  // frames per second (unchanged during runtime)
var time=0;  // only initialization
var itime=0; // only initialization
var isStopped=false; // only initialization; simulation starts (not) running
var dt=parseFloat(sliderTimewarp.value)/fps;

// (2) graphical elements

var scale=1; // [pixel/m], only initialisation
var car_srcFile='figs/blackCarCropped.gif';
var truck_srcFile='figs/truck1Small.png';
var bike_srcFile='figs/bikeCropped.gif';
var roadLanes_srcFileArr=['figs/roadSegment1lane.png', // MT 2021-11
			  'figs/roadSegment2lanes.png',
			  'figs/roadSegment3lanes.png',
			  'figs/roadSegment4lanes.png',
			  'figs/roadSegment5lanes.png',
			  'figs/roadSegment6lanes.png',
			  'figs/roadSegment7lanes.png'];
var roadLanes_srcFile=roadLanes_srcFileArr[4]; // will be overridden
var roadNoLanes_srcFile='figs/tarmac.jpg';
var obstacle_srcFile='figs/obstacleImg.png';
var background_srcFile='figs/backgroundGrass.jpg'; 


var displayForcefield=false; // can be changed interactively -> gui.js
var displayForceStyle=2;    // 0: with probe, 1: arrow field arround veh,
                            // 2: moving arrows at veh
var displayScatterplots=true; // scatterplots of macroPropert. at [umin,umax]
var displayMacroProperties=true; //displays where macroProperties taken from
var displayVehIDs=false;         // debugging

var hasChanged=true; // physical dim have changed (e.g. by window resize)
var canvas=document.getElementById("canvas_mixed");
var ctx=canvas.getContext("2d"); // graphics context


// (3) display logical (u,v) coords of mouse position (x,y)
// get mouse positions from gui.activateCoordDisplay which is called
// if html.onmousemover=true (only true if over client area AND moving)
// start showMouseCoords=false  since otherw NaN if mouse initially outside

showMouseCoords=true; 



//#############################################################
// (initial) parameterisation and creation of underlying longmodels
//#############################################################

var v0=25;
var Tgap=1;
var s0=2;
var amax=2;
var bcomf=2;

var v0Truck=12;
var TgapTruck=1.5;
var s0Truck=2;
var amaxTruck=1;
var bcomfTruck=2;

var v0Bike=25;
var TgapBike=0.5;
var s0Bike=1.5;
var amaxBike=3;
var bcomfBike=2;
var v0Obstacle=0;

var speedlimit=1000; // per default no speedlimit
var speedlimit_truck=80./3.6;

var v0max=Math.max(v0,v0Truck,v0Bike); // to define max dist range of neigbors


var speedmap_min=0; // min speed for speed colormap (drawn in red)
var speedmap_max=Math.max(v0, v0Truck, v0Bike); // max speed (fixed in sim)






//#############################################################
// (initial) parameterisation and creation of the
// mixed traffic models (MTM)
//#############################################################

// (1) model constants (behavioural and graphical)

// lateral kinematics restrictions
// (var accNoiseAmplLong=1; and accNoiseAmplLat=0.3; in road, before restr)

var dvdumax=0.3;       // 0.3 tan of maximum angle with respect to road axis
var dotdvdumax=0.3;    // 0.3 max change rate of angle to road axis
var phiVehRelMax=0.1;  // 0.1 OK only drawing: max visual angle to road axis
var speedLatStuck=1.2; // 1.2 OK lift angle restriction if obstacle ahead

var longParReductFactor=0.1; // long interaction reduced if completely lateral
                             // =lambda to save parameters
// IAM parameterisation
// (apart from tau->LatOVM, lambda=pushLong=pushLat in sliders)

var s0y=0.20;       // lat. attenuation scale [m] long veh-veh interact [0.15]
var s0yLat=0.40;    // lat. attenuation scale [m] lat veh-veh interact  [0.3]
var sensLat=1.0;    // sensit. sigma (max des speedLat)/accLong [s] [1.0]

var accBiasRightTruck=0.8;  //MT 2021-11 
var accBiasRightBike=0.0;  // MT 2023-01
var accBiasRightOthers=0.0;   // including cars
var accFloorMax=0.5;        //MT 2021-11 reduced from 6.5
//  sensDvy in sliders; default 1s/m


// boundaries

var glob_anticFactorB=2;  //antic time for boundary response (multiples of T)
var glob_accLatBMax=20;   //max boundary lat accel, of the order of bmax

var glob_accLongBRef=2; //longitudinal acceleration if veh touches boundary
var glob_accLatBRef=4;    //lateral acceleration if veh touches boundary
var s0yB=0.15;            // long. attenuation scale [m] wall-veh interact
var s0yLatB=0.20;         // lat. attenuation scale [m] wall-veh interact


// (2) variable slider params

var tauLatOVM=parseFloat(slider_tauLatOVM.value); // lat OVM relax time

// FVDM-like inclusion of rel lateral speed, but multiplicative=>slider
var sensDvy=parseFloat(slider_sensDvy.value);    

// anisotropy factor long; in [0,1]; 1=Galilei-inv. =lambda=0.2 in TRL
var pushLong=parseFloat(slider_pushLong.value); // in [0,1]; 1=Galilei-inv.

// anisotropy factor lat; in [0,1]; 1=Galilei-inv. =lambda=0.2 in TRL
var pushLat=parseFloat(slider_pushLat.value);   // in [0,1]; push by back vehs


// (3) creation of the standard models
// MT 2021-11: Every vehicle gets its own individual model with "new"
// to allow for local and/or vehicle-persistent attributes
// such as speed limits or variable maximum speeds


//var longModelCarRef=new IDM(v0,Tgap,s0,amax,bcomf);
//var longModelTruckRef=new IDM(v0Truck,TgapTruck,s0Truck,amaxTruck,bcomfTruck);
//var longModelBikeRef=new IDM(v0Bike,TgapBike,s0Bike,amaxBike,bcomfBike);

var longModelCarRef=new ACC(v0,Tgap,s0,amax,bcomf);
var longModelTruckRef=new ACC(v0Truck,TgapTruck,s0Truck,amaxTruck,bcomfTruck);
var longModelBikeRef=new ACC(v0Bike,TgapBike,s0Bike,amaxBike,bcomfBike);

var mixedModelCarRef=new MTM(longModelCarRef,s0y,s0yLat,s0yB,s0yLatB,
			  sensLat,tauLatOVM,sensDvy);
var mixedModelTruckRef=new MTM(longModelTruckRef,s0y,s0yLat,s0yB,s0yLatB,
			    sensLat,tauLatOVM,sensDvy);
var mixedModelBikeRef=new MTM(longModelBikeRef,s0y,s0yLat,s0yB,s0yLatB,
			    sensLat,tauLatOVM,sensDvy);
var mixedModelObstacle=new ModelObstacle();



//#############################################################
// initial traffic flow and composition settings ctrl by sliders
//#############################################################

qIn=6300./3600; 
commaDigits=2;
setSlider(slider_inflow, slider_inflowVal, qIn, commaDigits, "veh./s");

//var qIn=parseFloat(slider_inflow.value);
var fracTruck=0.01*parseFloat(slider_fracTruck.value); // !! otherwise string
var fracBike=0.01*parseFloat(slider_fracBike.value);  // frac+frac=e.g.0.20.2!!

// overridden by slider_speedmax if it exists => html
var speedMax=Math.max(v0,v0Truck,v0Bike);
var relOutflow=1.;  // outflow/maxflow,
                    //overridden by slider_outflowVal if it exists

// initial values not controlled by sliders

var speedInit=20;
var densityInit=0.0; 




//#############################################################
// specification of vehicle types and dimensions/geometry [SI units]
// (the actual vehicles are constructed in the road cstr)
//#############################################################

var car_length=5; 
var car_width=2.0;
var truck_length=10;
var truck_width=2.5; 
var bike_length=2; // bicycles or motorbikes, depending on parameterisation
var bike_width=0.7;
var obstacle_length=10;
var obstacle_width=1.5;



//#############################################################
// road or road network geometry
//#############################################################


// (road cstr needs the models and vehicle dimensions defined above 
// and the axis_x(u), axis_y(u), widthLeft(u), and widthRight(u)
// function pointers
// (as pointers they are automatically updated if arcRadius
// etc changes due to responsive design )
 
var roadID=1;
var roadLen=600; //300

//20 MT 2021 !!! BUG floorfield only uneven number

var wLane=3.5;  // lane width if floorField is on
var roadWidthRef=parseFloat(slider_roadWidth.value);
var nLanes=Math.round(roadWidthRef/wLane);

// if isRing, inflow automatically ignored and road geom not implemented

var isRing=false; 
//var varWidthLeft=false;  // as <script>.../script> in html
//var varWidthRight=false; // as <script>.../script> in html
//var floorField=true;     // as <script>.../script> in html

function axis_x(u){ // physical coordinates
        var dxPhysFromCenter= // center=origin of half-circle element
	    (u<straightLen) ? straightLen-u
	  : (u>straightLen+arcLen) ? u-roadLen+straightLen
	  : -arcRadius*Math.sin((u-straightLen)/arcRadius);
	return center_xPhys+dxPhysFromCenter;
}

function axis_y(u){ // physical coordinates
        var dyPhysFromCenter=
 	    (u<straightLen) ? arcRadius
	  : (u>straightLen+arcLen) ? -arcRadius
	  : arcRadius*Math.cos((u-straightLen)/arcRadius);
	return center_yPhys+dyPhysFromCenter;
}

function widthLeft(u){ // width left boundary - road axis
    if((!varWidthLeft)&&(relOutflow>=0.9999)){return 0.5*roadWidthRef;}
    var u1_1=0.20*roadLen; // begin narrowing Bottl 1
    var u1_2=0.30*roadLen; // end narrowing 1 (begin minimum capacity)
    var u1_3=0.40*roadLen; // begin widening 1
    var u1_4=0.45*roadLen; // end widening 1 (restore original capacity)
    var u2_1=0.70*roadLen; // begin narrowing Bottl 2
    var u2_2=0.75*roadLen; // end narrowing 2 (begin minimum capacity)
    var u2_3=0.80*roadLen; // begin widening 2
    var u2_4=0.85*roadLen; // end widening 2 (restore original capacity)
    var u3_1=0.85*roadLen; // begin narrowing for outflow restriction
    var u3_2=0.95*roadLen; // end narrowing for outflow restriction

    var wLeftRef=0.5*roadWidthRef;
    var wNarrow1=(varWidthLeft)? 0.2*roadWidthRef : wLeftRef;
    var wNarrow2=(varWidthLeft)? 0.3*roadWidthRef : wLeftRef;
    var wNarrow3=0.5*roadWidthRef*relOutflow;


    return (u<u1_1) ? wLeftRef
	: (u<u1_2) ? wLeftRef+(wNarrow1-wLeftRef)*(u-u1_1)/(u1_2-u1_1)
	: (u<u1_3) ? wNarrow1
	: (u<u1_4) ? wNarrow1+(wLeftRef-wNarrow1)*(u-u1_3)/(u1_4-u1_3)
	: (u<u2_1) ? wLeftRef
	: (u<u2_2) ? wLeftRef+(wNarrow2-wLeftRef)*(u-u2_1)/(u2_2-u2_1)
	: (u<u2_3) ? wNarrow2
	: (u<u2_4) ? wNarrow2+(wLeftRef-wNarrow2)*(u-u2_3)/(u2_4-u2_3)
	: (u<u3_1) ? wLeftRef
	: (u<u3_2) ? wLeftRef+(wNarrow3-wLeftRef)*(u-u3_1)/(u3_2-u3_1)
	: wNarrow3;
}

function widthRight(u){ // width road axis - right boundary
    if((!varWidthRight)&&(relOutflow>=0.9999)){return 0.5*roadWidthRef;}
    var u1_1=0.45*roadLen; // begin narrowing Bottl 1
    var u1_2=0.70*roadLen; // end narrowing 1 (begin minimum capacity)
    var u1_3=0.75*roadLen; // begin widening 1
    var u1_4=0.75*roadLen; // end widening 1 (restore original capacity)
    var u3_1=0.85*roadLen; // begin narrowing for outflow restriction
    var u3_2=0.95*roadLen; // end narrowing for outflow restriction

    var wRightRef=0.5*roadWidthRef;
    var wNarrow1=(varWidthRight)  ? 0.10*roadWidthRef : wRightRef;
    var wNarrow3=0.5*roadWidthRef*relOutflow;


    return (u<u1_1) ? wRightRef
	: (u<u1_2) ? wRightRef+(wNarrow1-wRightRef)*(u-u1_1)/(u1_2-u1_1)
	: (u<u1_3) ? wNarrow1
	: (u<u1_4) ? wNarrow1+(wRightRef-wNarrow1)*(u-u1_3)/(u1_4-u1_3)
	: (u<u3_1) ? wRightRef
	: (u<u3_2) ? wRightRef+(wNarrow3-wRightRef)*(u-u3_1)/(u3_2-u3_1)
    	: wNarrow3;
}


var mainroad=new road(roadID, isRing, roadLen,
		      axis_x, axis_y,widthLeft, widthRight,
		      densityInit, speedInit, fracTruck, fracBike, 
		      v0max, dvdumax);



//############################################
// data for evaluation
//############################################

// visual detectors

var detectors=[];
detectors[0]=new stationaryDetector(mainroad,0.40*roadLen,10);
detectors[1]=new stationaryDetector(mainroad,0.60*roadLen,10);

// region [umin,umax] for downloaded flow-density data
// every ndtSample timestep will be sampled in macroProperties[] vector

var macroProperties=[];
var ndtSample=60; 

var umin=0.59*roadLen;    // upstream boundary of sampled region [m];
var umax=0.61*roadLen;    // downstream boundary of sampled region [m];


//############################################
// traffic objects and traffic-light control editor
//############################################


// TrafficObjects(canvas,nTL,nLimit,xRelDepot,yRelDepot,nRow,nCol)
var trafficObjs=new TrafficObjects(canvas,2,3,0.62,0.22,1,9);

// also needed to just switch the traffic lights
// (then args xRelEditor,yRelEditor not relevant)
var trafficLightControl=new TrafficLightControlEditor(trafficObjs,0.5,0.5);

trafficObjs.setSpeedLimit(2,30); // trafficObj[2].value=x km/h, 0=free
trafficObjs.setSpeedLimit(3,50);
trafficObjs.setSpeedLimit(4,80);



//#################################################################
function updateSim(dt){    // called here by main_loop()
//#################################################################


  // updateSim (1): update times

  time +=dt; // dt depends on initial html and timewarp slider (fps=const)
  itime++;
    //console.log("\nbegin updateSim: itime=",itime);
  if(itime==1){ //not==0!! initializeMicro(types, len, w, u, v,speed,speedLat)
	mainroad.initializeMicro( ["car"], [car_length],
				  [car_width], [150], [0], 
				 [20], [0]);
	//mainroad.initializeMicro( ["obstacle"], [20], //!!! TEST pointer err
	//			  [20], [120], [0], 
	//                        [0], [0]);


        Math.seedrandom(42); //!! start reproducibly (see docu at onramp.js)

    }

//TEST
    if(false){
        if(time>13.6){
	    console.log("t=",time);
	    mainroad.writeVehicles();
	}
	if(time>13.8){clearInterval(myRun);}
    }



  // updateSim (2): implement slider changes

  dt=parseFloat(sliderTimewarp.value)/fps;
  roadWidthOld=roadWidthRef;
  roadWidthRef=parseFloat(slider_roadWidth.value);
  qIn=parseFloat(slider_inflow.value);
  relOutflow=parseFloat(slider_outflow.value);
  fracTruck=parseFloat(slider_fracTruck.value); // !! otherwise string
  fracBike=parseFloat(slider_fracBike.value);  // frac+frac=e.g.0.20.2!!
  tauLatOVM=parseFloat(slider_tauLatOVM.value);
  sensDvy=parseFloat(slider_sensDvy.value);
  pushLong=parseFloat(slider_pushLong.value);
  pushLat=parseFloat(slider_pushLat.value);


  nLanes=Math.round(roadWidthRef/wLane);
  roadImgLanes.src=roadLanes_srcFileArr[nLanes-1]; // MT 2021
  hasChanged=(roadWidthOld!=roadWidthRef); // redef scale and r to fit window


  if(true){
	mixedModelCarRef.tauLatOVM=tauLatOVM; // passed by model ref to all cars!
	mixedModelTruckRef.tauLatOVM=tauLatOVM;
	mixedModelBikeRef.tauLatOVM=tauLatOVM;
  }

  if(true){
	mixedModelCarRef.sensDvy=sensDvy; // passed by model ref to all cars!
	mixedModelTruckRef.sensDvy=sensDvy;
	mixedModelBikeRef.sensDvy=sensDvy;
  }

  // updateSim (3):  Actual vehicle update

  // !!! distribute new models to the vehicles
  mainroad.updateSpeedlimits(trafficObjs); // !!! not yet impl. MT 2021-11
  mainroad.calcAccelerations();  
  mainroad.updateSpeedPositions(dt);
  mainroad.updateBCdown();
  mainroad.updateBCup(qIn,fracTruck,fracBike,dt); 
  // !! later: array vehCompos[] instead of *frac*
  if(itime<2){mainroad.writeVehicles();}

  // updateSim (4): update detector readings
  // and macroProperties for file download

  for(var iDet=0; iDet<detectors.length; iDet++){
	detectors[iDet].update(time,dt);
  }

  
  mainroad.updateSpeedStatistics(umin,umax);
  if(itime%ndtSample==0){
    var iSample=Math.max(0,itime/ndtSample-1);
    // calcMacroProperties needs speed data from updateSpeedStatistics
    macroProperties[iSample]=mainroad.calcMacroProperties(ndtSample);
  }

  // activate at begin if needed
}//updateSim





//##################################################
function drawSim() {
//##################################################


    // (1) redefine graphical and gemetrical
    // aspects of road (arc radius etc) using
    // responsive design if canvas has been resized 

    var critAspectRatio=1.8; // U covers full height if aspectRatio>crit
    var simWindow=document.getElementById("contents");

    if (canvas.width!=simWindow.clientWidth){
	hasChanged=true;
	canvas.width  = simWindow.clientWidth;
    }
    if (canvas.height != simWindow.clientHeight){
	hasChanged=true;
        canvas.height  = simWindow.clientHeight;
    }
    var aspectRatio=canvas.width/canvas.height;
    var refSizePix=Math.min(canvas.height,canvas.width);

    if(hasChanged){
      var lenPix=0.5*Math.PI*canvas.height
	    +2*Math.max(canvas.width-0.5*canvas.height, 0);
      if(aspectRatio>critAspectRatio){lenPix*= critAspectRatio/aspectRatio;}

      scale=lenPix/roadLen;
      widthPix=scale*roadWidthRef;
      arcRadiusPix=0.49*canvas.height-0.5*widthPix;
      arcRadius=arcRadiusPix/scale;
      arcLen=arcRadius*Math.PI;
      straightLen=0.5*(roadLen-arcLen);  // len of one straight segment

      // coordinate origin left top => visible physical coordinates all <0 
      center_xPhys=arcRadius+0.5*roadWidthRef + 5/scale;
      center_yPhys=-0.5*canvas.height/scale; 
      center_xPix=scale*center_xPhys;
      center_yPix=-scale*center_yPhys;

     
      console.log("canvas size ",canvas.width,"X",canvas.height,
		  " lenPix=",Math.round(lenPix),
		  " scale=",scale,
		  " widthPix=",Math.round(widthPix),
		  " arcRadiusPix=",Math.round(arcRadiusPix)
		 );

      if(false){
	console.log("canvas has been resized: new dim ",
		    canvas.width,"X",canvas.height,
		    " arcRadius=",arcRadius,
		    " scale=",scale);
      }
    }



    // (2) reset transform matrix and draw background
    // (only needed if no explicit road drawn but "%10"-or condition"
    //  because some older firefoxes do not start up/draw properly)

  
//  console.log("drawSim: trafficObjZooms=",trafficObjZooms," trafficObjIsDragged=",trafficObjIsDragged);

  ctx.setTransform(1,0,0,1,0,0);
  if(hasChanged||trafficObjZooms||trafficObjIsDragged
     ||(itime<=1) || (itime%10==0) ){ 
    ctx.drawImage(background,0,0,canvas.width,canvas.height);
  }
  
 

  // (3) draw mainroad
  // (always drawn; changedGeometry only triggers
  // building a new lookup table)

    
    var changedGeometry=hasChanged||(itime<=1);
    var roadImg=(floorField) ? roadImgLanes : roadImgNoLanes
    mainroad.draw(roadImg,scale,changedGeometry);

  // (3a) draw boundaries of detection region [umin:umax] for
  // scatter plot  MT 2021

  if(displayMacroProperties){
    mainroad.displayMacroRegion(scale,umin,umax);
  }
 
    // (4) draw vehicles (obstacleImg here empty, only needed for interface)

    mainroad.drawVehicles(carImg,truckImg,bikeImg,obstacleImg,scale,
			  speedmap_min, speedmap_max);

    // (4a) draw acceleration vector field

    if(displayForcefield){
        //mainroad.drawVectorfield(parseFloat(slider_speedProbe.value),
        mainroad.drawVectorfield(15,
				 scale,
				 speedmap_min, speedmap_max, 
				 displayForceStyle);
    }

    // (4b) draw vehicle IDs

    if(displayVehIDs){
	mainroad.drawVehIDs(scale,0.015*canvas.height);
    }



  
    // (5) draw some running-time vars


    ctx.setTransform(1,0,0,1,0,0); 
    var textsize=0.02*Math.min(canvas.width,canvas.height); // 2vw;
    ctx.font=textsize+'px Arial';


    var timeStr="Time="+Math.round(10*time)/10;
    var timeStr_xlb=textsize;
    var timeStr_ylb=1.8*textsize;
    var timeStr_width=6*textsize;
    var timeStr_height=1.2*textsize;

    ctx.fillStyle="rgb(255,255,255)";
    ctx.fillRect(timeStr_xlb,timeStr_ylb-timeStr_height,
		 timeStr_width,timeStr_height);
    ctx.fillStyle="rgb(0,0,0)";
    ctx.fillText(timeStr, timeStr_xlb+0.2*textsize,
		 timeStr_ylb-0.2*textsize);

    
    var scaleStr="scale="+Math.round(10*scale)/10;
    var scaleStr_xlb=8*textsize;
    var scaleStr_ylb=timeStr_ylb;
    var scaleStr_width=5*textsize;
    var scaleStr_height=1.2*textsize;

    ctx.fillStyle="rgb(255,255,255)";
    ctx.fillRect(scaleStr_xlb,scaleStr_ylb-scaleStr_height,
		 scaleStr_width,scaleStr_height);
    ctx.fillStyle="rgb(0,0,0)";
    ctx.fillText(scaleStr, scaleStr_xlb+0.2*textsize, 
		 scaleStr_ylb-0.2*textsize);


  // (6) draw the speed colormap/colorbox
  // (speedmaxDisplay set for nice axis scaling)

    var speedmaxDisplay=25*Math.round(3.6*speedmap_max/25)/3.6; 

    drawColormap(10+1.1*widthPix+0.07*refSizePix,
                 center_yPix,
                 0.1*refSizePix, 0.2*refSizePix,
		 speedmap_min,speedmap_max,0,speedmaxDisplay);

  // drawSim (6a) show simulation time and detector displays

  for(var iDet=0; iDet<detectors.length; iDet++){
	detectors[iDet].display(textsize);
  }
  
  

    // (7) display the logical coordinates if mouse inside canvas
    // set/controlled in gui.js; sets ctx.setTransform(1,0,0,1,0,0) at end 

    if(mouseCoordsActivated){showLogicalCoords(xPixUser,yPixUser);}


    // (8) draw flow-speed-density scatter plots data of selected region

  if(displayScatterplots&&((itime%ndtSample==0)||(itime%10==0)
			   ||trafficObjZooms||trafficObjIsDragged)){ 


        // determine overall rel dimensions 

	var xCenterRel=0.71;
	var yCenterRel=0.44; // horiz boundary of diagrams: (0=top, 1=bottom)
	var wRel=0.22;
	var hRel=0.10;

        // determine arguments for plotxy

	//var wPix=refSizePix*wRel;
	//var hPix=refSizePix*hRel;
      var wPix=canvas.width*wRel;
      var hPix=wPix*hRel/wRel;
      var vertSpacePix=0.10*hPix; // vertical diagram separation
      var xPixLeft=canvas.width*xCenterRel-0.5*wPix;
      var yPixTop=canvas.height*yCenterRel+0.05*vertSpacePix; // lower diagr


      // determine axes specifications [colx, xmult,xmax,xlabel]
      // and optional boxplot specifications: each point gets
      // vertical candlestick [col_ymin, col_25th, col_50th, 75, ymax]

      var rhoSpec=[0,1000,200,"Density [veh/km]"];
      var QSpec=[1,3600,3600,"Flow [veh/h]"];
      var VSpec=[2,3.6,50,"Speed [km/h]"];
      var boxSpec=[3,4,5,6,7];

        // define scatter plots instance and do the plotting (new necessary!)

      var plot1=new plotxy(wPix,hPix,xPixLeft,yPixTop); // lower diagr
      plot1.scatterplot(ctx,macroProperties,rhoSpec,QSpec); // lower

      var plot2=new plotxy(wPix,hPix,xPixLeft,yPixTop-hPix-vertSpacePix);
      plot2.scatterplot(ctx,macroProperties,rhoSpec,VSpec,boxSpec);//upper

    } // do xy plots [ if (itime%ndtSample==0) ]

  // (9) draw trafficObjects

  trafficObjs.calcDepotPositions(canvas);
  trafficObjs.draw(scale);
  trafficObjs.zoomBack(); // to bring dropped objects back to the depot

  // (10) draw speedlimit-change select box

  ctx.setTransform(1,0,0,1,0,0); 
  drawSpeedlBox();


} // drawSim
 



function showLogicalCoords(xPixUser,yPixUser){

  //!!! use Road.findNearestDistanceTo

   // get (x,y) physical coordinates of these pixel coordinates

    var xPhys= xPixUser/scale;
    var yPhys=-yPixUser/scale;

    // get region of U: 1,3: first/last straight section; 2: arc segment

    var iRegion=(xPhys-center_xPhys<0) ? 2
	: (yPhys>center_yPhys) ? 1 : 3

    // default iRegion=1;

    var u=-xPhys+center_xPhys+straightLen;
    var v=yPhys-center_yPhys-arcRadius;

    if(iRegion==3){
	u=roadLen-straightLen+xPhys-center_xPhys;
	v=-yPhys+center_yPhys-arcRadius;
    }

    else if(iRegion==2){
	var dxPhys=xPhys-center_xPhys;
	var dyPhys=yPhys-center_yPhys;
	var r=Math.sqrt(dxPhys*dxPhys+dyPhys*dyPhys);
	var phi=Math.atan(dyPhys/dxPhys); // phi=0 at u=roadLen/2
	u=0.5*roadLen+phi*arcRadius;
	v=r-arcRadius;
    }

    var coordsStr="log coords u="+parseFloat(u,6).toFixed(1)
	+", v="+parseFloat(v,10).toFixed(1);

    var textsize=0.02*Math.min(canvas.width,canvas.height); // 2vw;
    var coordsStr_width=14*textsize;
    var coordsStr_height=1.2*textsize;
    var coordsStr_xlb=0.50*canvas.width-0.5*coordsStr_width;
    var coordsStr_ylb=0.99*canvas.height;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.font=textsize+'px Arial';
    ctx.fillStyle="rgb(255,255,255)";
    ctx.fillRect(coordsStr_xlb,coordsStr_ylb-coordsStr_height,
		 coordsStr_width,coordsStr_height);
    ctx.fillStyle="rgb(0,0,0)";
    ctx.fillText(coordsStr, coordsStr_xlb+0.2*textsize, 
		 coordsStr_ylb-0.2*textsize);

    if(false){
	console.log("sim-straight.showLogicalCoords:",
		    " straightLen=",parseFloat(straightLen,6).toFixed(1),
		" scale=",parseFloat(scale,6).toFixed(2),
		" xPixUser=",xPixUser,
		" yPixUser=",yPixUser,
		" xPhys=",parseFloat(xPhys,6).toFixed(2),
		" yPhys=",parseFloat(yPhys,6).toFixed(2),
		" iRegion=",iRegion,
		" center_yPhys=",parseFloat(center_yPhys,6).toFixed(1),
		    " coordsStr=",coordsStr
	       );
    }


} //showLogicalCoords


//##################################################
// Running function of the sim thread (triggered by setInterval in init())
//##################################################

function main_loop() {
    if(dt>0.5*tauLatOVM){
	console.log("Warning: dt=",parseFloat(dt).toFixed(2),
		    " due to timewarp ",
		    parseFloat(sliderTimewarp.value).toFixed(2),
		    " is greater than stability limit.",
		    " Reducing to ",parseFloat(0.5*tauLatOVM).toFixed(2)
		   );
	dt=0.5*tauLatOVM;
    }
    drawSim();
    updateSim(dt);
    //mainroad.writeVehicles(); // for debugging
}
 

//##################################################
// function to initialize/start the simulation thread "main_loop"
//##################################################

function init() {


    // associate all images to image files

    background = new Image();
    background.src =background_srcFile;

  roadImgLanes = new Image();
  console.log("mainroad=",mainroad);
  console.log("roadLanes_srcFileArr[nLanes-1]=",roadLanes_srcFileArr[nLanes-1]);
  roadImgLanes.src=roadLanes_srcFileArr[nLanes-1]; //MT 2021
    roadImgNoLanes = new Image();
    roadImgNoLanes.src=roadNoLanes_srcFile;
    //roadImgNoLanes.src='figs/tarmacOrig.jpg';

    carImg = new Image();
    carImg.src = car_srcFile;
    truckImg = new Image();
    truckImg.src = truck_srcFile;
    bikeImg = new Image();
    bikeImg.src = bike_srcFile;
    obstacleImg = new Image();
    obstacleImg.src = obstacle_srcFile;


    // starts simulation thread "main_loop"
    // with update time interval 1000/fps milliseconds
    // thread starts with "myRun=init();" (below)
    // thread stops with "clearInterval(myRun) (gui.js) 

    return setInterval(main_loop, 1000/fps); 
} // end init()



//##################################################
// Actual start of the simulation thread
// the only line where a function is called at top-level
// => THIS starts the simulation => must be at the end of file (checked)
//##################################################

var myRun;
if(isStopped==false){myRun=init();}

