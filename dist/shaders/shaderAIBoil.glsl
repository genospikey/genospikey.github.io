varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;
uniform float fBubbleIntensity; // New uniform for controlling bubble intensity

void main(void)
{
    // Base UV coordinates
    vec2 uv = vTextureCoord;

    // Modulate the time to avoid overflow and ensure smooth cycles
    float modTime = mod(fTime, 2.0 * 3.14159265358979323846); // fTime mod 2π for smooth animation

    // Bubbling effect using sine waves
    float wave1 = sin(uv.y * 30.0 + modTime * 2.0) * 0.03;
    float wave2 = cos(uv.x * 35.0 + modTime * 2.5) * 0.03;
    uv += vec2(wave1, wave2);

    // Smooth bubbling motion with more complexity
    float bubble = sin(modTime * 5.0 + uv.x * 15.0) * 0.02 * fBubbleIntensity;
    bubble += cos(modTime * 4.0 + uv.y * 12.0) * 0.02 * fBubbleIntensity;
    uv += vec2(bubble, bubble);

    // Color cycling effect for a trippy look
    vec3 colorCycle = vec3(
        sin(modTime * 2.0 + uv.x * 10.0) * 0.5 + 0.5,
        sin(modTime * 3.0 + uv.y * 10.0) * 0.5 + 0.5,
        sin(modTime * 4.0 + (uv.x + uv.y) * 5.0) * 0.5 + 0.5
    );

    // Sample the texture with bubbling distortions
    vec4 color = texture2D(uSampler, uv) * vec4(colorCycle, 1.0);

    // Sample the previous frame texture to add motion blur
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    prevColor *= 0.8; // Apply decay to the previous frame
    color = mix(color, prevColor, 0.2);

    // Add a slight convolution effect for extra smoothness
    vec4 convColor = texture2D(uSampler, vTextureCoord + vec2(0.01, 0.01)) * 0.1 +
                     texture2D(uSampler, vTextureCoord - vec2(0.01, 0.01)) * 0.1 +
                     texture2D(uSampler, vTextureCoord + vec2(-0.01, 0.01)) * 0.1 +
                     texture2D(uSampler, vTextureCoord + vec2(0.01, -0.01)) * 0.1;
    color = mix(color, convColor, fConvolutionFactor * 0.5);

    gl_FragColor = color;
}
