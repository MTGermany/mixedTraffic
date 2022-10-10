
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

static const int NDATA_MAX=5000;// max. number of data points
static const int MAXSTR=500;// max. string length


//#####################################################
//#####################################################
int main(int argc, char* argv[]) {



  //###############################
  // Example cmd-line args
  // ##############################

  char   projectName[MAXSTR];
  if (argc!=2){
    cerr <<"\nUsage: templateMain <projName>\n";
    exit(-1);
  }
  else {
    sprintf(projectName, "%s",argv[1]);
 }


  // Parsing: e.g., atof(argv[1]) or atoi (argv[1]) 

 


   //###############################
  // Example invoking system commands
  // ##############################

  /*

      char cmd[200];
      sprintf(cmd,"rm -fv %s",filename);
      int i=system(cmd);
      if(i!=0) printf("TravelTime:: system command \"%s\" not successful!!!\n",cmd);


      sprintf(cmd,"test -r %s",fnameDataUp);
      if (system(cmd)){ // andersrum als man denkt !!
         cout<<" file "<<fnameDataUp<<" does not exist!"<<endl;
      }
      else{
        cout<<" file "<<fnameDataUp<<" exists!"<<endl;
      }
  
  */
  

  


//#####################################################
// input
//#####################################################

  char   fnameIn[MAXSTR];
  sprintf(fnameIn,"%s.inp",projectName);

  InOut inout;

  double data[NDATA_MAX];
  int nData;

    // t(s)   iveh    x(m)    v(m/s)          s(m)    a(m/s^2)

  inout.get_col(fnameIn, 1, nData, data);


  if(nData>=NDATA_MAX){
    cerr<<" templateMain.main: error: nData="<<nData<<" greater than "
	<<" NDATA_MAX="<<NDATA_MAX<<endl;
    exit(-1);
  }
  

//#####################################################
// Do some calculations
//#####################################################

  Statistics stat;


//#####################################################
// file Output
//#####################################################

  char   fnameOut[MAXSTR];
  char   titleStr[MAXSTR];

  sprintf(fnameOut,"%s.dat",projectName);
  sprintf(titleStr,"%s","#template title\n#col1\t\tcol2\t\tcol3");

  cout <<" writing to "<<fnameOut<<" ..."<<endl;
  inout.write_array(fnameOut, nData, data, data, data, titleStr);


  //###############################
  // Example random numbers (#include "RandomUtils.h" written by Arne
  // ##############################

  cout <<"\nrandom numbers: myRand() starts with fixed seed by default"<<endl;
  double rand= myRand()-0.5; // rand sim G(-1/2,1/2)
  cout <<"\nrandom number rand sim G(-1/2,1/2): rand="<<rand<<endl;
  rand= myRand()-0.5; // rand sim G(-1/2,1/2)
  cout <<"random number rand sim G(-1/2,1/2): rand="<<rand<<endl;

  // Random seed:
  // srand(seed); e.g., srand(42);
  // Arne's function setRandomSeed(); works only OUTSIDE of scripts;
  // otherwise, obviously the starting time of script used!

  //#####################################################

 cout<<"\ntemplateMain main call finished ... \n\n";
 return(0);
}

// #########################################################







