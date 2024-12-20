varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fTime;
uniform sampler2D uPrevFrame;

void main(void)
{
    // Calculate the scroll offset
    float scrollSpeed = 0.1; // Adjust to control scroll speed
    vec2 scrollOffset = vec2(fTime * scrollSpeed, 0.0);

    // Wrap the texture coordinates to keep the scrolling seamless
    vec2 uv = mod(vTextureCoord - scrollOffset, 1.0);

    // Sample the current texture
    vec4 currentColor = texture2D(uSampler, uv);

    // Sample the previous frame texture
    vec4 prevColor = texture2D(uPrevFrame, vTextureCoord);

    // Blend the current frame with the previous frame
    vec4 color = mix(currentColor, prevColor, 0.5);

    // Set the fragment color
    gl_FragColor = color;
}
