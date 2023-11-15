

#####################################################################
# dashed now explicit with dt (implicit over "dashed" + ls no longer works)
# BUG (2021, Ubuntu20): dt does not work with png (there always solid)
######################################################################

# post eps dashed no longer works but dashtype (dt) in ls
# specs! dt 1 = solid
 
set style line 1 lt 1 lw 1 pt 7 ps 1.9 dt 1 lc rgb "#000000" #schwarz, bullet
set style line 2 lt 1 lw 1 pt 9 ps 1.5 dt 1 lc rgb "#CC0022" #closedUpTriang
set style line 3 lt 1 lw 1 pt 4 ps 1.2 dt 1 lc rgb "#FF3300" #closedSquare
set style line 4 lt 1 lw 1 pt 4 ps 1.5 dt 1 lc rgb "#FFAA00" #gelb,
set style line 5 lt 1 lw 1 pt 5 ps 1.5 dt 1 lc rgb "#00DD22" #gruen,
set style line 6 lt 1 lw 1 pt 4 ps 1.5 dt 1 lc rgb "#00AAAA"
set style line 7 lt 1 lw 1 pt 4 ps 2.0 dt 7 lc rgb "#4477FF" #blau,
set style line 8 lt 1 lw 1 pt 8 ps 1.5 dt 1 lc rgb "#220088"
set style line 9 lt 1 lw 1 pt 9 ps 1.5 dt 9 lc rgb "#999999" #grau

set style line 11 lt 1 lw 4 pt 7 ps 1.9  lc rgb "#000000" 
set style line 12 lt 1 lw 4 pt 2 ps 1.5 dt 2 lc rgb "#CC0022" 
set style line 13 lt 8 lw 4 pt 4 ps 1.2  lc rgb "#FF3300"
set style line 14 lt 6 lw 4 pt 4 ps 1.5  lc rgb "#FFAA00"
set style line 15 lt 1 lw 4 pt 5 ps 1.5  lc rgb "#00DD22"
set style line 16 lt 5 lw 4 pt 7 ps 1.5  lc rgb "#00AAAA"
set style line 17 lt 1 lw 4 pt 7 ps 1.5  lc rgb "#1100FF"
set style line 18 lt 4 lw 4 pt 8 ps 1.5  lc rgb "#220088"
set style line 19 lt 7 lw 4 pt 9 ps 1.5  lc rgb "#999999"



##############################################################
# Beispiele fuer Funktionen 
##############################################################

max(x,y)    = (x>y) ? x : y
min(x,y)    = (x>y) ? y : x
mod(x,interval)=x-(floor(x/interval)*interval) # x%interval for reals
round(x) = x - floor(x) < 0.5 ? floor(x) : ceil(x)
filterData(data,number)=(round(data)==number) ? 1 : NaN
filterDataInverse(data,number)=(round(data)==number) ? NaN : 1

selectRange(x,xmin,xmax)=((x>=xmin) && (x<=xmax)) ? 1 : NaN

##############################################################
set term post eps enhanced color solid "Helvetica" 14
#set term png notransparent truecolor medium font "Helvetica,12"
#set term pngcairo enhanced color notransparent crop font "Helvetica,12" #better


##############################################################
set out "mixedTraffOutput3_histograms.eps"
print "plotting mixedTraffOutput3_histograms.eps"
##############################################################

set key opaque box top right

halfWidth=5.

set xlabel "Distance y to the right [m]"
set xrange [-halfWidth:halfWidth]
set ylabel "\#Vehicles"
set boxwidth 0.9 relative
plot\
  "mixedTraffOutput3.hist" u 1:2 t "Motorcycles"\
     w boxes lc rgb "#aa4477ff" lw 2 fs solid 0.50,\
  "mixedTraffOutput3.hist" u 1:3 t "Other Vehicles"\
     w boxes lc rgb "#44000000" lw 3 fs transparent


##############################################################
set out "mixedTraffOutput3_xy.eps"
print "plotting mixedTraffOutput3_xy.eps"
##############################################################

set xlabel "Distance x [m]"
set xrange [200:300]
set ylabel "Distance y to the right [m]"
set yrange [-halfWidth:halfWidth]
plot\
  "mixedTraffOutput3.traj" u (filterData($2,0)*$3):($4)\
    t "Motorcycles" w p ls 7 ps 0.6,\
  "mixedTraffOutput3.traj" u (filterDataInverse($2,0)*$3):($4)\
    t "Other vehicles" w p ls 1 ps 0.8



##############################################################
set out "mixedTraffOutput3_xt_laneMiddle.eps"
print "plotting mixedTraffOutput3_xt_laneMiddle.eps"
##############################################################

set key opaque box bottom right

set xlabel "Time [s]"
set xrange [190:350]
tshift=50
set ylabel "Distance x [m]"
set yrange [0:375]

wLane=3.4    # as in js file
yminMotoLeft=-0.75*wLane
ymaxMotoLeft=-0.25*wLane
yminMotoRight=0.25*wLane
ymaxMotoRight=0.75*wLane
yminMotoCenter=-0.25*wLane
ymaxMotoCenter=0.25*wLane
yminOthers=-0.425*wLane
ymaxOthers=0.425*wLane

set auto x
set auto y

plot\
  "mixedTraffOutput3.traj" u\
   (filterData($2,0)*selectRange($4,yminMotoLeft,ymaxMotoLeft)*$1+tshift):($3-2)\
    t "Motos left" w p ls 5 ps 0.08,\
  "mixedTraffOutput3.traj" u\
   (filterData($2,0)*selectRange($4,yminMotoCenter,ymaxMotoCenter)*$1+tshift):($3-2)\
    t "Motos center" w p ls 9 ps 0.08,\
  "mixedTraffOutput3.traj" u\
   (filterData($2,0)*selectRange($4,yminMotoRight,ymaxMotoRight)*$1+tshift):($3-2)\
    t "Motos right" w p ls 7 ps 0.08,\
  "mixedTraffOutput3.traj" u\
   (filterDataInverse($2,0)*selectRange($4,yminOthers,ymaxOthers)*$1+tshift):($3-4)\
    t "Other vehicles" w p ls 1 ps 0.08,\
  "mixedTraffOutput3.traj" u\
   (filterData($2,3)*selectRange($4,yminOthers,ymaxOthers)*$1+tshift):($3)\
    t "red TL" w p ls 12 ps 0.12

# ($3-4) instead ($3) for vehs since otherwise veh too near (x=front)