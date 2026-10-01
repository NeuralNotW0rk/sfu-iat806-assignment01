let vertex = `
// GLSL
precision highp float;
attribute vec3 aPosition;

void main() {
  gl_Position = vec4(aPosition.xy, 0.0, 1.0);
}
`;

// Copied from an old shadertoy study of mine: https://www.shadertoy.com/view/tsdyWl
let fragmentCanvas = `
precision highp float;

uniform vec2 iResolution;

// Stuff for p5 orbitControl()
uniform vec3 uCamPos;

void sphereFold(inout vec3 z, inout float dz)
{
    float r = 0.5;
    
    float fixedRadius2 = 2.0;
    float minRadius2 = 0.1;
    
	float r2 = dot(z, z);
	if (r < minRadius2) { 
		float temp = (fixedRadius2 / minRadius2);
		z *= temp;
		dz *= temp;
	} else if (r2 < fixedRadius2) { 
		float temp =(fixedRadius2 / r2);
		z *= temp;
		dz *= temp;
	}
}

void boxFold(inout vec3 z, inout float dz)
{
    float foldingLimit = 1.0;
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float mandelbox(vec3 z)
{
    float scale = 2.0;
    const int iterations = 16;
    
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < iterations; n++)
    {
		boxFold(z, dr); 
		sphereFold(z, dr);
        z = scale * z + offset;
        dr = dr * abs(scale) + 1.0;
	}
	float r = length(z);
	return r / abs(dr);
}


float getDist(vec3 p) {
    return mandelbox(p);
}

vec2 rayMarch(vec3 ro, vec3 rd)
{
    const int maxSteps = 100;
	float maxDist = 100.0;
    float surfDist = 0.01;
    
	float dO = 0.0;
    float steps = 0.0;
    
    for(int i = 0; i < maxSteps; i++)
    {
    	vec3 p = ro + rd * dO;
        float dS = getDist(p);
        dO += dS;
        steps = float(i);
        if(dO > maxDist || dS < surfDist) break;
    }
    if (dO > maxDist) dO = -1.0;
    return vec2(dO, steps);
}

vec3 getNormal(vec3 p)
{
	float d = getDist(p);
    vec2 e = vec2(.01, 0);
    
    vec3 n = d - vec3(
    	getDist(p - e.xyy),
    	getDist(p - e.yxy),
    	getDist(p - e.yyx));
    
    return normalize(n);
}

float getLight(vec3 p)
{
	vec3 lightPos = vec3(0, 35, 0);
    vec3 l = normalize(lightPos - p);
    vec3 n = getNormal(p);
    
    float dif = clamp(dot(n, l), 0., 1.);
    float d = rayMarch(p + n * 0.01 * 2., l).x;
    if(d < length(lightPos - p)) dif *= .1;
    return dif;
}

mat3 calcLookAtMatrix(in vec3 ro, in vec3 ta)
{
    vec3 ww = normalize(ta - ro);
    vec3 upRef = vec3(0.0, 1.0, 0.0);
    vec3 uu = normalize(cross(upRef, ww));
    vec3 vv = normalize(cross(uu, ww));
    return mat3(uu, vv, ww);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    // Invert Y coordinate so orbit drag matches mouse direction naturally
    vec2 xy = (fragCoord - iResolution.xy * 0.5) / max(iResolution.x, iResolution.y);
    xy.y = -xy.y;
    
    // Patch in p5 camera
    vec3 campos = uCamPos;
    vec3 camtar = vec3(0.0, 0.0, 0.0);
    mat3 camMat = calcLookAtMatrix(campos, camtar);
    vec3 camdir = normalize(camMat * vec3(xy, 1.5));
    
    vec2 hit = rayMarch(campos, camdir);
    float dist = hit.x;
    float steps = hit.y;

    vec3 col = vec3(0.03, 0.03, 0.05);
    vec3 p = campos + camdir * dist;
    if (dist > 0.0) {
        vec3 p = campos + camdir * dist;
        float ao = clamp(1.0 - (steps / 100.0) * 1.6, 0.0, 1.0);
        col = vec3(ao);
    }
    gl_FragColor = vec4(col, 1.0);
}
`;

let shaderCanvas;
let cam;

function setup() {
    createCanvas(600, 600, WEBGL);
    pixelDensity(1);

    // Custom shaders using GLSL
    shaderCanvas = createShader(vertex, fragmentCanvas);

    // Initialize camera object
    cam = createCamera();
    cam.setPosition(35, 15, 35);
    cam.lookAt(0, 0, 0);
}

function draw() {
    clear();

    // Set up native p5 camera control
    orbitControl();
    let camPos = [cam.eyeX, cam.eyeY, cam.eyeZ];

    // Pass uniform variables
    shader(shaderCanvas);
    shaderCanvas.setUniform('uCamPos', camPos);
    shaderCanvas.setUniform('iResolution', [width, height]);

    quad(-1, -1, 1, -1, 1, 1, -1, 1);
}