

//!! v logical coordinate positive towards the RIGHT right
//!! v logical coordinate negative towards the LEFT left

//!! different from extractPNEUMA !!


/**
##########################################################
road segment (link): logic-geometrical properties (u,v),  
physical dynamics of the vehicles on a road section,
drawing routines of road/vehicles 
with road geometry functions (u,v)->(x,y) to be provided by the main program 
##########################################################

@param roadID:         integer-valued road ID
@param isRing:         true if periodic BC, false if open BC
@param roadLen:        link length [m]
@param axis_x,axis_y   function pointer road axis_x(u), axis_y(u)
@param widthLeft:      function pointer width[m] left boundary-road axis (u)
@param widthRight:     function pointer width[m] road axis-right boundary (u)
@param densInit:       initial linear density [veh/m]
@param speedInit:      initial longitudinal speed [m/s]
@param fracTruckInit:  initial truck fraction [0-1]
@param fracBikeInit:   initial bike fraction [0-1] (later on array of veh. compos.)
@param v0max:          max v0 of vehicles to define max distRange of forces
@return:               road segment instance
*/




// constructor
// widthLeft(u), widthRight(u) is a function which is passed!!

function road(roadID, isRing, roadLen, axis_x, axis_y, widthLeft, widthRight, 
	      densInit, speedInit, fracTruckInit, fracBikeInit, 
	      v0max,dvdumax){

  console.log("road: in road cstr: roadID=",roadID," roadLen=",roadLen);
  this.roadID=roadID;
  this.isRing=isRing;
  this.roadLen=roadLen;
  this.widthLeft=widthLeft;   // half width as f(u) from road axis
  this.widthRight=widthRight; // half width as f(u) to the right
  this.axis_x=axis_x;
  this.axis_y=axis_y;

  this.trafficLights=[]; // Introduce by this.addTrafficLight
                         // to model the traffic light->road operations.
                         // need separate array 
                         // since no virtual vehicles corresp. to green TL
                         // (all drawing is done by the 
                         // ObstacleTLDepot objects)
  
  
  // !!! MT 2021-11 assume roadWidthRef is multiple of wLane
  // wLane top-level var

  console.log("road cstr: wLane=",wLane," this.widthLeft=",this.widthLeft);

    // network related properties

    this.inVehBuffer=0; // #waiting vhicles; if>=1, updateBCup called
    this.inVehCount=0;   // sum of vehicles inserted by upstream BC

    // neighborhood-related  properties:
    // consider leading/flw vehicles in 
    // range du in [-dumaxLag,dumaxLead] !!

    var bMeasure=4; // assume double typ comf decel for bMeasure
    var TMeasure=1; // assume time gap of lMeasure
    var LMeasure=10; // assume time gap of lMeasure
    this.dumaxLag= LMeasure+0.5*(v0max*TMeasure+0.5*v0max*v0max/bMeasure);  
    this.dumaxLead=LMeasure+1.0*(v0max*TMeasure+0.5*v0max*v0max/bMeasure);

    console.log("road cstr: v0max=",v0max," dumaxLag=",this.dumaxLag,
		" dumaxLead=",this.dumaxLead);

    // drawing-related vatiables (set fixed)

    this.draw_nSegm=100;
    this.draw_curvMax=0.02; // maximum assmued curvature 1/r

    // road-segment related arrays for numeric performance: defined/redefined 
    // whenever road.draw(..) with changedGeometry=true is called
    // (x,y)=location in east-north direction while (u,v)=logical coordinates 

    this.draw_x=[];  // this.draw_x[iSegm]=this.axis_x(u)
    this.draw_y=[];
    this.draw_phi=[];
    this.draw_cosphi=[];
    this.draw_sinphi=[];

    // vehicle and vehicle composition related arrays
    
  this.veh=[];
  this.speed=[]; // need vehicle long speeds separately for calc macro properties
  this.Lmacro=0; // length of road section umax-umin where to calc macro properties
  this.vehType=["car", "truck", "bike", "obstacle"];
  this.vehLength=[car_length,truck_length,bike_length];
  this.vehWidth=[car_width,truck_width,bike_width];
  this.mixedModelRef=[mixedModelCarRef,mixedModelTruckRef,mixedModelBikeRef,
			mixedModelObstacle];
  this.longModelRef=[longModelCarRef, longModelTruckRef, longModelBikeRef,
		     null];

    
    // construct vehicle array
    // u=long logical coordinate; i=0: first vehicle=maximum u=(n-1)/n*roadLen
    // v=transv logical coordinate; v=0: center; v increasing left->right

  var nvehFromDens=Math.floor(this.roadLen*densInit);
     
  for(var i=0; i<nvehFromDens; i++){
    var u=(nvehFromDens-1-i)*this.roadLen/nvehFromDens;
    var v=(i%3-1)* 0.1*(this.widthLeft(u)+this.widthRight(u));
    var rnd=Math.random();
    var iType=(rnd<fracTruckInit) ? 1 : (rnd<fracTruckInit+fracBikeInit) ? 2 : 0;

    // actually construct vehicles with individual models ("new")
    
    var mixedModel=this.createNewMixedModel(iType);
    this.veh[i]=new vehicle(this.vehType[iType], this.vehLength[iType],
			    this.vehWidth[iType],
			    u, v, speedInit, 0, mixedModel);
  }
  this.writeVehicles();
} // road constructor


//######################################################################
// creates deep copy of MTM mixedModel for itype in {car,truck,bike,obstacle}
//######################################################################

road.prototype.createNewMixedModel=function(iType){
  var longModel;
  var mixedModel;
    
  if(iType<3){ // overwrite params (not applicable to obstacles)
    longModel=new ACC(v0,Tgap,s0,amax,bcomf); // car; "new" important
    mixedModel=new MTM(longModel,s0y,s0yLat,s0yB,s0yLatB,
		       sensLat,tauLatOVM,sensDvy); // car, new important
    mixedModel.copy(this.mixedModelRef[iType]);
  }
  else{ //iType==3
    mixedModel=new ModelObstacle();// no longModel needed
  }
  return mixedModel;
}



//######################################################################
// write vehicle info
//######################################################################

road.prototype.writeVehicles= function() {
    console.log("in road.writeVehicles(): roadLen="+this.roadLen);

  for(var i=0; i<this.veh.length; i++){
      console.log(" i=",i," id=",this.veh[i].id,
		  " type=",this.veh[i].type,
		  " len=",  parseFloat(this.veh[i].len).toFixed(2),
		  " width=",parseFloat(this.veh[i].width).toFixed(2),
		  "\n   u=",    parseFloat(this.veh[i].u).toFixed(2),
		  " v=",    parseFloat(this.veh[i].v).toFixed(2),
		  " speed=",parseFloat(this.veh[i].speed).toFixed(2),
		  " speedLat=",parseFloat(this.veh[i].speedLat).toFixed(2),
		  " accLong=",  parseFloat(this.veh[i].accLong).toFixed(2),
		  " accLat=",  parseFloat(this.veh[i].accLat).toFixed(2),
		  "");
  }
  if(this.veh.length==0){console.log(" no vehicles on road!");}
}

// ###########################################################
// TODO
// calculate realized travel times
// ###########################################################

//road.prototype.updateTravelTimes= function(time,umin,umax) {
    // (1) determine if a vehicle moved from u<umin to u>umin.
    //     if so, set this.veh[i].startTime=time  => add new veh property
    // (2) determine if a vehicle moved from u<umax to u>umax.
    //     if so, this.travTimes.push(time-this.veh[i].startTime); => def this.travTimes
//    ;
//}

// ###########################################################
// Calculate realized travel times
// scans road section from umin to umax
// and adds vehicle travelling times to this.travTime array if umax passed
// !!! copied from old version, may not work
// ###########################################################

road.prototype.updateTravelTimes= function(umin,umax,dt) {
    this.Lmacro=umax-umin;
    for(var i=0; i<this.veh.length; i++){
	if(this.veh[i].type !="obstacle"){
	    if((this.veh[i].u>=umin)&&(this.veh[i].u<=umax)){
		this.speed.push(this.veh[i].speed);
		this.veh[i].travTime += dt;
	    }

            // signature for exiting region (if precise, need history avriable uOld)
	    if((this.veh[i].u>umax)&&(this.veh[i].u<=umax+this.veh[i].speed*dt)){
		this.travTime.push(this.veh[i].travTime);
	    }
	}
    }
}

// ###########################################################
// scans road section from umin to umax
// and adds all veh speeds to the array this.speed
// !! the array is not emptied within the aggregation time interval
// (nt time steps)

// ###########################################################

road.prototype.updateSpeedStatistics= function(umin,umax) {
    this.Lmacro=umax-umin;
    for(var i=0; i<this.veh.length; i++){
	if((this.veh[i].type !="obstacle")&&(this.veh[i].u>=umin)&&(this.veh[i].u<=umax)){
	    this.speed.push(this.veh[i].speed);
	}
    }
}




// ###########################################################
// calculates macroscopic statistics out of the array this.speed
// [TODO: and this.travTimes]
// at the end of the aggregation time interval = nt time steps
// this.speed is obtained previously by nt calls of road.updateSpeedStatistics
// scanning the road section from umin to umax

// nt
//  = number of section scans
//  = number of time steps per aggregation interval
//  = number of calling updateSpeedStatistics before calling this routine

// returns [rho,Q,Vavg,Vmin,V25,V50,V75,Vmax]  TODO ttAvg, ttVar
// ###########################################################

road.prototype.calcMacroProperties= function(nt) {
    //console.log("in road.calcMacroProperties(): nveh=",(this.veh.length));

    // init values for no vehicles in [umin:umax]

    var rho=0;
    var Q=0;
    var Vavg=0;
    var Vmin=0;
    var V25=0;  // 1th quartil
    var V50=0; // median
    var V75=0; // 3th quartil
    var Vmax;


    // return if no veh at all 
    // or all vehicles have u>umax, so no veh in [umin,umax]

    if(this.speed.length==0){
	console.log(" no veh at all or all veh outside sampled region u=[",
		    umin,",",umax,"]");
	return [0,0,0,0,0,0,0,0];
    }


    // do the regular calculations for >=1 veh in [umin,umax]

    // copy speeds into separate array to do sorting w/respect to speed 
    // (the vehicles need to be sorted in decreasing u order)

  // nveh is the sum of all vehicle snapshots in n[umin,umax] over all times!
  // nveh/nt=time-averaged vehicle number in aggr interval
  
    var nveh=this.speed.length;  
    var speedsum=0;
    for(var i=0; i<nveh; i++){
	speedsum +=this.speed[i];
    }
    Vavg=speedsum/nveh;

    // rho=1/nt*sum_t rho_t=1/nt*sum_t nveh_t/L=1/nt* nveh/L
    // Q=1/nt*sum_t*Q_t=1/nt*sum_t rho_t V_t=1/nt*sum_t nveh_t/L*V_t
    //  =1/nt*sum_t sum_i V_{i,t}/L=nveh/nt*Vavg/L=Vavg/rho
    
    rho=nveh/(this.Lmacro * nt);
    Q=rho*Vavg; 

    // calculate the boxplot parameters (quantiles)

    Vmin=V25=V50=V75=Vmax=this.speed[0]; // valid if nveh=1

    if(nveh>1){
	this.speed.sort(function(a,b){ return a-b;}); // to calc quantiles

 
        // quantiles eg nveh=4, V25=1/4*V[0]+3/4*V[1]

	Vmin=this.speed[0];
	Vmax=this.speed[nveh-1];

	var il=Math.floor(0.25*(nveh-1));
	var rest=0.25*(nveh-1)-il;
	V25=(1-rest)*this.speed[il]+rest*this.speed[il+1];

	var il=Math.floor(0.50*(nveh-1));
	var rest=0.50*(nveh-1)-il;
	V50=(1-rest)*this.speed[il]+rest*this.speed[il+1];

	var il=Math.floor(0.75*(nveh-1));
	var rest=0.75*(nveh-1)-il;
	V75=(1-rest)*this.speed[il]+rest*this.speed[il+1];

    }

    // reset array of speeds

    this.speed=[];
    
    var ret=[rho, Q, Vavg, Vmin, V25,V50, V75, Vmax];
    return ret;

} // calcMacroProperties



//#####################################################
// initialize the road (section) with explicitely given single vehicles (ICmicro)
//#####################################################
road.prototype.initializeMicro=function(types,lengths,widths,longPos,latPos, 
					speedsLong, speedsLat){

    var nvehInit=types.length;
    if( (longPos.length!=nvehInit) || (latPos.length!=nvehInit)
      || (speedsLong.length!=nvehInit)|| (speedsLat.length!=nvehInit)){
      console.log("road.initializeMicro: bad input: not all arrays have length", 
		  nvehInit);
      return 0;
    }

    //empty vehicles array if not empty

  if(this.veh.length>0){this.veh.splice(0,this.veh.length);}

    // add the new vehicles to the array

  for(var i=0; i<types.length; i++){

    var iType=(types[i] == "car") ? 0 :
	(types[i] == "truck") ? 1 :
	(types[i] == "bike") ? 2 :
	3;
    
    var mixedModel=this.createNewMixedModel(iType);
	
    var vehNew=new vehicle(types[i], lengths[i], widths[i], 
			   longPos[i],latPos[i],speedsLong[i],speedsLat[i],
			   mixedModel);
    this.veh.push(vehNew);
  }

  this.sortVehicles(); // final step of initializeMicro
  
  this.writeVehicles();
}//initializeMicro



//#####################################################
// sort vehicles into descending arc-length positions u 
//#####################################################

road.prototype.sortVehicles=function(){
    if(this.veh.length>1){
	this.veh.sort(function(a,b){
	    return b.u-a.u;
	})
    };
}



/*
#############################################################
(aug17) find nearest regular leaders or followers 
at position u on a given lane (use in stationaryDetector)
#############################################################

@param  longitudinal physical position
@return the nearest vehicle to this position, regardless of lane 
        (id=-1 if none)
*/

road.prototype.findLeaderAt=function(u){
    //console.log("in road.findLeaderAt");


    // initialize virt veh for "no success"

    var vehLead=new vehicle(0,0,0,0,0,"car"); // new necessary here![];
    vehLead.id=-1;


    // do the actual finding

    var i=0;
    while ((i<this.veh.length) && (this.veh[i].u>u)){
	if(this.veh[i].isRegularVeh()){
	    vehLead=this.veh[i];
	}
	i++; 
    }


    //if(vehLead.id==-1){
  if(false){
	console.log("road.findLeadersAt: warning: no leader found");
    }

    return vehLead;
}



//################################################################
// nearest followers on any lane (only use in stationary detectors)
//################################################################

road.prototype.findFollowerAt=function(u){

    //console.log("in road.findFollowerAt");


    // initialize virt veh for "no success"

    var vehFollow=new vehicle(0,0,0,0,0,"car"); // new necessary here!


    // do the actual finding

    var i=this.veh.length-1;
    while ((i>=0) && (this.veh[i].u<u)){
	if(this.veh[i].isRegularVeh()){
	    vehFollow=this.veh[i];
	}
	i--; 
    }

    if(vehFollow.id==-1){
      console.log("road.findFollowersAt: warning: no follower at position ",u,
		  " on any lane");
    }

    return vehFollow;
}





//#####################################################
  /** get/update index range of all vehicles neighboring vehicle i
  requires sorted vehicle array = prior application of sortVehicles() 

  @param i:      vehicle for which neighbors are to be  determined
  @return:       array [imin,imax]
  */
//#####################################################

road.prototype.get_neighborIndexRange=function(i){
 
    // leaders
    
    var inRange=true;
    var u=this.veh[i].u;
    var imin=i; // may be =0
    while( (imin>0)&&inRange){imin--;
	inRange =(this.veh[imin].u - u   <= this.dumaxLead);
    }
    if((i>0)&&(!inRange)){imin+=1;}

    // followers
    
    inRange=true;
    var imax=i; // may be =0
    while( (imax<this.veh.length-1)&&inRange){imax++;
	inRange =(u-this.veh[imax].u <= this.dumaxLag);
    }
    if((i<this.veh.length-1)&&(!inRange)){imax-=1;}

    // test
    if(false){
	console.log("in road.get_neighborIndexRange(i=",i,
		    "): imin=",imin," imax=",imax);
	console.log("   u="+u+" u[imin]="+this.veh[imin].u
		    +" u[imax]="+this.veh[imax].u );
    }
    return [imin,imax];
}



/**
#####################################################
save old state for debugging
#####################################################
I apply it after calcAccelerations to track accel. jumps 
when calcAcceleration is called the next time. 
Index changes arise during movement, BCup, BCdown, possibly 
arrow drawing, and possibly elsewhere

@sets old environemnt and old accelerations with actual values
*/

road.prototype.saveOldState=function(){
    for(var i=0; i<this.veh.length; i++){
	this.veh[i].saveOldState();
    }
}



//######################################################################
// main calculation of accelerations 
//######################################################################

road.prototype.calcAccelerations=function(){

    this.saveOldState(); // debugging
    
    // get this.veh[i].imin ... this.veh[i].imax for all vehicles

    //this.writeVehicles();

    for(var i=0; i<this.veh.length; i++){
	//if(true){
	if(this.veh[i].type!=="obstacle"){
	    this.calcAccelerationsOfVehicle(i);
	}
    }
}


//######################################################################
// calculates long and lat accelerations of Vehicle i
// and sets this.veh[i].accLong and this.veh[i].accLat
// !!! central control of dynamics at place which knows nearly all vars
//######################################################################

road.prototype.calcAccelerationsOfVehicle=function(i){

  var useSeveralLeaders=false; //!!! test new model version

  var bIntCrit=0.1;  // !! preselection for vehicles eligible for interaction:
                     // if |longitudinal force| > bIntCrit

  var smaxfollow=s0; // in addition to above criterion, followers only
                     // included if their long gap <smaxfollow




  // just in case... road.prototype.calcAccelerations also checks it

  if(this.veh[i].type==="obstacle"){console.log("obstacle!"); return;}

 
  // (0) preselection: get ordered index range of candidate vehicles 
  //     (only longitudinal range considered)

  var irange=this.get_neighborIndexRange(i);
  var imin=irange[0];
  var imax=irange[1];

    // (0a) get interacting leading and lagging vehicles (subset of above)
    // notice: too many differences between veh.calcAccLongLeaderSelect and 
    // veh.calcAccLong, veh.calcAccLat
    // => hardly performance gain by reusing actual accelerations
    //    from the parts calculated by veh.calcAccLongLeaderSelect
    //    (actual interacting accelerations calculated for much fewer 
    //    leaders and followers than are in the preselection, anyway)
    // => make selection independently from the operative part

    // result: nLeaders, iLeaders[], nFollowers, iFollowers[]


  // selection of possibly interacting leaders
  // accInt=longitud interaction=accCFint*min(1,exp(-sy/s0ymax))

  var iLeaders=[];
  var accInteractionLeaders=[];
  var nLeaders=0;

  for(var j=imin; j<i; j++){
    var accInt=this.veh[i].calcAccLongLeaderSelect(this.veh[j]);
    if(accInt<-bIntCrit){
	    iLeaders[nLeaders]=j; 
	    accInteractionLeaders[nLeaders]=accInt;
	    nLeaders++;
    }
  }

  // selection of followers (consider only if interacting AND gap<s0)

  var iFollowers=[];
  var accInteractionFollowers=[];
  var nFollowers=0;

  for(var j=i+1; j<=imax; j++){
    var accInt=this.veh[j].calcAccLongLeaderSelect(this.veh[i]);
    if((accInt<-bIntCrit)
       &&(this.veh[i].u-this.veh[i].len-this.veh[j].u<smaxfollow)) {
      iFollowers[nFollowers]=j;
      accInteractionFollowers[nFollowers]=accInt;
      nFollowers++;
    }
  }

 
  //(1) longitudinal accelerations due to other vehicles ("traffic"): 
  //  just chose the single LEADER
  //  with strongest interaction 
  //  initialize with no interaction (nLeaders=0)
 
  var accLongFree=this.veh[i].calcAccLongFree(); 
  var accLongInt=0; 
  for(var ilead=0; ilead<nLeaders; ilead++){
    var j=iLeaders[ilead];
    var accLongLeader=this.veh[i].calcAccLongInt(this.veh[j]);
    if(accLongLeader<accLongInt){
      if(!useSeveralLeaders){accLongInt=accLongLeader;}

      // leaderType needed for special lateral treatment of obstacles later
      this.veh[i].mostInfluencingLeaderIndex=j;
    }
    if(useSeveralLeaders){accLongInt+=accLongLeader;}
    
  }

    //(1a) Longitudinal push from behind
    //  just chose the single FOLLOWER
    //  with strongest interaction 
    //  initialize with no interaction (nLeaders=0)

  if(true){ // gamma=pushLong. -lat external slider
    var accLongPushMax=0;
    for(var ifollow=0; ifollow<nFollowers; ifollow++){
      var j=iFollowers[ifollow];
      
      // pushLong=gamma, i <-> j means + <-> -
      var accLongPush=-pushLong*this.veh[j].calcAccLongInt(this.veh[i]);
      if(!useSeveralLeaders){ // just determine max push if only single flw
        accLongPushMax=Math.max(accLongPush, accLongPushMax);
      }
      else{accLongInt+=accLongPush;} // add to final interaction if several
    }
    if(!useSeveralLeaders){accLongInt += accLongPushMax;}
  }
  // finished calculation of accLongInt


  
  //(2) lateral accelerations due to other vehicles ("traffic"):
  //  include ALL leaders and followers, also leading obstacles
  //  leaders with weight 1, followers with weight pushLat
  //  initialize with no interaction (nLeaders=nFollowers=0)

  var accLatFree=this.veh[i].calcAccLatFree();
  var accLatInt=0;

    // leaders

  //var logging=(this.veh[i].id==9364); // need fixed random seed for this
  var logging=false;
  
  for(var ilead=0; ilead<nLeaders; ilead++){
    var j=iLeaders[ilead];
    accLatInt += this.veh[i].calcAccLatInt(this.veh[j],logging);
  }

    // followers (actio=reactio => "-=" instead of "+=" !)
    // of course, do not consider push effect of back obstacles

  for(var ifollow=0; ifollow<nFollowers; ifollow++){
    var j=iFollowers[ifollow];
    var factor=(this.veh[j].type==="obstacle") ? 0 : pushLat;
    accLatInt -= factor*this.veh[j].calcAccLatInt(this.veh[i],false);
  }
  // finished calculation of accLatInt


  // (3) repulsion effects of road boundaries/walls (vector)
  // ! (possibly replaceable by obstacles but probably less effective)
  // !!! make them more effective at high speeds to avoid BC crashes
  // !!! make them not blindly "anticipate" situations further ahead

  var accBoundaries=this.veh[i].calcAccB(widthLeft,widthRight);
 //console.log("accBoundaries=",accBoundaries);


  // (4) calculate final result of model w/o floor fields

  this.veh[i].accLong=accLongFree+accLongInt+accBoundaries[0];
  this.veh[i].accLat=accLatFree+accLatInt+accBoundaries[1];// accLatFree

 
  // (5) add floor fields (inited in sim-straight, controlled by gui)
  //  normal vehs in lane center
  //  bikes between lanes
  //  vPhase0: first potential minimum of vehs 0.6*wLane from right (+) boundary

  if(floorField){
    var vPhase0=0.5*roadWidthRef-0.5*wLane; // roadWidthRef global slider var
    var phase=2*Math.PI*(this.veh[i].v-vPhase0)/wLane; // phase=0: center of lane
    var accFloor=((this.veh[i].type=="car")||(this.veh[i].type=="truck"))
	? -accFloorMax*Math.sin(phase)   
	: (this.veh[i].type=="bike")
	? + accFloorMax*Math.sin(phase)
	: 0;
    accFloor *= 2*(1-2*Math.abs(this.veh[i].v/roadWidthRef)); 
    this.veh[i].accLat += accFloor;

    // (5a) Tweak to forbid bikes to go to the utter left space as observed
    // in the Athens pNEUMA d8* data
    // (js guaranteed to stop evaluation if first cond of an AND is false)
    // to right is positive in mixed traffic sim

    if( (!(typeof bikesNoLeftSpace === 'undefined'))
	&& bikesNoLeftSpace  && (this.veh[i].type=="bike")){
      var widthLeftLocal=this.widthLeft(this.veh[i].u);
      var dyLeft=widthLeftLocal-0.5*this.veh[i].width+this.veh[i].v;
      var accTweak=42*Math.exp(-dyLeft/0.4); // numbers here OK
      this.veh[i].accLat += accTweak; 
      if(false){
      //if(accTweak>1){
	console.log("bikesNoLeftSpace=true: this.veh[i].v=",
		    this.veh[i].v.toFixed(1),
		    " dyLeft=",dyLeft.toFixed(2),
		    " accAddtl=",accTweak.toFixed(2));
      }
    }
  }

  
  // (6) add bias acceleration to the right

  var accBiasRight=(this.veh[i].type==="truck")
      ? accBiasRightTruck : (this.veh[i].type==="bike")
      ? accBiasRightBike : accBiasRightOthers;
  this.veh[i].accLat += accBiasRight;


  // (7) add long and lateral accel noise to break some symmetry artifacts

  var accNoiseAmplLong=1.; // sig_speedFluct=noiseAcc*sqrt(t*dt/12)  //1.0
  var accNoiseAmplLat=0.3; // sig_speedFluct=noiseAcc*sqrt(t*dt/12)  //0.3

  var relspeed_v0=this.veh[i].speed/this.veh[i].mixedModel.longModel.v0;

  var accRnd=accNoiseAmplLong*(Math.random()-0.5);
  this.veh[i].accLong += accRnd*relspeed_v0; //!! *relspeed_v0

  accRnd=accNoiseAmplLat*(Math.random()-0.5);
  this.veh[i].accLat += accRnd*relspeed_v0;
  

    //################################
    // debug logging calcAccelerationsOfVehicle
    //################################

  if(false){
  //if(this.veh[i].id==200540){
  //if(true){
  //if(this.veh[i].type != "obstacle"){
    //if((!isNumeric(this.veh[i].accLong))||(!isNumeric(this.veh[i].accLat))){
    console.log("\nroad.calcAccelerationsOfVehicle: id=",this.veh[i].id);
    console.log(" position:       posx=",parseFloat(this.veh[i].u).toFixed(2),
		" posy=",parseFloat(this.veh[i].v).toFixed(2));
    console.log(" velocity:         vx=",
		parseFloat(this.veh[i].speed).toFixed(2),
		" vy=  ",parseFloat(this.veh[i].speedLat).toFixed(2));

    console.log(" acc_free:    accLongFree=",
		parseFloat(accLongFree).toFixed(2),
		" accLatFree=",parseFloat(accLatFree).toFixed(2));
    console.log(" acc_int:    accLongInt=",
		accLongInt.toFixed(2),
		" accLatInt=",parseFloat(accLatInt).toFixed(2));
    console.log(" acc boundaries: accBoundaries[0]=",
		parseFloat(accBoundaries[0]).toFixed(2),
		" accBoundaries[1]=",parseFloat(accBoundaries[1]).toFixed(2));
    console.log(" acc floor: (0,",accFloor.toFixed(2));
    console.log(" acc:            accLong=",
		parseFloat(this.veh[i].accLong).toFixed(2),
		" accLat=",parseFloat(this.veh[i].accLat).toFixed(2));
 

	if(false){
	  console.log("\n nLeaders=",nLeaders);
	  for(var ilead=0; ilead<nLeaders; ilead++){
	    var j=iLeaders[ilead];
	    console.log(
		"  leader id=",this.veh[j].id,
		" u=",parseFloat(this.veh[j].u).toFixed(2),
		" v=",parseFloat(this.veh[j].v).toFixed(2),
		" accInteraction=",
		parseFloat(accInteractionLeaders[ilead]).toFixed(3)
	    );
	  }
	}

	if(false){
	  for(var ifollow=0; ifollow<nFollowers; ifollow++){
	    var j=iFollowers[ifollow];
	    console.log(
		"  follower id=",this.veh[j].id,
		" u=",parseFloat(this.veh[j].u).toFixed(2),
		" v=",parseFloat(this.veh[j].v).toFixed(2),
		" accInteraction=",
		parseFloat(accInteractionFollowers[ifollow]).toFixed(3)
	    );
	  }
	}


    }

}// calcAccelerationsOfVehicle


/**
######################################################################
 main kinematic update (ballistic update scheme)
 including ring closure if isRing
######################################################################
@param dt:    update time interval [s]
@return:      void
*/

road.prototype.updateSpeedPositions=function(dt){
  for(var i=0; i<this.veh.length; i++){
    
    var accLong=this.veh[i].accLong;
    var speedOld=this.veh[i].speed;
    var speedLatOld=this.veh[i].speedLat;

    this.veh[i].speed    = speedOld + accLong*dt;
    this.veh[i].speedLat = speedLatOld +this.veh[i].accLat*dt;


    // restrict speedLat (1)
    // restrict change rate of approx heading angle to road axis by dotdvdumax
    // and curvature radius r approx dotu/dotdvdu lead/shuld lead
    // to addtl restriction according to
    // accLat| < dotu^2/r_min and |accLat| < =dotu*dotphi approx dotu*dotdvdu

    // local dvdu: new; this.veh[i].dvdu: old+saved

    var dvdu=this.veh[i].speedLat/(Math.max(this.veh[i].speed,0.0001));
    var sign_dotdvdu=(dvdu-this.veh[i].dvdu>0) ? 1 : -1;
    if(Math.abs(dvdu-this.veh[i].dvdu)>dt*dotdvdumax){
	  this.veh[i].dvdu +=sign_dotdvdu*dotdvdumax*dt;
    }

    // restrict speedLat (2)
    // restrict angle itself to dvdumax
      
    this.veh[i].dvdu=Math.max(-dvdumax, Math.min(dvdumax,this.veh[i].dvdu));

    // restrict speedLat (3)
    // restrict speedLat itself by angle this.veh[i].dvdu;
    // lift dvdu restriction and only apply speedLatMax restrction
    // if obstacle ahead
    // speedLatMax, speedLatStuck always >0

    var speedLatMax=Math.abs(this.veh[i].dvdu*this.veh[i].speed);

    // if real obstacle (no TL)
    var leaderIndex=this.veh[i].mostInfluencingLeaderIndex;
    //console.log("this.veh[leaderIndex]=",this.veh[leaderIndex]);
    
    if((!(typeof this.veh[leaderIndex] === 'undefined'))
       &&this.veh[leaderIndex].isRealObstacle()){
      console.log("Vehicle ",this.veh[i].id," follows real obstacle!");
      speedLatMax=Math.max(speedLatStuck,speedLatMax);
    }
    this.veh[i].speedLat
      =Math.max(-speedLatMax,Math.min(speedLatMax,this.veh[i].speedLat));



    // update positions (due this at the end because otherwise dvdu limits
    // not into effect!

    var dv=0.5*(speedLatOld+this.veh[i].speedLat)*dt;
    var du=0.5*(speedOld+this.veh[i].speed)*dt;
    if(this.veh[i].speed<-1e-6){
	    this.veh[i].speed=0;
	    du=-0.5*speedOld*speedOld/accLong;
    }
    this.veh[i].v+=dv;
    this.veh[i].u+=du;
    if((this.isRing)&&(this.veh[i].u>this.roadLen)){ // close ring if isRing
	    this.veh[i].u -= this.roadLen;
    }
    
 
    // debug dvdumax, dotdvdumax, speedLatStuck (all def @ top level)
    // in top-level sim-straight*.js

    if(false){
    //if(this.veh[i].id==974709){
      //if(this.veh[i].type!="obstacle"){
          console.log("road.updateSpeedPositions: t=",formd(time),
		      " veh ID ",this.veh[i].id,
		      " dvdu=",formd(dvdu),
		      " this.veh[i].dvdu=",formd(this.veh[i].dvdu),
		      " sign_dotdvdu=",sign_dotdvdu,
		      "  x=",parseFloat(this.veh[i].u).toFixed(2),
		      " vx=",parseFloat(this.veh[i].speed).toFixed(3),
		      " accx=",parseFloat(this.veh[i].accLong).toFixed(3),
		      "  y=",parseFloat(this.veh[i].v).toFixed(2),
		      " vy=",parseFloat(this.veh[i].speedLat).toFixed(3),
		      " accy=",parseFloat(this.veh[i].accLat).toFixed(3),
		      " speedLatMax=",formd(speedLatMax),
		      " speedLatStuck=",formd(speedLatStuck),
		     "");
    }
  }


  
  this.sortVehicles(); // positional update may have disturbed sorting
  if(downloadActive){this.updateExportString();} // MT 2021-11

}




//######################################################################
// downstream BC: drop at most one vehicle at a time (no action if isRing)
//######################################################################

road.prototype.updateBCdown=function(){
  if(this.veh.length>0){
    if((this.veh[0].u>this.roadLen)&&(!this.isRing)){
        //console.log("road.updateBCdown: nveh="+this.veh.length+
	//	  " removing one vehicle");
	this.veh.splice(0,1);
	this.sortVehicles(); // needed if faster veh overtook while leaving
	//console.log("after road.updateBCdown: this.veh.length=",this.veh.length,
	//	    " this.veh.length=",this.veh.length);
    }
  }
}

//######################################################################
// upstream BC: insert vehicles at total flow Qin
//######################################################################

road.prototype.updateBCup=function(Qin,fracTruck,fracBike,dt){
    if(false){
     console.log("road.updateBCup: Qin=",Qin,"dt=",dt,
		" inVehBuffer=",this.inVehBuffer);
  }
  this.inVehBuffer+=Qin*dt;
  this.inVehBuffer=Math.min(5,this.inVehBuffer); // !!avoid queue at inflow 

  if((!this.isRing)&&(this.inVehBuffer>=1)){
    var success=false; // false initially
    var sNew=0; // =0 just initializer
    var uNew=0; 
    var smin=10; // =10 filter accept upstream vehicle //
    var speedmin=2; // altern. filter accept upstream vehicle

    if(this.veh.length<2){success=true; } //length of ARRAY
    else{  // get gap of *last* inserted vehicle
        var iLast=this.veh.length-1;
        var s=this.veh[iLast].u-this.veh[iLast].len-uNew;
  	success=(s>smin) || (this.veh[iLast].speed>speedmin); 
    }

    // actually insert new vehicle (0=car,1=truck,2=bike)
    // insert trucks only at positiv v (right part of the road)

    if(success){
      var roadWidthLoc=this.widthLeft(0)+this.widthRight(0); // width at u=0
      // create array of possible entry positions (also lane based if mixed)
      var vNewRel=[];
      for(var k=0; k<nLanes; k++){vNewRel[k]=-0.5 + (0.5+k)/nLanes;}
      var rnd=Math.random();
      var iType=(rnd<fracTruck) ? 1 : (rnd<fracTruck+fracBike) ? 2 : 0;
      var index=this.inVehCount%nLanes;

      // put trucks only at the right-hand side (odd indices)
      if((iType==1)&&(index<0.5*nLanes-1.01)){
	index=(this.inVehCount+Math.round(0.5*nLanes))%nLanes;
      }
      
      var vNew=roadWidthLoc*vNewRel[index]; // not speed but lateral pos!
      var speedRef=1000; // js does not skip cond statement if false!
      if(this.veh.length>=2){speedRef=1.2*this.veh[iLast].speed;} 
      var speedNew=Math.min(this.mixedModelRef[iType].longModel.v0, Math.max(speedRef,3));
      
      var mixedModel=this.createNewMixedModel(iType);

      var vehNew=new vehicle(this.vehType[iType], this.vehLength[iType],
			     this.vehWidth[iType],
			     uNew,vNew,speedNew,0,mixedModel);
      this.veh.push(vehNew); // add vehicle after old pos this.veh.length-1 
      this.inVehBuffer -=1;
      this.inVehCount++;

      this.sortVehicles(); // necessary if later on more intelligent  
                           // upstream BC where veh may set not at u=0 

      if(false){
	  console.log("road.updateBCup: new vehicle i=", this.veh.length-1,
		      " type ", this.vehType[iType],
		      " at pos u=0, v "+vNew
		      +", type "+vehNew.type
		      +", speed="+vehNew.speed
		      +" speedLat="+vehNew.speedLat
		      +" Lveh="+vehNew.len);
      }
    }
  }
}




//######################################################################
// get direction of road at arclength u
//######################################################################
/**
@param axis_x(u), axis_y(u)=phys. road geometry as parametrized 
       function of the arc length
@param u=actual arclength for which to get direction
@return direction (heading) of the road (0=East, pi/2=North etc)
*/

road.prototype.get_phi=function(u){

    var smallVal=0.0000001;

    var du=0.1;
    var dx=this.axis_x(u+du)-this.axis_x(u-du);
    var dy=this.axis_y(u+du)-this.axis_y(u-du);
    var phi=(Math.abs(dx)<smallVal) ? 0.5*Math.PI : Math.atan(dy/dx);
    if( (dx<0) || ((Math.abs(dx)<smallVal)&&(dy<0))){phi+=Math.PI;}
    return phi;
}

//######################################################################
// get x pixel coordinate of logical long coord u and transv v (pos if right)
//######################################################################
/**
@param u=logical longitudinal coordinate (zero at beginning)
@param v=logical transversal coordinate (zero at road center, towards right)
@param scale translates physical road coordinbates into pixel:[scale]=pixels/m
@return x pixel coordinate
*/

road.prototype.get_xPix=function(u,v,scale){
  var phi=this.get_phi(u);
  return scale*(this.axis_x(u)+v*Math.sin(phi));
}

//######################################################################
// get yPix coordinate from logical coordinates (yPix increasing downwards)
//######################################################################
/**
@param u=logical longitudinal coordinate (zero at beginning)
@param v=logical transversal coordinate (zero at road center, towards right)
@param scale translates physical road coordinbates into pixel:[scale]=pixels/m
@return y pixel coordinate 
*/

road.prototype.get_yPix=function(u,v,scale){
    var phi=this.get_phi(u);
    return -scale*(this.axis_y(u)-v*Math.cos(phi));
}



//######################################################################
// draw road (w/o vehicles; for latter -> drawVehicles(...)
//######################################################################

/**
@param scale:      scale of map (x,y) -> (xPix,yPix) in pixels/m
@param hasChanged: true at beginning or if a resize event took place

@return:           draw into graphics context ctx (def. in calling routine)
*/

road.prototype.draw=function(roadImg,scale,hasChanged){

    var lSegm=this.roadLen/this.draw_nSegm;

    // actual drawing routine

    for (var iSegm=0; iSegm<this.draw_nSegm; iSegm++){
	var u=this.roadLen*(iSegm+0.5)/this.draw_nSegm;
      if((itime==0)||hasChanged){ // lookup table only at beginning or after rescaling
	    this.draw_x[iSegm]=this.axis_x(u); 
	    this.draw_y[iSegm]=this.axis_y(u);
	    this.draw_phi[iSegm]=this.get_phi(u);
	    this.draw_cosphi[iSegm]=Math.cos(this.draw_phi[iSegm]);
	    this.draw_sinphi[iSegm]=Math.sin(this.draw_phi[iSegm]);

	    if(false){
	        console.log("road.draw: iSegm="+iSegm+" u="+u
	  	   +" xPhys="+this.draw_x[iSegm]
                   +" yPhys="+this.draw_y[iSegm]
                   +" phi="+this.draw_phi[iSegm]);
	    }
	}

	var roadWidthLoc=this.widthLeft(u)+this.widthRight(u);
        var factor=1+roadWidthLoc*this.draw_curvMax; // "stitch factor"
	var vCenterLoc=0.5*(this.widthRight(u)-this.widthLeft(u));
	var cosphi=this.draw_cosphi[iSegm];
	var sinphi=this.draw_sinphi[iSegm];
	var lSegmPix=scale*factor*lSegm;
	var wSegmPix=scale*roadWidthLoc;

	var xCenterPix=scale*(this.draw_x[iSegm])+ vCenterLoc*sinphi; 
	var yCenterPix=-scale*(this.draw_y[iSegm] - vCenterLoc*cosphi);
	ctx.setTransform(cosphi,-sinphi,+sinphi,cosphi,xCenterPix,yCenterPix);
	ctx.drawImage(roadImg,-0.5*lSegmPix,-0.5* wSegmPix,lSegmPix,wSegmPix);
	if(false){
	    console.log("road.draw: iSegm=",iSegm,
			" u=",parseFloat(u).toFixed(2),
			" roadWidthLoc=",parseFloat(roadWidthLoc).toFixed(2),
			" vCenterLoc=",parseFloat(vCenterLoc).toFixed(2),
		        " cosphi=",parseFloat(cosphi).toFixed(2),
			" factor=",parseFloat(factor).toFixed(2),
		        " lSegmPix=",parseFloat(lSegmPix).toFixed(0),
		        " wSegmPix=",parseFloat(wSegmPix).toFixed(0),
		        " xCenterPix=",parseFloat(xCenterPix).toFixed(0),
		        " yCenterPix=",parseFloat(yCenterPix).toFixed(0)
		       )
	}
    }
}// road.prototype.draw




//######################################################################
// draw vehicles [no funct widthLeft, widthRight needed]
//######################################################################

/**
@param scale:      scale of map (x,y) -> (xPix,yPix) in pixels/m
@param speedmin:   minimum speed [m/s] for the colormap (red=slow,blue=fast)
@param speedmax:   maximum speed [m/s] for the colormap (red=slow,blue=fast)

@return draw into graphics context ctx (defined in calling routine)
*/

road.prototype.drawVehicles=function(carImg, truckImg, bikeImg, obstacleImg, 
				     scale,
				     speedmin,speedmax){

  // phiVehRelMax purely optical; vehicle "drift" sideways if speedLong
  // very small to resolve deadlocks of stopped vehicles


  for(var i=0; i<this.veh.length; i++){
    var type=this.veh[i].type;
    var vehLenPix=scale*this.veh[i].len;
    var vehWidthPix=scale*this.veh[i].width;

    var uCenterPhys=this.veh[i].u-0.5*this.veh[i].len;
    var vCenterPhys=this.veh[i].v; // incr left -> right, 0 @ road center

    var vxmin=2; //!! purely graphical
    var phiRoad=this.get_phi(uCenterPhys);
    var dvdu=this.veh[i].speedLat/(Math.max(this.veh[i].speed,vxmin));
    var phiVehRel=(this.veh[i].speed<1)  // 
	  ? 0 : - Math.atan(dvdu);
    var phiVeh=phiRoad
	+ Math.max(-phiVehRelMax, Math.min(phiVehRelMax,phiVehRel));

    var isActiveTrafficObjObstacle=(this.veh[i].id>=50)&&(this.veh[i].id<100);

    var vehImg=(type=="car") ? carImg : (type=="truck") ? truckImg :
      (type=="bike") ? bikeImg : obstacleImg;


    // TrafficObjects:
    // if veh id in [50,99]: vehicle is active TrafficObject obstacle
    // draw with associated image (only) these vehicles have

    if(isActiveTrafficObjObstacle){
      vehImg=this.veh[i].image;
      vehLenPix*=1.5;  //!!! ad-hoc; properly must do vehLenPixDepot
	               // *lenPhys/lenDepotPhys
      vehWidthPix*=2.0;
   
      // turn upside down images
      
      if((phiRoad>0.5*Math.PI)&&(phiRoad<1.5*Math.PI)){
        phiVeh-=Math.PI;
      }
    }
    
    var cphiRoad=Math.cos(phiRoad);
    var sphiRoad=Math.sin(phiRoad);
    var cphiVeh=Math.cos(phiVeh);
    var sphiVeh=Math.sin(phiVeh);
    var xCenterPix=scale*(this.axis_x(uCenterPhys) + vCenterPhys*sphiRoad);
    var yCenterPix=-scale*(this.axis_y(uCenterPhys) - vCenterPhys*cphiRoad);

       
          // (1) draw vehicles as images

   
    ctx.setTransform(cphiVeh, -sphiVeh, +sphiVeh, 
		     cphiVeh, xCenterPix, yCenterPix);
    ctx.drawImage(vehImg, -0.5*vehLenPix, -0.5*vehWidthPix,
		  vehLenPix,vehWidthPix);

          // (2) draw semi-transp boxes of speed-dependent color 
          //     over the images
          //     (different size of box because of mirrors of veh images)

    if(type!="obstacle"){
          var effLenPix=(type=="car") ? 0.95*vehLenPix : 0.90*vehLenPix;
          var effWPix=(type=="car") ? 0.90*vehWidthPix : 0.75*vehWidthPix;
          var speed=this.veh[i].speed;
          ctx.fillStyle=colormapSpeed(speed,speedmin,speedmax,type);
	  ctx.fillRect(-0.5*effLenPix, -0.5*effWPix, effLenPix, effWPix);
    }
    ctx.fillStyle="rgb(0,0,0)";

    if(false){
	  console.log("in road.drawVehicles:"
		      +" u="+this.veh[i].u
		      +" v="+this.veh[i].v
		      +" xCenterPix="+xCenterPix
		      +" yCenterPix="+yCenterPix
		     );
    }
  }
} // road.prototype.drawVehicles



road.prototype.displayMacroRegion=function(scale,umin,umax){
  var lSegmPrelim=5; // length of white segments visualized on road
  var nSegm=Math.floor((umax-umin)/lSegmPrelim+1);
  var lSegm=(umax-umin)/nSegm;
  var lSegmPix=scale*lSegm;
  for(var i=0; i<nSegm; i++){

    // widthLeft(u), widthRight(u) road geom functions
    var u=umin+(i+0.5)*lSegm; 
    var wSegmPix=scale*(this.widthLeft(u)+this.widthRight(u));
    var phiRoad=this.get_phi(u);
    var cphiRoad=Math.cos(phiRoad);
    var sphiRoad=Math.sin(phiRoad);
    var xCenterPix=scale*this.axis_x(u);
    var yCenterPix=-scale*this.axis_y(u);

    ctx.setTransform(cphiRoad, -sphiRoad, +sphiRoad, 
		     cphiRoad, xCenterPix, yCenterPix);
    ctx.fillStyle="rgb(255,255,255)";
    ctx.fillRect(-0.5*lSegmPix,-scale*this.widthLeft(u),lSegmPix,wSegmPix);
  }
} // road.prototype.displayMacroRegion




/**
######################################################################
draw vectorfield of forces for Vehicle veh
######################################################################

draws the force field of a virtual car at longitudinal speed "speed" 
at position (u,v) in the logical coordinates 
(for the actual position of a car and its actual speed, 
the vector field value agrees with the actual force)
The color of the arrows is that of the speed coding of the virtual vehicle

@param speed:      speed [m/s] of the virtual vehicle
@param scale:      geometric scale [pixels/m]
@param speedmin:   minimum speed for color-coding (transferred to colormap*)
@param speedmax:   maximum speed for color-coding (transferred to colormap*)
@param displayStyle:  
   0:   display force felt by addl probe vehicle at (u,v)
   2:   arrows attached at veh fronts displaying the real force
   1:   obsolete
   1 AND drawArrowsEverywhere: 
        force felt by nearest veh if it were at (u,v) and had the same speed
   1 AND !drawArrowsEverywhere:
        real force of nearest veh drawn in a bubble around 

@return:           draw into graphics context ctx (def. in calling routine)
*/

road.prototype.drawVectorfield=function(speed,scale,
					speedmin,speedmax,displayStyle){

  var logging=false;

  if((displayStyle==0)&&(this.veh.length<1)){return 0;} // if based on vehicles


  var drawArrowsEverywhere=false; // sub-variant of !withProbe (see above)
  var maxRange=7; // arrows drawn in circle of radius maxRange around veh
                   // (if !withProbe AND !drawArrowsEverywhere)
  var headSize_m=1.1; // size of acceleration arrowhead in displayed meters
  var scalePhys=1.5; // arrow length in displayed (long) meters per m/s^2
  var scaleAcc=scale*scalePhys;
  var ratioLat=1; // ratio of arrow length for the same lateral/long accel.
  var factor_roadWidth=0.85; // arrows over factor_roadWidth*roadWidthLoc
  var nu=20; // #arrows in long direction if displayStyle=0,1
  var nv=15; // #arrows in lat direction if displayStyle=0,1

  //############################################################
  if(displayStyle==0){// with probe vehicle
  //############################################################
    
    // add virtual vehicle to the vehicle array  
    // (needed since this vehicle needs the local neighborhood)

    var virtVeh=new vehicle("virtVeh",car_length,car_width,
			    0,0,speed,0,this.mixedModelRef[0]); //model irrel
    this.veh.push(virtVeh);

    ctx.fillStyle=colormapSpeedOpaque(virtVeh.speed,speedmin,speedmax,"truck");
    ctx.strokeStyle=colormapSpeedOpaque(virtVeh.speed,speedmin,speedmax,"truck");


    // loop over the virtual vehicle positions

    for(var iu=0; iu<nu; iu++){

    var leftBd=-this.widthLeft(roadLen*iu/nu);
    var rightBd=this.widthRight(roadLen*iu/nu);

    for(var iv=0; iv<nv; iv++){

	virtVeh.u=roadLen*iu/nu;
	virtVeh.v=factor_roadWidth*(leftBd+(iv+0.5)/nv*(rightBd-leftBd));
	this.sortVehicles();

        // find index of virtual vehicle

	var iVirt=0;
        for (var i=0; i<this.veh.length; i++){
	    if(this.veh[i].type=="virtVeh"){
		iVirt=i;
	        //console.log("virtVeh at vehicle index",i);
	    }
	}

	if(logging){
	//if(true){
          console.log("\nVectorfield inner loop:",
		    " u=", parseFloat(virtVeh.u).toFixed(2),
		    " v=", parseFloat(virtVeh.v).toFixed(2),
		    " iVirt=",iVirt,
		    " iminVirtCheck=",imin,
		    " imaxVirtCheck=",imax,
		    "");
	}

	//console.log("before calcAccelerationsOfVehicle(iVirt)");
	this.calcAccelerationsOfVehicle(iVirt);
        accLong=virtVeh.accLong;
        accLat=virtVeh.accLat;
	if(logging){
	  console.log("after calcAccelerationsOfVehicle(iVirt):",
		    " accLong=",parseFloat(virtVeh.accLong).toFixed(2),
		    " accLat=", parseFloat(virtVeh.accLat).toFixed(2));
	}
	//accLong=2; accLat=0;
        var phiRoad=this.get_phi(virtVeh.u);
        var cphiRoad=Math.cos(phiRoad);
        var sphiRoad=Math.sin(phiRoad);
        var xStartPix=scale*(this.axis_x(virtVeh.u) + virtVeh.v*sphiRoad);
        var yStartPix=-scale*(this.axis_y(virtVeh.u) - virtVeh.v*cphiRoad);

        // transform coordinates such that (u,v)=(x,y)

        ctx.setTransform(cphiRoad, -sphiRoad, +sphiRoad, 
		     cphiRoad, xStartPix, yStartPix); 

        var dxPix=scaleAcc*accLong;
        var dyPix=ratioLat*scaleAcc*accLat;

        drawArrow(ctx,0,0,dxPix,dyPix,scale*headSize_m);


        if(false){
	   console.log("road.drawVectorfield: u=",virtVeh.u," v=",virtVeh.v,
		" phiRoad=",phiRoad,
		" xStartPix=",xStartPix,
		" yStartPix=",yStartPix,
		" dxPix=",dxPix,
		" dyPix=",dyPix,
		" scale*headSize_m=",scale*headSize_m,
		""
	       );
	}
    }}

    // remove virtual vehicle

    for (var i=0; i<this.veh.length; i++){
	if(this.veh[i].type=="virtVeh"){
	    console.log("drawVectorfield: i=",i,
			" removing virtual vehicle at this position");
	    this.veh.splice(i,1);
	}
    }
  } // if withProbe


    
  //############################################################
  else if(displayStyle==1){ // vector field using data of nearest real vehicle
  //############################################################
	
    for(var iu=0; iu<nu; iu++){ // loop over the (u,v) positions of the vectorfield
    var leftBd=this.widthLeft(roadLen*iu/nu);
    var rightBd=this.widthRight(roadLen*iu/nu);

    for(var iv=0; iv<nv; iv++){

	var u=roadLen*iu/nu;
	var v=factor_roadWidth*(leftBd+(iv+0.5)/nv*(rightBd-leftBd));
	// find real vehicle nearest to (u,v)
	
	var iNearest=0;
	var rNearest=2*this.roadLen; // an upper limit of the distance of nearest veh
        for (var i=0; i<this.veh.length; i++){
	    var r=Math.sqrt(Math.pow(this.veh[i].u-u,2)+Math.pow(this.veh[i].v-v,2));
	    if(r<rNearest){
		iNearest=i;
		rNearest=r;
	    }
	}
	var vehNearest=this.veh[iNearest]; // reference=OK also after changed i

        // true: real veh virtually repositioned
        // false: constant arrows only drawn in neighborhood of a vehicle

	var drawArrows=true;

	if(drawArrowsEverywhere){

	    // reposition this vehicle to (u,v) and
	    // calculate its acceleration vector at (u,v)
            // WARNING: reposition may also change index iNearest
            // => reference vehNearest OK, this.veh[iNearest] not !

	    var uReal=vehNearest.u;
	    var vReal=vehNearest.v;
            vehNearest.u=u;
	    vehNearest.v=v;

	    this.sortVehicles(); // reposition vehicles may have changed the ordering


            //! drawArrows, displayStyle==1:
            // following sometimes wrong => if need, reformulate 
            // calcAccelerationsOfVehicle with vehicle reference as argument
            // and add addtl data element i to the vehicle pseudoclass
            // to get veh->i, not only i->veh=veh[i]

	    this.calcAccelerationsOfVehicle(iNearest); // =>veh.accLong,veh.accLat

	    // reposition this vehicle back 
	
            vehNearest.u=uReal;
	    vehNearest.v=vReal; 
 
            // sorting necessary for finding nearest vehicle in next step

	    this.sortVehicles();
	} // drawArrowsEverywhere

	else{// draw constant arrows locally

	    drawArrows=(rNearest<=maxRange);
	}


	// prepare drawing

	if(drawArrows){
	var phiRoad=this.get_phi(u);
        var cphiRoad=Math.cos(phiRoad);
        var sphiRoad=Math.sin(phiRoad);
        var xStartPix=scale*(this.axis_x(u) + v*sphiRoad);
        var yStartPix=-scale*(this.axis_y(u) - v*cphiRoad);
        var dxPix=scaleAcc*vehNearest.accLong;
        var dyPix=ratioLat*scaleAcc*vehNearest.accLat;

        // transform coordinates such that (u,v)=(x,y)

        ctx.setTransform(cphiRoad, -sphiRoad, +sphiRoad, 
		     cphiRoad, xStartPix, yStartPix); 

 	// set color and draw
	
	var speed=vehNearest.speed;
	ctx.fillStyle=colormapSpeedOpaque(speed,speedmin,speedmax,"truck");
	ctx.strokeStyle=colormapSpeedOpaque(speed,speedmin,speedmax,"truck");
        drawArrow(ctx,0,0,dxPix,dyPix,scale*headSize_m);
	}//drawArrows
	
    }}

    // final sorting and getting back orig. environemt to "leave no footsteps"

    this.sortVehicles(); 

  } // else branch with nearest real vehicle

  //############################################################
  else{ // displayStyle==2: draw arrows attached on real vehicles
  //############################################################

    for(var i=0; i<this.veh.length; i++){ 

	// prepare drawing

	var u=this.veh[i].u;
	var v=this.veh[i].v;
	var speed=this.veh[i].speed;
	var phiRoad=this.get_phi(u);
        var cphiRoad=Math.cos(phiRoad);
        var sphiRoad=Math.sin(phiRoad);
        var xStartPix=scale*(this.axis_x(u) + v*sphiRoad);
        var yStartPix=-scale*(this.axis_y(u) - v*cphiRoad);
        var dxPix=scaleAcc*this.veh[i].accLong;
        var dyPix=ratioLat*scaleAcc*this.veh[i].accLat;

        // transform coordinates such that (u,v)=(x,y)

        ctx.setTransform(cphiRoad, -sphiRoad, +sphiRoad, 
		     cphiRoad, xStartPix, yStartPix); 

 	// set color and draw
	
	ctx.fillStyle=colormapSpeedOpaque(speed,speedmin,speedmax,"truck");
	ctx.strokeStyle=colormapSpeedOpaque(speed,speedmin,speedmax,"truck");
        drawArrow(ctx,0,0,dxPix,dyPix,scale*headSize_m);
    }
  }
} // road.prototype.drawVectorfield



//######################################################################
//draw vehicle IDs on top of vehicles
//######################################################################
/**
@param scale:      geometric scale [pixels/m]
@param fontHeight:  height (pixels) of the font

@return draw vehicle IDs into graphics context ctx (defined in calling routine)
*/

road.prototype.drawVehIDs=function(scale,fontHeight){

    for(var i=0; i<this.veh.length; i++){ 

	// prepare drawing

	var wPix=0.60*fontHeight*(this.veh[i].id.toString().length);
	var hPix=fontHeight;

	var u=this.veh[i].u+0.5*wPix/scale; // label just touches vehicle at front
	var v=this.veh[i].v;
	var phiRoad=this.get_phi(u);
        var cphiRoad=Math.cos(phiRoad);
        var sphiRoad=Math.sin(phiRoad);
        var xCenterPix=scale*(this.axis_x(u) + v*sphiRoad);
        var yCenterPix=-scale*(this.axis_y(u) - v*cphiRoad);


        // transform coordinates such that pixel coordinate = (0,0) at veh center

        ctx.setTransform(1,0,0,1, xCenterPix, yCenterPix); 

 	// draw white rectangle and black ID

	//var wPix=5*fontHeight;
	ctx.strokeStyle="rgb(0,0,0)";
	ctx.fillStyle="rgba(255,255,255,0.5)";
	ctx.fillRect(-0.5*wPix,-0.5*hPix,wPix,hPix);

	ctx.font=fontHeight+'px Arial';
	ctx.fillStyle="rgb(0,0,0)"; // counterintuitively, fillStyle, not strokeStyle
	ctx.fillText(this.veh[i].id,-0.45*wPix,+0.40*hPix);
    }
}



//######################################################################
// simple write vehicle info to file
// all the data stored in this.exportString 
// in each record interval gui.dt_export are saved
//######################################################################



road.prototype.writeVehiclesToFile= function(filename) {

  console.log("\nin road.writeVehiclesToFile(): roadID=",this.roadID,
	      " filename=",filename);

  // function download in gui.js
  //console.log("road.exportString=\n",this.exportString);
  download(this.exportString, filename); 
  
}

//######################################################################
// update export string for writing vehicle data to file
// called in road.prototype.updateSpeedPositions
//######################################################################

road.prototype.updateExportString=function(){

  var ditime=Math.floor(dt_export/dt+1);
  if(itime%ditime==0){
    for(var i=0; i<this.veh.length; i++){
      this.exportString=this.exportString+"\n"+time.toFixed(2)
        + "\t"+this.veh[i].id
        + "\t"+this.veh[i].type
        + "\t"+this.veh[i].len.toFixed(2)
        + "\t"+this.veh[i].width.toFixed(2)
        + "\t"+this.veh[i].u.toFixed(2)
        + "\t"+(this.veh[i].v).toFixed(3)
        + "\t"+this.veh[i].speed.toFixed(2)
        + "\t"+this.veh[i].speedLat.toFixed(2)
        + "\t"+this.veh[i].accLong.toFixed(2)
        + "\t"+this.veh[i].accLat.toFixed(2)
        +"";
    }
  }
}
 

//#############################################################
// TrafficObjects interactions/helper functions
//#############################################################


/*############################################################# 
TrafficObjects: get nearest distance of the road axis (center)
to an external physical position
   
@param physical mouse coords xUser, yUser
@return [dist[m], u[m],v [m] ]  (notice that distance to axis dist=|v|)

Notice: u discretized to this.draw_nSegm drawing segments; these and the
associated arrays this.draw_x[iSegm], this.draw_y[iSegm] denoting
the discretized road axis will be used
#############################################################*/

road.prototype.findNearestDistanceTo=function(xUser,yUser){
  var dist2_min=1e9;
  var uReturn,dxReturn,dyReturn;
  for(var iSegm=0; iSegm<=this.draw_nSegm; iSegm++){
    var u=this.roadLen*(iSegm+0.5)/this.draw_nSegm;
    var dx=xUser-this.draw_x[iSegm];
    var dy=yUser-this.draw_y[iSegm];
    var dist2=dx*dx+dy*dy;
    if(dist2<dist2_min){
      dist2_min=dist2;
      uReturn=u;
      dxReturn=dx;
      dyReturn=dy;
    }
  }

  // determine sign of v: positive if (-cosphi,sinphi).dr>0

  var phiNorm=this.get_phi(uReturn)-0.5*Math.PI; // angle in v direction
  var sign_v=(Math.cos(phiNorm)*dxReturn
	      +Math.sin(phiNorm)*dyReturn > 0) ? 1 : -1;
  var distReturn=Math.sqrt(dist2_min);
  var vReturn=sign_v*distReturn; // v parallel to distance vector

  if(true){
	console.log("end road.findNearestDistanceTo:",
		    " roadID=",this.roadID,
		    " xUser=",xUser, " yUser=",yUser,
		    " distReturn=",distReturn,
		    " uReturn=",uReturn,
		    " vReturn=",vReturn
		   );
  }
  return [distReturn,uReturn,vReturn];
}

/*############################################################# 
 TrafficObjects: dropObject

#############################################################*/

road.prototype.dropObject=function(trafficObj){
  var u=trafficObj.u;
  var v=trafficObj.v
  console.log("itime=",itime,
	      " in road.dropObject: trafficObj.u=",u,
	      " trafficObj.v=",trafficObj.v);


  // construct normal road vehicle/obstacle from depot object
  // if id=50...99

  if(trafficObj.type==='obstacle'){
    var roadVehicle=new vehicle("obstacle",trafficObj.len,
				trafficObj.width,
				u, v, 0, 0, mixedModelObstacle);

      //!! id ctrls veh image: 50=black obstacle,
      // 51=constructionVeh1.png etc. Attribute veh.imgNumber defined only
      // for vehicles in depot!
      
    roadVehicle.id=trafficObj.id; // overwrite random id @ vehicle cstr
    roadVehicle.image=trafficObj.image;
    // insert vehicle (array position does not matter since sorted anyway)

    this.veh.push(roadVehicle);
    this.sortVehicles();
    console.log("  end road.dropObject: dropped obstacle at uDrop=",u,
		" v=",v," id=",roadVehicle.id,
		" imgNumber=",roadVehicle.imgNumber);
  }

  // position a traffic light if depot object id=100 ... 199
  // NOTICE: traffic light has its sorting/pushing/splicing methods


  else if(trafficObj.type==='trafficLight'){
    this.addTrafficLight(trafficObj);
    console.log("  end road.dropObject: added traffic light");
  }

  else {
    ; // speedlimit signs are taken care of automatically in update step
    // setting isActive=true in TrafficObjects.activate is enough
  }
}// dropObject


/*
#############################################################
TrafficObjects: remove obstacle object with given id
#############################################################

@param id:     unique id in [50,99]

@return:       removes the obstacle if id is found in road.veh
*/
road.prototype.removeObstacle= function(id) {
    // change value of trafficLight object

  console.log("in road.removeObstacle: id=",id);
  var success=false;
  var iDel=-1;
  for(var i=0; (!success)&&(i<this.veh.length); i++){
    if(this.veh[i].id===id){
      success=true;
      iDel=i;
    }
  }
  if(iDel===-1) console.log("road.removeObstacle: no id ",id," found!");
  else this.veh.splice(iDel,1);
}



/*
#############################################################
TrafficObjects: Add a new (red or green) traffic light to road.trafficLights
#############################################################

@param depotObject=a TL-type depot object

@return adds a traffic-light object to this.trafficLights[] serving 
purely for the road operations of the traffic light. 
All drawing is controlled by the depotObjects (elements of the obstTL[])
*/

road.prototype.addTrafficLight= function(depotObject) {
  var trafficLight={id: depotObject.id,
		    u: depotObject.u,
		    value: depotObject.value, // "red" or "green"
		   };
  this.trafficLights.push(trafficLight);
  this.changeTrafficLight(depotObject.id,depotObject.value);

  if(true){
    console.log("itime=",itime," road.addTrafficLight: roadID=",this.roadID,
	      " added traffic light id=",depotObject.id,
		" at u=",formd(depotObject.u)," value=",depotObject.value);
  }
  
}


/*
#############################################################
Programmatically change state (=value) of traffic light
and implement effects
#############################################################

@param id:     unique id in [100,199]
@param value:  (optional) "red", or "green". 
               If not given, the value is toggled
@return:       if a traffic light of this id is found, 
               its state is changed accordingly
*/

road.prototype.changeTrafficLight=function(id,value){

 // console.log("in road.changeTrafficLight");
  
  var success=false;
  var pickedTL;
  for(var i=0; (!success)&&(i<this.trafficLights.length); i++){
    if(id===this.trafficLights[i].id){
      success=true;
      pickedTL=this.trafficLights[i];

      if(typeof(value) === "undefined"){ // just toggle if no value given
	pickedTL.value=(pickedTL.value==="red")
	  ? "green" : "red";
	console.log("road.changeTrafficLight: id=",id, "no TL state given:",
		    " new value=opposite of old value=",pickedTL.value);
      }
      else{pickedTL.value=value;}
    }
  }

  if(!success){
    console.log("road.changeTrafficLight: no TL of id ",id," found!");
    return;
  }

    // implement effect to traffic by adding/removing virtual obstacles
    // (1) new TL value green

  if(pickedTL.value==="green"){
    console.log("remove TL virt vehicle id=",id);
      // debug
    //for(var i=0; i<this.veh.length; i++){
     // console.log("before removing: u=",this.veh[i].u," id=",this.veh[i].id);
    //}


    for(var i=0; i<this.veh.length; i++){ 
      if(this.veh[i].id===id){
	this.veh.splice(i, 1); // red TL virt veh removed
	//console.log("road.changeTrafficLight: removed virt red TL vehicle");
      }
    }

    for(var i=0; i<this.veh.length; i++){
      //console.log("after removing: u=",this.veh[i].u," id=",this.veh[i].id);
    }
    
    
  }

  // (2) new TL value red

  //!! heineous bug: only generate new virt vehicles if none of this id
  // there. Otherwise unbounded growth of virt veh if several 
  // commands changeTrafficLight(id,"red") without (id,"green") given!

  else{
    var virtVehAlreadyExist=false; // one or more
    for(var i=0; i<this.veh.length; i++){
      if(this.veh[i].id===id){virtVehAlreadyExist=true;}
    }

    if(!virtVehAlreadyExist){
      var u=pickedTL.u;
      var virtVehWidth=this.widthLeft(u)+this.widthRight(u);
      var virtVehLen=0.5;  // 0.5 m wide stopping line of TL
      var redTLvirtVehicle=new vehicle("obstacle",virtVehLen,virtVehWidth,
				u, 0, 0, 0, mixedModelObstacle);
      redTLvirtVehicle.id=id; // override id generated @ vehicle cstr
      this.veh.push(redTLvirtVehicle);
      console.log("road.changeTrafficLight: new virtual red TL vehicle");
    } // !virtVehAlreadyExist
  } // new TL value red

  this.sortVehicles();

  // debug
  if(false){
    for(var i=0; i<this.veh.length; i++){
      if(this.veh[i].type==="obstacle"){
        console.log("end changeTrafficLight: obstacle found: u=",
		    this.veh[i].u," id=",this.veh[i].id);
      }
    }
  }

} // changeTrafficLight






/*
#############################################################
TrafficObjects: remove a traffic light from road.trafficLights
#############################################################

@param id:     unique id in [100,199]

@return:       removes the traffic light of this id from road.trafficLights 
               if this id is found.  
               If last value was red, also removes the virtual
               vehicles associated with it
*/

road.prototype.removeTrafficLight= function(id) {
    // change value of trafficLight object

  console.log("in road.removeTrafficLight: id=",id,"this.trafficLights.length=",this.trafficLights.length);
  var success=false;
  var iDel=-1;
  for(var i=0; (!success)&&(i<this.trafficLights.length); i++){
    if(this.trafficLights[i].id===id){
      success=true;
      console.log("  succes! i=",i," trafficLight=",this.trafficLights[i]);
      iDel=i;
      this.changeTrafficLight(id,"green"); // to remove virt vehicles
    }
  }
  if(iDel===-1) console.log("road.removeTrafficLight: no id ",id," found!");
  else this.trafficLights.splice(iDel,1);
}


/* #####################################################
 TrafficObjects: implement effect of user-draggable speed limits 
from the traffic objects:

 distribute speed limits to the regular vehicle's longmodels
 (free sign=>value=200./3.6=>effectively no influence)
 need to order the speedlimit positions first 

 NOTICE: In top-level sim, all speedlimits should be set to 1000 or something
 to take care of the effect of removing limits

//#####################################################*/

road.prototype.updateSpeedlimits=function(trafficObjects){

  //console.log("\nin road.updateSpeedlimits");

  // start by removing all speedlimits

  for(var iveh=0; iveh<this.veh.length; iveh++){
    var veh=this.veh[iveh];
    if(veh.type!="obstacle"){
      veh.mixedModel.longModel.speedlimit=(veh.type==="truck")
	? speedlimit_truck : 1000;
    }
  }


  
  // sort trafficObj array by increasing u values (mixing of different roads
  // and object types OK since filtered in loop)

  trafficObjects.trafficObj.sort(function(a,b){
	    return a.u - b.u; // minus, not > or < !!
  })


  
  // implement (all speedlimits should be set to 1000 prior to this action)

  var duAntic=30; // anticipation distance for  obeying the speed limit
  var success=false;
  for(var i=0; i<trafficObjects.trafficObj.length; i++){
    var obj=trafficObjects.trafficObj[i];
    if((obj.type==='speedLimit')&&(obj.isActive)){
      success=true;
      var speedL=obj.value/3.6;  // in m/s
      if(true){
	console.log("road.updateSpeedlimits: speed limit ",
		    formd(speedL)," starting at ",
		    formd(obj.u));
      }

      var iveh=0;
      while((iveh<this.veh.length)&&(this.veh[iveh].u>obj.u-duAntic)){
	var targetVeh=this.veh[iveh];
	if(targetVeh.type!="obstacle"){
	  targetVeh.mixedModel.longModel.speedlimit=(targetVeh.type==="truck")
	    ? Math.min(speedL,speedlimit_truck) : speedL;
	}

	iveh++;
      }
      //if(iveh==this.veh.length){return;} // otherwise risk of range excess

    }// type speedlimit and active
  }

  // test

  if(false){
    for(var iveh=0; iveh<this.veh.length; iveh++){
      var veh=this.veh[iveh];
      if(veh.type!="obstacle"){
	console.log("end updateSpeedlimits: u=",veh.u,
		    "speedlimit=",veh.mixedModel.longModel.speedlimit);
      }
    }
  }


  if(!success){
    //console.log(" no active limits");
  }

}//updateSpeedlimits


