varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Calculate the kaleidoscope effect
    float angle = fTime * 0.5; // Adjust to control rotation speed
    float segments = 6.0; // Number of segments in the kaleidoscope
    float k = segments / 6.28;
    float s = sin(angle);
    float c = cos(angle);

    // Transform texture coordinates for the kaleidoscope effect
    vec2 uv = vTextureCoord * 2.0 - 1.0;
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
    uv *= mat2(k, 0.0, 0.0, k);

    // Sample the texture at the new coordinates
    vec4 color = texture2D(uSampler, fract(uv));

    // Sample the previous frame textures
    vec4 prevColorU = texture2D(uPrevFrame, vTextureCoord);
    vec4 prevColorD = texture2D(uPrevFrame, vec2(vTextureCoord.x + fConvolutionFactor, vTextureCoord.y));

    // Apply the convolution effect
    vec2 offset = vec2(fConvolutionFactor);
    vec4 convolution = texture2D(uPrevFrame, vTextureCoord + offset) + 
                       texture2D(uPrevFrame, vTextureCoord - offset) +
                       texture2D(uPrevFrame, vTextureCoord + vec2(offset.x, -offset.y)) + 
                       texture2D(uPrevFrame, vTextureCoord + vec2(-offset.x, offset.y));
    convolution *= 0.125; // Reduce blur contribution

    // Blend the current frame with previous frame and apply convolution
    color = convolution * 0.1 + prevColorU * 0.2 + color * 0.7;

    // Clamp the color to a maximum value to prevent whiteout
    color = min(color, vec4(1.0));

    gl_FragColor = color;
}
