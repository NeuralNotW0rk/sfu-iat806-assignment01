// Bounding (hyper)box dimensions
const width = 600;
const height = 600;

// Audio constants
const f_base = 200;
const f_min = 200;
const f_max = 800;

const sampleRate = Tone.context.sampleRate;
const duration = 0.04; // 40 milliseconds
const length = Math.floor(sampleRate * duration);

const channelData = new Float32Array(length);

let grainBuffer;
let limiter;

// Prepare audio context
function setupAudio() {
    // Force stereo output on Chrome
    Tone.context.destination.channelCount = 2;
    Tone.context.destination.channelCountMode = "explicit";
    Tone.context.destination.channelInterpretation = "speakers";

    // Pre-calculate grain sample
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const env = 0.5 * (1 - Math.cos((2 * Math.PI * i) / length)); // Hann envelope
        channelData[i] = Math.sin(2 * Math.PI * f_base * t) * env;
    }

    // Limiter to avoid clipping
    limiter = new Tone.Limiter(-3).toDestination();

    // Create buffer
    grainBuffer = Tone.ToneAudioBuffer.fromArray(channelData);
}

// Play a single audio grain
function playGrain(freq, gain = 0.5, pan = 0) {
    // Cancel if audio is not set up
    if (Tone.context.state !== "running" || !grainBuffer) return;

    // Create a buffer source 
    const source = new Tone.ToneBufferSource(grainBuffer);

    // Resample pitch relative to base
    source.playbackRate.value = Math.max(0.1, freq / f_base);

    const dynamicGain = new Tone.Gain(gain * (1 / Math.sqrt(n)));
    const panner = new Tone.Panner(constrain(pan, -1.0, 1.0));

    // Sound processing chain
    source.connect(dynamicGain);
    dynamicGain.connect(panner);
    panner.connect(limiter);

    // Cleanup hook
    source.onended = () => {
        source.dispose();
        dynamicGain.dispose();
        panner.dispose();
    };

    source.start();
}

// Ball param limits
const n_max = 1000;
const n_min = 1;
const r_max = 20;
const r_min = 10;

// Physical constants
const v_max = 20.0;
const v_min = 2.0;
const drag = 0.01; // Drag coefficient (0-1)
const elast = 0.9; // Collision elasticity (0-1)
const grav = 1.0; // Acceleration due to gravity (pixels per frame^2)

let balls = [];
let synth;
let n = 1;
let amp = 1.0;

class Ball {
    constructor(randomize = true) {
        // Radius
        this.r = r_min;

        // Spatial vectors
        this.pos = createVector(0.0, 0.0);
        this.vel = createVector(0.0, 0.0);

        // Color
        this.red = 0;
        this.blue = 0;
        this.green = 0;

        if (randomize) {
            // Random size
            // this.r = random(r_min, r_max);

            // Random position
            this.pos.x = random(this.r, width - this.r);
            this.pos.y = random(this.r, height - this.r);

            // Random color
            this.red = random(0, 255);
            this.blue = random(0, 255);
            this.green = random(0, 255);
        }
    }

    ping(ground = false) {
        let freq = f_base;
        if (!ground) {
            freq = (1 - this.pos.y / height) * f_max + f_min;
        }
        let pan = this.pos.x / width * 2 - 1;
        playGrain(freq, 1.0, pan);
    }

    update() {
        // Move
        this.pos.add(this.vel);

        // Gravity (deactivates when ball is roughly in contact with ground)
        if (this.pos.y < height - this.r * 1.2) {
            this.vel.y += grav;
        }

        // Drag
        this.vel.mult(1.0 - drag);
    }

    render() {
        noStroke();
        // Map z position to alpha channel
        fill(color(this.red, this.blue, this.green, 200));
        circle(this.pos.x, this.pos.y, this.r * 2);
    }
}

function staticCollision(ball) {
    // x bounds
    if (ball.pos.x >= width - ball.r) {
        ball.vel.x = -ball.vel.x * elast;
        ball.pos.x = width - ball.r;
        ball.ping();
    }
    if (ball.pos.x <= ball.r) {
        ball.vel.x = -ball.vel.x * elast;
        ball.pos.x = ball.r;
        ball.ping();
    }

    // y bound (no top edge)
    if (ball.pos.y >= height - ball.r) {
        // Clamp velocity to avoid infinite bouncing
        if (Math.abs(ball.vel.y) < v_min) {
            ball.vel.y = 0;
        } else {
            ball.ping(true);
        }
        ball.vel.y = -ball.vel.y * elast;
        ball.pos.y = height - ball.r;
    }
}

let bg = true; // Background toggle

function setup() {
    createCanvas(width, height);
    // Initialize balls
    for (let i = 0; i < n; i++) {
        balls.push(new Ball());
    }
    setupAudio()
}

function draw() {
    if (bg) {
        background(0);
    }
    for (let i = 0; i < n; i++) {
        balls[i].update();
        staticCollision(balls[i]);
        balls[i].render();
    }

    fill(255)
    text("balls: " + n, 50, 50)
}

const accel = 0.1; // Click acceleration factor
const v = 100; // Random variability of click location

function mousePressed() {
    Tone.start();
    for (let i = 0; i < n; i++) {
        // Move toward mouse
        balls[i].vel.x += (mouseX - balls[i].pos.x + random(-v, v)) * accel;
        balls[i].vel.y += (mouseY - balls[i].pos.y + random(-v, v)) * accel;
    }
}

function keyPressed() {
    // Toggle background (turn off to stack frames)
    if (key === 't') {
        bg = !bg;
    }
    // Add balls
    if (key === 'q' && n < n_max) {
        balls.push(new Ball());
        n++;
        amp = 1 / (n ** 0.5);
    }
    // Remove balls
    if (key === 'a' && n >= n_min + 1) {
        balls.pop();
        n--;
        amp = 1 / (n ** 0.5);
    }
}