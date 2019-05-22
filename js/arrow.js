/**
helper method to draw an arrow to a graphics context
@param ctx:        Graphics context
@param xStart:     x coordinate in pixel coordinates (right)
@param yStart:     y coordinate in pixel coordinates (down)
@param dx,dy:      length vector [pixels] to the tip of the arrowhead
@param headsize:   size of triangle-shaped closed arrowhead [pixel]
*/

function drawArrow(ctx,xStart,yStart,dx,dy,headSize){
    var wHalf=0.4*headSize; // maximum half-with of arrow
    var xEnd=xStart+dx;
    var yEnd=yStart+dy;
    var cphi=dx/Math.sqrt(dx*dx+dy*dy);  // e_x.e_dir
    var sphi=dy/Math.sqrt(dx*dx+dy*dy);  // e_y.e_dir

    ctx.beginPath();              // start arrow line
    ctx.moveTo(xStart,yStart);    // start at arrow base  
    ctx.lineTo(xEnd,yEnd);        // tip of arrowhead
    //console.log("drawArrow: xStart=",xStart," yStart=",yStart," xEnd=",xEnd," yEnd=",yEnd);
    ctx.stroke();
    ctx.beginPath();              // start arrow triangle
    ctx.moveTo(xEnd,yEnd);        // start at tip of arrowhead
    ctx.lineTo(xEnd-headSize*cphi-wHalf*sphi,yEnd-headSize*sphi+wHalf*cphi); 
    ctx.lineTo(xEnd-headSize*cphi+wHalf*sphi,yEnd-headSize*sphi-wHalf*cphi); 
    ctx.fill();
}



