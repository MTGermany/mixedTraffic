

#####################################################################
# dashed now explicit with dt (implicit over "dashed" + ls no longer works)
# BUG (2021, Ubuntu20): dt does not work with png (there always solid)
######################################################################

# post eps dashed no longer works but dashtype (dt) in ls
# specs! dt 1 = solid
 
set style line 1 lt 1 lw 2 pt 7 ps 1.9 dt 1 lc rgb "#000000" #schwarz, bullet
set style line 2 lt 1 lw 2 pt 9 ps 1.5 dt 1 lc rgb "#CC0022" #closedUpTriang
set style line 3 lt 1 lw 2 pt 4 ps 1.2 dt 1 lc rgb "#FF3300" #closedSquare
set style line 4 lt 1 lw 2 pt 4 ps 1.5 dt 1 lc rgb "#FFAA00" #gelb,
set style line 5 lt 1 lw 2 pt 5 ps 1.5 dt 1 lc rgb "#00DD22" #gruen,
set style line 6 lt 1 lw 2 pt 4 ps 1.5 dt 1 lc rgb "#00AAAA"
set style line 7 lt 1 lw 2 pt 4 ps 2.0 dt 7 lc rgb "#4477FF" #blau,
set style line 8 lt 1 lw 2 pt 8 ps 1.5 dt 1 lc rgb "#220088"
set style line 9 lt 1 lw 2 pt 9 ps 1.5 dt 9 lc rgb "#999999" #grau

set style line 11 lt 1 lw 6 pt 7 ps 1.9  lc rgb "#000000" 
set style line 12 lt 1 lw 6 pt 2 ps 1.5 dt 2 lc rgb "#CC0022" 
set style line 13 lt 8 lw 6 pt 4 ps 1.2  lc rgb "#FF3300"
set style line 14 lt 6 lw 6 pt 4 ps 1.5  lc rgb "#FFAA00"
set style line 15 lt 1 lw 6 pt 5 ps 1.5  lc rgb "#00DD22"
set style line 16 lt 5 lw 6 pt 7 ps 1.5  lc rgb "#00AAAA"
set style line 17 lt 1 lw 6 pt 7 ps 1.5  lc rgb "#1100FF"
set style line 18 lt 4 lw 6 pt 8 ps 1.5  lc rgb "#220088"
set style line 19 lt 7 lw 6 pt 9 ps 1.5  lc rgb "#999999"



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
set out "mixedBicycle_w1_6_xt_lane2.eps"
print "plotting mixedBicycle_w1_6_xt_lane2.eps"
##############################################################

set xlabel "time [s]"
set ylabel "longitudinal x [m]"
wLane=1.5
ymin=-0.5*wLane
ymax=0.5*wLane

plot\
  "mixedBicycle_w1_6.traj" u\
   (filterData($2,0)*selectRange($4,ymin,ymax)*$1):($3)\
    t "Bicycles" w p ls 7 ps 0.3
