
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
  cout<<"argc="<<argc<<endl;
  if ((argc<3)||(argc>5)){
    cerr <<"\nUsage: analyze_mixedSim <projName> <roadWidth_m> "
	 <<" [<startHistogram_at_u>]  [<endHistogram_at_u>]"<<endl;
    cerr<<"Default vals: startHistogram_at_u="<<startHistogram_at_u
	<<" endHistogram_at_u="<<endHistogram_at_u<<endl;
    cerr<<"Example: "<<endl
	<<"analyze_mixedSim mixedTraffOutput3_xt 10"<<endl;
    exit(-1);
  }

  sprintf(projectName,"%s",argv[1]);
  double roadWidth=atof(argv[2]);
  if(argc>=4){startHistogram_at_u=atof(argv[3]);}
  if(argc>=5){endHistogram_at_u=atof(argv[4]);}


 

  


//#####################################################
// input
//#####################################################

  char   fnameIn[MAXSTR+4];
  sprintf(fnameIn,"%s.txt",projectName);

  InOut inout;
  int nData=inout.getNumberOfDataLines(fnameIn);

  if(nData<10){
    cerr<<"nData="<<nData<<": Error: no or too little data"<<endl;
    exit(-1);
  }

 
  //vector<double> times; //!!!
  vector<double> times;
  vector<string> type;
  vector<double> x;
  vector<double> y;
  vector<double> vx;
  vector<double> vy;


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

  vector<double> y_bike;  // for all x, homogeneous road
  vector<double> y_rest;
  cout<<"Hier2: nData="<<nData<<"x.size()="<<x.size()<<endl;
  for(int i=0; i<nData; i++){
    if(false){cout<<"i="<<i<<endl;}
    bool inRange=((x[i]>startHistogram_at_u)&&(x[i]<endHistogram_at_u));
    if(inRange){
      if(type[i]=="bike"){
        y_bike.push_back(y[i]);
      }
      else if(type[i]!="obstacle"){
        y_rest.push_back(y[i]);
      }
    }
  }
  int nbike=y_bike.size();
  int nrest=y_rest.size();
  cout<<"nbike="<<y_bike.size()<<" nrest="<<y_rest.size()<<endl;

  
  int nClass=int(min(100., sqrt(0.5*(nbike+nrest))));
  double hist_bikes[nClass];  // double: compatibility write_array
  double hist_rest[nClass];
  double yc[nClass];
  stat.calculate_histogram(y_bike, -0.5*roadWidth, roadWidth/nClass,
			   nClass, hist_bikes);
  stat.calculate_histogram(y_rest, -0.5*roadWidth, roadWidth/nClass,
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

  char   fnameOut[MAXSTR+15];
  char   titleStr[MAXSTR];

  sprintf(fnameOut,"%s.hist",projectName);
  sprintf(titleStr,"%s","#generated by analyze_mixedSim\n#yc\t\tnBikes\t\tnRest");

  cout <<" writing to "<<fnameOut<<" ..."<<endl;
  inout.write_array(fnameOut, nClass, yc, hist_bikes, hist_rest, titleStr);
  //!!! change to vector based dedicted output

//#####################################################
// transformed trajectory output
//#####################################################

  vector<int> typeID;
  for(unsigned i=0; i<unsigned(type.size()); i++){
    typeID.push_back(type2typeID(type[i]));
  }
  
  sprintf(fnameOut,"%s.traj",projectName);
  sprintf(titleStr,"%s","#generated by analyze_mixedSim\n#types: 0=bike,1=car,2=truck,3=others\n#time\ttypeID\tx[m]\ty[m]");
  cout <<" writing to "<<fnameOut<<" ..."<<endl;

  ofstream outfile(fnameOut);
  outfile<<titleStr<<endl;

  for(unsigned i=0; i<unsigned(times.size()); i++){
      outfile<<setprecision(5)
	     <<times[i]<<"\t"
	     <<typeID[i]<<"\t"
	     <<x[i]<<"\t"
	     <<y[i]<<endl;
  }
  outfile<<endl;

  
  //#####################################################
  // write funddias (only Edie's definitions simple
  //#####################################################

  int x_det=300; //!!!
  
  double tmin=times[0];
  double tmax=times[nData-1];
  double dtAggr=10;
  double dxAggr=20;
  double dt=0;
  for(int i=1; (i<int(times.size())&&(dt<1e-10)); i++){
    dt=times[i]-times[i-1];
  }
  cout<<"tmin="<<tmin<<" tmax="<<tmax<<" dt="<<dt<<endl;
  
  int nAggr=int((tmax-tmin)/dtAggr+1);
  
  vector<double> xtot (nAggr,0); //for Edie
  vector<double> ttot (nAggr,0);
  vector<double> densEdie (nAggr,0); //for Edie
  vector<double> flowEdie (nAggr,0);

  for(int i=0; i<int(times.size()); i++){
    if((type[i]!="obstacle")
       && (x[i]>=x_det-0.5*dxAggr)&&(x[i]<x_det+0.5*dxAggr)){
      int iAggr=int((times[i]-tmin)/dtAggr);
      xtot[iAggr]+=vx[i]*dt;
      ttot[iAggr]+=dt;
    }
  }
  
   // calculate Edies' estimators  from the sums
    
  for(int iAggr=0; iAggr<nAggr; iAggr++){
    densEdie[iAggr]=ttot[iAggr]/(dxAggr*dtAggr)*1000;
    flowEdie[iAggr]=xtot[iAggr]/(dxAggr*dtAggr)*3600;
  }

  // write to file
  
  sprintf(fnameOut,"%s_x%i.fundEdie",projectName,x_det);
  sprintf(titleStr,"%s","#generated by analyze_mixedSim\n#time\tdensEdie[1/km]\tflowEdie[1/h]");
  cout <<" writing to "<<fnameOut<<" ..."<<endl;

  ofstream outfile2(fnameOut);
  outfile2<<titleStr<<endl;

  for(int iAggr=0; iAggr<nAggr; iAggr++){
      outfile2<<setprecision(5)
	      <<tmin+iAggr*dtAggr<<"\t"
	      <<densEdie[iAggr]<<"\t"
	      <<flowEdie[iAggr]<<endl;
  }
  outfile2<<endl;

  cout<<"startHistogram_at_u="<<startHistogram_at_u<<" endHistogram_at_u="<<endHistogram_at_u<<endl;
  
  cout<<"\nanalyze_mixedSim finished ... \n\n";
  return(0);
}

// #########################################################







