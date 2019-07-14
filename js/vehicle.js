
// type = "bike", "car", "truck", or "obstacle"
// speed=longitudinal speed (lat speed=0 initially)

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
    this.mixedModel=mixedModel;
    if(this.type=="obstacle"){
	this.speed=0;
	this.speedLat=0;
    }
    this.accLong=0;
    this.accLat=0;
    this.index=-100;    // index in the actual array (changes all the time) 
    this.id=Math.floor(10000*Math.random());
    //console.log("vehicle cstr: this.id=",this.id);
    

    // history variables only for debugging (old=1 timestep in the past)

    this.accLongOld=0;
    this.accLatOld=0;
    
    this.indexOld=0;
    
}

/** 
######################################################################
NEW nov17
calculate strength of interaction as CF acceleration (<=0) 
times lateral attenuation with scale=max(model.s0y, model.s0yLat)
//######################################################################

@param   leadveh: instance of the vehicle
@return: interaction in terms of modified long acceleration 
         (this.accLong not automatically updated!)
*/

vehicle.prototype.calcLeaderInteraction=function(leadveh){
    if(this.type=="obstacle"){return 0;}
    if(this==leadveh){return 0;}
    var dx=leadveh.u-this.u;
    var dy=leadveh.v-this.v;
    var speedl=leadveh.speed;
    var accl=leadveh.accLong;
    var Ll=leadveh.len;
    var Wavg=0.5*(this.width+leadveh.width);
    return this.mixedModel.calcLeaderInteraction
      (dx,dy,this.speed,speedl,accl,Ll,Wavg);
}


/** 
######################################################################
calculate longitudinal acceleration as effect of a single other vehicle
including free acceleration
//######################################################################

@param leadveh: instance of the vehicle
@return: longitudinal acceleration (this.accLong not automatically updated!)
*/

vehicle.prototype.calcAccLong=function(leadveh){
    if(this.type=="obstacle"){return 0;}
    if(this==leadveh){ // acceleration with itself as partner -> free acc
	//console.log("vehicle.calcAccLong: itself as partner!");
	return this.mixedModel.calcAccLongFree();
    }
    var dx=leadveh.u-this.u;
    var dy=leadveh.v-this.v;
    var speedl=leadveh.speed;
    var accl=leadveh.accLong;
    var Ll=leadveh.len;
    var Wavg=0.5*(this.width+leadveh.width);
    return this.mixedModel.calcAccLong(dx,dy,this.speed,speedl,accl,Ll,Wavg);
}


// free longitudinal acceleration

vehicle.prototype.calcAccLongFree=function(){
    if(this.type=="obstacle"){return 0;}
    return this.mixedModel.longModel.calcAccFree(this.speed);
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

    var dx=leadveh.u-this.u;
    var dy=leadveh.v-this.v;
    var vxl=leadveh.speed;
    var vyl=leadveh.speedLat;
    var accl=leadveh.accLong;
    var Ll=leadveh.len;
    var Wavg=0.5*(this.width+leadveh.width);
    return this.mixedModel.calcAccLatInt(dx,dy,this.speed,vxl,
					 this.speedLat,vyl,accl,
					  this.len,Ll,Wavg,logging);
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

