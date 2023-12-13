

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
set style line 7 lt 1 lw 1 pt 4 ps 2.0 dt 7 lc rgb "#1100FF" #blau,
set style line 8 lt 1 lw 1 pt 8 ps 1.5 dt 1 lc rgb "#220088"
set style line 9 lt 1 lw 1 pt 9 ps 1.5 dt 9 lc rgb "#999999" #grau

set style line 11 lt 1 lw 4 pt 7 ps 1.9  lc rgb "#000000" 
set style line 12 lt 1 lw 4 pt 2 ps 1.5  lc rgb "#CC0022" 
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
set term post eps enhanced color solid "Helvetica" 20


width_str="1_25"

##############################################################
hist_in=sprintf("sim_bicycles_IAM_w%s.hist",width_str)
hist_out=sprintf("../figs/sim_bicycles_IAM_histogramw_w%s.eps",width_str)
set out hist_out
print "plotting ",hist_out
##############################################################

set key opaque box top right

halfWidth=1.0

set xlabel "Distance y to the right [m]"
set xrange [-halfWidth:halfWidth]
set ylabel "\#Cyclists"
set boxwidth 0.9 relative
plot hist_in u 1:2 t "Cyclists"\
  w boxes lc rgb "#aa4477ff" lw 2 fs solid 0.50


##############################################################
xy_in=sprintf("sim_bicycles_IAM_w%s.traj",width_str)
xy_out=sprintf("../figs/sim_bicycles_IAM_xy_w%s.eps",width_str)
set out xy_out
print "plotting ",xy_out
##############################################################

set xlabel "Distance x [m]"
set xrange [120:170]
set ylabel "Distance y to the right [m]"
set auto y
plot[t=0:1]\
  xy_in u (filterData($2,0)*$3):($4)\
    t "" w p ls 7 ps 0.3,\
    t,t t "Bicycles" w l ls 17


##############################################################
xt_in=sprintf("sim_bicycles_IAM_w%s.traj",width_str)
xt_out=sprintf("../figs/sim_bicycles_IAM_xt_w%s.eps",width_str)
set out xt_out
print "plotting ",xt_out
##############################################################

set key opaque box bottom right

set xlabel "Time [s]"
set xrange [130:]
tshift=0
set ylabel "Distance x [m]"
set yrange [120:170]

 
plot[t=0:1]\
  xt_in u (filterData($2,0)*($1+tshift)):($3) t "" w p ls 7 ps 0.18,\
    t,t t "Motos right" w l ls 17


quit





##############################################################
set term post eps enhanced color solid "Helvetica" 20
#set term png notransparent truecolor medium font "Helvetica,12"
#set term pngcairo enhanced color notransparent crop font "Helvetica,12" #better


set key box top right
unset key
set size 0.7,1

set xlabel "lateral position y [m]" 
set xrange [-1.1:1.1]
set ylabel "\#Vehicles" offset 1,0
set boxwidth 0.9 relative

##############################################################
set out "mixedBicycle_w1_0_histograms.eps"
print "plotting mixedBicycle_w1_0_histograms.eps"
##############################################################

plot[t=0:1]\
  "mixedBicycle_w1_0.hist" u 1:2 t "Bicycles"\
     w boxes lc rgb "#aa4477ff" lw 2 fs solid 0.50,\
   -0.5, 1200*t w l ls 11,\
   0.5, 1200*t w l ls 11



##############################################################
set out "mixedBicycle_w1_6_histograms.eps"
print "plotting mixedBicycle_w1_6_histograms.eps"
##############################################################

plot[t=0:1]\
  "mixedBicycle_w1_6.hist" u 1:2 t "Bicycles"\
     w boxes lc rgb "#aa4477ff" lw 2 fs solid 0.50,\
   -0.8, 800*t w l ls 11,\
   0.8, 800*t w l ls 11
     

##############################################################
set out "mixedBicycle_w2_4_histograms.eps"
print "plotting mixedBicycle_w2_4_histograms.eps"
##############################################################

plot[t=0:1]\
  "mixedBicycle_w2_4.hist" u 1:2 t "Bicycles"\
     w boxes lc rgb "#aa4477ff" lw 2 fs solid 0.50,\
   -1.2, 800*t w l ls 11,\
   1.2, 800*t w l ls 11



##############################################################
set out "mixedBicycle_w1_6_xy.eps"
print "plotting mixedBicycle_w1_6_xy.eps"
##############################################################

set size 1,1

set xlabel "longitudinal x [m]"
set auto x
set ylabel "lateral y [m]"
plot\
  "mixedBicycle_w1_6.traj" u (filterData($2,0)*$3):($4)\
    t "Bicycles" w p ls 7 ps 0.3

##############################################################
set out "mixedBicycle_w2_0_xy.eps"
print "plotting mixedBicycle_w2_0_xy.eps"
##############################################################

plot\
  "mixedBicycle_w2_0.traj" u (filterData($2,0)*$3):($4)\
    t "Bicycles" w p ls 7 ps 0.3

##############################################################
set out "mixedBicycle_w2_4_xy.eps"
print "plotting mixedBicycle_w2_4_xy.eps"
############################################# habe 2.6m statt 2.4m gewaehlt

set xrange [10:190]
plot\
  "mixedBicycle_w2_4.traj" u (filterData($2,0)*$3):($4)\
    t "Bicycles" w p ls 7 ps 0.3
set auto x


##############################################################
set out "mixedBicycle_w1_6_xt_lane2.eps"
print "plotting mixedBicycle_w1_6_xt_lane2.eps"
##############################################################

set xlabel "time [s]"
set ylabel "longitudinal x [m]"
set yrange [0:200]
wLane=1.5
ymin=-0.5*wLane
ymax=0.5*wLane

plot\
  "mixedBicycle_w1_6.traj" u\
   (filterData($2,0)*selectRange($4,ymin,ymax)*$1):($3)\
    t "Bicycles" w p ls 7 ps 0.3

##############################################################
set out "mixedBicycle_w1_0_xt_lane2.eps"
print "plotting mixedBicycle_w1_0_xt_lane2.eps"
##############################################################

wLane=1.0
ymin=-0.5*wLane
ymax=0.5*wLane

plot\
  "mixedBicycle_w1_0.traj" u\
   (filterData($2,0)*selectRange($4,ymin,ymax)*$1):($3)\
    t "Bicycles" w p ls 7 ps 0.3

##############################################################
set out "mixedBicycle_w2_0_xt_lane2.eps"
print "plotting mixedBicycle_w2_0_xt_lane2.eps"
##############################################################

wLane=2.0
ymin=-0.5*wLane
ymax=0.5*wLane

plot\
  "mixedBicycle_w2_0.traj" u\
   (filterData($2,0)*selectRange($4,ymin,ymax)*$1):($3)\
    t "Bicycles" w p ls 7 ps 0.3

##############################################################
set out "mixedBicycle_w2_4_xt_lane2.eps"
print "plotting mixedBicycle_w2_4_xt_lane2.eps"
##############################################################

wLane=2.4
ymin=-0.5*wLane
ymax=0.5*wLane

plot\
  "mixedBicycle_w2_4.traj" u\
   (filterData($2,0)*selectRange($4,ymin,ymax)*$1):($3)\
    t "Bicycles" w p ls 7 ps 0.3


