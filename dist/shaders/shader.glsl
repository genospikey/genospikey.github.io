varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fDelta;
uniform sampler2D uPrevFrame;

void main(void)
{
    mat2 grow = mat2(0.98, 0.0, 
                     0.0, 0.98);

    vec2 tGrow = vec2(0.01, 0.020);
    vec2 tDown = vec2(0.01, 0.000);

    vec4 prevU = texture2D(uPrevFrame,(vTextureCoord*grow)+tGrow);
    vec4 prevD = texture2D(uPrevFrame,(vTextureCoord*grow)+tDown);
    vec4 color = texture2D(uSampler, vTextureCoord);

    color.r = prevU.r * .85 + prevD.r * .14;
    color.g = prevU.g * 0.0;
    color.b = prevU.b * .05 + prevD.b * .94;
    
    gl_FragColor = color;
}