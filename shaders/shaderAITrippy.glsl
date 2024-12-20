varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Base UV coordinates
    vec2 uv = vTextureCoord;

    // Color cycling effect
    vec3 colorCycle = vec3(
        sin(fTime * 2.0 + uv.x * 5.0) * 0.5 + 0.5,
        sin(fTime * 3.0 + uv.y * 5.0) * 0.5 + 0.5,
        sin(fTime * 4.0 + (uv.x + uv.y) * 5.0) * 0.5 + 0.5
    );

    // Wave distortions
    float wave = sin(uv.y * 10.0 + fTime * 2.0) * 0.05;
    uv.x += wave;
    wave = cos(uv.x * 10.0 + fTime * 2.0) * 0.05;
    uv.y += wave;

    // Spinning effect
    float angle = fTime;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    uv = (rotation * (uv - 0.5)) + 0.5;

    // Psychedelic patterns
    vec2 pattern = vec2(
        sin(fTime * 3.0 + uv.x * 10.0) * 0.1,
        cos(fTime * 2.0 + uv.y * 10.0) * 0.1
    );
    uv += pattern;

    // Sample the texture with all the distortions
    vec4 color = texture2D(uSampler, uv) * vec4(colorCycle, 1.0);

    // Blend the previous frame to add motion blur
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
