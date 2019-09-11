const m4 = twgl.m4;

var AR = $('#c').width() / $('#c').height();

$(window).resize(function(){
    AR = $('#c').width() / $('#c').height();
});

var p_vertex_shader = `#version 300 es

in vec4 position;
in vec3 normal;
in vec4 instanceColor;
in mat4 instanceWorld;
in vec3 instanceVelocity;
in vec3 instanceCurvature;
in float instanceStartTime;
in float instanceLifetime;

uniform mat4 mvp;
uniform float time;

out float lifetime;
out vec4 rgb;

void main(){
  float instanceTime = time - instanceStartTime;
  vec4 instance_position = instanceWorld * position;
  vec3 velocityContribs = instanceTime*instanceVelocity + instanceCurvature/(0.7+instanceTime);
  //vec3 velocityContribs = instanceTime*instanceVelocity + sqrt(instanceTime)*instanceTime*instanceCurvature;
  vec4 world_position = instance_position + vec4(velocityContribs, 1.0);
  gl_Position = mvp * world_position;

  rgb = instanceColor;
  lifetime = instanceLifetime;
}
`;

var p_fragment_shader = `#version 300 es

precision mediump float;

in vec4 rgb;
in float lifetime;

layout (location = 0) out vec4 outColor;
layout (location = 1) out vec4 brightColor;

void main(){
  vec3 out_rgb = rgb.xyz;
  float alpha_dist = rgb.w;
  float out_a = lifetime < 0.5 ? alpha_dist * (lifetime/0.5) : alpha_dist;

  outColor = vec4(out_rgb, out_a);
}
`;


var o_vertex_shader = `#version 300 es
in vec3 aPos;
in vec2 aTexCoords;

out vec2 TexCoords;

void main()
{
    TexCoords = aTexCoords;
    gl_Position = vec4(aPos, 1.0);
}
`;

var o_fragment_shader = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D scene;
uniform sampler2D bloomBlur;
uniform float exposure;

void main()
{
    const float gamma = 2.2;
    vec3 hdrColor = texture(scene, TexCoords).rgb;
    vec3 bloomColor = texture(bloomBlur, TexCoords).rgb;
    hdrColor += bloomColor; // additive blending
    // tone mapping
    vec3 result = vec3(1.0) - exp(-hdrColor * exposure);
    // also gamma correct while we're at it
    result = pow(result, vec3(1.0 / gamma));
    FragColor = vec4(result, 1.0);
}
`;


function rand(min, max){
    if (max === undefined){
        max = min;
        min = 0;
    }
    return min + Math.random() * (max - min);
}

function create_particle(mat, color, velocity, curvature, lifetime,
    start_time, time){

    const r = 4;
    const len_cube = 0.55;

    m4.identity(mat);
    m4.translate(mat, [rand(-(r*AR), (r*AR)), rand(-r, r), rand(-r, r)], mat);
    m4.scale(mat, [len_cube, len_cube, len_cube], mat);
    m4.rotateY(mat, rand(0, Math.PI * 2), mat);
    m4.rotateX(mat, rand(0, Math.PI * 2), mat);
    m4.rotateZ(mat, rand(0, Math.PI * 2), mat);
    color[0] = 0.4;
    color[1] = 0.6;
    color[2] = 1.0;
    //color[0] = 0.7;
    //color[1] = 0.4;
    //color[2] = 0.1;
    color[3] = rand(1);
    velocity[0] = rand(-0.5, 0.5);
    velocity[1] = rand(-0.5, 0.5);
    velocity[2] = rand(-0.5, 0.5);
    curvature[0] = rand(-0.5, 0.5);
    curvature[1] = rand(-0.5, 0.5);
    curvature[2] = rand(-0.5, 0.5);
    lifetime[0] = rand(0.3, 3);
    start_time[0] = time;
}

function init_particles(numInstances){
    const p_instanceWorlds = new Float32Array(numInstances * 16);
    const p_instanceColors = new Float32Array(numInstances * 4);
    const p_instanceVelocities = new Float32Array(numInstances * 3);
    const p_instanceCurvatures = new Float32Array(numInstances * 3);
    const p_instanceLifetimes = new Float32Array(numInstances * 1);
    const p_instanceStartTimes = new Float32Array(numInstances * 1);
    for(let i = 0; i < numInstances; i++){
        const mat = new Float32Array(p_instanceWorlds.buffer, i * 16 * 4, 16);
        const color = new Float32Array(p_instanceColors.buffer, i * 4 * 4, 4);
        const velocity = new Float32Array(p_instanceVelocities.buffer, i * 3 * 4, 3);
        const curvature = new Float32Array(p_instanceCurvatures.buffer, i * 3 * 4, 3);
        const lifetime = new Float32Array(p_instanceLifetimes.buffer, i * 1 * 4, 1);
        const start_time = new Float32Array(p_instanceStartTimes.buffer, i * 1 * 4, 1);

        create_particle(mat, color, velocity, curvature, lifetime, start_time, 0);
    }

    const p_array = twgl.primitives.createSphereVertices(0.05, 4, 4);
    Object.assign(p_array, {
        instanceWorld: {
            numComponents: 16,
            data: p_instanceWorlds,
            divisor: 1
        },
        instanceColor: {
            numComponents: 4,
            data: p_instanceColors,
            divisor: 1
        },
        instanceVelocity: {
            numComponents: 3,
            data: p_instanceVelocities,
            divisor: 1
        },
        instanceCurvature: {
            numComponents: 3,
            data: p_instanceCurvatures,
            divisor: 1
        },
        instanceLifetime: {
            numComponents: 1,
            data: p_instanceLifetimes,
            divisor: 1
        },
        instanceStartTime: {
            numComponents: 1,
            data: p_instanceStartTimes,
            divisor: 1
        }

    });

    return p_array;
}

function update_particles(gl, time, p_array, p_bufferInfo){
    for(let i = 0; i < p_array.instanceLifetime.data.length; i++){
        const lifetime =
            new Float32Array(p_array.instanceLifetime.data.buffer, i * 1 * 4, 1);

        lifetime[0] -= 0.005;
        if(lifetime[0] < 0){
            const mat =
                new Float32Array(p_array.instanceWorld.data.buffer, i * 16 * 4, 16);
            const color =
                new Float32Array(p_array.instanceColor.data.buffer, i * 4 * 4, 4);
            const velocity =
                new Float32Array(p_array.instanceVelocity.data.buffer, i * 3 * 4, 3);
            const curvature = 
                new Float32Array(p_array.instanceCurvature.data.buffer, i * 3 * 4, 3);
            const start_time =
                new Float32Array(p_array.instanceStartTime.data.buffer, i * 1 * 4, 1);

            create_particle(mat, color, velocity, curvature, lifetime,
                start_time, time);

            twgl.setAttribInfoBufferFromArray(gl,
                p_bufferInfo.attribs.instanceWorld,
                p_array.instanceWorld);
            twgl.setAttribInfoBufferFromArray(gl,
                p_bufferInfo.attribs.instanceColor,
                p_array.instanceColor);
            twgl.setAttribInfoBufferFromArray(gl,
                p_bufferInfo.attribs.instanceVelocity,
                p_array.instanceVelocity);
            twgl.setAttribInfoBufferFromArray(gl,
                p_bufferInfo.attribs.instanceCurvature,
                p_array.instanceCurvature);
            twgl.setAttribInfoBufferFromArray(gl,
                p_bufferInfo.attribs.instanceStartTime,
                p_array.instanceStartTime);
            twgl.setAttribInfoBufferFromArray(gl,
                p_bufferInfo.attribs.instanceLifetime,
                p_array.instanceLifetime);
        }
    }
}

function calc_mvp(){
    let u_proj;
    {
        const left   = -1.0*AR;
        const right  = 1.0*AR;
        const top    = 1.0;
        const bottom = -1.0;
        const near   = -10.0;
        const far    = 10.0;
        u_proj = m4.ortho(left, right, bottom, top, near, far);
    }

    let u_view;
    {
        const eye    = [0, 0, -1]; // Eye is in front of the screen
        const target = [0, 0, 0];  // Look at origin
        const up     = [0, 1, 0];  // Up direction is pointed towards +y
        u_view = m4.lookAt(eye, target, up);
    }

    return m4.multiply(u_proj, u_view);
}

$(document).ready(function(){
    const gl = document.getElementById('c').getContext('webgl2', { });
    const numInstances = 200;

    twgl.addExtensionsToContext(gl);
    if (!gl.drawArraysInstanced || !gl.createVertexArray) {
        alert("need drawArraysInstanced and createVertexArray");
        return;
    }

    if(!gl)
        console.log('WebGL not supported');

    var p_program =
        twgl.createProgramInfo(gl, [p_vertex_shader, p_fragment_shader])
    //var b_program =
    //    twgl.createProgramInfo(gl, [b_vertex_shader, b_fragment_shader])
    var o_program =
        twgl.createProgramInfo(gl, [o_vertex_shader, o_fragment_shader])

    p_array = init_particles(numInstances);
    const p_bufferInfo = twgl.createBufferInfoFromArrays(gl, p_array);
    const p_vertexArrayInfo = twgl.createVertexArrayInfo(gl, p_program, p_bufferInfo);
    const fb_default = twgl.createFramebufferInfo(gl, [ {attach: gl.COLOR_ATTACHMENT0} ]);
    const fb_bloom = twgl.createFramebufferInfo(gl, [
        {attach: gl.COLOR_ATTACHMENT1}
    ]);
    twgl.bindFramebufferInfo(gl, null, 0);
    //twgl.bindFramebufferInfo(gl, fb_bloom, 1);


    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const uniforms = {};

    function render(time){
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        update_particles(gl, time, p_array, p_bufferInfo);

        uniforms.mvp = calc_mvp();
        uniforms.time = time;

        gl.useProgram(p_program.program);
        twgl.setBuffersAndAttributes(gl, p_program, p_vertexArrayInfo);
        twgl.setUniforms(p_program, uniforms);
        twgl.drawBufferInfo(gl, p_vertexArrayInfo, gl.TRIANGLE,
            p_vertexArrayInfo.numelements, 0, numInstances);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
});
