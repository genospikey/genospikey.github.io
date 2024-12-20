varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;


void main(void)
{
    const float PI = 3.141592653589793;
    const float RPM = 10.0;

    vec2 center = vec2(0.5, 0.5);
    float radius = 1.0;
    float angle = mod(fTime, PI * 2.0); // Rotate over time

    // Apply radial blur effect
    vec2 offset = vec2(cos(angle), sin(angle)) * fConvolutionFactor * radius;
    vec4 color = texture2D(uSampler, vTextureCoord + offset) * 0.2;
    color += texture2D(uSampler, vTextureCoord - offset) * 0.2;
    color += texture2D(uSampler, vTextureCoord) * 0.6;

    // Sample the previous frame texture
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);
    
    // Blend current frame with the previous frame
    color = mix(color, prevColor*.9, 0.1);

    gl_FragColor = color;
}
