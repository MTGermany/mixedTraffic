
//#############################################################
// color manipulation routines
// same in traffic-simulatioun.de and mixedTraffic
//#############################################################




/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue (periodic, period 1!)
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */

function hslToRgb(h, s, l) {
  var r, g, b;

  var myVersion=true;

  if(myVersion){


    var r_smax=Math.max(0, 1-6*Math.pow(h,2), 1-9*Math.pow(h-1,2));
    var g_smax=Math.max(0, 1-9*Math.pow(h-1/3,2));
    var b_smax=Math.max(0, 1-9*Math.pow(h-2/3,2));


    r = Math.min(255,Math.round(255*3.0*l*(0.5+s*(r_smax-0.5))));
    g = Math.min(255,Math.round(255*2.2*l*(0.5+s*(g_smax-0.5))));
    b = Math.min(255,Math.round(255*1.6*l*(0.5+s*(b_smax-0.5))));

  }

  else{ // not mt version

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = Math.round(255*hue2rgb(p, q, h + 1/3));
        g = Math.round(255*hue2rgb(p, q, h));
        b = Math.round(255*hue2rgb(p, q, h - 1/3));
    }
  }
  return [r, g, b];

}




/**
 * color-codes speed in semi-transparent rainbow colors 
 * in form of an rgba string which can be used as an argument for 
 * ctx.fillStyle etc
 * if (isTruck) [arg optional], then the rgba color is darker
 *
 * @param   v: the actual speed
 * @param   vmin,vmax: speed range for color coding
 * @param   vehType: darker if vehType=="truck"
 * @return  Array           The RGB representation
 */

function colormapSpeed(v, vmin, vmax, vehType){
    var hue_vmin=0/360; // color wheel: 0=360=red
    var hue_vmax=270/360; 



    // rel speed with respect to [vmin,vmax]
    // transform nonlinearly (use vrel_nl) to shrink the unnaturally wide 
    // central green regions

    var vrel= Math.min( (v-vmin)/(vmax-vmin), 1.0);
    var vrel_nl=(vrel<=0.5) ? 2*Math.pow(vrel,2) : 1-2*Math.pow(vrel-1,2)

    // determine hue-saturation-lightness

    var hue=hue_vmin+vrel_nl*(hue_vmax-hue_vmin);
    var sat=1; // use max saturation
    var lightness=(vehType=="truck") ? 0.2 : 0.5; //0: all black; 1: white

    // convert into rgb and add opacity (0: fully transp; 1: opaque=normal)

    var rgbArr=hslToRgb(hue,sat,lightness);

    r=rgbArr[0];
    g=rgbArr[1];
    b=rgbArr[2];
    a=(vehType=="truck") ? 0.4 : 0.5;
    var colStr="rgba("+r+","+g+","+b+","+a+")";
    return colStr;
}

function colormapSpeedOpaque(v, vmin, vmax, vehType){
    var hue_vmin=0/360; // color wheel: 0=360=red
    var hue_vmax=270/360; 

    var vrel= Math.min( (v-vmin)/(vmax-vmin), 1.0);
    var vrel_nl=(vrel<=0.5) ? 2*Math.pow(vrel,2) : 1-2*Math.pow(vrel-1,2)

    var hue=hue_vmin+vrel_nl*(hue_vmax-hue_vmin);
    var sat=1; // use max saturation
    var lightness=(vehType=="truck") ? 0.2 : 0.5; //0: all black; 1: white

    // convert into rgb and return

    var rgbArr=hslToRgb(hue,sat,lightness);
    var colStr="rgb("+rgbArr[0]+","+rgbArr[1]+","+rgbArr[2]+")";
    return colStr;
}







/** draws colormap graphically on graphics "2d" context ctx

  @param xCenterPix, ycenterPix: center-upper corner in pixel coordinates
  @param widthPix, heightPix: dimension of the displayed box
  @param vminMap, vmaxMap: value range used in colormapSpeed
  @param vminDisplay, vmaxDisplay: value range displayed here
*/


function drawColormap(xCenterPix, yCenterPix, widthPix, heightPix,
		      vminMap, vmaxMap, vminDisplay, vmaxDisplay){

    ctx.setTransform(1,0,0,1,xCenterPix-0.5*widthPix,
		     yCenterPix-0.5*heightPix); 


    // draw the actual speed colormap

    var nvals=30; // nvals color values
    var nlegend=6;  // nlegend numbers displayed in legend
    var hBox=heightPix/nvals;

    for(var i=0; i<nvals; i++){
	var xLeft=0;
	var yTop=i*hBox;
        var val=vminDisplay+i/(nvals-1)*(vmaxDisplay-vminDisplay);
        ctx.fillStyle=colormapSpeedOpaque(val,vminMap,vmaxMap,"car");
        ctx.fillRect(xLeft,yTop,widthPix,hBox); 
    }


    // draw the legend

    var textsize=0.11*heightPix;
    ctx.font=textsize+'px Arial';
    var textwidthPix=4*textsize;
    ctx.fillStyle="#FFFFFF";

    // white bg box

    ctx.fillRect(widthPix,-0.5*textsize,textwidthPix,heightPix+textsize); 

    // speed labels

    for (var i=0; i<nlegend; i++){
	var v=vminMap+i*(vmaxDisplay-vminDisplay)/(nlegend-1);
	var xLeft=widthPix+0.2*textsize;
	var yBot=0.4*textsize+(heightPix-0)*i/(nlegend-1);
        var speedStr=Math.round(3.6*v)+" km/h";
        ctx.fillStyle="#000000";
	ctx.fillText(speedStr,xLeft,yBot);
    }

    // revert to neutral transformation at the end!

    ctx.setTransform(1,0,0,1,0,0); 

}
