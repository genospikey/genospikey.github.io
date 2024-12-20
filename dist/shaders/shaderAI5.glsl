varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Create a moving wave effect
    float waveX = sin(vTextureCoord.y * 10.0 + fTime) * 0.1;
    float waveY = cos(vTextureCoord.x * 10.0 + fTime * 0.5) * 0.1;
    vec2 uv = vec2(vTextureCoord.x + waveX, vTextureCoord.y + waveY);

    // Sample the texture with wave distortions
    vec4 color = texture2D(uSampler, uv);

    // Add a color cycling effect
    float cycle = sin(fTime * 2.0) * 0.5 + 0.5;
    color.rgb = mix(color.rgb, vec3(cycle, 1.0 - cycle, sin(fTime)), 0.5);

    // Sample the previous frame texture
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    prevColor *= 0.9; // Apply decay to the previous frame

    // Blend the current frame with the previous frame
    color = mix(color, prevColor, 0.2);

    // Add a slight convolution effect for extra trippiness
    vec4 convColor = texture2D(uSampler, vTextureCoord + vec2(0.01, 0.01)) * 0.2 +
                     texture2D(uSampler, vTextureCoord - vec2(0.01, 0.01)) * 0.2 +
                     texture2D(uSampler, vTextureCoord + vec2(-0.01, 0.01)) * 0.2 +
                     texture2D(uSampler, vTextureCoord + vec2(0.01, -0.01)) * 0.2;
    color = mix(color, convColor, fConvolutionFactor);

    gl_FragColor = color;
}
