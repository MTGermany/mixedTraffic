#!/bin/bash

#############################################
# (1) select and prepare targetdir
#############################################

startDir=$HOME/versionedProjects/mixedTraffic
targetDir="$HOME/public_html/professional/mixedTraffic_`date +20%y_%m_%d`"

echo "preparing target Directory $targetDir"
cd $startDir

if test -d $targetDir; 
  then echo "$targetDir already exists; removing old files..."
       rm -r $targetDir/*;
  else echo "creating $targetDir ...";
       mkdir $targetDir
fi
mkdir $targetDir/js
mkdir $targetDir/css
mkdir $targetDir/figs
mkdir $targetDir/IC-configurations

#############################################
# (2) upload files to targetdir and set permissions
#############################################

cp *.html $targetDir
cp js/*.js $targetDir/js
cp css/*.css $targetDir/css
cp figs/*.jpg figs/*.png figs/*.gif figs/*.ico $targetDir/figs
cp IC-configurations/IC*.txt $targetDir/IC-configurations



for dir in `find $targetDir -type d`; do chmod o+x $dir; done
for file in `find $targetDir -type f`; do chmod o+r $file; done

echo "made directory $targetDir ready for upload"

echo "hint: In the simplest case, just rm -r old dir, cp -r new to it and upload"
echo "rm -r $HOME/public_html/professional/mixedTraffic"
echo "cp -rp $targetDir $HOME/public_html/professional/mixedTraffic"
echo ""
echo "Test: call www.mtreiber.de/mixedTraffic/index.html"
echo "      !!!WARNING!!! chromium cache remembers elements in chromium"
echo "      =>\"chromium clear cache\""



