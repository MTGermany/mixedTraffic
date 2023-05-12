
//!!! CHANGE all to vectors; quick hack: ulimit -s unlimited
/*
  (mar18)
  Template fuer main() Programm; Ort:
  
  ~/versionedProjects/lib/templates/templateMain.cpp

  makefile dazu:
  
  ~/versionedProjects/lib/templates/makefile
 
  Achtung! Auch ohne .h File muss man bei $OBJECTS immer auch das 
  File mit der Main-Methode dazunehmen!
  (sonst "ld: undefined reference to main"
*/

using namespace std;

// c
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>

//alternatively there is <cstdio> which declares
//everything in namespace std
//but the explicit "using namespace std;" puts
//everything in global namespace


// c++  (the first is nearly always needed)
#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <iomanip> //!! <feb19>
#include <vector>

// own (delete if not needed)
#include "general.h"
#include "Statistics.h"
#include "RandomUtils.h" // contains, e.g.,  myRand()
#include "InOut.h"
#include "Math.h"


// constants


static const int MAXSTR=500;// max. string length


//#####################################################
//#####################################################


double type2typeID(string type){
  return (type=="bike") ? 0
    : (type=="car") ? 1
    : (type=="truck") ? 2 : 3;
}


int main(int argc, char* argv[]) {



  //###############################
  // Parsing cmd line
  // ##############################

  double startHistogram_at_u=50;
  double endHistogram_at_u=400;
  char   projectName[MAXSTR];
  
  if ((argc<3)||(argc>5)){
    cerr <<"\nUsage: analyze <projName> <roadWidth_m> "
	 <<" [<startHistogram_at_u>]  [<endHistogram_at_u>]<<endl";
    cerr<<"Default vals: startHistogram_at_u="<<startHistogram_at_u
	<<" endHistogram_at_u="<<endHistogram_at_u<<endl;
    exit(-1);
  }

  sprintf(projectName,"%s",argv[1]);
  double roadWidth=atof(argv[2]);
  if(argc==4){startHistogram_at_u=atof(argv[3]);}
  if(argc==5){endHistogram_at_u=atof(argv[4]);}


 

  


//#####################################################
// input
//#####################################################

  char   fnameIn[MAXSTR];
  sprintf(fnameIn,"%s.txt",projectName);

  InOut inout;
  int nData=inout.getNumberOfDataLines(fnameIn);
  cout<<"nData="<<nData<<" possible bug: consider applying ulimit -s unlimited"<<endl;
  if(nData<10){
    cerr<<"nData="<<nData<<": Error: no or too little data"<<endl;
    exit(-1);
  }


  //vector<double> times; //!!!
  double times[nData];
  string type[nData];
  double x[nData];
  double y[nData];
  double vx[nData];
  double vy[nData];


    // t(s)   iveh    x(m)    v(m/s)          s(m)    a(m/s^2)

  inout.get_col(fnameIn, 1, nData, times);
  inout.get_col(fnameIn, 3, nData, type);
  inout.get_col(fnameIn, 6, nData, x);
  inout.get_col(fnameIn, 7, nData, y);
  inout.get_col(fnameIn, 8, nData, vx);
  inout.get_col(fnameIn, 9, nData, vy);

  
  //!!!
  /*
  cout<<"times.size()="<<times.size()
      <<" times[0]="<<times[0]
      <<" times[int(times.size())-1]="
      <<times[int(times.size())-1]<<endl;
  */
  
//#####################################################
// Do some calculations
//#####################################################

  Statistics stat;
  cout<<"Hier"<<endl;

  double y_bike [nData];  // for all x, homogeneous road
  double y_rest[nData];
  int nbike=0;
  int nrest=0;
  cout<<"Hier2"<<endl;
  for(int i=0; i<nData; i++){
    bool inRange=((x[i]>startHistogram_at_u)&&(x[i]<endHistogram_at_u));
    if(inRange){
      if(type[i]=="bike"){
        y_bike[nbike]=y[i];
        nbike++;
      }
      else if(type[i]!="obstacle"){
        y_rest[nrest]=y[i];
        nrest++;
      }
    }
  }
  nbike--;
  nrest--;
  cout<<"nbike="<<nbike<<" nrest="<<nrest<<endl;

  if(false){
    for(int i=0; i<nrest; i++){
      cout<<"i="<<i<<" y_rest[i]="<<y_rest[i]<<endl;
    }
  }
  
  int nClass=int(min(100., sqrt(0.5*(nbike+nrest))));
  double hist_bikes[nClass];  // double: compatibility write_array
  double hist_rest[nClass];
  double yc[nClass];
  stat.calculate_histogram(y_bike, nbike, -0.5*roadWidth, roadWidth/nClass,
			   nClass, hist_bikes);
  stat.calculate_histogram(y_rest, nrest, -0.5*roadWidth, roadWidth/nClass,
			   nClass, hist_rest);

  if(false){// test; overrides stat.histogram
    double dy=roadWidth/nClass;
    for(int i=0; i<nrest; i++){
      int iy=int(nClass/2+round(y_rest[i]/dy));
      if((iy>=0)&&(iy<nClass)){
	hist_rest[iy]++;
      }
    }
  }

  if(false){// test the fucking zero accumulation!! HEUREKA: obstacles as TL!
    int nPlus=0; int nMinus=0; int nZero=0;
    double dy=0.06;
    for(int i=0; i<nrest; i++){
      if(fabs(y_rest[i])<=0.5*dy){nZero++;}
      else if((y_rest[i]>-1.5*dy)&&(y_rest[i]<-0.5*dy)){nMinus++;}
      else if((y_rest[i]<1.5*dy)&&(y_rest[i]>0.5*dy)){nPlus++;}
    }
    cout<<"nMinus="<<nMinus<<" nZero="<<nZero<<" nPlus="<<nPlus<<endl;
    //exit(0);
  }
  
  for(int ic=0; ic<nClass; ic++){
    yc[ic]=-0.5*roadWidth+(ic+0.5)*roadWidth/nClass;
    cout<<"y="<<yc[ic]<<" hist_bikes="<<hist_bikes[ic]
	<<" hist_rest="<<hist_rest[ic]
	<<endl;
  }


  
//#####################################################
// histogram file Output
//#####################################################

  char   fnameOut[MAXSTR];
  char   titleStr[MAXSTR];

  sprintf(fnameOut,"%s.hist",projectName);
  sprintf(titleStr,"%s","#generated by analyze\n#yc\t\tnBikes\t\tnRest");

  cout <<" writing to "<<fnameOut<<" ..."<<endl;
  inout.write_array(fnameOut, nClass, yc, hist_bikes, hist_rest, titleStr);
  //!!! change to vector based dedicted output

//#####################################################
// transformed trajectory output
//#####################################################

  double typeID[nData];
  for(int i=0; i<nData; i++){
    typeID[i]=type2typeID(type[i]);
  }
  
  sprintf(fnameOut,"%s.traj",projectName);
  sprintf(titleStr,"%s","#generated by analyze\n#types: 0=bike,1=car,2=truck,3=others\n#time\ttypeID\tx[m]\ty[m]");
  cout <<" writing to "<<fnameOut<<" ..."<<endl;
  inout.write_array(fnameOut, nData, times, typeID, x, y, titleStr);
  //!!! change to vector based dedicted output
  cout<<"\nanalyze finished ... \n\n";
  return(0);
}

// #########################################################







