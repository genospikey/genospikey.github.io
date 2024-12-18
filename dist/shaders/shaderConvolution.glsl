varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uPrevFrame;
uniform float uScale;
uniform float uTheta;
uniform vec2 uTranslate;


void main(void)
{
    mat2 scale = mat2((1.0 - .35*vTextureCoord.x)*.1 + .9, 0.0, 
                     0.0, (1.0 - 1.0/10.0*vTextureCoord.y));

    vec2 translate = vec2(.025*vTextureCoord.x, 0.020);

    vec4 prev = texture2D(uPrevFrame,(vTextureCoord*scale)+translate);
    vec4 color = texture2D(uSampler, vTextureCoord);

    color.r = prev.r * .93;
    color.g = prev.g * .80;
    color.b = prev.b * .97;
    
    gl_FragColor = color;
}