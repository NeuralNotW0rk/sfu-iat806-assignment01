/**
 * Space folding operations for signed distance function (SDF) derivation of fractals
 * Based on my own c++ code: https://github.com/NeuralNotW0rk/LatentSpace/tree/main/Source/LatentSpace/Private/Fractal/Fold
 * I think this in turn was based on https://github.com/HackerPoet/PySpace/blob/master/pyspace/fold.py
 */

function boxFold(position, w, radius) {
    const positionTemp = position.copy()
	if (position.x < -radius.x) {
        position.x = -radius.x;
    } 
	if (position.x > radius.x) {
        position.x = radius.x;
    }
	if (position.y < -radius.y) {
        position.y = -radius.y;
    }
	if (position.y > radius.y) {
        position.y = radius.y;
    }
	if (position.z < -radius.z) {
        position.z = -radius.z;
    }
	if (position.z > radius.z) {
        position.z = radius.z;
    }
	position.mult(2.0);
	position.sub(positionTemp);
    return w;
}

function sphereFold(position, w, rMin, rMax) {
    let r2 = position.dot(position);
	position.mult(Math.max(rMax / Math.max(rMin, r2), 1.0));
    return w;
}

function scaleOriginFold(position, w, origin, scale) {
    position.mult(scale);
	position.add(origin);
    return w * scale;
}