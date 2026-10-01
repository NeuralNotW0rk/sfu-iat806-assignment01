

function boxSDE(position, w, size, center) {
    position -= center;
    position = abs(position) - size;
    return (Math.min(Math.max(position.x, position.y, position.z), 0.0) + createVector(Math.max(position.x, 0), Math.max(position.y, 0), Math.max(position.z, 0)).mag()) / w;
}

function mandelboxSDE(origin, scale, iterations, size, center) {
    origin.div(scale);
    let position = origin.copy();
    let w = 1.0;
    let d = 1000000;
    const radius = createVector(1, 1, 1);
    const rMin = 0.5;
    const rMax = 1.0;
    const wScale = 2.0;
    for (let i = 0; i < iterations; i++) {
        boxFold(position, radius);
        sphereFold(position, rMin, rMax);
        w = scaleOriginFold(position, w, origin, wScale);
    }
    return boxSDE(position, w, size, center);
}