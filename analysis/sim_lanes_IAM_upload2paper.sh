#!/bin/bash

target=$HOME/papers/2023_IntellAgentModel_TGF-TRL/data
for ext in .gnu .txt _x300.fund _x300.fundEdie .hist .traj; do
    cp sim_lanes_IAM$ext $target
done
cp ../figs/sim_lanes_IAM* $target/../figs
echo "copied all resources to"
echo "$target"
echo "and"
echo "$target/../figs"
echo "can also redo there the analysys and plots by calling"
echo ""
echo "  analyze_mixedSim sim_lanes_IAM 10"
echo "  gnuplot sim_lanes_IAM.gnu"
echo "in any case, must give the command fig2eps *.fig there"
