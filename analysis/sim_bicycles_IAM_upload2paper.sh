#!/bin/bash

target=$HOME/papers/2023_IntellAgentModel_TGF-TRL/data
for ext in gnu txt hist traj; do
    cp sim_bicycles_IAM*.$ext $target
done
cp ../figs/sim_bicycles_IAM*.eps $target/../figs
echo "copied all resources to"
echo "$target"
echo "and"
echo "$target/../figs"
echo "can also redo there the analysys and plots by calling"
echo ""
echo "~/versionedProjects/mixedTraffic/analysis/sim_bicycles_IAM.run <widthstr>"
echo ""
echo "In any case, must give the command fig2eps *.fig there"
