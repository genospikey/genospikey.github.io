varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

// Function for fractal iterations
float fractal(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 z = uv;
    float i;
    for(i = 0.0; i < 20.0; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + uv;
        if(length(z) > 4.0) break;
    }
    return i / 20.0;
}

void main(void)
{
    vec2 uv = vTextureCoord;

    // Apply wave distortions based on the Milkdrop preset
    float wave = sin(uv.y * 20.0 + fTime * 3.0) * 0.1;
    uv.x += wave;

    // Fractal effect
    float fract = fractal(uv);
    
    // Color cycling effect
    vec3 colorCycle = vec3(
        sin(fTime * 2.0 + uv.x * 5.0) * 0.5 + 0.5,
        sin(fTime * 3.0 + uv.y * 5.0) * 0.5 + 0.5,
        sin(fTime * 4.0 + (uv.x + uv.y) * 5.0) * 0.5 + 0.5
    );

    // Sample the texture
    vec4 color = texture2D(uSampler, uv) * vec4(colorCycle, 1.0);

    // Apply the fractal effect
    color.rgb += fract * 0.5;

    // Sample the previous frame texture with motion blur
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    prevColor *= 0.8; // Apply decay to the previous frame
    color = mix(color, prevColor, 0.2);

    // Add a slight convolution effect for extra trippiness
    vec4 convColor = texture2D(uSampler, vTextureCoord + vec2(0.01, 0.01)) * 0.1 +
                     texture2D(uSampler, vTextureCoord - vec2(0.01, 0.01)) * 0.1 +
                     texture2D(uSampler, vTextureCoord + vec2(-0.01, 0.01)) * 0.1 +
                     texture2D(uSampler, vTextureCoord + vec2(0.01, -0.01)) * 0.1;
    color = mix(color, convColor, fConvolutionFactor * 0.5);

    gl_FragColor = color;
}
