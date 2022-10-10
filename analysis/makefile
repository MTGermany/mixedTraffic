#
# makefile of general c++ projects
# source: ~/versionedProjects/lib/templates
# Achtung! Auch ohne .h File muss man bei $OBJECTS immer auch das 
# File mit der Main-Methode dazunehmen!
# 
# (jun10) 
# Example for small program with own classes: ../climbersFlightSimulator
#(dec10)
# On Notebook: Replace "~/trafficSim/" with "~/"

#compiler
CC=g++ -Wall -O3
 
#output:
OUTNAME=analyze

#include path for headers
# !!! ACHTUNG keine Comments hinter Befehle/Defs => obskurer Fehler!!

LIBDIR=~/versionedProjects/lib/trunk
BINDIR=~/bin

 
#objects/other programs for linking (all own classes to OBJECTS_MAIN)

OBJECTS_MAIN=${OUTNAME}.o
LIBOBJECTS=general.o InOut.o Statistics.o


###########################################################
# suffix regel: mache aus *.cpp ein *.o, und zwar fuer eingabedatei $<
.cpp.o:
	${CC} -I ${LIBDIR}  -c $<
.cc.o:
	${CC} -I ${LIBDIR}  -c $<

############################################################

#wenn man nur h-file veraendert, sollte make alles neu compilieren
#irgendwie muss das gehen!


#o-files werden in "." als target verzeichnis geschrieben!
#dann wird alles von hier gelinkt. sehr gut so 
#(weil InOut.o ja zu diesem build gehoert)
general.o: ${LIBDIR}/general.cpp
	${CC} -c ${LIBDIR}/general.cpp -o general.o

InOut.o: ${LIBDIR}/InOut.cpp
	${CC} -c ${LIBDIR}/InOut.cpp -o InOut.o

Statistics.o: ${LIBDIR}/Statistics.cpp
	${CC} -c ${LIBDIR}/Statistics.cpp -o Statistics.o

Math.o: ${LIBDIR}/Math.cpp
	${CC} -c ${LIBDIR}/Math.cpp -o Math.o

RandomUtils.o: ${LIBDIR}/RandomUtils.cpp
	${CC} -c ${LIBDIR}/RandomUtils.cpp -o RandomUtils.o

##########################################################


#target: abhaengigkeiten in Macro $(OBJECTS_MAIN) zusammengefasst 
#wichtig ist dass naechste befehlszeile mit TAB anfaengt:
${OUTNAME}: $(OBJECTS_MAIN)  $(LIBOBJECTS)
	${CC} -o ${BINDIR}/${OUTNAME} -O3 $(OBJECTS_MAIN) $(LIBOBJECTS) -lm

makedistr:  $(OBJECTS_DIST) 
	${CC} -o ${BINDIR}/makedistr -O3 $(OBJECTS_DIST) -lm 


#
# Misc.
#
clean:
	rm -v *.o


#-I directory
#Mit der -I-Compileroption kann man beim Übersetzen eines Programmes die Liste der Verzeichnisse erweitern, in denen nach einer Datei gesucht wird.
# gcc -Iinc hello.c
#sucht nach stdio.h zuerst als inc/stdio.h, und erst dann als /usr/include/stdio.h.


#The -I option or the INCLUDE_PATH variable described below should always be used to set the include path for header files.
