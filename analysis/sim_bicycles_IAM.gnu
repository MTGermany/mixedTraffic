
# !! This is set by the run script in
# ~/versionedProjects/mixedTraffic/analysis
# can it also set by hand to typically "0_75", "1_25" or "2_00"

width_str="1_25"


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



##############################################################
hist_in=sprintf("sim_bicycles_IAM_w%s.hist",width_str)
hist_out=sprintf("../figs/sim_bicycles_IAM_histogram_w%s.eps",width_str)
set out hist_out
print "plotting ",hist_out
##############################################################

set key opaque box top right

halfWidth=1.0

set xlabel "Distance y to the right [m]"
set xrange [-halfWidth:halfWidth]
set ylabel "\#Cyclists"
set boxwidth 0.9 relative
plot\
  hist_in u 1:2 t "Slow cyclists"\
  w boxes lc rgb "#1100ff" lw 2 fs solid 0.50,\
  hist_in u 1:3 t "Fast cyclists"\
  w boxes lc rgb "#cc0022" lw 2 fs transparent


##############################################################
xy_in=sprintf("sim_bicycles_IAM_w%s.traj",width_str)
xy_out=sprintf("../figs/sim_bicycles_IAM_xy_w%s.eps",width_str)
set out xy_out
print "plotting ",xy_out
##############################################################

set xlabel "Distance x [m]"
set xrange [95:200]
set ylabel "Distance y to the right [m]"
set auto y
plot[t=0:1]\
  xy_in u (filterData($2,0)*$3):($4)\
    t "Slow cyclists" w d ls 7,\
  xy_in u (filterData($2,1)*$3):($4)\
    t "Fast cyclists" w d ls 2



##############################################################
xt_in=sprintf("sim_bicycles_IAM_w%s.traj",width_str)
xt_out=sprintf("../figs/sim_bicycles_IAM_xt_w%s.eps",width_str)
set out xt_out
print "plotting ",xt_out
##############################################################

set key opaque box top right

set xlabel "Time [s]"  
set xrange [180:300] #time
set ylabel "Distance x [m]" #longitudinal
set yrange [80:180]
wLane=1.2
ymin=-0.5*wLane
ymax=0.5*wLane
  
 
plot[t=0:1]\
  xt_in u (filterData($2,0)*selectRange($4,ymin,ymax)*$1):($3)\
  t sprintf("slow cyclists, track center +/- %.2f m", ymax) w p ls 7 ps 0.18,\
  xt_in u (filterData($2,1)*selectRange($4,ymin,ymax)*$1):($3)\
  t sprintf("fast cyclists, track center +/- %.2f m", ymax)\
  w p ls 2 ps 0.24 lc rgb "#ff0055"

# psychologically, ls 2 looks more orange here => overrode it

print "\nHint: set variable width_str to desired width"
print " (where data are available)"
print "present value widtstr=",width_str
quit

