varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float time;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Create wave effect
    float wave = sin(vTextureCoord.y * 10.0 + time) * 0.05;
    vec2 uv = vec2(vTextureCoord.x + wave, vTextureCoord.y);

    // Sample the texture
    vec4 color = texture2D(uSampler, uv);

    // Sample the previous frame texture
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    prevColor *= 0.95; // Apply decay to the previous frame

    // Blend the current frame with the previous frame
    color = mix(color, prevColor, 0.1);

    gl_FragColor = color;
}
