varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Calculate wave effect
    float wave1 = sin(vTextureCoord.y * 20.0 + fTime * 2.0) * 0.02;
    float wave2 = cos(vTextureCoord.x * 25.0 + fTime * 1.5) * 0.02;
    vec2 uv = vec2(vTextureCoord.x + wave1, vTextureCoord.y + wave2);

    // Sample the texture with wave distortions
    vec4 color = texture2D(uSampler, uv);

    // Create shimmer effect
    float shimmer = sin(fTime * 10.0 + uv.x * 30.0) * 0.1;
    color.rgb += shimmer;

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
