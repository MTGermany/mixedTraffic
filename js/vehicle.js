
function formd(x){return parseFloat(x).toFixed(2);}

// type = "bike", "car", "truck", or "obstacle"
// speed=longitudinal speed (lat speed=0 initially)


/*
special vehicles: id<200:
 id=1:                ego vehicle (not yet used)
 id=10,11, ..49       disturbed vehicles (not yet used)
 id=50..99            special obstacles => generated veh.type="obstacle"
 id=100..149          traffic lights => generated veh.type="obstacle"
 id=150..199          moveable speed limits (just formally, no virt vehs)
 id>=100000:          normal vehicles and fixed (non-depot) obstacles
*/

function vehicle(type, len, width, u, v, speedLong, speedLat, mixedModel){
    //console.log("vehicle: in vehicle cstr: type=",type);


  this.type=type;
  this.len=len;       // car length[m]
  this.width=width;   // car width[m]
  this.u=u;           // arc length [m]
  this.v=v;           // transv log. coord [m] (up to the right, center=0)
  this.travTime=0;    // calculated in road.updateStatistics(umin,umax,dt)
  this.speed=speedLong;
  this.speedLat=speedLat;
  this.dvdu=speedLat/(Math.max(speedLong,0.0001)); //tan angle to road axis
  this.mixedModel=mixedModel;

  // init, needed to check if speedLatStuck applied
  this.mostInfluencingLeaderIndex=0;
  
  if(this.type=="obstacle"){
	this.speed=0;
	this.speedLat=0;
  }
  this.accLong=0;
  this.accLat=0;
  this.index=-100;    // index in the actual array (changes all the time) 
  this.id=100000+Math.floor(900000*Math.random());
    //console.log("vehicle cstr: this.id=",this.id);
    

    // history variables only for debugging (old=1 timestep in the past)

  this.accLongOld=0;
  this.accLatOld=0;

  this.indexOld=0;
    
}



vehicle.prototype.isRegularVeh=function(){
    return (this.id>=200)&&(this.type !== "obstacle");
}

// real obstacle since TL has also type obstacle
vehicle.prototype.isRealObstacle=function(){
  var isSpecialObstacle=(this.id>=50)&&(this.id<100);
  var isNormalObstacle=(this.type=="obstacle");
  return ((!this.isTL())&&(isSpecialObstacle||isNormalObstacle));
}

vehicle.prototype.isTL=function(){
  return ((this.id>=100)&&(this.id<150));
}



// free longitudinal acceleration

vehicle.prototype.calcAccLongFree=function(){
    if(this.type=="obstacle"){return 0;}
    return this.mixedModel.longModel.calcAccFree(this.speed);
}

// longitudinal interaction acceleration by one vehicle

vehicle.prototype.calcAccLongInt=function(leadveh){
  if(this.type=="obstacle"){return 0;}
  if(this==leadveh){return 0;}
  var dx=leadveh.u-this.u;
  var dy=leadveh.v-this.v;
  var speedl=leadveh.speed;
  var accl=leadveh.accLong;
  var Ll=leadveh.len;
  var Wavg=0.5*(this.width+leadveh.width);
  return this.mixedModel.calcAccLongInt(dx,dy,this.speed,speedl,accl,Ll,Wavg);
}
 
// simplified longitudinal interaction acceleration
vehicle.prototype.calcAccLongLeaderSelect=function(leadveh){
    if(this.type=="obstacle"){return 0;}
    if(this==leadveh){return 0;}
    var dx=leadveh.u-this.u;
    var dy=leadveh.v-this.v;
    var speedl=leadveh.speed;
    var accl=leadveh.accLong;
    var Ll=leadveh.len;
    var Wavg=0.5*(this.width+leadveh.width);
    return this.mixedModel.calcAccLongLeaderSelect
      (dx,dy,this.speed,speedl,accl,Ll,Wavg);
}




/** 
######################################################################
calculate transversal acceleration as effect of a single other vehicle
//######################################################################

@param leadveh: instance of the vehicles
@return:        lateral acceleration contribution 
                (this.accLat not automatically updated!)
*/

// free lateral acceleration

vehicle.prototype.calcAccLatFree=function(){
    if(this.type=="obstacle"){return 0;}
    return this.mixedModel.calcAccLatFree(this.speedLat);
}



vehicle.prototype.calcAccLatInt=function(leadveh,logging){
  if(this.type=="obstacle"){return 0;}
  if(this==leadveh){return 0;}

  var vxl=leadveh.speed;
  var vyl=leadveh.speedLat;
  var axl=leadveh.accLong;
  var Ll=leadveh.len;
  var Wl=leadveh.width;
  var leadveh_veff=(leadveh.isTL()&&(Math.abs(this.v-leadveh.v)<Wl))
      ? this.v : leadveh.v; // to avoid drivers go around TL
    
  return this.mixedModel.calcAccLatInt(this.u,leadveh.u,this.v,leadveh_veff,
				       this.speed,vxl,this.speedLat,vyl,axl,
				       this.len,Ll,this.width,Wl,roadWidthRef,
				       logging);
 }


/** 
######################################################################
calculate transversal acceleration as effect of one road boundary
//######################################################################

@param dy:       lat dist wall-vehCenter (>0 if wall to the right)
@param dyAnti:   lat dist wall-vehCenter  at anticipated position
@param rightBnd: if true, right boundary (if dy<0 veh (partly) outside road

@return: lat acceleration (this.accLong not automatically updated!)
//!!!  no long deceleration due to boundaries
*/

vehicle.prototype.calcAccB=function(widthLeft,widthRight){
    if(false){console.log("in vehicle.calcAccB: u=",this.u," v=",this.v);}
    if(this.type=="obstacle"){return [0,0];}
    return this.mixedModel.calcAccB(widthLeft,widthRight,
					  this.u, this.v,
					  this.speed, this.speedLat,
					  this.width);
}



//#####################################################
//save old state for debugging
//#####################################################

vehicle.prototype.saveOldState=function(){
    this.accLongOld=this.accLong;
    this.accLatOld=this.accLat;
    this.indexOld=this.index;
}

