let shaderCanvas;
let shaderPrimitive;

function setup() {
  createCanvas(300, 300, WEBGL);
  // Make the shader run faster 
  // reducing number of pixels 
  pixelDensity(1);

  // Custom shaders using GLSL
  shaderCanvas = createShader(
    vertex, fragmentCanvas
  );
}

let vertex = `
// GLSL
precision highp float;

attribute vec3 aPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

// Copied from an old shadertoy study of mine: https://www.shadertoy.com/view/tsdyWl
let fragmentCanvas = `

void sphereFold(inout vec3 z, inout float dz)
{
    float r=0.5;
    
    float fixedRadius2 = 2.0;
    float minRadius2 = 0.1;
    
	float r2 = dot(z,z);
	if (r<minRadius2) { 
		float temp = (fixedRadius2/minRadius2);
		z *= temp;
		dz*= temp;
	} else if (r2<fixedRadius2) { 
		float temp =(fixedRadius2/r2);
		z *= temp;
		dz*= temp;
	}
}

void boxFold(inout vec3 z, inout float dz)
{
    float foldingLimit = 1.0;
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float mandelBox(vec3 z)
{
    float scale = 2.0;
    scale += sin(iTime * 0.25) * 0.5;
    int iterations = 16;
    
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < iterations; n++)
    {
		boxFold(z,dr); 
		sphereFold(z,dr);
        z=scale*z + offset;
        dr = dr*abs(scale)+1.0;
	}
	float r = length(z);
	return r/abs(dr);
}


float getDist(vec3 p) {
    return mandelBox(p);
}

float rayMarch(vec3 ro, vec3 rd)
{
    int maxSteps = 100;
	float maxDist = 100.0;
    float surfDist = 0.01;
    
	float dO = 0.0;
    
    for(int i=0; i<maxSteps; i++)
    {
    	vec3 p = ro + rd*dO;
        float dS = getDist(p);
        dO += dS;
        if(dO>maxDist || dS<surfDist) break;
    }
    if( dO>maxDist ) dO = -1.0;
    return dO;
}

vec3 getNormal(vec3 p)
{
	float d = getDist(p);
    vec2 e = vec2(.01, 0);
    
    vec3 n = d - vec3(
    	getDist(p-e.xyy),
    	getDist(p-e.yxy),
    	getDist(p-e.yyx));
    
    return normalize(n);
}

float getLight(vec3 p)
{
	vec3 lightPos = vec3(0, 35, 0);
    lightPos.xz += vec2(sin(iTime), cos(iTime))*40.;
    vec3 l = normalize(lightPos-p);
    vec3 n = getNormal(p);
    
    float dif = clamp(dot(n, l), 0., 1.);
    float d = rayMarch(p+n*0.01*2., l);
    if(d<length(lightPos-p)) dif *= .1;
    return dif;
}

mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 xy = (fragCoord.xy - iResolution.xy/2.0) / max(iResolution.xy.x, iResolution.xy.y);
    vec3 col = vec3(0);
    
   	vec3 campos = vec3(35.0,10.0,35.0);
    vec3 camtar = vec3(0.0,0.0,0.0);
    
    //vec3 campos = vec3(-0.1,0.45,0.);
    //vec3 camtar = vec3(1.7, .2, -0.6);
    
    mat3 camMat = calcLookAtMatrix( campos, camtar, 0.0 );
    vec3 camdir = normalize( camMat * vec3(xy,1.0) );
    
    float dist = rayMarch(campos, camdir);
    float dif = 0.0;
    vec3 p = campos + camdir * dist;
    if( dist!=-1.0 ) dif = getLight(p);
    col = vec3(dif);
    
    fragColor = vec4(col,1.0);
}
`;

function draw() {
  // Apply color shader in canvas
  filter(shaderCanvas);
}