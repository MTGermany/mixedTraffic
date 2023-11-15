# Fully Twodimensional Mixed Traffic Simulation

Source code for the interactive Javascript simulation at
[www.mtreiber.de/mixedTraffic](http://www.mtreiber.de/mixedTraffic)

This simulation is intended to demonstrate fully two-dimensional but
directed traffic flow and to visually test 2d flow models. Further
information of what can be done with this simulation is provided in
[www.mtreiber.de/mixedTraffic/info.html](http://www.mtreiber.de/mixedTraffic/info.html),
here, I will concentrate on the implementation.


Presently,
I have implemented the "Mixed Traffic flow Model" (MTM) described in detail in
[Reference 1](https://doi.org/10.1016/j.physa.2018.05.086), also
available [here](https://arxiv.org/abs/1805.05076).

To my knowledge, this is the first fully operational 2d model
for traffic flow. Notice that, while similar from a formal;
mathematics point of view, the dynamics of the MTM is markedly different from 
that of the Social Force Model for pedestrians proposed by Dirk
Helbing and Peter Molnar. The reason is that, unlike the case for
pedestrians, high speeds and inertial effects and the high damage in
case of crashes lead to a fundamentally different driving behaviour
compared to walking. Partcularly, for forced single-file traffic
(narrow road),
it reverts to well-known car-following models such as the Intelligent
Driver Model, or variants thereof. 

## Running the Simulation

This simulation uses JavaScript together with html5.

The master html file index.html contains the canvas which contains the visual simulation and essentially covers the whole viewport
```html
<canvas id="canvas_mixed"...> ...  </canvas>
```
What to do with this canvas is specified in the _init()_ procedure of sim-straight.js which assocoates this canvas with a JavaScript object by the first command of the init procedure,

```
 canvas = document.getElementById("canvas_mixed");
```

At the end of the initialization, _init()_ starts the actual simulation thread by the command 

```
return setInterval(main_loop, 1000/fps);
```

The initial canvas dimensions are overridden depending on the actual browser's
viewport size by additional controls in _canvasresize.js_ implementing a responsive design.


## Programm Files and Structure

The javascript code is organized in a main file _sim-straight.js_
controlling the whole simulation, into pseudo objects in appropriately
named files, and into files providing helper functions as follows:


### road.js

represents a road network element (road link) and organizes the
vehicles on it. Contains an array of vehicles and methods to get the
neighboring vehicles for a given vehicle, to update all vehicles for
one time step, and to interact with the other vehicles and the road
boundaries.

In contrast to the js code at
[traffic-simulation.de](https://www.traffic-simulation.de),
the road of the mixed-traffic simulation is not intended to be part
(link) of a network, for reasons of simplicity. Furthermore, the road
surface is fully twodimensional instead of consisting of several
onedimensional lanes.

_road.js_ also provides methods to draw the road and the vehicles and obstacles
on it, and optionally vehicle IDs and the actual acceleration
vectors for each vehicle. These drawing methods depend on the road geometry functions
_axis\_x_ and _axis\_y_ defining the road axis in physical x-y
coordinates as a parametric function of the logical longitudinal
position u. This function is provided in the calling class _sim-straight.js_

### vehicle.js

each vehicle has _(i)_ properties such as length, width, and type, _(ii)_ dynamic variables such as the
longitudinal and lateral position _(u,v)_ in logical coordinates, the
velocity (speedLong, speedLat) and acceleration vectors, and _(iii_)
instances of the acceleration models/methods from _models.js_.

Notice that the vehicle type _obstacle_ plays a much more dominant
role compared to _traffic-simulation.de_ since it can be used to
arbitrarily vary the shape of the road boundaries, e.g., narrowings at
the left or right, walls crossing the road with a small passage
(corresponding to the "exit a room through a door" scenarios of
pedestrian simulations), and more. See
[www.mtreiber.de/mixedTraffic/info.html](http://www.mtreiber.de/mixedTraffic/info.html)
for more details.

### models.js

a collection of pseudo-classes for the underlying longitudinal
car-following models, presently, the IDM and the ACC model (see Ref[2]
for details) as well as the MTM (Ref [1]) generalizing the longitudinal models
to a fully twodimensional dynamics.

### gui.js

Callbacks for all the interactive elements (mouseover, sliders,
buttons) including a possibility to load own initial configurations in
form of external files. See
[www.mtreiber.de/mixedTraffic/info.html](http://www.mtreiber.de/mixedTraffic/info.html)
for more details.

### plotxy.js

Helper pseudo-class for drawing the insert boxplots and scatterplots
(speed-density and flow-density data).

### colormanip.js

Helper functions providing some speed and type-dependent color maps to draw the vehicles.

### arrow.js

Helper function for drawing the arrows representing the acceleration
vectors if the GUI element _Display Forces_ is on.


## Numerical Integration

Like the Social-Force Model, the MTM is a time-continuous
acceleration-based particle model, i.e., the formal dynamics is like
that of Newtonian particles of unit mass. Mathematically, we obtain
coupled ordinary differential equations (ODEs). While, generally, Runge-Kutta
of forth order (RK4) is used for approximatively numerically solving
such a system of ODEs, we use the ballistic update instead,
i.e., taking into consideration the accelerations for the positional update (second
order) but keeping the acceleration constant during this step
(first-order Euler update for the velocities). Although this ballistic update
method is first order as a whole, it turned out to be more efficient
than RK4 (and also than the simple Euler update scheme). The reason is
that the right-hand sides of the ODEs are generally not smooth
(sufficiently often differentiable with respect to the state variables) effectively reducing also RK4 to
first order. Details can be found in [Reference
5](https://arxiv.org/abs/1403.4881). 

The pseudo-code for the ballistic update over a fixed time interval _dt_ is as follows:

```
velocityVector(t+dt)=velocityVector(t)+accVector(t)*dt;
posVector(t+dt)=posVector(t)+velocityVector(t)*dt+1/2*accVector(t)*dt^2;

```

where _accVector(t)_ is calculated by the MTM.

Notice that we implement parallel update. One complete update step
 consists of (i) executing the user-driven callbacks, (ii)
 simultaneously updating _all_ 
 accelerations on a given road by the MTM, (iii) updating all velocities and
 positions by the ballistic method.

## Graphics

The drawing is essentially based on images:

* The background is just a _jpeg_ or _png_ image.

* Each road network element is composed of typically 50-100 small road segments. Each   road segment  (a small _png_ file) represents typically 10m-20m of the road length with all the lanes. By transforming this image (translation, rotation,scaling) and drawing it multiple times, realistically looking roads can be drawn.

* The vehicles are drawn first as b/w. images (again translated, rotated, and scaled accordingly) to which an (appropriately transformed) semi-transparent rectangle is added to display the color-coding of the speeds.


## References 

[1] Venkatesan Kanagaraj and Martin Treiber (2018),
Self-Driven Particle Model for Mixed Traffic and Other Disordered Flows
Physica A: Statistical Mechanics and its Applications 509, 1-11
[Paper link](https://doi.org/10.1016/j.physa.2018.05.086)
[arXiv e-print: 1805.05076](https://arxiv.org/abs/1805.05076)


[2] M. Treiber and A. Kesting (2013), [_Traffic Flow Dynamics, Data, Models and Simulation_](http://www.traffic-flow-dynamics.org). Springer. [Link](http://www.springer.com/physics/complexity/book/978-3-642-32459-8)

[3] M. Treiber, A. Hennecke, and D. Helbing (2000), _Congested traffic states
in empirical observations and microscopic simulations._ Physical
review E 62 1805-1824. [Paper link](http://journals.aps.org/pre/pdf/10.1103/PhysRevE.62.1805) [arXiv e-print](http://arxiv.org/abs/cond-mat/0002177)

[4] A. Kesting, M. Treiber, and D. Helbing (2010), _Enhanced intelligent driver model to access the impact of driving strategies on traffic capacity_. Philosophical Transactions of the Royal Society A, 4585-4605. [arXiv e-print](http://arxiv.org/abs/0912.3613)
    
[5] M. Treiber and V. Kanagaraj (2018),
Comparing Numerical Integration Schemes for Time-Continuous Car-Following Models
Physica A: Statistical Mechanics and its Applications 419C, 183-195
DOI 10.1016/j.physa.2014.09.061 (2015).
[arXiv e-print](http://arxiv.org/abs/1403.4881)
