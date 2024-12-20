varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Calculate zoom factor
    float zoom = 1.0 - 0.1 * sin(fTime * 0.5);
    
    // Apply zoom effect
    vec2 uv = (vTextureCoord - 0.5) * zoom + 0.5;
    
    // Create a moving wave effect
    float wave = sin(uv.y * 20.0 + fTime * 2.0) * 0.02;
    uv = vec2(uv.x + wave, uv.y);

    // Create a swirling effect with less intensity
    float angle = fTime * 0.5;
    uv = vec2(
        cos(angle) * (uv.x - 0.5) - sin(angle) * (uv.y - 0.5) + 0.5,
        sin(angle) * (uv.x - 0.5) + cos(angle) * (uv.y - 0.5) + 0.5
    );

    // Sample the original texture
    vec4 color = texture2D(uSampler, uv);

    // Introduce a more subtle color cycling effect
    vec3 colCycle = vec3(
        sin(fTime * 3.0 + uv.x * 5.0) * 0.2,
        sin(fTime * 2.0 + uv.y * 5.0) * 0.2,
        sin(fTime * 4.0 + (uv.x + uv.y) * 5.0) * 0.2
    );
    color.rgb += colCycle;

    // Sample the previous frame texture with less blending
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    prevColor *= 0.8; // Apply decay to the previous frame

    // Blend the current frame with the previous frame, but keep more of the original texture
    color = mix(color, prevColor, 0.3);

    // Add a slight convolution effect for extra trippiness
    vec4 convColor = texture2D(uSampler, vTextureCoord + vec2(0.01, 0.01)) * 0.15 +
                     texture2D(uSampler, vTextureCoord - vec2(0.01, 0.01)) * 0.15 +
                     texture2D(uSampler, vTextureCoord + vec2(-0.01, 0.01)) * 0.15 +
                     texture2D(uSampler, vTextureCoord + vec2(0.01, -0.01)) * 0.15;
    color = mix(color, convColor, fConvolutionFactor * 0.5);

    gl_FragColor = color;
}
