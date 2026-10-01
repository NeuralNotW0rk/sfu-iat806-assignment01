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
  shaderPrimitive = createShader(
    vertex, fragmentPrimitive
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

let fragmentCanvas = `
// GLSL
precision highp float;

void main() {
  // Blue color as RGB(0%, 0%, 100%)
  vec3 color = vec3(0.0, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`;

let fragmentPrimitive = `
// GLSL
precision highp float;

void main() {
  // Red color as RGB(100%, 0%, 0%)
  vec3 color = vec3(1.0, 0.0, 0.0);

  gl_FragColor = vec4(color, 1.0);
}
`;

function draw() {
  // Apply color shader in canvas
  filter(shaderCanvas);

  // Apply color shader in 3D primitive
  shader(shaderPrimitive);

  // Rotate 3D primitive
  const anim = millis() * 0.00025;
  rotateY(anim);

  box(120);
}