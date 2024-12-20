varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Calculate waterfall effect
    float waterfall = sin(vTextureCoord.y * 10.0 + fTime * 3.0) * 0.05;
    vec2 uv = vec2(vTextureCoord.x, vTextureCoord.y + waterfall);

    // Create a wave effect
    float wave = sin(uv.y * 20.0 + fTime * 2.0) * 0.02;
    uv.x += wave;

    // Sample the texture with waterfall and wave distortions
    vec4 color = texture2D(uSampler, uv);

    // Add color cycling effect
    vec3 colCycle = vec3(
        sin(fTime * 3.0 + uv.x * 5.0) * 0.2,
        sin(fTime * 2.0 + uv.y * 5.0) * 0.2,
        sin(fTime * 4.0 + (uv.x + uv.y) * 5.0) * 0.2
    );
    color.rgb += colCycle;

    // Sample the previous frame texture with less blending
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    prevColor *= 0.8; // Apply decay to the previous frame

    // Blend the current frame with the previous frame
    color = mix(color, prevColor, 0.3);

    // Add a slight convolution effect for extra trippiness
    vec4 convColor = texture2D(uSampler, vTextureCoord + vec2(0.01, 0.01)) * 0.15 +
                     texture2D(uSampler, vTextureCoord - vec2(0.01, 0.01)) * 0.15 +
                     texture2D(uSampler, vTextureCoord + vec2(-0.01, 0.01)) * 0.15 +
                     texture2D(uSampler, vTextureCoord + vec2(0.01, -0.01)) * 0.15;
    color = mix(color, convColor, fConvolutionFactor * 0.5);

    gl_FragColor = color;
}
