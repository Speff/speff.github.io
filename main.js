var vertexShaderSource = `#version 300 es

in vec4 instanceColor;
in mat4 instanceWorld;
in vec4 position;
in vec3 instanceVelocity;
in float instanceStartTime;
in float instanceLifetime;

uniform mat4 mvp;
uniform float time;

out float lifetime;
out vec4 rgb;

void main(){
  float instance_time = time - instanceStartTime;
  vec4 instance_init_position = instanceWorld * position;
  vec4 world_v = instance_init_position + vec4(instance_time * instanceVelocity, 1.0);
  gl_Position = mvp * world_v;

  rgb = instanceColor;
  lifetime = instanceLifetime;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

in vec4 rgb;
in float lifetime;
out vec4 outColor;

void main(){
  vec3 out_rgb = rgb.xyz;
  float out_a = lifetime < 0.5 ? rgb.w * (lifetime/0.5) : rgb.w;
  outColor = vec4(out_rgb, out_a);
}
`;


function rand(min, max){
    if (max === undefined){
        max = min;
        min = 0;
    }
    return min + Math.random() * (max - min);
}



$(document).ready(function(){
    console.log('Started demo');
    const m4 = twgl.m4;
    const gl = document.getElementById('c').getContext('webgl2', { });

    twgl.addExtensionsToContext(gl);
    if (!gl.drawArraysInstanced || !gl.createVertexArray) {
        alert("need drawArraysInstanced and createVertexArray"); // eslint-disable-line
        return;
    }

    if(!gl)
        console.log('WebGL not supported');

    var programInfo =
        twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource])

    var AR = $('#c').width() / $('#c').height();

    $(window).resize(function(){
        AR = $('#c').width() / $('#c').height();
    });

    const numInstances = 100;
    const instanceWorlds = new Float32Array(numInstances * 16);
    const instanceColors = new Float32Array(numInstances * 4);
    const instanceVelocities = new Float32Array(numInstances * 4);
    const instanceLifetimes = new Float32Array(numInstances * 1);
    const instanceStartTimes = new Float32Array(numInstances * 1);

    for (let i = 0; i < numInstances; i++) {
        const r = 2;
        const len_cube = 0.05;

        const mat = new Float32Array(instanceWorlds.buffer, i * 16 * 4, 16);
        const color = new Float32Array(instanceColors.buffer, i * 4 * 4, 4);
        const velocity = new Float32Array(instanceVelocities.buffer, i * 3 * 4, 3);
        const lifetime = new Float32Array(instanceLifetimes.buffer, i * 1 * 4, 1);
        const start_time = new Float32Array(instanceStartTimes.buffer, i * 1 * 4, 1);

        m4.identity(mat);
        m4.translate(mat, [rand(-(r*AR), (r*AR)), rand(-r, r), rand(-r, r)], mat);
        m4.scale(mat, [len_cube, len_cube, len_cube], mat);
        m4.rotateY(mat, rand(0, Math.PI * 2), mat);
        m4.rotateX(mat, rand(0, Math.PI * 2), mat);
        m4.rotateZ(mat, rand(0, Math.PI * 2), mat);
        color[0] = 0.2;
        color[1] = 0.4;
        color[2] = 1.0;
        color[3] = rand(1);
        velocity[0] = rand(-0.5, 0.5);
        velocity[1] = rand(-0.5, 0.5);
        velocity[2] = rand(-0.5, 0.5);
        lifetime[0] = rand(0.3, 3);
        start_time[0] = 0.0;
    }
    
    //const arrays = twgl.primitives.createCubeVertices();
    const arrays = twgl.primitives.createSphereVertices(0.5, 10, 10);
    Object.assign(arrays, {
        instanceWorld: {
            numComponents: 16,
            data: instanceWorlds,
            divisor: 1
        },
        instanceColor: {
            numComponents: 4,
            data: instanceColors,
            divisor: 1
        },
        instanceVelocity: {
            numComponents: 3,
            data: instanceVelocities,
            divisor: 1
        },
        instanceLifetime: {
            numComponents: 1,
            data: instanceLifetimes,
            divisor: 1
        },
        instanceStartTime: {
            numComponents: 1,
            data: instanceStartTimes,
            divisor: 1
        }

    });

    console.log(arrays);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vertexArrayInfo = twgl.createVertexArrayInfo(gl, programInfo, bufferInfo);


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

        var changed = false;
        for(var i = 0; i < arrays.instanceLifetime.data.length; i++){
            const lifetime = new Float32Array(arrays.instanceLifetime.data.buffer, i * 1 * 4, 1);

            lifetime[0] -= 0.005;
            if(lifetime[0] < 0){
                changed = true;
                const r = 2;
                const len_cube = 0.05;

                const mat = new Float32Array(arrays.instanceWorld.data.buffer, i * 16 * 4, 16);
                const color = new Float32Array(arrays.instanceColor.data.buffer, i * 4 * 4, 4);
                const velocity = new Float32Array(arrays.instanceVelocity.data.buffer, i * 3 * 4, 3);
                const start_time = new Float32Array(arrays.instanceStartTime.data.buffer, i * 1 * 4, 1);

                m4.identity(mat);
                m4.translate(mat, [rand(-(r*AR), (r*AR)), rand(-r, r), rand(-r, r)], mat);
                m4.scale(mat, [len_cube, len_cube, len_cube], mat);
                m4.rotateY(mat, rand(0, Math.PI * 2), mat);
                m4.rotateX(mat, rand(0, Math.PI * 2), mat);
                m4.rotateZ(mat, rand(0, Math.PI * 2), mat);
                color[0] = 0.2;
                color[1] = 0.4;
                color[2] = 1.0;
                color[3] = rand(1);
                velocity[0] = rand(-0.5, 0.5);
                velocity[1] = rand(-0.5, 0.5);
                velocity[2] = rand(-0.5, 0.5);
                lifetime[0] = rand(0.3, 3);
                start_time[0] = time;
            }
        }
        if(changed){
            twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.instanceWorld, arrays.instanceWorld);
            twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.instanceColor, arrays.instanceColor);
            twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.instanceVelocity, arrays.instanceVelocity);
            twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.instanceStartTime, arrays.instanceStartTime);
            twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.instanceLifetime, arrays.instanceLifetime);
        }

        uniforms.mvp = calc_mvp();
        uniforms.time = time;

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, vertexArrayInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, vertexArrayInfo, gl.TRIANGLES, vertexArrayInfo.numelements, 0, numInstances);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
});
