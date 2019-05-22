

function plotxy(wPix,hPix,xPixLeft,yPixTop){
    this.wPix=wPix;
    this.hPix=hPix;
    this.xPixLeft=xPixLeft;
    this.yPixTop=yPixTop;
    this.sizePix=Math.min(this.wPix,this.hPix);
    this.yPixBot=this.yPixTop+this.hPix;
    this.rPix=0.02*this.sizePix; // radius of scatter-plot bullets

    var xrelOrig=0.12; // rel x-gap between y axis and left boundary
    var yrelOrig=0.07; // rel y-gap between x axis and bottom boundary
    this.xPixOrig=this.xPixLeft+xrelOrig*this.wPix;
    this.yPixOrig=this.yPixBot -yrelOrig*this.hPix;
    this.xPixDataMax=this.xPixOrig+(1-xrelOrig-0.01)*this.wPix;
    this.yPixDataMax=this.yPixOrig-(1-xrelOrig-0.01)*this.hPix;
}


/**
scatter plot

@param ctx:     2d graphics context ctx
@param data:    matrix [dataPoint0, dataPoint1,...] with 
                data[i]=[col0, col1, ...] the quantities in each data point
@param xSpec:   [colx in {0,1,..}, 
                  xmult=multipl factor (e.g., 3600 for unit 1/s->1/h),
                  xmax=initial maximum value (may be overridden by max of data),
                  colxname (e.g., "flow [veh/h]") 
                ]
@param ySpec:   in analogy
@param boxSpec: (optional) array of cols where to find 
                ymin, 25th, 50th, 75th and 100th percentile=ymax

@return:        scatter plot in 2d graphics context ctx
*/

plotxy.prototype.scatterplot=function(ctx, data, xSpec, ySpec, boxSpec){


    var colx=xSpec[0];
    var xmult=xSpec[1];    
    var xmaxPlot=xSpec[2];
    var xname=xSpec[3];

    var coly=ySpec[0];
    var ymult=ySpec[1];    
    var ymaxPlot=ySpec[2];
    var yname=ySpec[3];

    // just abbreviations

    var wPix=this.wPix;
    var hPix=this.hPix;
    var xPixOrig=this.xPixOrig;
    var yPixOrig=this.yPixOrig;
    var xPixDataMax=this.xPixDataMax;
    var yPixDataMax=this.yPixDataMax;



    // determine range and tic marc distances (min=0, max value >1)

    for (var i=0; i<data.length; i++){
	xmaxPlot=Math.max(xmult*data[i][colx],xmaxPlot);
	ymaxPlot=Math.max(ymult*data[i][coly],ymaxPlot);
    }
    var dxTic=dTic(xmaxPlot);
    var dyTic=dTic(ymaxPlot);



    // draw a white rectangle defining the place of the graphics

    ctx.fillStyle="rgb(255,255,255)";
    ctx.fillRect(this.xPixLeft,this.yPixTop, wPix, hPix);


    // draw the axes including labelling

    ctx.fillStyle="rgb(0,0,0)";
    var textsize=0.05*this.sizePix; 
    ctx.font=textsize+'px Arial';

    // x axis

    ctx.fillText(xname,xPixOrig+0.55*wPix, yPixOrig-0.03*hPix);
    ctx.fillRect(xPixOrig,yPixOrig-0.005*hPix,xPixDataMax-xPixOrig, 0.01*hPix);

    for(var i=0; i<=Math.floor(xmaxPlot/dxTic); i++){
	var xTic=xPixOrig-0.005*wPix+i*dxTic/xmaxPlot*(xPixDataMax-xPixOrig);
	var yTic=yPixOrig;
	var nDigits=Math.floor((Math.log(i*dxTic+1))/Math.log(10))+1;
	ctx.fillRect(xTic,yTic,0.01*wPix, -0.04*hPix);
	ctx.fillText(i*dxTic, xTic+2-0.3*nDigits*textsize, yTic+textsize);
    }
	
    // y axis
	
    ctx.fillText(yname,xPixOrig+0.01*wPix, yPixDataMax+0.04*hPix);
    ctx.fillRect(xPixOrig-0.005*wPix,yPixOrig,0.01*wPix,yPixDataMax-yPixOrig);

    for(var i=0; i<=Math.floor(ymaxPlot/dyTic); i++){
	var xTic=xPixOrig;
	var yTic=yPixOrig-0.005*hPix+i*dyTic/ymaxPlot*(yPixDataMax-yPixOrig);
	var nDigits=Math.floor((Math.log(i*dyTic+1))/Math.log(10))+1;
	ctx.fillRect(xTic,yTic,0.04*wPix, 0.01*hPix);
	ctx.fillText(i*dyTic, xTic-2-0.6*nDigits*textsize, yTic+0.5*textsize);
    }
   

    // draw the actual data

    for(var i=0; i<data.length; i++){
	var x=data[i][colx]*xmult;
	var y=data[i][coly]*ymult;
	var center_xPix=xPixOrig+(xPixDataMax-xPixOrig)*x/xmaxPlot;
	var center_yPix=yPixOrig+(yPixDataMax-yPixOrig)*y/ymaxPlot;

        // draw just the scatter-plot bullets if no info for boxplot


	if(boxSpec==null){
            ctx.fillStyle="rgb(0,0,0)";
	    ctx.beginPath();
	    ctx.arc(center_xPix,center_yPix,this.rPix,0,2*Math.PI);
	    ctx.fill();
	}

        // draw box-whisker plot if applicable

	else{
	    //console.log(" in box-whisker branch: boxSpec=",boxSpec);
	    var ymin=data[i][boxSpec[0]]*ymult;
	    var y25 =data[i][boxSpec[1]]*ymult;
	    var y50 =data[i][boxSpec[2]]*ymult; // median
	    var y75 =data[i][boxSpec[3]]*ymult;
	    var ymax=data[i][boxSpec[4]]*ymult;

	    var yPixMin=yPixOrig+(yPixDataMax-yPixOrig)*ymin/ymaxPlot;
	    var yPix25=yPixOrig+(yPixDataMax-yPixOrig)*y25/ymaxPlot;
	    var yPix50=yPixOrig+(yPixDataMax-yPixOrig)*y50/ymaxPlot;
	    var yPix75=yPixOrig+(yPixDataMax-yPixOrig)*y75/ymaxPlot;
	    var yPixMax=yPixOrig+(yPixDataMax-yPixOrig)*ymax/ymaxPlot;
	    var wBox=0.03*this.sizePix;      // width of central box body
	    var wWhi=0.015*this.sizePix;  // width of square whiskers
	    var wLine=0.005*this.sizePix;     // width of vertikal line
	    var hBox=(yPixDataMax-yPixOrig)*(y75-y25)/ymaxPlot;

            // draw vertical line from ymin to ymax

            ctx.fillStyle="rgb(255,40,0)";
	    ctx.fillRect(center_xPix-0.5*wLine,yPixMin,wLine,yPixMax-yPixMin);

            // draw box body

            ctx.fillStyle="rgb(100,100,100)";
	    ctx.fillRect(center_xPix-0.5*wBox,yPix25,wBox,yPix75-yPix25);

            // draw square whiskers at the ends and median in box body

            ctx.fillStyle="rgb(50,0,150)";
	    ctx.fillRect(center_xPix-wWhi,yPixMin-0.5*wWhi, 2*wWhi, wWhi);
	    ctx.fillRect(center_xPix-wWhi,yPixMax-0.5*wWhi, 2*wWhi, wWhi);
            ctx.fillStyle="rgb(0,0,0)";
	    ctx.fillRect(center_xPix-wWhi,yPix50-0.5*wWhi, 2*wWhi, wWhi);
	}


    }

} // plotxy.scatterplot




















