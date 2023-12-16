

//#############################################################
// Gloal var definitions and initial settings
//#############################################################

// (0) project-specific tweaks road geometry

// see also ~/versionedProjects/mixedTraffic/analysis/analyze.cpp
// var varWidthLeft,-Right,floorField set toplevel <script>.../script> in html



// reduce critical distances for mouse actions because small region here
// (preset in gui.js)

distCrit_m=5;
distDragCrit=2;


// custom road geometry

function widthLeft(u){ // width left boundary - road axis
  var wLeftRef=0.5*roadWidthRef;
  
  var u0=0.20*roadLen; var w0=1.0; // start with full width
  var u1=0.25*roadLen; var w1=0.7; // center initial narrowing
                                   // to disorder initial config
  var u2=0.30*roadLen; var w2=1.0; // end initial narrowing
  var u3=0.50*roadLen; var w3=1.0; // begin bottleneck taper
  var u4=0.65*roadLen; var w4=0.5; // begin full bottleneck
  var u5=0.80*roadLen; var w5=0.5; // end full bottleneck
  var u6=0.80*roadLen; var w6=1.0; // outflow section




  return (u<u0) ? wLeftRef
    : (u<u1) ? w0*wLeftRef+(w1-w0)*wLeftRef*(u-u0)/(u1-u0)
    : (u<u2) ? w1*wLeftRef+(w2-w1)*wLeftRef*(u-u1)/(u2-u1)
    : (u<u3) ? w2*wLeftRef+(w3-w2)*wLeftRef*(u-u2)/(u3-u2)
    : (u<u4) ? w3*wLeftRef+(w4-w3)*wLeftRef*(u-u3)/(u4-u3)
    : (u<u5) ? w4*wLeftRef+(w5-w4)*wLeftRef*(u-u4)/(u5-u4)
    : (u<u6) ? w5*wLeftRef+(w6-w5)*wLeftRef*(u-u5)/(u6-u5)
    : wLeftRef;
}

function widthRight(u){ // width road axis - right boundary - symmetric here
  return widthLeft(u);
}




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
var displayScatterplots=true;
var displayMacroProperties=false;
var displayVehIDs=false; // debugging

var hasChanged=true; // physical dim have changed (e.g. by window resize)
var canvas=document.getElementById("canvas_mixed");
var ctx=canvas.getContext("2d"); // graphics context


// (3) display logical (u,v) coords of mouse position (x,y)
// get mouse positions from gui.activateCoordDisplay which is called
// if html.onmousemover=true (only true if over client area AND moving)
// start showMouseCoords=false  since otherw NaN if mouse initially outside

showMouseCoords=true; 



//#############################################################
// (initial) IDM/ACC parameterisation and creation of underlying longmodels
//#############################################################

var v0Bike=5; var v0=6; // cars (v0 etc) are faster bicycles
var TgapBike=0.5; var Tgap=0.5;
var s0Bike=0.5; var s0=0.5;
var amaxBike=1; var amax=1;
var bcomfBike=1; var bcomf=1;

var v0Truck=12;
var TgapTruck=1.5;
var s0Truck=2;
var amaxTruck=1;
var bcomfTruck=2;

var v0Obstacle=0;

var speedlimit=1000; // per default no speedlimit
var speedlimit_truck=80./3.6;

var v0max=Math.max(v0,v0Truck,v0Bike); // to define max dist range of neigbors


var speedmap_min=0; // min speed for speed colormap (drawn in red)
var speedmap_max=v0Bike; // !!! max speed (fixed in sim)






//#############################################################
// (initial) IAM parameters and creation of the
// mixed traffic models (MTM/IAM)
//#############################################################

// (1) model constants (behavioural and graphical)

// lateral kinematics restrictions

var dvdumax=0.3;       // tan of maximum angle with respect to road axis
var dotdvdumax=0.3;    // max change rate of angle to road axis
var phiVehRelMax=0.10; // only drawing: maximum visual angle to road axis
var speedLatStuck=0.2;   // max lateral speed if long speed low!!DOS!!!

var longParReductFactor=0.1; // long interaction reduced if completely lateral
                             // =lambda to save parameters



// IAM parameterisation 
// (tau=tauLatOVM and lambda=pushLong, pushLat at the sliders)

var s0y=0.10;       // lat. attenuation scale [m] long veh-veh interact [0.15]
var s0yLat=0.10;    // !!! scale [m] lat veh-veh interact [0.60]
var sensLat=0.5;    // !!! sigma  (max des lat speed)/(long accel) [s] [1.0]

var accBiasRightTruck=0.8;  //MT 2021-11 
var accBiasRightBike=0.0;  // MT 2023-01
var accBiasRightOthers=0.0;   // including cars
var accFloorMax=0.5;        // MT 2023-01 standard 0.5; IAM lane paper 0.9
//  sensDvy in sliders; default 1s/m


// boundaries

var glob_anticFactorB=2;  //antic time for boundary response (multiples of T)
var glob_accLatBMax=20;   //max boundary lat accel, of the order of bmax

var glob_accLongBRef=2; //!!!long acceleration if veh touches boundary
var glob_accLatBRef=4;    //lateral acceleration if veh touches boundary
var s0yB=0.05;            //!!! long. attenuation scale [m] wall-veh interact
var s0yLatB=0.1;         //!!! lat. attenuation scale [m] wall-veh interact


// (2) variable slider params

var tauLatOVM=parseFloat(slider_tauLatOVM.value); // lat OVM relax time
var sensDvy=parseFloat(slider_sensDvy.value);     // FVDM-like inclusion of
                    // rel lateral speed, but multiplicative=>slider
var pushLong=parseFloat(slider_pushLong.value); // in [0,1]; 1=Galilei-inv.
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

commaDigits=2;

//setSlider(slider_inflow, slider_inflowVal, qIn, commaDigits, "veh./s");
//  qIn=6300./3600; 

var qIn=parseFloat(slider_inflow.value); //!!! instead of the above
var fracTruck=parseFloat(slider_fracTruck.value); // !! otherwise string
var fracBike=parseFloat(slider_fracBike.value);  // frac+frac=e.g.0.20.2!!
var speedMax=20;    // overridden by slider_speedmax if it exists => html
var relOutflow=1.;  // outflow/maxflow,
                    //overridden by slider_outflowVal if it exists

// initial values not controlled by sliders

var speedInit=20;
var densityInit=0.0; 




//#############################################################
// specification of vehicle types, widths, lengths [SI units]
// (the actual vehicles are constructed in the road cstr)
//#############################################################

var bike_length=1.4; var car_length=1.4; // cars=faster cyclists
var bike_width=0.4; var car_width=0.4;
var truck_length=10;
var truck_width=2.5; 
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
var roadLen=200; //300

//20 MT 2021 !!! BUG floorfield only uneven number

var wLane=0.7;  // lane width if floorField is on !! always needed for inflow!
var roadWidthRef=parseFloat(slider_roadWidth.value);
var nLanes=Math.round(roadWidthRef/wLane);

// if isRing, inflow automatically ignored and road geom not implemented

var isRing=false; 

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
detectors[1]=new stationaryDetector(mainroad,0.90*roadLen,10);

// region [umin,umax] for downloaded flow-density data
// every ndtSample timestep will be sampled in macroProperties[] vector

var macroProperties=[];
var ndtSample=60; 

var umin=0.38*roadLen;    // upstream boundary of sampled region [m];
var umax=0.42*roadLen;    // downstream boundary of sampled region [m];


//############################################
// traffic objects and traffic-light control editor
//############################################


// TrafficObjects(canvas,nTL,nLimit,xRelDepot,yRelDepot,nRow,nCol)
var trafficObjs=new TrafficObjects(canvas,2,2,0.62,0.22,1,7);

// also needed to just switch the traffic lights
// (then args xRelEditor,yRelEditor not relevant)
var trafficLightControl=new TrafficLightControlEditor(trafficObjs,0.5,0.5);

trafficObjs.setSpeedLimit(2,10); // trafficObj[2].value=x km/h, 0=free
trafficObjs.setSpeedLimit(3,20);


//#################################################################
function updateSim(dt){    // called here by main_loop()
//#################################################################


  // updateSim (1): update times
  
  time +=dt; // dt depends on initial html and timewarp slider (fps=const)
  itime++;
    //console.log("\nbegin updateSim: itime=",itime);
  if(itime==1){ // initializeMicro(types, len, w, u, v,speed,speedLat)
    //!!!
	mainroad.initializeMicro( ["bike"], [bike_length],
				  [bike_width], [150], [0], 
				 [5], [0]);


        Math.seedrandom(42); //!! start reproducibly (see docu at onramp.js)

    }

  // updateSim (1a): gradually increase inflow
  // !! Dual input (auto+sliders) only works if input
  // offset by dit/2 >=10 time steps
  
  var dit=20; 
  var dqdt=0.004;  // [veh./s^2]
  var dit=20; 
  qIn +=dqdt*dt;

  // slider_inflowVal jus as reference!
  // need not to assign a value (=>DOS), gets assigned!
  if(itime%dit==0){
    setSlider(slider_inflow, slider_inflowVal, qIn, commaDigits, "veh./s");
  }
  
  // updateSim (2): implement slider changes

  dt=parseFloat(sliderTimewarp.value)/fps;
  roadWidthOld=roadWidthRef;
  roadWidthRef=parseFloat(slider_roadWidth.value);
  if((itime+dit/2)%dit==0){
    qIn=parseFloat(slider_inflow.value);
  }
  relOutflow=parseFloat(slider_outflow.value);
  fracTruck=parseFloat(slider_fracTruck.value); // !! otherwise string
  fracBike=parseFloat(slider_fracBike.value);  // frac+frac=e.g.0.20.2!!
  tauLatOVM=parseFloat(slider_tauLatOVM.value);
  sensDvy=parseFloat(slider_sensDvy.value);
  pushLong=parseFloat(slider_pushLong.value);
  pushLat=parseFloat(slider_pushLat.value);


  nLanes=Math.max(1, Math.round(roadWidthRef/wLane));
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
  
  // !! distribute new models to the vehicles
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
    // (always drawn; changedGeometry only triggers building a new lookup table)

    
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


    // (6) draw the speed colormap (speedmaxDisplay set for nice axis scaling)

    var speedmaxDisplay=25*Math.round(3.6*speedmap_max/25)/3.6; 

    drawColormap(10+1.1*widthPix+0.10*refSizePix,
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
	var yCenterRel=0.44; // horiz center of diagrams: (0=top, 1=bottom)
	var wRel=0.24;
	var hRel=0.11;

        // determine arguments for plotxy

	//var wPix=refSizePix*wRel;
	//var hPix=refSizePix*hRel;
      var wPix=canvas.width*wRel;
      var hPix=wPix*hRel/wRel;
      var vertSpacePix=0.10*hPix; // diagram separation
      var xPixLeft=canvas.width*xCenterRel-0.5*wPix;
      var yPixTop=canvas.height*yCenterRel+0.05*vertSpacePix; // lower diagr


      // determine axes specifications [colx, xmult,xmax,xlabel]
      // and optional boxplot specifications: each point gets
      // vertical candlestick [col_ymin, col_25th, col_50th, 75, ymax]

      var rhoSpec=[0,1000,200,"Density [veh/km]"];
      var QSpec=[1,3600,3600,"Flow [veh/h]"];
      var VSpec=[2,3.6,20,"Speed [km/h]"];
      var boxSpec=[3,4,5,6,7];

        // define scatter plots instance and do the plotting (new necessary!)
      // macroProperties from mainroad.updateSpeedStatistics(umin,umax)
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

  //!! use Road.findNearestDistanceTo

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

