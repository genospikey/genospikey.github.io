varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float fDelta;
uniform float fConvolutionFactor;
uniform sampler2D uPrevFrame;

void main(void)
{
    vec2 vLeftTextureCoord = vec2(vTextureCoord.x - fConvolutionFactor, vTextureCoord.y);
    vec2 vRightTextureCoord = vec2(vTextureCoord.x + fConvolutionFactor, vTextureCoord.y);

    vec2 vTopTextureCoord = vec2(vTextureCoord.x, vTextureCoord.y - fConvolutionFactor);
    vec2 vTopLeftTextureCoord = vec2(vTextureCoord.x - fConvolutionFactor, vTextureCoord.y - fConvolutionFactor);
    vec2 vTopRightTextureCoord = vec2(vTextureCoord.x + fConvolutionFactor, vTextureCoord.y - fConvolutionFactor);

    vec2 vBottomTextureCoord = vec2(vTextureCoord.x, vTextureCoord.y + fConvolutionFactor);
    vec2 vBottomLeftTextureCoord = vec2(vTextureCoord.x - fConvolutionFactor, vTextureCoord.y + fConvolutionFactor);
    vec2 vBottomRightTextureCoord = vec2(vTextureCoord.x + fConvolutionFactor, vTextureCoord.y + fConvolutionFactor);

    vec4 topLeft = texture2D(uPrevFrame,vTopLeftTextureCoord);
    vec4 topMid = texture2D(uPrevFrame,vTopTextureCoord);
    vec4 topRight = texture2D(uPrevFrame,vTopRightTextureCoord);

    vec4 midLeft = texture2D(uPrevFrame,vLeftTextureCoord);
    vec4 midRight = texture2D(uPrevFrame,vRightTextureCoord);

    vec4 botLeft = texture2D(uPrevFrame,vBottomLeftTextureCoord);
    vec4 botMid = texture2D(uPrevFrame,vBottomTextureCoord);
    vec4 botRight = texture2D(uPrevFrame,vBottomRightTextureCoord);

    vec4 convolution = 0.125 * topLeft + 0.125 * topMid + 0.125 * topRight + 0.125 * midLeft + 0.125 * midRight + 0.125 * botLeft + 0.125 * botMid + 0.125 * botRight;

    mat2 scale = mat2(0.98, 0.0, 
                     0.0, 0.98);
    
    float a = 0.05;
    float s = sin(a);
	float c = cos(a);
	mat2 rotate = mat2(c, -s, s, c);

    a = 0.07;
    s = sin(a);
	c = cos(a);
	mat2 rotate2 = mat2(c, -s, s, c);

    vec2 translate = vec2(0.04, -0.02);
    vec2 translate2 = vec2(0.052, -0.028);

    vec4 prevU = texture2D(uPrevFrame,(vTextureCoord*scale*rotate)+translate);
    
    vec4 prevD = texture2D(uPrevFrame,(vTextureCoord*scale*rotate2)+translate);

    vec4 color = texture2D(uSampler, vTextureCoord);

    color.r = convolution.r * .29 + prevU.r* .0;
    color.g = convolution.g * .99;
    color.b = prevU.b * .0 + prevD.b*.0;
    
    gl_FragColor = color;
}