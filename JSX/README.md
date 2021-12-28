# This isn't as useful when done in Node

To make this into something that's far more accessible, it should be pure JSX and compatible with Extendscript. At that point, it could be added as a Gehenna util for ILST and automatically pre-loaded by brutalism.

I don't think this is too big of an issue, though I'm unable to use any fancy Array methods like `.filter` or `.map`. I should avoid extending prototypes in the case others use `for...of` loops on Arrays, though.

JSON > AIA should be easy, given that I have a pure JSON representation of the current `ActionSet`. AIA > JSON is likely going to be much more of a pain.
