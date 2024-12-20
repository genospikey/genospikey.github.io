varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;
uniform float fConvolutionFactor;

void main(void)
{
    // Calculate the perspective effect
    vec2 uv = vTextureCoord - 0.5; // Center the UV coordinates
    float perspective = 1.0 / (1.5 - uv.y); // Increase perspective effect
    uv *= perspective; // Apply perspective transformation
    uv += 0.5; // Re-center the UV coordinates

    // Animate the movement down the hallway
    uv.y += fTime * 0.005; // Adjust speed as needed

    // Add spinning effect
    float angle = sin(fTime * 0.1) * 3.14; // Spinning effect based on time
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    uv = (rotation * (uv - 0.5)) + 0.5;

    // Randomly change directions
    float directionChange = step(0.5, fract(sin(fTime * 3.0) * 43758.5453));
    uv.x += directionChange * 0.1;

    // Tile the texture to create the hallway effect
    uv = fract(uv);

    // Sample the texture
    vec4 color = texture2D(uSampler, uv);

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
