
function formd(x){return parseFloat(x).toFixed(2);}


//#################################
// longitudinal models
//#################################

// Chromium does not know Math.tanh(!!)

function myTanh(x){ 
    return (x>50) ? 1 : (x<-50) ? -1 : (Math.exp(2*x)-1)/(Math.exp(2*x)+1);
}



/**
longitudinal model IDM

@param v0:     desired speed [m/s]
@param T:     desired time gap [s]
@param s0:    minimum gap [m]
@param a:     maximum acceleration [m/s^2]
@param b:     comfortable deceleration [m/s^2]

@return:      IDM instance (constructor)
*/

function IDM(v0,T,s0,a,b){
    this.v0=v0; 
    this.T=T;
    this.s0=s0;
    this.a=a;
    this.b=b;
    this.alpha_v0=1; // multiplicator for temporary reduction

    // possible restrictions (value 1000 => initially no restriction)

    this.speedlimit=1000; // if effective speed limits, speedlimit<v0  
    this.speedmax=1000; // if vehicle restricts speed, speedmax<speedlimit, v0
    this.bmax=9;
}


/**
IDM free acceleration function
@param v:     actual speed [m/s]
@return:  free acceleration [m/s^2]
*/

IDM.prototype.calcAccFree=function(v){ 

    // determine valid local v0

    var v0eff=Math.max
        (0.01, Math.min(this.v0, this.speedlimit, this.speedmax));
    v0eff*=this.alpha_v0;
    var accFree=(v<v0eff) ? this.a*(1-Math.pow(v/v0eff,4))
	: this.a*(1-v/v0eff);
    return accFree;
}



/**
IDM acceleration function

@param s:     actual gap [m]
@param v:     actual speed [m/s]
@param vl:    leading speed [m/s]
@param al:    leading accel [m/s^2] (only for common interface; ignored)

@return:  acceleration [m/s^2]
*/


IDM.prototype.calcAccInt=function(s,v,vl,al){ 

    //MT 2016: noise to avoid some artifacts

    var noiseAcc=0.3; // sig_speedFluct=noiseAcc*sqrt(t*dt/12)
    var accRnd=noiseAcc*(Math.random()-0.5); //if acceleration noise

    // actual acceleration model

    var sstar=this.s0
	+Math.max(0,v*this.T+0.5*v*(v-vl)/Math.sqrt(this.a*this.b));
    var accInt=-this.a*Math.pow(sstar/Math.max(s,0.1*this.s0),2);


    // IDM

    return Math.max(-this.bmax, accInt + accRnd);

    // IDM+

    //var accFree=this.calcAccFree(v);
    //var accIntRaw_IDMplus=accInt+this.a;
    //var accInt_IDMplus=Math.min(accFree, accIntRaw_IDMplus)-accFree;
    //return Math.max(-this.bmax, accInt_IDMplus + accRnd);

}//IDM.prototype.calcAccInt







/**
MT 2016: longitudinal model ACC: Has same parameters as IDM 
but exactly triangular steady state and "cooler" reactions if gap too small

@param v0:     desired speed [m/s]
@param T:     desired time gap [s]
@param s0:    minimum gap [m]
@param a:     maximum acceleration [m/s^2]
@param b:     comfortable deceleration [m/s^2]

@return:      ACC instance (constructor)
*/




function ACC(v0,T,s0,a,b){
    this.v0=v0; 
    this.T=T;
    this.s0=s0;
    this.a=a;
    this.b=b;
    this.cool=0.99;
    this.alpha_v0=1; // multiplicator for temporary reduction

    this.speedlimit=1000; // if effective speed limits, speedlimit<v0  
    this.speedmax=1000; // if vehicle restricts speed, speedmax<speedlimit, v0
    this.bmax=9;
}

/**
ACC free acceleration function = IDM free acceleration function
@param v:     actual speed [m/s]
@return:  free acceleration [m/s^2]
*/

ACC.prototype.calcAccFree=function(v){ 

    // determine valid local v0

    var v0eff=Math.max
        (0.01, Math.min(this.v0, this.speedlimit, this.speedmax));
    v0eff*=this.alpha_v0;
    var accFree=(v<v0eff) ? this.a*(1-Math.pow(v/v0eff,4))
	: this.a*(1-v/v0eff);
    return accFree;
}

/**
ACC acceleration function

@param s:     actual gap [m]
@param v:     actual speed [m/s]
@param vl:    leading speed [m/s]
@param al:    leading acceleration [m/s^2] (optional; al=0 if 3 args)

@return:  acceleration [m/s^2]
*/


ACC.prototype.calcAccInt=function(s,v,vl,al){ 

    // better w/o this and max(s,s0) in denominator !!
    //if(s<0.0001){return -this.bmax;} 

    // noise to avoid some artifacts

    var noiseAcc=0.; // sig_speedFluct=noiseAcc*sqrt(t*dt/12)  //0.3
    var accRnd=noiseAcc*(Math.random()-0.5); //if acceleration noise

    // determine valid local v0

    var v0eff=Math.min(this.v0, this.speedlimit, this.speedmax);
    v0eff*=this.alpha_v0;

    // actual acceleration model

    var sstar=this.s0
	+Math.max(0, v*this.T+0.5*v*(v-vl)/Math.sqrt(this.a*this.b));
    var accFree=this.calcAccFree(v);
    var accIntIDM=-this.a*Math.pow(sstar/Math.max(s,0.1*this.s0),2);
    var accIDM=accFree+accIntIDM;

    var accCAH=(vl*(v-vl) < -2*s*al)
	? v*v*al/(vl*vl -2*s*al) 
	: al - Math.pow(v-vl,2)/(2*Math.max(s,0.1)) * ((v>vl) ? 1 : 0);
    accCAH=Math.min(accCAH,this.a);

    var accMix=(accIDM>accCAH)
	? accIDM
	: accCAH+this.b*myTanh((accIDM-accCAH)/this.b);
 
    var accACC=this.cool*accMix +(1-this.cool)*accIDM;

    var accInt= Math.max(-this.bmax, accACC + accRnd - accFree);

    //if(this.alpha_v0<0.6){ // alpha not yet used

    if(false){
        console.log("ACC.calcAcc:"
		    +" s="+parseFloat(s)
		    +" v="+parseFloat(v)
		    +" vl="+parseFloat(vl)
		   // +" al="+parseFloat(al)
		    +" accFree="+parseFloat(accFree)
		    +" accIDM="+parseFloat(accIDM)
		    +" accCAH="+parseFloat(accCAH)
		    +" tanarg=",parseFloat((accIDM-accCAH)/this.b)
		    +" myTanh=",parseFloat(myTanh((accIDM-accCAH)/this.b))
		    +" accMix="+parseFloat(accMix)
		    +" accACC="+parseFloat(accACC)
		    +" accInt="+parseFloat(accInt)
		   )
    }
    return accInt;

}//ACC.prototype.calcAccInt






/**
###########################################################################
Mixed Traffic Flow Model (MTM), based on some underlying long CF model
###########################################################################

politeness and dvdumax: higher-level: road.js

@param longModel:   underlying long car-following model

@param s0y:       lateral attenuation scale [m] for long. veh-veh interaction
@param s0yLat:    lateral attenuation scale [m] for lat. veh-veh interaction
@param s0yB:      lateral attenuation scale [m] for long. bd-veh interaction
@param s0yLatB:   lateral attenuation scale [m] for lat. bd-veh interaction
@param sensLat:   sensitivity (desired lat speed)/(long accel) [s]
@param tauLatOVM: time constant[s] lateral OVM 
                  (sensLat/tauLatOVM=maximum ratio lat/long accelerations)
@param sensDvy:   FVDM-like but multiplicative dependence [s/m] 
                  of lat rel speed

@return      MTM instance (constructor)
*/

function MTM(longModel,s0y,s0yLat,s0yB,s0yLatB,sensLat,tauLatOVM,sensDvy){
    this.longModel=longModel;
    this.s0y=s0y;
    this.s0yB=s0yB;
    this.s0yLat=s0yLat;
    this.s0yLatB=s0yLatB;
    this.sensLat=sensLat;
    this.tauLatOVM=tauLatOVM;
    this.sensDvy=sensDvy;

    // fixed values within MTM (acc noise at longModels, v0LatMax at road!)

    this.accLatIntMax=2*longModel.b; // max lat interact accel = x*comf decel 
    this.longParReductFactor=0.0; // !!! reduce longInt if parallel (dx<Ll)
                                  //  and no collision (sy>0)

  // fixed boundary parameters (see sim_straight.js for explanation)
  
  this.accLatBMax=glob_accLatBMax;     
  this.accLatBRef=glob_accLatBRef;
  this.accLongBRef=glob_accLongBRef;
  this.anticFactorB=glob_anticFactorB;
  
  this.nj=8; // number of discr. steps; 
             // max antic length approx 2*relLongAttenLen*sStop


}





/**
###########################################################################
NEW nov17
calculate strength of interaction as CF acceleration (<=0) 
times lateral attenuation with scale=max(model.s0y, model.s0yLat)
only nonzero if partner is leader (dx>=0)
need to calculate accCFint as difference total-free 
since not all models easily separable (IDM is, OVM and ACC not)
###########################################################################

@param dx:   longitudinal distance =u[other vehicle]-u [m] (u=front)
@param vx:   own long speed [m/s]
@param vxl:  leading long speed [m/s]
@param axl:  leading long acceleration [m/s^2]
@param Ll:   length leading car [m]

@return:  CF interaction acceleration [m/s^2] 
*/

MTM.prototype.calcLeaderInteraction=function(dx,dy,vx,vxl,axl,Ll,Wavg){ 
    var sx=Math.max(0,dx-Ll);
    var sy=Math.abs(dy)-Wavg;

    var accCFint= this.longModel.calcAccInt(sx,vx,vxl,axl)
    var s0ymax=Math.max(this.s0y, this.s0yLat);
    var alpha=Math.min(Math.exp(-sy/s0ymax), 1); // =1 if sy<0

    return alpha*accCFint;
}








/**
###########################################################################
MTM longitudinal acceleration function effected by one vehicle (only if dx>0)
###########################################################################

@param dx:   longitudinal distance =u[other vehicle]-u [m] (u=front)
@param dy:   lateral distance =v[other vehicle]-v [m] 
             (v=lateral center position; dy>0 if other vehicle to the right)
@param vx:   own long speed [m/s]
@param vxl:  leading long speed [m/s]
@param axl:  leading long acceleration [m/s^2]
@param Ll:   length leading car [m]
@param Wavg: 1/2(W+Wl) avg. vehicle width [m]

@return:  acceleration ax [m/s^2]
*/

MTM.prototype.calcAccLong=function(dx,dy,vx,vxl,axl,Ll,Wavg){ 
    var sx=Math.max(0,dx-Ll);
    var sy=Math.abs(dy)-Wavg;
    var accFree= this.longModel.calcAccFree(vx);
    var accCFint=this.longModel.calcAccInt(sx,vx,vxl,axl);
    var alpha=Math.min(Math.exp(-sy/this.s0y), 1);

    // reduce longInt if parallel (dx<Ll) and no collision (sy>0)
    if((dx<Ll)&&(sy>0)){ alpha*=this.longParReductFactor;}  


    // tests (set stochasticity noiseAcc in this.longModel.calcAcc=0 
    // for comparisons !!)

    if(false){
      console.log("alpha=",alpha," s=",s," vx=",vx," vxl=",vxl," axl=",axl,
		" accFree=",accFree,
		" accCFint=",accCFint,
		" accFree+alpha*longModelAccInt=",accFree+alpha*accCFint,
		" longModelAcc=",this.longModel.calcAcc(s,vx,vxl,axl),
		"");
    }

    return accFree+alpha*accCFint;
}//MTM.prototype.calcAccLong


/**
###########################################################################
MTM free lateral acceleration 
###########################################################################
@param vy:          own lateral speed [m/s]
@return:            lateral free acceleration due to vy != 0
*/

MTM.prototype.calcAccLatFree=function(vy){
    return -vy/this.tauLatOVM;
}



/**
###########################################################################
MTM lateral interaction acceleration effected by one vehicle 
###########################################################################

@param dx:   longitudinal distance =u[other vehicle]-u [m] (u=front)
@param dy:   lateral distance =v[other vehicle]-v [m] 
             (v=lateral center position; dy>0 if other vehicle to the right)
@param vx:   own long speed [m/s]
@param vxl:  leading long speed [m/s]
@param vy:   own lateral speed [m/s]
@param vyl:  leading lateral speed [m/s]
@param axl:  leading long acceleration [m/s^2]
@param Lveh: length own car [m]
@param Ll:   length leading car [m]
@param Wavg: 1/2(W+Wl) avg. vehicle width [m]

@return:  desired lateral acceleration [m/s^2] (including sign)

!! minor performance improvement would be to reuse accLongFree, accCFint
   by adding these state variables to the vehicle class 
   (defined in prior vehicle.calcAccLong call) 
   and to the function param list but more obscure information flow 
   (I have checked it!)  and
   less flexible to accLong with multiple leaders=> forget it
*/

MTM.prototype.calcAccLatInt=function(dx,dy,vx,vxl,vy,vyl,axl,
				      Lveh,Ll,Wavg,logging){
  var sx=Math.max(0,dx-Ll);
  var sy=Math.abs(dy)-Wavg;
  var sign_dy=(dy<0) ? -1 : 1;
  var sign_sy=(sy<0) ? -1 : 1;
  var accFree=this.longModel.calcAccFree(vx); 
  var accCFint=this.longModel.calcAccInt(sx,vx,vxl,axl); // possibly reuse
  var alpha=(sy<0) // sy=-Wavg ... infty; Math.abs(dy)/Wavg=1+sy/Wavg
	? 1+sy/Wavg : Math.exp(-sy/this.s0yLat); //sy<0 => lin increase
  var v0LatInt=+sensLat*sign_dy*alpha*accCFint; // accCFint<0!! 

  var accLatInt=v0LatInt/this.tauLatOVM;
  
    // add multiplicative FVDM-like effect on lat speed difference
    // 1/sensDvy=lateral speed difference where accLatInt=doubled or zeroed

  var mult_dv_factor=(sy<0)
      ? 1 : Math.max(0., 1.-sign_dy*(vyl-vy)*this.sensDvy);
  accLatInt *=mult_dv_factor;


    // restrict to +/- accLatIntMax

  accLatInt=Math.max(-this.accLatIntMax, 
                     Math.min(this.accLatIntMax,accLatInt));



    // tests (set stochasticity noiseAcc in this.longModel.calcAcc=0 
    // for comparisons !!)
    // possibly switch on also logging in road.updateSpeedPositions
    // for complete accLat that are not accessible here (multi-veh etc)

    //if(logging){
  if(false){
    //if(vx>0)
	console.log(
	  " MTM.calcAccLatInt single pair: ",
	   // " this.tauLatOVM=",this.tauLatOVM,
	   // " this.sensDvy=",this.sensDvy,
	    " dy=",formd(dy),
	    " sx=",formd(sx),
	    " sy=",formd(sy),
	    " vx=",formd(vx),
	    " vy=",formd(vy),
	    //" vxl=",formd(vxl),
	    //" vyl=",formd(vyl),
	    //" axl=",formd(axl),
	    //" accCFint=",formd(accCFint),
	    //" alpha=",formd(alpha),
	  " v0LatInt=",formd(v0LatInt),
	  " mult_dv_factor=",formd(mult_dv_factor),
	  " accLatInt=",formd(accLatInt),
	  " accLatFree=",formd(this.calcAccLatFree(vy)),
	    "");
    }
    return accLatInt;

}//MTM.prototype.calcAccLatInt



/**
###########################################################################
MTM interaction acceleration caused by lateral boundaries
###########################################################################

in logical coordinates (everything in SI units)
x: arcLength from beginning of road link, 
   (=u in simulation, for consistency here x)
y: lateral distance from road axis (positive if to the right)
   (=v in simulation, for consistency here y)

accLatB(x,y)=      int_0^infty(ds) lam*exp(-lam*s)*ayB(x+s,y)
            approx sum_{j=0}^nj c*exp(-j*c)*ayB(x+j*c*sStop,y),
where

sStop=s0+vT+v^2/(2b):             stopping distance
lam=1/sStop:                      long attenuation scale
ayB(x,y)=-accRef*f(w_rB(x)-y-W/2)  local lat accel induced by right boundary
ayB(x,y)=+accRef*f(w_lB(x)+y-W/2)  local lat accel induced by right boundary
f(sy)=exp(-sy/syLatB)              fraction ayB(sy)/ayB(sy=0) for sy>0
f(sy)=1                            fraction ayB(sy)/ayB(sy=0) for sy<=0
accRef=b                           max lat acceleration by boundary

c                              x step of discretisation in units sStop
nj                             #of summation terms; max range nj*c*sStop

new parameter: s0yB,s0yLatB

notice: road width should not change too quickly 
(no narrowing of length less than c*sStop; otherwise, use obstacle-vehicles)


@param widthLeft:  function pointer roadAxis-leftBd as a funct of arcLength u
@param widthRight: same for rightBd-roadAxis
@param x,y:     logical veh coordinates (long,lat) (=(u,v) in simulation)
@param vx,vy:   logical veh velocity vector (speedLong, speedLat)
@param Wveh:    width own car [m]
@param logging: whether send debugging info to console

@return:        desired lateral acceleration [m/s^2] (including sign)
*/


// helper functions: dimensionless absolute factor
// of long/lat acceleration as f(gap to boundary)
// @param signed lateral gap (<0 if boundary exceeded)

// no addtl deceleration if boundary exceeded

MTM.prototype.alphaLongBfun=function(sy){
    return (sy>0) ? Math.exp(-sy/this.s0yB) : 1;
}

// increasing lateral restoring force if boundary exceeded

MTM.prototype.alphaLatBfun=function(sy){
    return (sy>0) ? Math.exp(-sy/this.s0yLatB) : 1-sy/this.s0yLatB;
}


MTM.prototype.calcAccB=function(widthLeft,widthRight,x,y,vx,vy,Wveh){



  //var log=true; MT 2019-08
  var log=false;
  
    // !! vx can be =0; this.longModel.s0/vx heineous error!
  var Tantic=this.anticFactorB*(this.longModel.T);//+this.longModel.s0/vx);
  var dTantic=2*Tantic/this.nj; // sampling width (weight=0 ... exp(-2))
  //var denom=1./(1-Math.exp(-dTantic/Tantic)); // geom series 1/(1-q)

  var alphaLongLeftMax=0; // multiplication alpha(sy)*alpha(sx)
  var alphaLongRightMax=0;
  var alphaLatLeftMax=0; // multiplication alpha(sy)*alpha(sx)
  var alphaLatRightMax=0;
 
  var v0yBleft=0;  // check if road boundaries induce lat desired vel comp
  var v0yBright=0;

  if(log){
    console.log("MTM.calcAccB:",
		" x=",formd(x)," y=",formd(y),
		" vx=",formd(vx)," vy=",formd(vy));
    console.log("\nFind maximum interaction at anticipated longPos:");
  }
  
  // loop over spatial anticipations dx_antic=x+vx*TTC: find max interaction
  
  for(var j=0; j<this.nj; j++){
    var TTC=j*dTantic;
    var weight=Math.exp(-TTC/Tantic);
    var syLeft =widthLeft(x+vx*TTC) +y-0.5*Wveh;
    var syRight=widthRight(x+vx*TTC)-y-0.5*Wveh;

    // calculate locally implied v0yB to avoid B-collisions
    // only active if syLeft<0 => v0yB>0 or syRight<0 => v0yB<0
    
    if(j>0){
      v0yBleft=Math.max(v0yBleft, -syLeft/TTC);
      v0yBright=Math.min(v0yBright, -(-syRight/TTC));
    }
    var alphaLongLeft =this.alphaLongBfun(syLeft)*weight;
    var alphaLongRight=this.alphaLongBfun(syRight)*weight;
    var alphaLatLeft  =this.alphaLatBfun(syLeft)*weight;
    var alphaLatRight =this.alphaLatBfun(syRight)*weight;

    alphaLongLeftMax=Math.max(alphaLongLeft,alphaLongLeftMax);
    alphaLongRightMax=Math.max(alphaLongRight,alphaLongRightMax);
    alphaLatLeftMax=Math.max(alphaLatLeft,alphaLatLeftMax);
    alphaLatRightMax=Math.max(alphaLatRight,alphaLatRightMax);

    if(false&&log){
      console.log(" j=",j," TTC=",formd(TTC)," dx_antic=",formd(vx*TTC),
		  " weight=",formd(weight));
      console.log("  syLeft=",formd(syLeft)," syRight=",formd(syRight));
      if(j>0){
        console.log("  -syLeft/TTC=",formd(-syLeft/TTC),
		    " v0yBleft=",v0yBleft,
		    " syRight/TTC=",formd(syRight/TTC),
		    " v0yBright=",v0yBright);
      }
      console.log("  alphaLongLeft=",formd(alphaLongLeft),
		  " alphaLongRight=",formd(alphaLongRight));
      console.log("  alphaLatLeft=",formd(alphaLatLeft),
		  " alphaLatRight=",formd(alphaLatRight));
    }

  }

  var v0y=(Math.abs(v0yBleft)>Math.abs(v0yBright)) ? v0yBleft : v0yBright;
  var accLongB =this.accLongBRef*( - alphaLongLeftMax - alphaLongRightMax);
  var accLatB0  =this.accLatBRef *( + alphaLatLeftMax  - alphaLatRightMax);

  // add OVM like effect
  // active if boundaries induce lateral component of desired velocity 
  // ! no -vy/tauLatOVM since already taken care of at accFree
  
  accLatB =accLatB0+v0y/this.tauLatOVM;  


  // apply restrictions (rarely in effect)

  var accLatBrestr=Math.max(-this.accLatBMax, 
			      Math.min(this.accLatBMax,accLatB));

  if(log){
    console.log("v0yBleft=",formd(v0yBleft),
		    " v0yBright=",formd(v0yBright));
    console.log("alphaLatLeftMax=",formd(alphaLatLeftMax),
		" alphaLatRightMax=",formd(alphaLatRightMax));
    console.log("accLatB_vy0=",formd(accLatB0));
    console.log("accLatB=",formd(accLatB));
    console.log("accLatBrestr=",formd(accLatBrestr));

    //clearInterval(myRun);//!!! then stepwise with go button!
  }


  return [accLongB,accLatBrestr];

}//MTM.prototype.calcAccB





/**
###########################################################################
displays a table of MTM acceleration values as f(dx,vx) in the console
the columns are dx, dy, vx, vy, calcAccLong and calcAccLat1
###########################################################################

@param dy:   lateral distance =v[other vehicle]-v [m] 
             (v=lateral center position; dy>0 if other vehicle to the right)
@param vxl:  leading long speed [m/s]
@param vy:   own lateral speed [m/s]
@param axl:  leading long acceleration [m/s^2]
@param Lveh: length own car [m]
@param Ll:   length leading car [m]
@param Wavg: 1/2(W+Wl) avg. vehicle width [m]

@return: table in the console
*/

MTM.prototype.calcTable_dxvx=function(dy,vxl,vy,vyl,axl,Lveh,Ll,Wavg){
    var n_dx=2;
    var dxmin=Ll+5;
    var dxmax=Ll+10;

    var n_vx=51;
    var vxmin=0;
    var vxmax=30;

    var str_dy=formd(dy);
    var str_vxl=formd(vxl);
    var str_vy=formd(vy);
    var str_vyl=formd(vyl);
    var str_axl=formd(axl);
    var str_Lveh=formd(Lveh);
    var str_Ll=formd(Ll);
    var str_Wavg=formd(Wavg);

    console.log("\n\n#output of MTM.calcAccTable1_dxvx");
    console.log("#Lveh=",str_Lveh," Ll=",str_Ll," Wavg=",str_Wavg);
    console.log("#");
    console.log("#dx[m]\tdy[m]\tvx\tvy[m/s]\tax[SI]\tay[SI]");

    if((n_dx<2) || (n_vx<2)){
	console.log("MTM.calcAccTable1_dxvx: n_dx and n_vx must be >=2");}
    else for(var i=0; i<n_dx; i++){
	var dx=dxmin+i*(dxmax-dxmin)/(n_dx-1);
	var str_dx=formd(dx);
	for(var j=0; j<n_vx; j++){
	    var vx=vxmin+j*(vxmax-vxmin)/(n_vx-1);
	    var str_vx=formd(vx);

	    var ax=this.calcAccLong(dx,dy,vx,vxl,axl,Ll,Wavg);
	    var ay=this.calcAccLatInt(dx,dy,vx,vxl,vy,vyl,axl,Lveh,Ll,Wavg,false)
		+ this.calcAccLatFree(vy);
	    console.log(str_dx,
			"\t",str_dy,
			"\t",str_vx,
			"\t",str_vy,
			"\t",formd(ax),
			"\t",formd(ay)
		       );
	}
    }

}



/**
###########################################################################
displays a table of ACC acceleration values as f(dx,vx) in the console
the columns are dx=xl-x, vx, ACC.calcAcc
###########################################################################

@param vxl:  leading long speed [m/s]
@param axl:  leading long acceleration [m/s^2]
@param Ll:   length leading car [m]

@return: table in the console
*/

ACC.prototype.calcTable_dxvx=function(vxl,axl,Ll){
    var n_dx=2;
    var dxmin=Ll+5;
    var dxmax=Ll+10;

    var n_vx=51;
    var vxmin=0;
    var vxmax=30;

    var str_vxl=formd(vxl);
    var str_axl=formd(axl);
    var str_Ll=formd(Ll);

    console.log("\n\n#output of ACC.calcAccTable1_dxvx");
    console.log("#vxl=",str_vxl," axl=",str_axl," Ll=",str_Ll);
    console.log("#");
    console.log("#dx[m]\tvx\tax[SI]");

    if((n_dx<2) || (n_vx<2)){
	console.log("ACC.calcAccTable1_dxvx: n_dx and n_vx must be >=2");}
    else for(var i=0; i<n_dx; i++){
	var dx=dxmin+i*(dxmax-dxmin)/(n_dx-1);
	var str_dx=formd(dx);
	for(var j=0; j<n_vx; j++){
	    var vx=vxmin+j*(vxmax-vxmin)/(n_vx-1);
	    var str_vx=formd(vx);

	    var ax=this.calcAcc(dx-Ll,vx,vxl,axl);
	    console.log(str_dx,
			"\t",str_vx,
			"\t",formd(ax)
		       );
	}
    }

}


/**
###########################################################################
obstacle pseudo-model
###########################################################################
*/


function ModelObstacle(){
    console.log("created empty obstacle pseudo-model");
}




