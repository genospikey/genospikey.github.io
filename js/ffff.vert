<script type="shader" id="seascape">
/*
"Seascape" by Alexander Alekseev aka TDM - 2014
License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Contact: tdmaav@gmail.com
*/

const int NUM_STEPS = 8;
const float PI	 	= 3.1415;
const float EPSILON	= 1e-3;
float EPSILON_NRM	= 0.1 / iResolution.x;

// sea
const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.1,0.19,0.22);
const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6);
float SEA_TIME = 1.0 + iGlobalTime * SEA_SPEED;
mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}
float hash( vec2 p ) {
	float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
}
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// lighting
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}
float specular(vec3 n,vec3 l,vec3 e,float s) {    
    float nrm = (s + 8.0) / (3.1415 * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = max(e.y,0.0);
    vec3 ret;
    ret.x = pow(1.0-e.y,2.0);
    ret.y = 1.0-e.y;
    ret.z = 0.6+(1.0-e.y)*0.4;
    return ret;
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_GEOMETRY; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
    fresnel = pow(fresnel,3.0) * 0.65;
        
    vec3 reflected = getSkyColor(reflect(eye,n));    
    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12; 
    
    vec3 color = mix(refracted,reflected,fresnel);
    
    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;
    
    color += vec3(specular(n,l,eye,60.0));
    
    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);    
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
    float tm = 0.0;
    float tx = 1000.0;    
    float hx = map(ori + dir * tx);
    if(hx > 0.0) return tx;   
    float hm = map(ori + dir * tm);    
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm,tx, hm/(hm-hx));                   
        p = ori + dir * tmid;                   
    	float hmid = map(p);
		if(hmid < 0.0) {
        	tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

// main
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;    
    float time = iGlobalTime * 0.3 + iMouse.x*0.01;
        
    // ray
    vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);    
    vec3 ori = vec3(0.0,3.5,time*5.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); dir.z += length(uv) * 0.15;
    dir = normalize(dir) * fromEuler(ang);
    
    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8)); 
             
    // color
    vec3 color = mix(
        getSkyColor(dir),
        getSeaColor(p,n,light,dir,dist),
    	pow(smoothstep(0.0,-0.05,dir.y),0.3));
        
    // post
	fragColor = vec4(pow(color,vec3(0.75)), 1.0);
}
</script>

<!-- https://www.shadertoy.com/view/MtdSWS -->
<script type="shader" id="industrialcomplex">
	/*

	Industrial Complex
	------------------

	Using standard distance field operations to produce an industrial-looking 
	architectual entity - albeit a pretty abstract one. It'd probably take a while 
	to walk from one end to the other. :)

	The camera swings around a fair bit. I did that intentionally to show more of 
	the scene without distorting the lens and FOV too much.

	Adding detail to a scene is pretty straight forward - in concept anyway. Simply
	integrate more objects. Trying to add detail without frying your GPU is another
	story. Bump mapping the finer details definitely helped, but my slowest computer
	struggled to maintain 45 FPS with this particular scene, which meant a lot of my
	original plans had to be abandoned.

	Most of this was pretty straight forward, but there's always one annoying aspect.
	For me, believe it or not, it was the simple mesh looking floors. With such high
	frequency repetition, Moire effects became a problem. The solution was to abandon
	the distance field approach and fake it with a smooth bump mapped function.

	I try not to put too many conditional compiler options into shader code because
	it can make things confusing to read, but I added in a couple for variety. 
	There's an option to wrap the object around the camera, and an optional "WARM" 
	aesthetic by default.


*/

// Maximum ray distance.
#define FAR 50. 

// Wrap the scene itself around the camera path.
//#define OBJECT_CAMERA_WRAP 

// Warm setting. Commenting it out gives it more of a twilight feel, which I prefer, but
// fiery stuff tends to stand out more, so that's the default. :)
#define WARM 
 

// Comment this out to omit the detailing. Basically, the function-based bump mapping 
// won't be included. The texture-based bump mapping will remain though.
#define SHOW_DETAILS


// 2D rotation. Always handy. Angle vector, courtesy of Fabrice.
mat2 rot( float th ){ vec2 a = sin(vec2(1.5707963, 0) + th); return mat2(a, -a.y, a.x); }


// Camera path. Arranged to coincide with the frequency of the lattice.
vec3 camPath(float t){
  
    //return vec3(4, 0, t); // Straight path.
    
    // Curvy path. Weaving around the columns.
    float a = sin(t * 3.14159265/32. + 1.5707963*1.);
    float b = cos(t * 3.14159265/32.);
    
    return vec3(a*5., b*a, t);    
}


float objID; // Structure object ID.
float bObjID; // Bump map detail ID.



// Regular Menger Sponge formula. Very simple, but if you're not sure, look it
// up on Wikipedia, and look up a Void Cube image.
float Menger(vec3 q){
    
    objID = 0.;
    bObjID = 0.;
    
    vec3 p;
	// Scale factor, and distance.
    float s = 16., d = 0., d1;
 
    // Repeat space.
    p = abs(fract(q/s)*s - s/2.); // Equivalent to: p = abs(mod(q, s) - s/2.);
    // Repeat Void Cubes. Cubes with a cross taken out.
    d1 = min(max(p.x, p.y), min(max(p.y, p.z), max(p.x, p.z))) - s/3. + 1.;
    d = max(d, d1);
    s /= 4.; // Divide space (each dimension) by 4.


    p = abs(fract(q/s)*s - s/2.); // Equivalent to: p = abs(mod(q, s) - s/2.);
    // Repeat Void Cubes. Cubes with a cross taken out.

    d1 = min(max(p.x, p.y), min(max(p.y, p.z), max(p.x, p.z))) - s/3.;
    d = max(d, d1);
    s /= 3.; // Divide space (each dimension) by 3.

    p = abs(fract(q/s)*s - s/2.); // Equivalent to: p = abs(mod(q, s) - s/2.);
    // Repeat Void Cubes. Cubes with a cross taken out.
    d1 = min(max(p.x, p.y), min(max(p.y, p.z), max(p.x, p.z))) - s/3.;
    bObjID = step(d, d1);
    d = max(d, d1);
 
 
 	return d;    
}



// The distance field is a little messier than usual - mainly because it includes more objects, 
// but at it's core, it's just a simple amalgation of repetive objects placed in the scene with 
// repeat space tricks.
//
// In essence, it's a lattice with a floor and railings thrown in, and a bit of space taken out.
// I put it together in a hurry, so could have planned it a bit better. I wanted it to be at least 
// a little readable, so didn't group as much stuff together as I could have. Either way, I'll 
// take a look at it later and tidy things up a bit.
float lattice(vec3 p){
 
    // Repeat space.
    vec3 q = abs(mod(p, vec3(32, 16, 32)) - vec3(16, 8, 16));
    vec3 q2 = abs(mod(p - vec3(4, 0, 0), vec3(32, 2, 16)) - vec3(16, 1, 8));
    
    // Holes. I've called them holes, but they're more like square columns used to negate objects.
    float hole1 = max(q2.x - 7.65, q.z - 8.); // Used to carve a hole beside the railings.
    float hole2 = max(-p.y - .75, q.z - 4.85); // Used to chop the top off of the bridge railings.
    float hole3 = abs(mod(p.z + 16., 32.) - 16.) - 2.85; // Used to form the floor to ceiling partitions.
    
    
    // Floor minus hole (repeat square columns) equals bridge. :) 
    float fl = max(p.y + 3.5, -hole1);  
    
    // The wall panels with rectangular windows.
    float wall = max(q2.x - 8., q2.z - 2.15);
    wall = max(wall, -max(abs(abs(q2.x - 8.) - 4.) - 1.75, abs(q.y - 8.) - .5)); // Wall with window.
    
    // This is a neat trick to subdivide space up further without the need for another
    // modulo call... in a manner of speaking.
    q2.x = abs(q2.x - 8.);
    float rail = max(q2.x - .15, q2.y - .15);
    float rail2 = max(q2.x - .15/6., abs(mod(q2.y + 1./6., 1./3.) - 1./6.) - .15/6.);
    rail = min(rail, max(rail2, -p.y - 3.));
    // Optional bottom rail with no gap. Comment out the line above though.
    //rail = min(min(rail, rail2), max(q2.x - .15, abs(p.y + 3.75) - .6));
    
    // Posts.
    float posts = max(q2.x - .15, abs(mod(q2.z, 2.) - 1.) - .15);
    
    // Forming the railings. Comment out the 2nd and 3rd lines if you want to see what they're there for.
    rail = min(rail, posts);
    rail = max(rail, -hole2);    
    rail = max(rail, -hole3);
    
  
    // Subdividing space down again without using the modulo call. For all I know, I've made things
    // slower. :)
    q.xz = abs(q.xz - vec2(8));
    q.x = abs(q.x - 4.);


    // Pylons and round pylons.
    float pylon = min( max(max(q.x, q.y) - 3., -p.y) , min(max(q.y, q.z)*.55 + length(q.yz)*.45 - 3.1, max(q.x, q.z)) - 2.);
    float rndPylon = length(vec2(q.xz)*vec2(.7, .4)) - 1.;
    
    // Breaking space right down to 2x2x2 cubic segments.
    q = abs(mod(q,  2.) - 1.);
    float pylonHole = min(q.x, min(q.y, q.z)); // Used to take cubic chunks out of the pylons.

    
    //objID = step(pylonHole - .15, pylon);
    

    // Forming the structure.
    float structure = min(max(pylon, pylonHole) - .15, min(rndPylon, wall)); 
    
    // Adding the floor and the railings to the structure.
    return min(structure, min(fl, rail));
 
    
}



// For all intents and purposes, this is a twisty lattice smoothly bounded by a square 
// tube on the outside. I have a million different shaders based on this concept alone, 
// but I won't bore you with them. Instead, Dila and Aiekick have some pretty good examples 
// on Shadertoy making use of it that are worth looking at.
float map(vec3 p){
    
    objID = 0.;
    
    #ifdef OBJECT_CAMERA_WRAP
    // Wrap the scene around the path. Optional. See the bump mapping function also.    
    p.xy -= camPath(p.z).xy;
    #else   
    p.x += 4.;
    #endif
    
    float d = lattice(p);

     
    return d*.95;//*.7;
}



// Raymarching.
float trace(vec3 ro, vec3 rd){

    float t = 0., d;
    for (int i=0; i<80; i++){

        d = map(ro + rd*t);
        if(abs(d)<.001*(t*.125 + 1.) || t>FAR) break;
        t += d;
    }
    return min(t, FAR);
}

// Tri-Planar blending function. Based on an old Nvidia writeup:
// GPU Gems 3 - Ryan Geiss: http://http.developer.nvidia.com/GPUGems3/gpugems3_ch01.html
vec3 tex3D(sampler2D channel, vec3 p, vec3 n){
    

    
    n = max(abs(n) - .2, 0.001);
    n /= dot(n, vec3(1));
	vec3 tx = texture2D(channel, p.zy).xyz;
    vec3 ty = texture2D(channel, p.xz).xyz;
    vec3 tz = texture2D(channel, p.xy).xyz;
    
    // Textures are stored in sRGB (I think), so you have to convert them to linear space 
    // (squaring is a rough approximation) prior to working with them... or something like that. :)
    // Once the final color value is gamma corrected, you see should correct looking colors.
    return tx*tx*n.x + ty*ty*n.y + tz*tz*n.z;
}


// Texture bump mapping. Four tri-planar lookups, or 12 texture lookups in total.
vec3 doBumpMap( sampler2D tx, in vec3 p, in vec3 n, float bf){
   
    const vec2 e = vec2(0.001, 0);
    
    // Three gradient vectors rolled into a matrix, constructed with offset greyscale texture values.    
    mat3 m = mat3( tex3D(tx, p - e.xyy, n), tex3D(tx, p - e.yxy, n), tex3D(tx, p - e.yyx, n));
    
    vec3 g = vec3(0.299, 0.587, 0.114)*m; // Converting to greyscale.
    g = (g - dot(tex3D(tx,  p , n), vec3(0.299, 0.587, 0.114)) )/e.x; g -= n*dot(n, g);
                      
    return normalize( n + g*bf ); // Bumped normal. "bf" - bump factor.
	
}

// Smooth tiles. There are better ways, but it works.
float tiles(vec2 p){
     
    p = abs(fract(p*4.) - .5)*2.;
    float s = max(p.x, p.y);
    return smoothstep(0., .6, s);//smoothstep(0.1, 1., s*2. - .35);//


    /*
    // Fancier grid pattern, but I decided to implement the "less is more" principle. :)
    vec2 q = abs(fract(p*1.) - .5)*2.;
    float s = max(q.x, q.y);
    s = smoothstep(0.5, .85, s);
    
    q = abs(fract(p*4. + .5) - .5)*2.;
    float s2 = max(q.x, q.y);
    s2 = smoothstep(0., 1., s2);
    
    return max(s, s2);
    */

}


// The bump mapping function.
float bumpFunction(in vec3 p){
    
    // If wrapping the scene around the the camera path, the bump has to match.
    #ifdef OBJECT_CAMERA_WRAP
    p.xy -= camPath(p.z).xy;
    #endif
    
    // A reproduction of the lattice at higher frequency. Obviously, you could put
    // anything here. Noise, Voronoi, other geometrical formulas, etc.
    float c;
    if(p.y>-3.49 || p.y<-3.51) c = min(abs(Menger(p*4.))*1.6, 1.);
    else { 
        
        // Another floor pattern. It didn't really work here.
        //c = 1.-(Menger(p*8. + vec3(0, 0., 0))*1.6) + .7;      
        //c = smoothstep(.1, 1., c);
        
        // Simple grid setup for the floor.
        c = tiles(p.xz + vec2(0));
        
        bObjID = 0.;
    }
    
    return c;   
   
}

// Standard function-based bump mapping function with some edging thrown into the mix.
vec3 doBumpMap(in vec3 p, in vec3 n, float bumpfactor, inout float edge){
    
    // Resolution independent sample distance... Basically, I want the lines to be about
    // the same pixel with, regardless of resolution... Coding is annoying sometimes. :)
    vec2 e = vec2(2./iResolution.y, 0); 
    
    float f = bumpFunction(p); // Hit point function sample.
    
    float fx = bumpFunction(p - e.xyy); // Nearby sample in the X-direction.
    float fy = bumpFunction(p - e.yxy); // Nearby sample in the Y-direction.
    float fz = bumpFunction(p - e.yyx); // Nearby sample in the Y-direction.
    
    float fx2 = bumpFunction(p + e.xyy); // Sample in the opposite X-direction.
    float fy2 = bumpFunction(p + e.yxy); // Sample in the opposite Y-direction.
    float fz2 = bumpFunction(p+ e.yyx);  // Sample in the opposite Z-direction.
    
     
    // The gradient vector. Making use of the extra samples to obtain a more locally
    // accurate value. It has a bit of a smoothing effect, which is a bonus.
    vec3 grad = vec3(fx - fx2, fy - fy2, fz - fz2)/(e.x*2.);  
    //vec3 grad = (vec3(fx, fy, fz ) - f)/e.x;  // Without the extra samples.


    // Using the above samples to obtain an edge value. In essence, you're taking some
    // surrounding samples and determining how much they differ from the hit point
    // sample. It's really no different in concept to 2D edging.
    edge = abs(fx + fy + fz + fx2 + fy2 + fz2 - 6.*f);
    edge = smoothstep(0., 1., edge/e.x);
    
    // Some kind of gradient correction. I'm getting so old that I've forgotten why you
    // do this. It's a simple reason, and a necessary one. I remember that much. :D
    grad -= n*dot(n, grad);          
                      
    return normalize(n + grad*bumpfactor); // Bump the normal with the gradient vector.
	
}

// The normal function with some edge detection rolled into it. Sometimes, it's possible to get away
// with six taps, but we need a bit of epsilon value variance here, so there's an extra six.
vec3 nr(vec3 p, inout float edge, float t){ 
	
    vec2 e = vec2(2./iResolution.y, 0); // Larger epsilon for greater sample spread, thus thicker edges.

    // Take some distance function measurements from either side of the hit point on all three axes.
	float d1 = map(p + e.xyy), d2 = map(p - e.xyy);
	float d3 = map(p + e.yxy), d4 = map(p - e.yxy);
	float d5 = map(p + e.yyx), d6 = map(p - e.yyx);
	float d = map(p)*2.;	// The hit point itself - Doubled to cut down on calculations. See below.
     
    // Edges - Take a geometry measurement from either side of the hit point. Average them, then see how
    // much the value differs from the hit point itself. Do this for X, Y and Z directions. Here, the sum
    // is used for the overall difference, but there are other ways. Note that it's mainly sharp surface 
    // curves that register a discernible difference.
    edge = abs(d1 + d2 - d) + abs(d3 + d4 - d) + abs(d5 + d6 - d);
    //edge = max(max(abs(d1 + d2 - d), abs(d3 + d4 - d)), abs(d5 + d6 - d)); // Etc.
    
    // Once you have an edge value, it needs to normalized, and smoothed if possible. How you 
    // do that is up to you. This is what I came up with for now, but I might tweak it later.
    edge = smoothstep(0., 1., sqrt(edge/e.x*2.));
	
    // Redoing the calculations for the normal with a more precise epsilon value.
    e = vec2(.005*min(1. + t, 5.), 0);
	d1 = map(p + e.xyy), d2 = map(p - e.xyy);
	d3 = map(p + e.yxy), d4 = map(p - e.yxy);
	d5 = map(p + e.yyx), d6 = map(p - e.yyx); 
    
    // Return the normal.
    // Standard, normalized gradient mearsurement.
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

// I keep a collection of occlusion routines... OK, that sounded really nerdy. :)
// Anyway, I like this one. I'm assuming it's based on IQ's original.
float cao(in vec3 p, in vec3 n){
	
    float sca = 1., occ = 0.;
    for(float i=0.; i<5.; i++){
    
        float hr = .01 + i*.5/4.;        
        float dd = map(n * hr + p);
        occ += (hr - dd)*sca;
        sca *= 0.7;
    }
    return clamp(1.0 - occ, 0., 1.);    
}


// Cheap shadows are hard. In fact, I'd almost say, shadowing particular scenes with limited 
// iterations is impossible... However, I'd be very grateful if someone could prove me wrong. :)
float softShadow(vec3 ro, vec3 lp, float k){

    // More would be nicer. More is always nicer, but not really affordable... Not on my slow test machine, anyway.
    const int maxIterationsShad = 20; 
    
    vec3 rd = (lp-ro); // Unnormalized direction ray.

    float shade = 1.0;
    float dist = 0.05;    
    float end = max(length(rd), 0.001);
    //float stepDist = end/float(maxIterationsShad);
    
    rd /= end;

    // Max shadow iterations - More iterations make nicer shadows, but slow things down. Obviously, the lowest 
    // number to give a decent shadow is the best one to choose. 
    for (int i=0; i<maxIterationsShad; i++){

        float h = map(ro + rd*dist);
        //shade = min(shade, k*h/dist);
        shade = min(shade, smoothstep(0.0, 1.0, k*h/dist)); // Subtle difference. Thanks to IQ for this tidbit.
        //dist += min( h, stepDist ); // So many options here: dist += clamp( h, 0.0005, 0.2 ), etc.
        dist += clamp(h, 0.01, 0.2);
        
        // Early exits from accumulative distance function calls tend to be a good thing.
        if (h<0.001 || dist > end) break; 
    }

    // I've added 0.5 to the final shade value, which lightens the shadow a bit. It's a preference thing.
    return min(max(shade, 0.) + 0.2, 1.0); 
}

// Blackbody color palette. Handy for all kinds of things.
vec3 blackbodyPalette(float t){

    // t = tLow + (tHigh - tLow)*t;
    t *= 4000.; // Temperature range. Hardcoded from 0K to 4000K, in this case.    
    
    // Planckian locus or black body locus approximated in CIE color space.
    float cx = (0.860117757 + 1.54118254e-4*t + 1.28641212e-7*t*t)/(1.0 + 8.42420235e-4*t + 7.08145163e-7*t*t);
    float cy = (0.317398726 + 4.22806245e-5*t + 4.20481691e-8*t*t)/(1.0 - 2.89741816e-5*t + 1.61456053e-7*t*t);
    
    // Converting the chromacity coordinates to XYZ tristimulus color space.
    float d = (2.*cx - 8.*cy + 4.);
    vec3 XYZ = vec3(3.*cx/d, 2.*cy/d, 1. - (3.*cx + 2.*cy)/d);
    
    // Converting XYZ color space to RGB: https://www.cs.rit.edu/~ncs/color/t_spectr.html
    vec3 RGB = mat3(3.240479, -0.969256, 0.055648, -1.537150, 1.875992, -0.204043, 
                    -0.498535, 0.041556, 1.057311) * vec3(1./XYZ.y*XYZ.x, 1., 1./XYZ.y*XYZ.z);

    // Apply Stefan–Boltzmann's law to the RGB color
    return max(RGB, 0.)*pow(t*0.0004, 4.); 
}

// Pseudo environment mapping. Simlilar to above, but using tri-planar texturing for a more 
// even spread.
vec3 envMap(vec3 rd, vec3 n){
    
    vec3 col = tex3D(iChannel0, rd, n);
    col = smoothstep(.15, .5, col);
    #ifdef WARM
    col *= vec3(1.35, 1, .65);
    #endif
    //col = col*.5 + vec3(1)*pow(min(vec3(1.5, 1, 1)*dot(col, vec3(.299, .587, .114)), 1.), vec3(1, 3, 10))*.5; // Contrast, coloring. 
    
    return col;

}

// Compact, self-contained version of IQ's 3D value noise function.
float n3D(vec3 p){
    
	const vec3 s = vec3(7, 157, 113);
	vec3 ip = floor(p); p -= ip; 
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p = p*p*(3. - 2.*p); //p *= p*p*(p*(p * 6. - 15.) + 10.);
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z); // Range: [0, 1].
}

// Layered noise.
float fBm(vec3 p){ return n3D(p)*.57 + n3D(p*2.)*.28 + n3D(p*4.)*.15; }

void mainImage(out vec4 fragColor, in vec2 fragCoord){

    // Screen coordinates.
	vec2 u = (fragCoord.xy - iResolution.xy*0.5)/iResolution.y;
	
	// Camera Setup.
    float speed = 3.;
    vec3 ro = camPath(iGlobalTime*speed); // Camera position, doubling as the ray origin.
    vec3 lk = camPath(iGlobalTime*speed + .1);  // "Look At" position.
    
    vec3 lp = camPath(iGlobalTime*speed + 5.5); // Light position, somewhere near the moving camera.
    // Moving the light in the opposite X-direction to the camera path. No science is involved. I
    // just preferred the lighting a better from this perpective.
    lp.x = -lp.x;
    // Moving the light along the Z-axis only, if your prefer.
	//vec3 lp = vec3(0, 0, iGlobalTime*speed) + vec3(4, .5, 3.5);   
    
    #ifdef OBJECT_CAMERA_WRAP
    lp.x += 8.;
    #endif


    // Using the above to produce the unit ray-direction vector.
    float FOV = 3.14159/3.; ///3. FOV - Field of view.
    vec3 fwd = normalize(lk-ro);
    vec3 rgt = normalize(vec3(fwd.z, 0., -fwd.x )); 
    vec3 up = cross(fwd, rgt);

    // Unit direction ray.
    //vec3 rd = normalize(fwd + FOV*(u.x*rgt + u.y*up));
    
    // Mild lens distortion to fit more of the scene in, and to mix things up a little.
    vec3 rd = fwd + FOV*(u.x*rgt + u.y*up);
    rd = normalize(vec3(rd.xy, (rd.z - length(rd.xy)*.3)*.7));
    
    // Swiveling the camera from left to right when turning corners.
    float swivel = camPath(lk.z).x;
    rd.xy = rot(swivel/24. )*rd.xy;
    rd.xz = rot(swivel/8. )*rd.xz;
    

    
    // Raymarch.
    float t = trace(ro, rd);
    float svObjID = objID;
    
    // Surface hit point.
    vec3 sp = ro + rd*t;
    
    // Normal with edge component.
    float edge;
    vec3 sn = nr(sp, edge, t);
    
    // Shadows and ambient self shadowing.
    float sh = softShadow(sp, lp, 16.); // Soft shadows.
    float ao = cao(sp, sn); // Ambient occlusion.
    
    // Light direction vector setup and light to surface distance.
    vec3 ld = lp - sp;
    float lDist = max(length(ld), .0001);
    ld /= lDist;
    
    // Attenuation.
    float atten = 1./(1. + lDist*.125 + lDist*lDist*.025);
    
 
    
    // Heavy function-based bump mapping with bumped edges.
    float edge2 = 0.;
    #ifdef SHOW_DETAILS
    sn = doBumpMap(sp, sn, .15/(1. + t/FAR), edge2);
    #endif
    

    // Warping the texture cordinates by the camera path just slightly to break up the
    // texture repetion a bit, especially on the floor.
    vec3 tsp = sp;
    tsp.xy += camPath(tsp.z).xy*.35;

    
    // Texture-based bump mapping.
    const float tSize = 1./5.;
    sn = doBumpMap(iChannel0, tsp*tSize, sn, .01/(1. + t/FAR));

    
    // Diffuse, specular and Fresnel.
    float dif = max(dot(ld, sn), 0.);
    float spe = pow(max(dot(reflect(rd, sn), ld), 0.), 8.);
    float fre = pow(clamp(dot(rd, sn) + 1., 0., 1.), 4.);
    dif = pow(dif, 4.)*0.66 + pow(dif, 8.)*0.34; // Ramping up the diffuse to make it shinier.
    
    
    // Texturing the object.
    vec3 tx = tex3D(iChannel0, tsp*tSize, sn);
    tx = smoothstep(0.05, .5, tx)*1.5; // Giving it a bit more brightness and contrast.
    #ifdef WARM
    tx *= vec3(1.35, 1, .65);
    #endif
 
 
    
    #ifdef SHOW_DETAILS
    if(bObjID > .5 && bObjID < 1.5) tx *= vec3(1.3, .65, .35);//vec3(1.5, .85, .25);
    #endif
    
    // Lazy way to identify the mesh floor area. It saves an object identification in the
    // distance function.
    if(sp.y<-3.49 && sp.y>-3.51) {
        
        //dif = (sqrt(dif));
        #ifdef SHOW_DETAILS
        tx *= tiles(sp.xz);
        #endif
        tx *= vec3(1.3, 1, .7);
    }
    
    
    // Applying the normal-based and bump mapped edges.
    tx *= (1.-edge*.7)*(1.-edge2*.7);
    
    
    // Combining the terms above to produce the final color.
    vec3 fc = tx*(dif*1.5 + .2);
    #ifdef WARM
    fc += tx*vec3(1, .7, .4)*fre*4. + vec3(1.35, 1, .65)*vec3(1, .7, .3)*spe*3.;
    #else
    fc += tx*vec3(.5, .7, 1)*fre*4. + vec3(1, .7, .3)*spe*3.;
    #endif
    
    // Adding in some reflective looking color. It's completely fake, but subtle enough so
    // that you don't notice.
    vec3 env = envMap(tsp*tSize + reflect(rd, sn), sn);//svSn*.75 + sn*.25
    fc += env*.5;
  
    
    // Shading.
    fc *= atten*sh*ao;

    
    // Extra processing. A little too heavy going for my liking.
    //fc = fc*.5 + vec3(1)*pow(max(fc, 0.), vec3(1, 1.5, 2.5))*.5; // Contrast, coloring.

    
    // Mixing in some fiery background haze, otherwise known as a lazy, two dollar, noise effect. :)
    #ifdef WARM
    float noise = (fBm(sp - iGlobalTime*2.)*.08 + .94)*(rd.y*.25 + .75);
    vec3 bg = blackbodyPalette(noise);
    #else
    float noise = (fBm(sp - iGlobalTime*2.)*.15 + .9)*(rd.y*.5 + .5);
    vec3 bg = mix(vec3(.3, .4, .7), vec3(.7, .9, 1), noise);
    #endif
    fc = mix(bg, fc, 1. - smoothstep(0., 1., t*t/FAR/FAR) ); //1./(1. + t*t*.003)
    
    
    // Approximate gamma correction.
	fragColor = vec4(sqrt(clamp(fc, 0., 1.)), 1.0);
}
</script>

<!-- https://www.shadertoy.com/view/Xds3zN -->
<script type="shader" id="primitives">
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// A list of usefull distance function to simple primitives, and an example on how to 
// do some interesting boolean operations, repetition and displacement.
//
// More info here: http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm

float sdPlane( vec3 p )
{
	return p.y;
}

float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdEllipsoid( in vec3 p, in vec3 r )
{
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float udRoundBox( vec3 p, vec3 b, float r )
{
  return length(max(abs(p)-b,0.0))-r;
}

float sdTorus( vec3 p, vec2 t )
{
  return length( vec2(length(p.xz)-t.x,p.y) )-t.y;
}

float sdHexPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
#if 0
    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
#else
    float d1 = q.z-h.y;
    float d2 = max((q.x*0.866025+q.y*0.5),q.y)-h.x;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - r;
}

float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
#if 0
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
#else
    float d1 = q.z-h.y;
    float d2 = max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float sdCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCone( in vec3 p, in vec3 c )
{
    vec2 q = vec2( length(p.xz), p.y );
    float d1 = -q.y-c.z;
    float d2 = max( dot(q,c.xy), q.y);
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float sdConeSection( in vec3 p, in float h, in float r1, in float r2 )
{
    float d1 = -p.y - h;
    float q = p.y - h;
    float si = 0.5*(r1-r2)/h;
    float d2 = max( sqrt( dot(p.xz,p.xz)*(1.0-si*si)) + q*si - r2, q );
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}


float length2( vec2 p )
{
	return sqrt( p.x*p.x + p.y*p.y );
}

float length6( vec2 p )
{
	p = p*p*p; p = p*p;
	return pow( p.x + p.y, 1.0/6.0 );
}

float length8( vec2 p )
{
	p = p*p; p = p*p; p = p*p;
	return pow( p.x + p.y, 1.0/8.0 );
}

float sdTorus82( vec3 p, vec2 t )
{
  vec2 q = vec2(length2(p.xz)-t.x,p.y);
  return length8(q)-t.y;
}

float sdTorus88( vec3 p, vec2 t )
{
  vec2 q = vec2(length8(p.xz)-t.x,p.y);
  return length8(q)-t.y;
}

float sdCylinder6( vec3 p, vec2 h )
{
  return max( length6(p.xz)-h.x, abs(p.y)-h.y );
}

//----------------------------------------------------------------------

float opS( float d1, float d2 )
{
    return max(-d2,d1);
}

vec2 opU( vec2 d1, vec2 d2 )
{
	return (d1.x<d2.x) ? d1 : d2;
}

vec3 opRep( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
}

vec3 opTwist( vec3 p )
{
    float  c = cos(10.0*p.y+10.0);
    float  s = sin(10.0*p.y+10.0);
    mat2   m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}

//----------------------------------------------------------------------

vec2 map( in vec3 pos )
{
    vec2 res = opU( vec2( sdPlane(     pos), 1.0 ),
	                vec2( sdSphere(    pos-vec3( 0.0,0.25, 0.0), 0.25 ), 46.9 ) );
    res = opU( res, vec2( sdBox(       pos-vec3( 1.0,0.25, 0.0), vec3(0.25) ), 3.0 ) );
    res = opU( res, vec2( udRoundBox(  pos-vec3( 1.0,0.25, 1.0), vec3(0.15), 0.1 ), 41.0 ) );
	res = opU( res, vec2( sdTorus(     pos-vec3( 0.0,0.25, 1.0), vec2(0.20,0.05) ), 25.0 ) );
    res = opU( res, vec2( sdCapsule(   pos,vec3(-1.3,0.10,-0.1), vec3(-0.8,0.50,0.2), 0.1  ), 31.9 ) );
	res = opU( res, vec2( sdTriPrism(  pos-vec3(-1.0,0.25,-1.0), vec2(0.25,0.05) ),43.5 ) );
	res = opU( res, vec2( sdCylinder(  pos-vec3( 1.0,0.30,-1.0), vec2(0.1,0.2) ), 8.0 ) );
	res = opU( res, vec2( sdCone(      pos-vec3( 0.0,0.50,-1.0), vec3(0.8,0.6,0.3) ), 55.0 ) );
	res = opU( res, vec2( sdTorus82(   pos-vec3( 0.0,0.25, 2.0), vec2(0.20,0.05) ),50.0 ) );
	res = opU( res, vec2( sdTorus88(   pos-vec3(-1.0,0.25, 2.0), vec2(0.20,0.05) ),43.0 ) );
	res = opU( res, vec2( sdCylinder6( pos-vec3( 1.0,0.30, 2.0), vec2(0.1,0.2) ), 12.0 ) );
	res = opU( res, vec2( sdHexPrism(  pos-vec3(-1.0,0.20, 1.0), vec2(0.25,0.05) ),17.0 ) );

    res = opU( res, vec2( opS(
		             udRoundBox(  pos-vec3(-2.0,0.2, 1.0), vec3(0.15),0.05),
	                 sdSphere(    pos-vec3(-2.0,0.2, 1.0), 0.25)), 13.0 ) );
    res = opU( res, vec2( opS(
		             sdTorus82(  pos-vec3(-2.0,0.2, 0.0), vec2(0.20,0.1)),
	                 sdCylinder(  opRep( vec3(atan(pos.x+2.0,pos.z)/6.2831,
											  pos.y,
											  0.02+0.5*length(pos-vec3(-2.0,0.2, 0.0))),
									     vec3(0.05,1.0,0.05)), vec2(0.02,0.6))), 51.0 ) );
	res = opU( res, vec2( 0.7*sdSphere(    pos-vec3(-2.0,0.25,-1.0), 0.2 ) + 
					                   0.03*sin(50.0*pos.x)*sin(50.0*pos.y)*sin(50.0*pos.z), 
                                       65.0 ) );
	res = opU( res, vec2( 0.5*sdTorus( opTwist(pos-vec3(-2.0,0.25, 2.0)),vec2(0.20,0.05)), 46.7 ) );

    res = opU( res, vec2(sdConeSection( pos-vec3( 0.0,0.35,-2.0), 0.15, 0.2, 0.1 ), 13.67 ) );

    res = opU( res, vec2(sdEllipsoid( pos-vec3( 1.0,0.35,-2.0), vec3(0.15, 0.2, 0.05) ), 43.17 ) );
        
    return res;
}

vec2 castRay( in vec3 ro, in vec3 rd )
{
    float tmin = 1.0;
    float tmax = 20.0;
    
#if 0
    float tp1 = (0.0-ro.y)/rd.y; if( tp1>0.0 ) tmax = min( tmax, tp1 );
    float tp2 = (1.6-ro.y)/rd.y; if( tp2>0.0 ) { if( ro.y>1.6 ) tmin = max( tmin, tp2 );
                                                 else           tmax = min( tmax, tp2 ); }
#endif
    
	float precis = 0.002;
    float t = tmin;
    float m = -1.0;
    for( int i=0; i<50; i++ )
    {
	    vec2 res = map( ro+rd*t );
        if( res.x<precis || t>tmax ) break;
        t += res.x;
	    m = res.y;
    }

    if( t>tmax ) m=-1.0;
    return vec2( t, m );
}


float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
	float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ )
    {
		float h = map( ro + rd*t ).x;
        res = min( res, 8.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );

}

vec3 calcNormal( in vec3 pos )
{
	vec3 eps = vec3( 0.001, 0.0, 0.0 );
	vec3 nor = vec3(
	    map(pos+eps.xyy).x - map(pos-eps.xyy).x,
	    map(pos+eps.yxy).x - map(pos-eps.yxy).x,
	    map(pos+eps.yyx).x - map(pos-eps.yyx).x );
	return normalize(nor);
}

float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}




vec3 render( in vec3 ro, in vec3 rd )
{ 
    vec3 col = vec3(0.7, 0.9, 1.0) +rd.y*0.8;
    vec2 res = castRay(ro,rd);
    float t = res.x;
	float m = res.y;
    if( m>-0.5 )
    {
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal( pos );
        vec3 ref = reflect( rd, nor );
        
        // material        
		col = 0.45 + 0.3*sin( vec3(0.05,0.08,0.10)*(m-1.0) );
		
        if( m<1.5 )
        {
            
            float f = mod( floor(5.0*pos.z) + floor(5.0*pos.x), 2.0);
            col = 0.4 + 0.1*f*vec3(1.0);
        }

        // lighitng        
        float occ = calcAO( pos, nor );
		vec3  lig = normalize( vec3(-0.6, 0.7, -0.5) );
		float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
        float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
        float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);
        float dom = smoothstep( -0.1, 0.1, ref.y );
        float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );
		float spe = pow(clamp( dot( ref, lig ), 0.0, 1.0 ),16.0);
        
        dif *= softshadow( pos, lig, 0.02, 2.5 );
        dom *= softshadow( pos, ref, 0.02, 2.5 );

		vec3 lin = vec3(0.0);
        lin += 1.20*dif*vec3(1.00,0.85,0.55);
		lin += 1.20*spe*vec3(1.00,0.85,0.55)*dif;
        lin += 0.20*amb*vec3(0.50,0.70,1.00)*occ;
        lin += 0.30*dom*vec3(0.50,0.70,1.00)*occ;
        lin += 0.30*bac*vec3(0.25,0.25,0.25)*occ;
        lin += 0.40*fre*vec3(1.00,1.00,1.00)*occ;
		col = col*lin;

    	col = mix( col, vec3(0.8,0.9,1.0), 1.0-exp( -0.002*t*t ) );

    }

	return vec3( clamp(col,0.0,1.0) );
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 q = fragCoord.xy/iResolution.xy;
    vec2 p = -1.0+2.0*q;
	p.x *= iResolution.x/iResolution.y;
    vec2 mo = iMouse.xy/iResolution.xy;
		 
	float time = 15.0 + iGlobalTime;

	// camera	
	vec3 ro = vec3( -0.5+3.5*cos(0.1*time + 6.0*mo.x), 1.0 + 2.0*mo.y, 0.5 + 3.5*sin(0.1*time + 6.0*mo.x) );
	vec3 ta = vec3( -0.5, -0.4, 0.5 );
	
	// camera-to-world transformation
    mat3 ca = setCamera( ro, ta, 0.0 );
    
    // ray direction
	vec3 rd = ca * normalize( vec3(p.xy,2.0) );

    // render	
    vec3 col = render( ro, rd );

	col = pow( col, vec3(0.4545) );

    fragColor=vec4( col, 1.0 );
}
</script>

<!-- https://www.shadertoy.com/view/MdX3zr -->
<script type="shader" id="flame">
float noise(vec3 p) //Thx to Las^Mercury
{
	vec3 i = floor(p);
	vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
	vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
	a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
	a.xy = mix(a.xz, a.yw, f.y);
	return mix(a.x, a.y, f.z);
}

float sphere(vec3 p, vec4 spr)
{
	return length(spr.xyz-p) - spr.w;
}

float flame(vec3 p)
{
	float d = sphere(p*vec3(1.,.5,1.), vec4(.0,-1.,.0,1.));
	return d + (noise(p+vec3(.0,iGlobalTime*2.,.0)) + noise(p*3.)*.5)*.25*(p.y) ;
}

float scene(vec3 p)
{
	return min(100.-length(p) , abs(flame(p)) );
}

vec4 raymarch(vec3 org, vec3 dir)
{
	float d = 0.0, glow = 0.0, eps = 0.02;
	vec3  p = org;
	bool glowed = false;
	
	for(int i=0; i<64; i++)
	{
		d = scene(p) + eps;
		p += d * dir;
		if( d>eps )
		{
			if(flame(p) < .0)
				glowed=true;
			if(glowed)
       			glow = float(i)/64.;
		}
	}
	return vec4(p,glow);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 v = -1.0 + 2.0 * fragCoord.xy / iResolution.xy;
	v.x *= iResolution.x/iResolution.y;
	
	vec3 org = vec3(0., -2., 4.);
	vec3 dir = normalize(vec3(v.x*1.6, -v.y, -1.5));
	
	vec4 p = raymarch(org, dir);
	float glow = p.w;
	
	vec4 col = mix(vec4(1.,.5,.1,1.), vec4(0.1,.5,1.,1.), p.y*.02+.4);
	
	fragColor = mix(vec4(0.), col, pow(glow*2.,4.));
	//fragColor = mix(vec4(1.), mix(vec4(1.,.5,.1,1.),vec4(0.1,.5,1.,1.),p.y*.02+.4), pow(glow*2.,4.));

}
</script>

<!-- https://www.shadertoy.com/view/4lfSzS -->
<script type="shader" id="awesomestar">
// Panteleymonov A K 2015

//
// procedural noise from https://www.shadertoy.com/view/4sfGzS
// for first variant
/*float hash( float n ) { return fract(sin(n)*753.5453123); }
float noise( vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
	
    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}*/

// animated noise
vec4 NC0=vec4(0.0,157.0,113.0,270.0);
vec4 NC1=vec4(1.0,158.0,114.0,271.0);
//vec4 WS=vec4(10.25,32.25,15.25,3.25);
vec4 WS=vec4(0.25,0.25,0.25,0.25);

//
//vec4 hash4(vec4 x){ return fract(fract(x*0.31830988618379067153776752674503)*fract(x*0.15915494309189533576888376337251)*265871.1723); }
//vec4 hash4( vec4 n ) { return fract(sin(n)*753.5453123); }
//float noise3( vec3 x )
//{
//    vec3 p = floor(x);
//    vec3 f = fract(x);
//    f = f*f*(3.0-2.0*f);
//    float n = p.x + dot(p.yz,vec2(157.0,113.0));
//    vec4 s1=mix(hash4(vec4(n)+NC0),hash4(vec4(n)+NC1),vec4(f.x));
//    return mix(mix(s1.x,s1.y,f.y),mix(s1.z,s1.w,f.y),f.z);
//}

// just a noise
//float noise4( vec4 x )
//{
//    vec4 p = floor(x);
//    vec4 f = fract(x);
//    p.w=mod(p.w,100.0); // looping noise in one axis
//    f = f*f*(3.0-2.0*f);
//    float n = p.x + dot(p.yzw,vec3(157.0,113.0,642.0));
//    vec4 vs1=mix(hash4(vec4(n)+NC0),hash4(vec4(n)+NC1),vec4(f.x));
//    n = n-642.0*p.w + 642.0*mod(p.w+1.0,100.0);
//    vec4 vs2=mix(hash4(vec4(n)+NC0),hash4(vec4(n)+NC1),vec4(f.x));
//    vs1=mix(vec4(vs1.xz,vs2.xz),vec4(vs1.yw,vs2.yw),vec4(f.y));
//    vs1.xy=mix(vs1.xz,vs1.yw,vec2(f.z));
//    return mix(vs1.x,vs1.y,f.w);
//}

// mix noise for alive animation
//float noise4r( vec4 x )
//{
//    return (noise4(x)+noise4(x+=WS)+noise4(x+=WS)+noise4(x+=WS))*0.25;
//    //return noise4(x);
//}

// mix noise for alive animation, full source
vec4 hash4( vec4 n ) { return fract(sin(n)*1399763.5453123); }
vec3 hash3( vec3 n ) { return fract(sin(n)*1399763.5453123); }
vec3 hpos( vec3 n ) { return hash3(vec3(dot(n,vec3(157.0,113.0,271.0)),dot(n,vec3(271.0,157.0,113.0)),dot(n,vec3(113.0,271.0,157.0)))); }
//vec4 hash4( vec4 n ) { return fract(n*fract(n*0.5453123)); }
//vec4 hash4( vec4 n ) { n*=1.987654321; return fract(n*fract(n)); }
float noise4q(vec4 x)
{
	vec4 n3 = vec4(0,0.25,0.5,0.75);
	vec4 p2 = floor(x.wwww+n3);
	vec4 b = floor(x.xxxx+n3) + floor(x.yyyy+n3)*157.0 + floor(x.zzzz +n3)*113.0;
	vec4 p1 = b + fract(p2*0.00390625)*vec4(164352.0, -164352.0, 163840.0, -163840.0);
	p2 = b + fract((p2+1.0)*0.00390625)*vec4(164352.0, -164352.0, 163840.0, -163840.0);
	vec4 f1 = fract(x.xxxx+n3);
	vec4 f2 = fract(x.yyyy+n3);
	f1=f1*f1*(3.0-2.0*f1);
	f2=f2*f2*(3.0-2.0*f2);
	vec4 n1 = vec4(0,1.0,157.0,158.0);
	vec4 n2 = vec4(113.0,114.0,270.0,271.0);	
	vec4 vs1 = mix(hash4(p1), hash4(n1.yyyy+p1), f1);
	vec4 vs2 = mix(hash4(n1.zzzz+p1), hash4(n1.wwww+p1), f1);
	vec4 vs3 = mix(hash4(p2), hash4(n1.yyyy+p2), f1);
	vec4 vs4 = mix(hash4(n1.zzzz+p2), hash4(n1.wwww+p2), f1);	
	vs1 = mix(vs1, vs2, f2);
	vs3 = mix(vs3, vs4, f2);
	vs2 = mix(hash4(n2.xxxx+p1), hash4(n2.yyyy+p1), f1);
	vs4 = mix(hash4(n2.zzzz+p1), hash4(n2.wwww+p1), f1);
	vs2 = mix(vs2, vs4, f2);
	vs4 = mix(hash4(n2.xxxx+p2), hash4(n2.yyyy+p2), f1);
	vec4 vs5 = mix(hash4(n2.zzzz+p2), hash4(n2.wwww+p2), f1);
	vs4 = mix(vs4, vs5, f2);
	f1 = fract(x.zzzz+n3);
	f2 = fract(x.wwww+n3);
	f1=f1*f1*(3.0-2.0*f1);
	f2=f2*f2*(3.0-2.0*f2);
	vs1 = mix(vs1, vs2, f1);
	vs3 = mix(vs3, vs4, f1);
	vs1 = mix(vs1, vs3, f2);
	float r=dot(vs1,vec4(0.25));
	//r=r*r*(3.0-2.0*r);
	return r*r*(3.0-2.0*r);
}

// body of a star
float noiseSpere(vec3 ray,vec3 pos,float r,mat3 mr,float zoom,vec3 subnoise,float anim)
{
  	float b = dot(ray,pos);
  	float c = dot(pos,pos) - b*b;
    
    vec3 r1=vec3(0.0);
    
    float s=0.0;
    float d=0.03125;
    float d2=zoom/(d*d); 
    float ar=5.0;
   
    for (int i=0;i<3;i++) {
		float rq=r*r;
        if(c <rq)
        {
            float l1=sqrt(rq-c);
            r1= ray*(b-l1)-pos;
            r1=r1*mr;
            s+=abs(noise4q(vec4(r1*d2+subnoise*ar,anim*ar))*d);
        }
        ar-=2.0;
        d*=4.0;
        d2*=0.0625;
        r=r-r*0.02;
    }
    return s;
}

// glow ring
float ring(vec3 ray,vec3 pos,float r,float size)
{
  	float b = dot(ray,pos);
  	float c = dot(pos,pos) - b*b;
   
    float s=max(0.0,(1.0-size*abs(r-sqrt(c))));
    
    return s;
}

// rays of a star
float ringRayNoise(vec3 ray,vec3 pos,float r,float size,mat3 mr,float anim)
{
  	float b = dot(ray,pos);
    vec3 pr=ray*b-pos;
       
    float c=length(pr);

    pr*=mr;
    
    pr=normalize(pr);
    
    float s=max(0.0,(1.0-size*abs(r-c)));
    
    float nd=noise4q(vec4(pr*1.0,-anim+c))*2.0;
    nd=pow(nd,2.0);
    float n=0.4;
    float ns=1.0;
    if (c>r) {
        n=noise4q(vec4(pr*10.0,-anim+c));
        ns=noise4q(vec4(pr*50.0,-anim*2.5+c*2.0))*2.0;
    }
    n=n*n*nd*ns;
    
    return pow(s,4.0)+s*s*n;
}

vec4 noiseSpace(vec3 ray,vec3 pos,float r,mat3 mr,float zoom,vec3 subnoise,float anim)
{
  	float b = dot(ray,pos);
  	float c = dot(pos,pos) - b*b;
    
    vec3 r1=vec3(0.0);
    
    float s=0.0;
    float d=0.0625*1.5;
    float d2=zoom/d;

	float rq=r*r;
    float l1=sqrt(abs(rq-c));
    r1= (ray*(b-l1)-pos)*mr;

    r1*=d2;
    s+=abs(noise4q(vec4(r1+subnoise,anim))*d);
    s+=abs(noise4q(vec4(r1*0.5+subnoise,anim))*d*2.0);
    s+=abs(noise4q(vec4(r1*0.25+subnoise,anim))*d*4.0);
    //return s;
    return vec4(s*2.0,abs(noise4q(vec4(r1*0.1+subnoise,anim))),abs(noise4q(vec4(r1*0.1+subnoise*6.0,anim))),abs(noise4q(vec4(r1*0.1+subnoise*13.0,anim))));
}

float sphereZero(vec3 ray,vec3 pos,float r)
{
  	float b = dot(ray,pos);
  	float c = dot(pos,pos) - b*b;
    float s=1.0;
    if (c<r*r) s=0.0;
    return s;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (-iResolution.xy + 2.0*fragCoord.xy) / iResolution.y;

    float time=iGlobalTime*1.0;
    
	float mx = iMouse.y>0.0?iMouse.x/iResolution.x*10.0:time*0.025;
    float my = iMouse.y>0.0?iMouse.y/iResolution.y*4.0-2.0:-0.6;
    vec2 rotate = vec2(mx,my);

    vec2 sins=sin(rotate);
    vec2 coss=cos(rotate);
    mat3 mr=mat3(vec3(coss.x,0.0,sins.x),vec3(0.0,1.0,0.0),vec3(-sins.x,0.0,coss.x));
    mr=mat3(vec3(1.0,0.0,0.0),vec3(0.0,coss.y,sins.y),vec3(0.0,-sins.y,coss.y))*mr;    

    mat3 imr=mat3(vec3(coss.x,0.0,-sins.x),vec3(0.0,1.0,0.0),vec3(sins.x,0.0,coss.x));
    imr=imr*mat3(vec3(1.0,0.0,0.0),vec3(0.0,coss.y,-sins.y),vec3(0.0,sins.y,coss.y));
	
    vec3 ray = normalize(vec3(p,2.0));
    vec3 pos = vec3(0.0,0.0,3.0);
    
    float s1=noiseSpere(ray,pos,1.0,mr,0.5,vec3(0.0),time);
    s1=pow(min(1.0,s1*2.4),2.0);
    float s2=noiseSpere(ray,pos,1.0,mr,4.0,vec3(83.23,34.34,67.453),time);
    s2=min(1.0,s2*2.2);
    fragColor = vec4( mix(vec3(1.0,1.0,0.0),vec3(1.0),pow(s1,60.0))*s1, 1.0 );
    fragColor += vec4( mix(mix(vec3(1.0,0.0,0.0),vec3(1.0,0.0,1.0),pow(s2,2.0)),vec3(1.0),pow(s2,10.0))*s2, 1.0 );
	
    fragColor.xyz -= vec3(ring(ray,pos,1.03,11.0))*2.0;
    fragColor = max( vec4(0.0), fragColor );
    
    float s3=ringRayNoise(ray,pos,0.96,1.0,mr,time);
    fragColor.xyz += mix(vec3(1.0,0.6,0.1),vec3(1.0,0.95,1.0),pow(s3,3.0))*s3;

    float zero=sphereZero(ray,pos,0.9);
    if (zero>0.0) {
    	//float s4=noiseSpace(ray,pos,100.0,mr,0.5,vec3(0.0),time*0.01);
	    vec4 s4=noiseSpace(ray,pos,100.0,mr,0.05,vec3(1.0,2.0,4.0),0.0);
    	//float s5=noiseSpace(ray,pos,100.0,vec3(mx,my,0.5),vec3(83.23,34.34,67.453),time*0.01);
    	//s4=pow(s4*2.0,6.0);
    	//s4=pow(s4*1.8,5.7);
    	s4.x=pow(s4.x,3.0);
    	//s5=pow(s5*2.0,6.0);
    	//fragColor.xyz += (vec3(0.0,0.0,1.0)*s4*0.6+vec3(0.9,0.0,1.0)*s5*0.3)*sphereZero(ray,pos,0.9);
    	fragColor.xyz += mix(mix(vec3(1.0,0.0,0.0),vec3(0.0,0.0,1.0),s4.y*1.9),vec3(0.9,1.0,0.1),s4.w*0.75)*s4.x*pow(s4.z*2.5,3.0)*0.2*zero;
    	//fragColor.xyz += (mix(mix(vec3(1.0,0.0,0.0),vec3(0.0,0.0,1.0),s4*3.0),vec3(1.0),pow(s4*2.0,4.0))*s4*0.6)*sphereZero(ray,pos,0.9);
        
        
		/*float b = dot(ray,pos);
  		float c = dot(pos,pos) - b*b;
    	float l1 = sqrt(abs(10.0-c));
    	vec3 spos = (ray*(b-l1))*mr;
        vec3 sposr=ceil(spos)+spos/abs(spos)*0.5;
        //sposr+=hpos(sposr)*0.2;
        
        float ss3=max(0.0,ringRayNoise(ray,(sposr)*imr,0.001,10.0,mr,time));
        fragColor.xyz += vec3(ss3);*/
    }
    
    //fragColor = max( vec4(0.0), fragColor );
    //s+=noiseSpere(ray,vec3(0.0,0.0,3.0),0.96,vec2(mx+1.4,my),vec3(83.23,34.34,67.453));
    //s+=noiseSpere(ray,vec3(0.0,0.0,3.0),0.90,vec2(mx,my),vec3(123.223311,956.34,7.45333))*0.6;
    
    fragColor = max( vec4(0.0), fragColor );
	fragColor = min( vec4(1.0), fragColor );
}

//
// SunShader 1.0 for Unity3D 4-5
//
// Panteleymonov Aleksandr 2016
//
// foxes@bk.ru
// manil@panteleymonov.ru
//
/*
Shader "Space/Star/Sun"
{
	Properties
	{
		_Radius("Radius", Float) = 0.5
		_Light("Light",Color) = (1,1,1,1)
		_Color("Color", Color) = (1,1,0,1)
		_Base("Base", Color) = (1,0,0,1)
		_Dark("Dark", Color) = (1,0,1,1)
		_RayString("Ray String", Range(0.02,10.0)) = 1.0
		_RayLight("Ray Light", Color) = (1,0.95,1.0,1)
		_Ray("Ray End", Color) = (1,0.6,0.1,1)
		_Detail("Detail Body", Range(0,5)) = 3
		_Rays("Rays", Range(1.0,10.0)) = 2.0
		_RayRing("Ray Ring", Range(1.0,10.0)) = 1.0
		_RayGlow("Ray Glow", Range(1.0,10.0)) = 2.0
		_Glow("Glow", Range(1.0,100.0)) = 4.0
		_Zoom("Zoom", Float) = 1.0
		_SpeedHi("Speed Hi", Range(0.0,10)) = 2.0
		_SpeedLow("Speed Low", Range(0.0,10)) = 2.0
		_SpeedRay("Speed Ray", Range(0.0,10)) = 5.0
		_SpeedRing("Speed Ring", Range(0.0,20)) = 2.0
		_Seed("Seed", Range(-10,10)) = 0
	}
		SubShader
	{
		Tags{ "Queue" = "Transparent" "IgnoreProjector" = "True" "RenderType" = "Transparent" }
		LOD 100

		Pass
		{
			Blend One OneMinusSrcAlpha
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#pragma target 4.0
			
			#include "UnityCG.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float2 uv : TEXCOORD0;
			};

			struct v2f
			{
			#if UNITY_5_0
				UNITY_FOG_COORDS(1)
			#endif
				float4 vertex : SV_POSITION;
			};

			sampler2D _MainTex;
			float _Radius;
			float _RayString;
			fixed4 _Light;
			fixed4 _Color;
			fixed4 _Base;
			fixed4 _Dark;
			fixed4 _Ray;
			fixed4 _RayLight;
			int _Detail;
			float _Rays;
			float _RayRing;
			float _RayGlow;
			float _Zoom;
			float _SpeedHi;
			float _SpeedLow;
			float _SpeedRay;
			float _SpeedRing;
			float _Glow;
			float _Seed;

			float4 posGlob; // center position
									
			v2f vert (appdata v)
			{
				v2f o;		
				posGlob = float4(UNITY_MATRIX_MV[0].w, UNITY_MATRIX_MV[1].w, UNITY_MATRIX_MV[2].w,0);
				float3x3 r=transpose((float3x3)UNITY_MATRIX_MV);
				float3x3 m;
				m[2]=normalize(mul(r,(float3)posGlob));
				m[1]=normalize(cross(m[2],float3(0.0, 1.0, 0.0)));
				m[0]=normalize(cross(m[1],m[2]));
				o.uv1 = mul(transpose(m), (float3)v.vertex);
            	o.vertex = mul(UNITY_MATRIX_MVP, float4(o.uv1, 1.0));
				
				#if UNITY_5_0
				UNITY_TRANSFER_FOG(o,o.vertex);
				#endif
				return o;
			}

			// animated noise
			fixed4 hash4(fixed4 n) { return frac(sin(n)*(fixed)753.5453123); }

			// mix noise for alive animation
			fixed noise4q(fixed4 x)
			{
				fixed4 n3 = fixed4(0,0.25,0.5,0.75);
				fixed4 p2 = floor(x.wwww+n3);
				fixed4 b = floor(x.xxxx +n3) + floor(x.yyyy +n3)*157.0 + floor(x.zzzz +n3)*113.0;
				fixed4 p1 = b + frac(p2*0.00390625)*fixed4(164352.0, -164352.0, 163840.0, -163840.0);
				p2 = b + frac((p2+1)*0.00390625)*fixed4(164352.0, -164352.0, 163840.0, -163840.0);
				fixed4 f1 = frac(x.xxxx+n3);
				fixed4 f2 = frac(x.yyyy+n3);
				
				fixed4 n1 = fixed4(0,1.0,157.0,158.0);
				fixed4 n2 = fixed4(113.0,114.0,270.0,271.0);		
				fixed4 vs1 = lerp(hash4(p1), hash4(n1.yyyy+p1), f1);
				fixed4 vs2 = lerp(hash4(n1.zzzz+p1), hash4(n1.wwww+p1), f1);
				fixed4 vs3 = lerp(hash4(p2), hash4(n1.yyyy+p2), f1);
				fixed4 vs4 = lerp(hash4(n1.zzzz+p2), hash4(n1.wwww+p2), f1);	
				vs1 = lerp(vs1, vs2, f2);
				vs3 = lerp(vs3, vs4, f2);
				
				vs2 = lerp(hash4(n2.xxxx+p1), hash4(n2.yyyy+p1), f1);
				vs4 = lerp(hash4(n2.zzzz+p1), hash4(n2.wwww+p1), f1);
				vs2 = lerp(vs2, vs4, f2);
				vs4 = lerp(hash4(n2.xxxx+p2), hash4(n2.yyyy+p2), f1);
				fixed4 vs5 = lerp(hash4(n2.zzzz+p2), hash4(n2.wwww+p2), f1);
				vs4 = lerp(vs4, vs5, f2);
				f1 = frac(x.zzzz+n3);
				f2 = frac(x.wwww+n3);
				
				vs1 = lerp(vs1, vs2, f1);
				vs3 = lerp(vs3, vs4, f1);
				vs1 = lerp(vs1, vs3, f2);
				
				return dot(vs1,0.25);
			}
					
			float RayProj;
			float sqRadius; // sphere radius
			float fragTime;
			float sphere; // sphere distance
			float3 surfase; // position on surfase

			// body of a star
			fixed noiseSpere(float zoom, float3 subnoise, float anim)
			{
				fixed s = 0.0;

				if (sphere <sqRadius) {
					if (_Detail>0.0) s = noise4q(fixed4(surfase*zoom*3.6864 + subnoise, fragTime*_SpeedHi))*0.625;
					if (_Detail>1.0) s =s*0.85+noise4q(fixed4(surfase*zoom*61.44 + subnoise*3.0, fragTime*_SpeedHi*3.0))*0.125;
					if (_Detail>2.0) s =s*0.94+noise4q(fixed4(surfase*zoom*307.2 + subnoise*5.0, anim*5.0))*0.0625;//*0.03125;
					if (_Detail>3.0) s =s*0.98+noise4q(fixed4(surfase*zoom*600.0 + subnoise*6.0, fragTime*_SpeedLow*6.0))*0.03125;
					if (_Detail>4.0) s =s*0.98+noise4q(fixed4(surfase*zoom*1200.0 + subnoise*9.0, fragTime*_SpeedLow*9.0))*0.01125;
				}
				return s;
			}

			fixed4 frag (v2f i) : SV_Target
			{
				float invz =1/_Zoom;
				_Radius*=invz;
				fragTime=_Time.x*10.0;
				posGlob = float4(UNITY_MATRIX_MV[0].w, UNITY_MATRIX_MV[1].w, UNITY_MATRIX_MV[2].w,0);
				float3x3 m = (float3x3)UNITY_MATRIX_MV;
				float3 ray = normalize(mul(m, i.uv1) + posGlob.xyz);
				m = transpose((float3x3)UNITY_MATRIX_V);

				RayProj = dot(ray, (float3)posGlob);
				float sqDist=dot((float3)posGlob, (float3)posGlob);
				sphere = sqDist - RayProj*RayProj;
				sqRadius = _Radius*_Radius;
				if (RayProj<=0.0) sphere=sqRadius;
				float3 pr = ray*abs(RayProj) - (float3)posGlob;
				
				if (sqDist<=sqRadius) {
					surfase=-posGlob;
					sphere=sqDist;
				} else if (sphere <sqRadius) {
					float l1 = sqrt(sqRadius - sphere);
					surfase = mul(m,pr - ray*l1);
				} else {
					surfase=(float3)0;
				}

				fixed4 col = fixed4(0,0,0,0);

				if (_Detail >= 1.0) {
					float s1 = noiseSpere(0.5*_Zoom, float3(45.78, 113.04, 28.957)*_Seed, fragTime*_SpeedLow);
					s1 = pow(s1*2.4, 2.0);
					float s2 = noiseSpere(4.0*_Zoom, float3(83.23, 34.34, 67.453)*_Seed, fragTime*_SpeedHi);
					s2 = s2*2.2;

					col.xyz = fixed3(lerp((float3)_Color, (float3)_Light, pow(s1, 60.0))*s1);
					col.xyz += fixed3(lerp(lerp((float3)_Base, (float3)_Dark, s2*s2), (float3)_Light, pow(s2, 10.0))*s2);
				}

				fixed c = length(pr)*_Zoom;
				pr = normalize(mul(m, pr));//-ray;
				fixed s = max(0.0, (1.0 - abs(_Radius*_Zoom - c) / _RayString));//*RayProj;
				fixed nd = noise4q(float4(pr+float3(83.23, 34.34, 67.453)*_Seed, -fragTime*_SpeedRing + c))*2.0;
				nd = pow(nd, 2.0);
				fixed dr=1.0;
				if (sphere < sqRadius) dr = sphere / sqRadius;
				pr*=10.0;
				fixed n = noise4q(float4(pr+ float3(83.23, 34.34, 67.453)*_Seed, -fragTime*_SpeedRing + c))*dr;
				pr*=5.0;
				fixed ns = noise4q(float4(pr+ float3(83.23, 34.34, 67.453)*_Seed, -fragTime*_SpeedRay + c))*2.0*dr;
				if (_Detail>=3.0) {
					pr *= 3.0;
					ns = ns*0.5+noise4q(float4(pr+ float3(83.23, 34.34, 67.453)*_Seed, -fragTime*_SpeedRay + 0))*dr;
				}
				n = pow(n, _Rays)*pow(nd,_RayRing)*ns;
				fixed s3 = pow(s, _Glow) + pow(s, _RayGlow)*n;

				if (sphere < sqRadius) col.w = 1.0-s3*dr;
				if (sqDist>sqRadius)
					col.xyz = col.xyz+lerp((fixed3)_Ray, (fixed3)_RayLight, s3*s3*s3)*s3; //pow(s3, 3.0)
				
				col = clamp(col, 0, 1);

#if UNITY_5_0
				// apply fog
				UNITY_APPLY_FOG(i.fogCoord, col);
#endif
				return col;
			}
			ENDCG
		}
	}
}
*/

</script>

<!-- https://www.shadertoy.com/view/llG3RD -->
<script type="shader" id="voxeltowers">
// Shader by Zanzlanz ;)
// You can freely use and alter this shader (please give credit of course).

const float worldSize = 150.0;
const float pi = 3.1415926536;
const vec3 skyColor = vec3(22.0/255.0, 86.0/255.0, 129.0/255.0);

vec3 cam;
vec3 camRot;
float tick = 0.0;

// One of my favorite utilities :)
float mod2(float a, float b) {
	float c = mod(a, b);
	return (c < 0.0) ? c + b : c;
}

// For coloring blocks, but current not used
float rand2(vec2 co){
    return fract(sin(dot(co.xy*.01, vec2(25.5254, -15.5254))) * 52352.323);
}

// For block heights
float rand(vec2 co){
	return min(rand2(co)+sin(co.x*.1-co.y*.5+tick*.2)*.1+cos(co.y*.3+co.x*.5+tick*.4)*.1,
               .87+length(vec2(mod2(co.x-cam.x+worldSize*.5, worldSize)-worldSize*.5, mod2(co.y-cam.z+worldSize*.5, worldSize)-worldSize*.5))*.1);
}

vec3 getFG(vec3 co) {
    if(co.y/worldSize*3.0 < rand(vec2(co.x, co.z))) {
        //Uncomment below for randomly colored blocks
        //return vec3(rand(vec2(co.x+co.y+1., co.z+2.)), rand(vec2(co.x+3., co.z+co.y+4.)), rand(vec2(co.x+co.y+5., co.z+co.y+6.)));
    
        return vec3(1.0, 1.0, 1.0);
    }
    return vec3(-1, 0, 0);
}
vec4 raycast(vec3 start, vec3 castSpeedStart) {
	vec3 castSpeed = vec3(castSpeedStart.xyz);
    float skyAmount = castSpeed.y*.4;
    
	vec4 returnValue = vec4(skyColor*skyAmount, 0.0);
	vec3 ray = vec3(start.xyz);
	
    float shadowing = 1.0;
    vec3 currentCast = vec3(floor(ray));
    
    int collideWith = 0;
	
    bool skipLoop = false;
    for(float its=0.0; its<200.0; its++) {
        if(skipLoop) {
            skipLoop = false;
            continue;
        }
		if(currentCast.y<0.0 || currentCast.y>=worldSize*.4) {
			returnValue = vec4(skyColor*skyAmount, 0);
			break;
		}
        
		vec3 inBlock = getFG(vec3(mod(currentCast.x, worldSize), mod(currentCast.y, worldSize), mod(currentCast.z, worldSize)));
		if(inBlock.x != -1.0) {
            float finalShadowing = clamp(shadowing-length(ray-start)/60.0, 0.0, 1.0);
            
            if	   (collideWith == 0) finalShadowing *= .5;
            else if(collideWith == 1) finalShadowing *= .7;
            else if(collideWith == 2) finalShadowing *= .3;
            else if(collideWith == 3) finalShadowing *= .8;
          	else if(collideWith == 4) finalShadowing *= .6;
            else if(collideWith == 5) finalShadowing *= .4; // Not sure a better way to do this at the moment

            returnValue = vec4(inBlock*finalShadowing+(1.0-finalShadowing)*skyColor*skyAmount, 0.0 );
            break;
		} // Here is also where I used to do reflections and fun stuff... recursively though
        
        // These last three IFs are checking if the ray passes the next voxel plane
		if(castSpeed.x != 0.0) {
			float t = ( floor(currentCast.x+clamp(sign(castSpeed.x), 0.0, 1.0)) -ray.x)/castSpeed.x;
			vec3 cast1Tmp = ray+castSpeed*t;
			if(cast1Tmp.y>=currentCast.y && cast1Tmp.y<=currentCast.y+1.0 && cast1Tmp.z>=currentCast.z && cast1Tmp.z<=currentCast.z+1.0) {
				ray = cast1Tmp;
				currentCast.x += sign(castSpeed.x);
				collideWith = (castSpeed.x>0.0?0:1);
                skipLoop = true;
				continue;
			}
		}
		if(castSpeed.y != 0.0) {
			float t = ( floor(currentCast.y+clamp(sign(castSpeed.y), 0.0, 1.0)) -ray.y)/castSpeed.y;
			vec3 cast1Tmp = ray+castSpeed*t;
			if(cast1Tmp.x>=currentCast.x && cast1Tmp.x<=currentCast.x+1.0 && cast1Tmp.z>=currentCast.z && cast1Tmp.z<=currentCast.z+1.0) {
				ray = cast1Tmp;
				currentCast.y += sign(castSpeed.y);
				collideWith = (castSpeed.y>0.0?2:3);
                skipLoop = true;
				continue;
			}
		}
		if(castSpeed.z != 0.0) {
			float t = ( floor(currentCast.z+clamp(sign(castSpeed.z), 0.0, 1.0)) -ray.z)/castSpeed.z;
			vec3 cast1Tmp = ray+castSpeed*t;
			if(cast1Tmp.y>=currentCast.y && cast1Tmp.y<=currentCast.y+1.0 && cast1Tmp.x>=currentCast.x && cast1Tmp.x<=currentCast.x+1.0) {
				ray = cast1Tmp;
				currentCast.z += sign(castSpeed.z);
				collideWith = (castSpeed.z>0.0?4:5);
                skipLoop = true;
				continue;
			}
		}
	}
	returnValue.w = length(ray-start);
    float val = 1.0-returnValue.w/70.0;
	return vec4(returnValue.xyz*val, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	vec4 f = fragCoord;
    vec2 f2 = vec2(f.x, iResolution.y-f.y);
	vec2 uv = f.xy / iResolution.xy;
    tick = iGlobalTime;
    
    cam.x = worldSize/2.0+sin(tick/worldSize*14.0*pi)*10.0;
    cam.y = worldSize-100.0;
    cam.z = worldSize/2.0+tick*8.0;
    
    camRot = vec3(sin(tick/worldSize*22.0*pi)*.5+.5, 0.0, sin(tick/worldSize*14.0*pi)*.5);
    
    vec3 castDir = vec3(0, 0, 0);
    vec3 cast1 = vec3(cam+.5);
    vec3 cast2 = vec3(0, 0, 0);

    // Getting raycast speed based on the pixel in the frustrum
    castDir.x = f2.x/iResolution.y*5.0-(iResolution.x-iResolution.y)/2.0/iResolution.y*5.0-.5*5.0;
    castDir.y = (.5-f2.y/iResolution.y)*5.0;
    castDir.z = 3.0;

    // Rotating camera in 3D
    cast2.x = castDir.x*(cos(camRot.y)*cos(camRot.z))+castDir.y*(cos(camRot.z)*sin(camRot.x)*sin(camRot.y)-cos(camRot.x)*sin(camRot.z))+castDir.z*(cos(camRot.x)*cos(camRot.z)*sin(camRot.y)+sin(camRot.x)*sin(camRot.z));
    cast2.y = castDir.x*(cos(camRot.y)*sin(camRot.z))+castDir.y*(cos(camRot.x)*cos(camRot.z)+sin(camRot.x)*sin(camRot.y)*sin(camRot.z))-castDir.z*(cos(camRot.z)*sin(camRot.x)-cos(camRot.x)*sin(camRot.y)*sin(camRot.z));
    cast2.z = -castDir.x*(sin(camRot.y))+castDir.y*(cos(camRot.y)*sin(camRot.x))+castDir.z*(cos(camRot.x)*cos(camRot.y));
 
    vec3 castResult = raycast(cast1, cast2).xyz;
    
    fragColor = vec4(clamp(castResult, 0.0, 1.0), 1.0);
}
</script>

<!-- https://www.shadertoy.com/view/4s2Sz3 -->
<script type="shader" id="trainride">
// "Train Ride" by dr2 - 2014
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

// Borrows ideas and techniques published on Shadertoy.
// Thanks everyone for a great learning resource!!

const vec4 cHashA4 = vec4 (0., 1., 57., 58.);
const vec3 cHashA3 = vec3 (1., 57., 113.);
const float cHashM = 43758.54;

float Hashfv2 (vec2 p)
{
  return fract (sin (dot (p, cHashA3.xy)) * cHashM);
}

vec4 Hashv4f (float p)
{
  return fract (sin (p + cHashA4) * cHashM);
}

float Noisefv2 (vec2 p)
{
  vec2 i = floor (p);
  vec2 f = fract (p);
  f = f * f * (3. - 2. * f);
  vec4 t = Hashv4f (dot (i, cHashA3.xy));
  return mix (mix (t.x, t.y, f.x), mix (t.z, t.w, f.x), f.y);
}

float Noisefv3 (vec3 p)
{
  vec3 i = floor (p);
  vec3 f = fract (p);
  f = f * f * (3. - 2. * f);
  float q = dot (i, cHashA3);
  vec4 t1 = Hashv4f (q);
  vec4 t2 = Hashv4f (q + cHashA3.z);
  return mix (mix (mix (t1.x, t1.y, f.x), mix (t1.z, t1.w, f.x), f.y),
     mix (mix (t2.x, t2.y, f.x), mix (t2.z, t2.w, f.x), f.y), f.z);
}

vec3 Noisev3v2 (vec2 p)
{
  vec2 i = floor (p);
  vec2 f = fract (p);
  vec2 ff = f * f;
  vec2 u = ff * (3. - 2. * f);
  vec2 uu = 30. * ff * (ff - 2. * f + 1.);
  vec4 h = Hashv4f (dot (i, cHashA3.xy));
  return vec3 (h.x + (h.y - h.x) * u.x + (h.z - h.x) * u.y +
     (h.x - h.y - h.z + h.w) * u.x * u.y, uu * (vec2 (h.y - h.x, h.z - h.x) +
     (h.x - h.y - h.z + h.w) * u.yx));
}

float SmoothMin (float a, float b, float r)
{
  float h = clamp (0.5 + 0.5 * (b - a) / r, 0., 1.);
  return mix (b, a, h) - r * h * (1. - h);
}

vec3 RgbToHsv (vec3 c)
{
  vec4 p = mix (vec4 (c.bg, vec2 (-1., 2./3.)), vec4 (c.gb, vec2 (0., -1./3.)),
     step (c.b, c.g));
  vec4 q = mix (vec4 (p.xyw, c.r), vec4 (c.r, p.yzx), step (p.x, c.r));
  float d = q.x - min (q.w, q.y);
  const float e = 1.e-10;
  return vec3 (abs (q.z + (q.w - q.y) / (6. * d + e)), d / (q.x + e), q.x);
}

vec3 HsvToRgb (vec3 c)
{
  vec3 p = abs (fract (c.xxx + vec3 (1., 2./3., 1./3.)) * 6. - 3.);
  return c.z * mix (vec3 (1.), clamp (p - 1., 0., 1.), c.y);
}

vec3 BrickSurfCol (vec2 p) {
  vec2 q = p * (1. / 20.);
  vec2 i = floor (q);
  if (2. * floor (i.y / 2.) != i.y) {
    q.x += 0.5;
    i = floor (q);
  }
  q = smoothstep (0.015, 0.025, abs (fract (q + 0.5) - 0.5));
  return (1. + Noisefv2 (10. * p)) * (0.3 + 0.7 * q.x * q.y) *
     (0.3 + 0.2 * sin (2. * Hashfv2 (i) + vec3 (1., 1.2, 1.4)));
}

vec3 BrickCol (vec3 p, vec3 n)
{
  n = abs (n);
  p *= 150.;
  return BrickSurfCol (p.zy) * n.x + BrickSurfCol (p.xz) * n.y +
     BrickSurfCol (p.xy) * n.z;
}

float PrBoxDf (vec3 p, vec3 b)
{
  vec3 d = abs (p) - b;
  return min (max (d.x, max (d.y, d.z)), 0.) + length (max (d, 0.));
}

float PrOBoxDf (vec3 p, vec3 b)
{
  return length (max (abs (p) - b, 0.));
}

float PrCylDf (vec3 p, vec2 b)
{
  return max (length (p.xz) - b.x, abs (p.y) - b.y);
}

mat3 trainMat[5], trMat;
vec3 trainPos[5], trPos, qTrWin, sunDir, sunCol, moonDir, moonCol;
vec2 trkOffset;
float tCur, dirTrWin;
int idObj;
bool isNight;
const float dstFar = 250.;

vec3 TrackPath (float t)
{
  float y = 0.01 + sin (0.021 * t) * sin (1. + 0.023 * t);
  return vec3 (15. * sin (0.035 * t) * sin (0.012 * t) * cos (0.01 * t) +
     11. * sin (0.0032 * t) + 100. * trkOffset.x, 2. * y * y, t);
}

float GrndHt (vec2 p, int hiRes)
{
  const vec2 vRot = vec2 (1.4624, 1.6721);
  vec2 q = p * 0.06;
  float w = 0.75 * Noisefv2 (0.25 * q) + 0.15;
  w *= 36. * w;
  vec2 vyz = vec2 (0.);
  float ht = 0.;
  for (int j = 0; j < 10; j ++) {
    vec3 v = Noisev3v2 (q);
    vyz += v.yz;
    ht += w * v.x / (1. + dot (vyz, vyz));
    if (j == 4) {
      ht += 50. * pow (Noisefv2 (0.003 * q), 4.) - 1.;
      if (hiRes == 0) break;
    }
    w *= -0.37;      
    q *= mat2 (vRot.x, vRot.y, - vRot.y, vRot.x);
  }
  vec3 pt = TrackPath (p.y);
  pt.y += 0.07 * Noisefv2 (0.0001 * p) + 0.04 * Noisefv2 (2.1 * p) +
     0.03 * Noisefv2 (2.3 * p.yx);
  float g = smoothstep (4., 35., abs (p.x - pt.x));
  return SmoothMin (ht, pt.y * (1. - g) + ht * g, 0.5);
}

vec3 GrndNf (vec3 p, float d)
{
  float ht = GrndHt (p.xz, 1);
  vec2 e = vec2 (max (0.01, 0.00001 * d * d), 0.);
  return normalize (vec3 (ht - GrndHt (p.xz + e.xy, 1), e.x,
     ht - GrndHt (p.xz + e.yx, 1)));
}

vec4 GrndCol (vec3 p, vec3 n)
{
  const vec3 gCol1 = vec3 (0.6, 0.7, 0.7), gCol2 = vec3 (0.2, 0.1, 0.1),
     gCol3 = vec3 (0.4, 0.3, 0.3), gCol4 = vec3 (0.1, 0.2, 0.1),
     gCol5 = vec3 (0.7, 0.7, 0.8), gCol6 = vec3 (0.05, 0.3, 0.03),
     gCol7 = vec3 (0.02, 0.1, 0.02), gCol8 = vec3 (0.1, 0.08, 0.);
  vec2 q = p.xz;
  float f, d;
  float cSpec = 0.;
  f = 0.5 * (clamp (Noisefv2 (0.1 * q), 0., 1.) +
      0.8 * Noisefv2 (0.2 * q + 2.1 * n.xy + 2.2 * n.yz));
  vec3 col = f * mix (f * gCol1 + gCol2, f * gCol3 + gCol4, 0.65 * f);
  if (n.y < 0.5) {
    f = 0.4 * (Noisefv2 (0.4 * q + vec2 (0., 0.57 * p.y)) +
       0.5 * Noisefv2 (6. * q));
    d = 4. * (0.5 - n.y);
    col = mix (col, vec3 (f), clamp (d * d, 0.1, 1.));
    cSpec += 0.1;
  }
  if (p.y > 22.) {
    if (n.y > 0.25) {
      f = clamp (0.07 * (p.y - 22. - Noisefv2 (0.2 * q) * 15.), 0., 1.);
      col = mix (col, gCol5, f);
      cSpec += f;
    }
  } else {
    if (n.y > 0.45) {
      vec3 c = (n.y - 0.3) * (gCol6 * vec3 (Noisefv2 (0.4 * q),
         Noisefv2 (0.34 * q), Noisefv2 (0.38 * q)) + gCol7);
      col = mix (col, c, smoothstep (0.45, 0.65, n.y) *
         (1. - smoothstep (15., 22., p.y - 1.5 + 1.5 * Noisefv2 (0.2 * q))));
    }
    if (p.y < 0.65 && n.y > 0.4) {
      d = n.y - 0.4;
      col = mix (col, d * d + gCol8, 2. * clamp ((0.65 - p.y -
         0.35 * (Noisefv2 (0.4 * q) + 0.5 * Noisefv2 (0.8 * q) +
         0.25 * Noisefv2 (1.6 * q))), 0., 0.3));
      cSpec += 0.1;
    }
  }
  return vec4 (col, cSpec);
}

float GrndRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, h, s, sLo, sHi;
  s = 0.;
  sLo = 0.;
  dHit = dstFar;
  for (int j = 0; j < 150; j ++) {
    p = ro + s * rd;
    h = p.y - GrndHt (p.xz, 0);
    if (h < 0.) break;
    sLo = s;
    s += max (0.15, 0.4 * h) + 0.008 * s;
    if (s > dstFar) break;
  }
  if (h < 0.) {
    sHi = s;
    for (int j = 0; j < 10; j ++) {
      s = 0.5 * (sLo + sHi);
      p = ro + s * rd;
      h = step (0., p.y - GrndHt (p.xz, 0));
      sLo += h * (s - sLo);
      sHi += (1. - h) * (s - sHi);
    }
    dHit = sHi;
  }
  return dHit;
}

float WaterHt (vec3 p)
{
  p *= 0.06;
  float ht = 0.;
  const float wb = 1.414;
  float w = 0.1 * wb;
  for (int j = 0; j < 7; j ++) {
    w *= 0.5;
    p = wb * vec3 (p.y + p.z, p.z - p.y, 2. * p.x);
    ht += w * abs (Noisefv3 (p) - 0.5);
  }
  return ht;
}

vec3 WaterNf (vec3 p, float d)
{
  float ht = WaterHt (p);
  vec2 e = vec2 (max (0.01, 0.001 * d * d), 0.);
  return normalize (vec3 (ht - WaterHt (p + e.xyy), e.x, ht - WaterHt (p + e.yyx)));
}

vec3 SkyBg (vec3 rd)
{
  const vec3 sbCol1 = vec3 (0.05, 0.05, 0.15), sbCol2 = vec3 (0.2, 0.25, 0.5);
  vec3 col;
  if (isNight) col = 0.3 * clamp (sbCol1 - 0.12 * rd.y * rd.y, 0., 1.);
  else col = sbCol2 + 0.2 * sunCol * pow (1. - max (rd.y, 0.), 5.);
  return col;
}

vec3 SkyCol (vec3 ro, vec3 rd)
{
  const vec3 sCol1 = vec3 (0.06, 0.04, 0.02), sCol2 = vec3 (0.03, 0.03, 0.06),
     mBrite = vec3 (-0.5, -0.4, 0.77);
  const float skyHt = 150.;
  vec3 col;
  float cloudFac;
  if (rd.y > 0.) {
    ro.x += 0.5 * tCur;
    vec2 p = 0.02 * (rd.xz * (skyHt - ro.y) / rd.y + ro.xz);
    float w = 0.8;
    float f = 0.;
    for (int j = 0; j < 4; j ++) {
      f += w * Noisefv2 (p);
      w *= 0.5;
      p *= 2.;
    }
    cloudFac = clamp (5. * (f - 0.4) * rd.y - 0.1, 0., 1.);
  } else cloudFac = 0.;
  if (isNight) {
    vec3 bgCol = SkyBg (rd) + sCol1 * pow (clamp (dot (rd, moonDir), 0., 1.), 30.);
    col = bgCol;
    const float moonRad = 0.04;
    vec3 vn;
    bool mHit = false;
    float bs = - dot (rd, moonDir);
    float cs = dot (moonDir, moonDir) - moonRad * moonRad;
    float ts = bs * bs - cs;
    if (ts > 0.) {
      ts = - bs - sqrt (ts);
      if (ts > 0.) {
        vn = normalize ((ts * rd - moonDir) / moonRad);
        mHit = true;
      }
    }
    if (mHit) {
      col += 1.4 * moonCol * clamp (dot (mBrite, vn) *
         (0.3 + Noisefv3 (5. * vn)), 0., 1.);
    } else {
      vec3 st = (rd + vec3 (1.));
      for (int j = 0; j < 10; j ++) {
        st = 11. * abs (st) / dot (st, st) - 3.;
      }
      col += min (1., 1.5e-6 * pow (min (16., length (st)), 4.5));
    }
    col = mix (col, sCol2, cloudFac) + bgCol;
  } else {
    float s = max (dot (rd, sunDir), 0.);
    col = SkyBg (rd) + sunCol * (0.35 * pow (s, 6.) +
       0.65 * min (pow (s, 256.), 0.3));
    col = mix (col, vec3 (0.55), cloudFac);
  }
  return col;
}

float TrainDf (vec3 p, float dHit, float dir)
{
  const float eRad = 0.25;
  vec3 q;
  float d;
  q = p;
  if (dir == 0.) {
    q.y -= 0.15;
    d = length (max (abs (q) - vec3 (0.42, 0.25, 0.95), 0.)) - eRad;
  } else {
    q.yz += vec2 (2.6, 0.7 * dir);
    d = length (vec4 (max (abs (q.x) - 0.45, 0.), max (2.5 - q.y, 0.),
       max (- q.z * dir, 0.),
       max (length (q.yz + vec2 (0., - 0.2 * dir)) - 3., 0.))) - eRad;
  }
  if (d < dHit) {
    dHit = d;  idObj = 21;
    if (dir == 0.) q.y -= 0.1;
    else q.y -= 2.85;
    qTrWin = abs (q);
    dirTrWin = dir;
  }
  q = vec3 (p.y + 0.32, abs (p.x) - 0.46, p.z + 0.4);
  vec2 ww = vec2 (0.12 - sign (q.y) * 0.02, 0.04);
  d = min (PrCylDf (q, ww), PrCylDf (q - vec3 (0., 0., 1.), ww));
  if (d < dHit) {
    dHit = d;  idObj = 22;
  }
  if (dir != 0.) {
    q = p;
    if (dir > 0.) {
      q.x = abs (q.x) - 0.2;
      q.yz += vec2 (0.2, -1.6);
      d = PrCylDf (q.xzy, vec2 (0.05, 0.1));
      if (d < dHit) {
        dHit = d;  idObj = 23;
      }
    } else {
      q.yz += vec2 (0.15, 1.6);
      d = PrCylDf (q.xzy, vec2 (0.07, 0.1));
      if (d < dHit) {
        dHit = d;  idObj = 24;
      }
    }
  }
  return dHit;
}

float RailDf (vec3 p, float dHit)
{
  vec2 w = vec2 (abs (p.x) - 0.5, p.y + 0.57);
  float d = min (length (max (abs (w - vec2 (0., 0.14)) - vec2 (0.02), 0.)),
     SmoothMin (length (max (abs (w - vec2 (0., 0.08)) - vec2 (0.01, 0.08), 0.)),
     length (max (abs (w - vec2 (0., -0.02)) - vec2 (0.04), 0.)), 0.06));
  if (d < dHit) {
    dHit = d;  idObj = 10;
  }
  vec3 q = vec3 (p.x, p.y + 0.7, mod (p.z, 2.4) - 1.2);
  d = PrOBoxDf (q, vec3 (0.75, 0.03, 0.15));
  if (d < dHit) {
    dHit = d;  idObj = 11;
  }
  return dHit;
}

float BridgeDf (vec3 p, float dHit, float hg)
{
  vec3 q = p;
  float d = max (abs (q.x) - 0.85, q.y + 0.68);
  q.y += 4.5;
  q.z = mod (q.z + 1.3, 2.6) - 1.3;
  d = max (max (d, - max (length (q.yz +
     vec2 (4. * clamp (q.y / 4., -0.5, 0.5), 0.)) - 5.5, abs (q.z) - 0.9)), - hg);
  if (d < dHit) {
    dHit = d;  idObj = 12;
  }
  return dHit;
}

float PlatformDf (vec3 p, float dHit, float hg)
{
  vec3 q = vec3 (p.x, p.y, mod (p.z, 150.) - 75.);
  vec3 qq = q + vec3 (-1.9, -0.4, 0.);
  float d = min (min (PrBoxDf (vec3 (abs (q.x) - 1.7, q.y + 0.5, q.z),
     vec3 (0.7, 0.05, 5.)), max (PrBoxDf (qq, vec3 (0.1, 0.7, 2.)),
     - PrBoxDf (qq, vec3 (0.15, 0.5, 1.5)))),
     max (PrCylDf (vec3 (abs (abs (q.x) - 1.7) - 0.4, q.y + 4.5, abs (q.z) - 4.4),
     vec2 (0.13, 4.)), - hg));
  if (d < dHit) {
    dHit = d;  idObj = 13;
  }
  d = PrCylDf (q + vec3 (-1.9, -1.2, 0.), vec2 (0.1, 0.06));
  if (d < dHit) {
    dHit = d;  idObj = 14;
  }
  return dHit;
}

float ObjDf (vec3 p)
{
  float dHit = dstFar;
  dHit = TrainDf (trainMat[0] * (p - trainPos[0]), dHit, -1.);
  dHit = TrainDf (trainMat[1] * (p - trainPos[1]), dHit, 0.);
  dHit = TrainDf (trainMat[2] * (p - trainPos[2]), dHit, 0.);
  dHit = TrainDf (trainMat[3] * (p - trainPos[3]), dHit, 0.);
  dHit = TrainDf (trainMat[4] * (p - trainPos[4]), dHit, 1.);
  float hg = p.y;
  p.xy -= TrackPath (p.z).xy;
  p.y -= 0.9;
  dHit = RailDf (p, dHit);
  dHit = BridgeDf (p, dHit, hg);
  dHit = PlatformDf (p, dHit, hg);
  return dHit;
}

float ObjRay (vec3 ro, vec3 rd)
{
  const float dTol = 0.001;
  float d;
  float dHit = 0.;
  for (int j = 0; j < 180; j ++) {
    d = ObjDf (ro + dHit * rd);
    dHit += d;
    if (d < dTol || dHit > dstFar) break;
  }
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  const vec3 e = vec3 (0.001, -0.001, 0.);
  float v0 = ObjDf (p + e.xxx);
  float v1 = ObjDf (p + e.xyy);
  float v2 = ObjDf (p + e.yxy);
  float v3 = ObjDf (p + e.yyx);
  return normalize (vec3 (v0 - v1 - v2 - v3) + 2. * vec3 (v1, v2, v3));
}

vec4 ObjCol (vec3 p, vec3 n)
{
  vec3 col = vec3 (0.);
  float sp;
  float dkFac = 1.;
  if (idObj >= 10 && idObj <= 19) {
    sp = 0.;
    if (idObj == 10) {
      col = vec3 (0.3);
      sp = 1.;
    } else if (idObj == 11) {
      col = vec3 (0.12, 0.08, 0.04) * (1.5 + Noisefv2 (30. * p.xz));
    } else if (idObj == 12) {
      if (n.y > 0.9) col = vec3 (0.025) * (2. + Noisefv2 (15. * p.xz));
      else col = 0.1 * BrickCol (0.5 * p, n);
      dkFac = 0.4;
    } else if (idObj == 13) {
      p.xy -= TrackPath (p.z).xy;
      col = vec3 (0.26, 0.22, 0.2) * BrickCol (0.3 * p, n);
      dkFac = 0.2;
    } else if (idObj == 14) {
      if (isNight) col = vec3 (1., 0., 0.);
      else col = vec3 (0.7, 1., 0.7);
    }
  } else if (idObj >= 21 && idObj <= 29) {
    sp = 0.7;
    if (idObj == 21) {
      col = vec3 (0.7, 0.2, 0.2);
      dkFac = 0.02;
      sp = 0.7;
    } else if (idObj == 22) {
      col = vec3 (0.7, 0.3, 0.);
      dkFac = 0.1;
    } else if (idObj == 23) {
      col = vec3 (1., 0., 0.);
    } else if (idObj == 24) {
      if (isNight) col = vec3 (1.);
      else col = vec3 (1., 1., 0.);
    }
  }
  if (isNight) col *= dkFac;
  return vec4 (col, sp);
}

void TrainCarPM (float t)
{
  vec3 vp, vd, ve, vf;
  trPos = TrackPath (tCur + t);
  vp = TrackPath (tCur + t + 0.1) - trPos;
  vd = - normalize (vec3 (vp.x, 0., vp.z));
  ve = normalize (vec3 (0., vp.yz));
  trPos.y += 0.9;
  trMat = mat3 (vec3 (1., 0., 0.), vec3 (0., ve.z, - ve.y), ve) *
      mat3 (vec3 (- vd.z, 0., vd.x), vec3 (0., 1., 0.), vd);
}

vec3 ShowScene (vec3 ro, vec3 rd, vec2 vDir)
{
  const float eps = 0.01;
  vec4 col4;
  vec3 col, vn;
  float f;
  vec3 roo = ro;
  float dstHit = dstFar;
  float dstGrnd = GrndRay (ro, rd);
  idObj = 0;
  float dstObj = ObjRay (ro, rd);
  int idObjT = idObj;
  float refFac = 1.;
  if (dstGrnd < dstObj && ro.y + dstGrnd * rd.y < 0.) {
    float dw = - ro.y / rd.y;
    ro += dw * rd;
    rd = reflect (rd, WaterNf (ro, dw));
    ro += eps * rd;
    dstGrnd = GrndRay (ro, rd);
    idObj = 0;
    dstObj = ObjRay (ro, rd);
    idObjT = idObj;
    refFac *= 0.6;
  }
  bool isLit = true;
  bool isGrnd = false;
  if (dstObj < dstGrnd) {
    if (idObjT == 21 && (qTrWin.y < 0.2 &&
       (qTrWin.x < 0.45 || qTrWin.x > 0.65) || dirTrWin == 0. &&
       qTrWin.x < 0.3 && qTrWin.z < 0.7)) idObjT = 20;
    ro += dstObj * rd;
    vn = ObjNf (ro);
    if (idObjT == 20) {
      rd = reflect (rd, vn);
      ro += eps * rd;
      dstGrnd = GrndRay (ro, rd);
      if (dstGrnd < dstFar) {
        ro += dstGrnd * rd;
        dstHit = dstGrnd;
        refFac *= 0.4;
        isGrnd = true;
      } else {
        col = refFac * SkyCol (ro, rd);
        isLit = false;
      }
    } else {
      col4 = ObjCol (ro, vn);
      col = refFac * col4.xyz;
      if (! isNight) {
        col *=  sunCol * (0.3 + (max (0., dot (sunDir, vn)) +
           col4.w * pow (max (dot (rd, reflect (sunDir, vn)), 0.), 20.)));
      } else {
        if (idObjT == 21) col *= moonCol * (0.6 +
           col4.w * pow (max (dot (rd, reflect (moonDir, vn)), 0.), 40.));
      }
      dstHit = dstObj;
      isLit = ! (idObjT == 14 || (idObjT >= 20 && idObjT <= 29));
    }
  } else {
    vec3 rp = ro + dstGrnd * rd;
    if (refFac < 1.) dstHit = length (rp - roo);
    else dstHit = dstGrnd;
    if (dstHit < dstFar) {
      ro = rp;
      isGrnd = true;
    } else {
      col = refFac * SkyCol (ro, rd);
      isLit = false;
    }
  }
  if (isGrnd) {
    vn = GrndNf (ro, dstHit);
    col4 = GrndCol (ro, vn);
    col = col4.xyz * refFac;
    if (! isNight) {
      f = dot (sunDir, vn);
      col = sunCol * mix (col * (max (f, 0.) + 0.1), vec3 (refFac),
         step (f, 0.) * col4.w * pow (max (dot (reflect (sunDir, vn), rd), 0.), 3.));
    }
  }
  if (dstHit < dstFar) {
    f = dstHit / dstFar;
    col = mix (col, refFac * SkyBg (rd), clamp (1.03 * f * f, 0., 1.));
  }
  col = sqrt (clamp (col, 0., 1.));
  if (isNight && isLit) {
    vec3 vLight = ro - trainPos[0];
    vLight.z -= 2.2;
    float dstLightI = 1. / length (vLight);
    vLight *= dstLightI;
    f = dot (vLight.xz, vDir);
    if (dstLightI > 0.02 && f > 0.4) {
      col *= (0.1 + pow (f, 8.)) * min (1., 100. * dstLightI * dstLightI);
    } else {
      col = RgbToHsv (col);
      col.y = 0.1;
      col.z *= col.z;
      col.z *= 0.3 * col.z;
      col = HsvToRgb (col);
    }
  }
  return clamp (col, 0., 1.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = 2. * fragCoord.xy / iResolution.xy - 1.;
  vec2 uvs = uv;
  uv.x *= iResolution.x / iResolution.y;
  trkOffset = vec2 (0.);
  float zmFac = 1.8;
  tCur = 15. * iGlobalTime + 100. * trkOffset.y;
  sunDir = normalize (vec3 (0.4, 0.5, 0.5));
  moonDir = normalize (vec3 (0.3, 0.25, 0.5));
  sunCol = vec3 (1., 0.9, 0.8);
  moonCol = vec3 (1., 0.9, 0.5);
  float dt = 0.3;
  isNight = mod (floor (tCur / 1000.), 2.) != 0.;
  float trStart = 12.;
  float trGap = 2.2;
  float tz;
  tz = tCur + trStart - 2. * trGap;
  vec2 vDir = normalize ((TrackPath (tz + dt).xz -
     TrackPath (tz - dt).xz) / (2. * dt));
  float dGap = sqrt (1. - vDir.x * vDir.x);
  TrainCarPM (trStart);
  trainPos[0] = trPos;  trainMat[0] = trMat;
  TrainCarPM (trStart - trGap * dGap);
  trainPos[1] = trPos;  trainMat[1] = trMat;
  TrainCarPM (trStart - (2. * trGap + 0.25) * dGap);
  trainPos[2] = trPos;  trainMat[2] = trMat;
  TrainCarPM (trStart - (3. * trGap + 0.5) * dGap);
  trainPos[3] = trPos;  trainMat[3] = trMat;
  TrainCarPM (trStart - (4. * trGap + 0.5) * dGap);
  trainPos[4] = trPos;  trainMat[4] = trMat;
  bool fixCam = mod (floor (tCur / 500.), 2.) == 0.;
  mat3 scMat;
  vec3 ro, rd, vd;
  if (fixCam) {
    tz = ceil (tCur / 100.) * 100.;
    ro = TrackPath (tz - 40.);
    float dx = 2. * mod (tz / 100., 2.) - 1.;
    ro.x += 13. * dx;
    float gh = GrndHt (ro.xz, 0);
    ro.xy += vec2 (-3. * dx, 3. + 0.1 * gh * gh);
    vd = normalize (TrackPath (tCur + 8.) - ro);
    vec3 u = - vd.y * vd;
    float f = 1. / sqrt (1. - vd.y * vd.y);
    scMat = mat3 (f * vec3 (vd.z, 0., - vd.x), f * vec3 (u.x, 1. + u.y, u.z), vd);
  } else {
    tz = tCur + trStart - 6. * trGap * dGap;
    ro = TrackPath (tz);
    ro.y += 4.;
    vd = TrackPath (tz + dt) - TrackPath (tz - dt);
    vd.y = 0.;
    vd = normalize (vd);
    scMat = mat3 (vd.z, 0., - vd.x, 0., 1., 0., vd);
  }
  rd = scMat * normalize (vec3 (uv, zmFac));
  vec3 col = ShowScene (ro, rd, vDir);
  uvs *= uvs * uvs;
  col = mix (vec3 (0.7), col, pow (max (0., 0.95 - length (uvs * uvs * uvs)), 0.3));
  fragColor = vec4 (col, 1.);
}
</script>

<!-- https://www.shadertoy.com/view/XlcSzM -->
<script type="shader" id="matroshka">
// Matroshka! - 2016 Martijn Steinrucken - BigWings
// countfrolic@gmail.com
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// 
// This effect matches the music. In order for it to be in sync, its best to restart
// the effect as soon as the music loads.
//
// Use the mouse to look around. Watch at least 30 seconds to see the whole effect!
// 
// I tried to create a painted look. To make the flowers and leaves move use the PSYCO define.
// A video of the effect can be found here:
// https://www.youtube.com/watch?v=0kbZzVolycw

// Because dolls are different sizes and they are leaning when they walk, 
// it can happen that we overstep into the next cell, causing gaps in the doll.
// This is why, in the marching loop, I make sure to always start a new cell at the cell boundary.
// Another way to fix this is to make the step size 0.6 x the doll distance but that obviously 
// makes the ray marching slower. I'm not sure which solution is faster because im at a steady
// 60fps for both solutions on my machine. 
// Some better performance metrics would really help!
//
// I sunk way too much time into this, time to move on to something else! I hope you like it!
//
// SONG: Skorge - Tetris Theme
// https://soundcloud.com/officialskorge/skorge-tetris-theme

// Use these to change the effect

//#define PSYCO
//#define TEXTUREMODE
#define INVERTMOUSE 1.
#define MAX_STEPS 150
#define MIN_DISTANCE 0.1
#define MAX_DISTANCE 100.
#define RAY_PRECISION 0.002

#define S(x,y,z) smoothstep(x,y,z)
#define B(x,y,z,w) S(x-z, x+z, w)*S(y+z, y-z, w)
#define sat(x) clamp(x,0.,1.)
#define SIN(x) (sin(x)*.5+.5)
#define COS(x) (cos(x)*.5+.5)

float X2(float x) { return x*x; }

vec3 mainCol = vec3(1.0, .2, .1);		// the main color
vec3 lastCol = vec3(.1,.3, .1);			// the last main color
vec3 secCol = vec3(.8, .6, .1);			// the secondary color
vec3 lineCol = vec3(1.1);				// the line color

vec3 grid = vec3(5., 10., 5.);			// grid of marching dolls
vec4 stones = vec4(.2, .3, .5, 2.);		// controls size and shape of stones

float SOLO;								// wether we are in solo mode or not	

const vec3 light = vec3(1., 1., 1.)*.577; 
const vec3 lf=vec3(1., 0., 0.);
const vec3 up=vec3(0., 1., 0.);
const vec3 fw=vec3(0., 0., 1.);
const float pi2 = 1.570796326794896619;
const float pi = 3.141592653589793238;
const float twopi = 6.283185307179586;

vec2 mouse;
vec3 bg; // global background color

float time;

float remap01(float a, float b, float t) {return (t-a)/(b-a);}
float L2(vec3 p) {return dot(p, p);}
float L2(vec2 p) {return dot(p, p);}

float N1( float x ) { return fract(sin(x)*5346.1764); }
float N2(vec2 p)
{	// Dave Hoskins - https://www.shadertoy.com/view/4djSRW
	vec3 p3  = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
float N2(float x, float y) { return N2(vec2(x, y)); }

vec3 N31(float p)		
{	
   vec3 p3 = fract(vec3(p) * vec3(443.897, 441.423, 437.195));
   p3 += dot(p3, p3.yzx+19.19);
   return fract((p3.xxy+p3.yzz)*p3.zyx); 
}

vec2 N21(float p)
{
	vec2 p2 = fract(vec2(p) * vec2(443.897, 441.423));
	p2 += dot(p2, p2.yx + 19.19);
    return fract((p2.xx+p2.yx)*p2.yy);

}

float Noise(vec2 uv) {
    // noise function I came up with
    // ... doesn't look exactly the same as what i've seen elswhere
    // .. seems to work though :)
    vec2 id = floor(uv);
    vec2 m = fract(uv);
    m = 3.*m*m - 2.*m*m*m;
    
    float top = mix(N2(id.x, id.y), N2(id.x+1., id.y), m.x);
    float bot = mix(N2(id.x, id.y+1.), N2(id.x+1., id.y+1.), m.x);
    
    return mix(top, bot, m.y);
}

float NoiseTex(vec2 uv, float seed, float octaves) {
    float v=0.;
    uv += N21(seed);
    
    for(float i=1.; i<=11.; i++) {
    	v += Noise(uv)/i;
        uv *= 2.;
        
        if(i>octaves) break;
    }
    
    return v*.5;
}


struct ray {
    vec3 o;
    vec3 d;
};

struct camera {
    vec3 p;			// the position of the camera
    vec3 forward;	// the camera forward vector
    vec3 left;		// the camera left vector
    vec3 up;		// the camera up vector
	
    vec3 center;	// the center of the screen, in world coords
    vec3 i;			// where the current ray intersects the screen, in world coords
    ray ray;		// the current ray: from cam pos, through current uv projected on screen
    vec3 lookAt;	// the lookat point
    float zoom;		// the zoom factor
};
camera cam;


void CameraSetup(vec2 uv, vec3 position, vec3 lookAt, float zoom) {
    cam.p = position;
    cam.lookAt = lookAt;
    cam.forward = normalize(cam.lookAt-cam.p);
    cam.left = cross(up, cam.forward);
    cam.up = cross(cam.forward, cam.left);
    cam.zoom = zoom;
    cam.center = cam.p+cam.forward*cam.zoom;
    cam.i = cam.center+cam.left*uv.x+cam.up*uv.y;
    cam.ray.o = cam.p;						// ray origin = camera position
    cam.ray.d = normalize(cam.i-cam.p);	// ray direction is the vector from the cam pos through the point on the imaginary screen
}


// DE functions from IQ
// https://www.shadertoy.com/view/Xds3zN

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float smax( float a, float b, float k )
{
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( a, b, h ) + k*h*(1.0-h);
}

float sdSphere( vec3 p, vec3 pos, float s ) { return length(p-pos)-s; }

float sSph( vec3 p, vec3 scale, float s )
{
    return (length(p/scale)-s)*min(scale.x, min(scale.y, scale.z));
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

mat3 RotY(float angle) {
	float s = sin(angle);
    float c = cos(angle);
    
    return mat3(c, 0., s,  0., 1., 0.,  -s, 0., c);
}


mat3 RotZ(float angle) {
	float s = sin(angle);
    float c = cos(angle);    
    
    return mat3(c, -s, 0.,  s, c, 0.,  0., 0., 1.);
}

struct de {
    // data type used to pass the various bits of information used to shade a de object
	float d;	// distance to the object
   	vec4 p;		// local coordinate pos (xyz)
    float m; 	// material
    vec2 uv;	// uv coordinates
    vec3 id;
    
    float t; // transition between inside and outside
    float open; 	// how far open the split matroshkas are
    float inside;	// wether its the inside matroshka. This whole struct is a mess... oww well
    float seed;	// seed used to generate random values
    
    
    // shading parameters
    vec3 pos;		// the world-space coordinate of the fragment
    vec3 nor;		// the world-space normal of the fragment
    vec3 rd;		// the world-space view dir of the fragment
    float fresnel;	
};
    
struct rc {
    // data type used to handle a repeated coordinate
	vec3 id;	// holds the floor'ed coordinate of each cell. Used to identify the cell.
    vec3 h;		// half of the size of the cell
    vec3 p;		// the repeated coordinate
};
    
rc Repeat(vec3 pos, vec3 size) {
	rc o;
    o.h = size*.5;					
    o.id = floor(pos/size);			// used to give a unique id to each cell
    o.p = mod(pos, size)-o.h;
    return o;
}


vec2 PolarCoords(vec2 uv) {
	// carthesian coords in polar coords out
    return vec2(atan(uv.x, uv.y), length(uv));
}

vec2 SpiralCoords(vec2 st, float turns) {
	// polar coords in... spiral coords out. Spiral coordinates are neat!
    st.x = st.x/twopi +.5;
    st.y *= turns;
    float s = st.y+st.x;
    float l = (floor(s)-st.x);
    float d = fract(s);
    return vec2(l, d);
}


float circ(vec2 uv, float x, float y, float aspect, float radius, float edge) {
	vec2 p = uv-vec2(x, y);
    p.x *= aspect;
    
    edge *= .02;
    radius *= radius;								// comparing to r^2 to avoid sqrt
    return S(radius+edge, radius-edge, dot(p, p));	// not sure if thats actually faster
}

float circ(inout vec4 base, vec2 uv, float x, float y, float aspect, float radius, float edge, vec3 col) {
    float alpha = circ(uv, x, y, aspect, radius, edge);
    base = mix(base, vec4(col, 1.), alpha);
    return alpha;
}

float square(vec2 uv, vec4 rect, float blur) {
	// returns 1 when uv is inside the square, 0 otherwise
    return B(rect.x, rect.z, blur, uv.x) * B(rect.y, rect.w, blur, uv.y);
}

vec2 within(vec2 uv, vec4 rect) {
	// converts a uv from a global coordinate to a rect coordinate
    return (uv.xy-rect.xy)/(rect.zw-rect.xy);
}

float TowerMask(vec2 uv, float blur) {
    uv.x = abs(uv.x-.5);
    
    float y = uv.y * 2.5;
    
    float c = exp(-y*y)*pow(sat(y), .6)*.8;
    c = S(c, c-blur, uv.x);
    
    float width = mix(.15, .35, S(-.3, -.6, uv.y));
    float tower = width+uv.y*uv.y*.05;
    
    tower = S(tower+.01+blur, tower, uv.x);
    tower *= S(0.5, 0.2, uv.y);
    
    c = max(c, tower);
    return c;
}

float Kremlin(vec2 uv) {
    float c = TowerMask(within(uv, vec4(0.35, 0.7,.63,1.1)), .1);
    c += TowerMask(within(uv, vec4(0.15, 0.5,.43,.8)), .1);
    c += TowerMask(within(uv, vec4(0.65, 0.5,.83,.8)), .1);
    c += TowerMask(within(uv, vec4(0.525, 0.3,.72,.8)), .1);
    c += TowerMask(within(uv, vec4(0.025, 0.25,.22,.6)), .1);
    c += TowerMask(within(uv, vec4(0.8, 0.25,.95,.5)), .15);
    c = sat(c);
    c *= S(.0, .4, uv.y);
    return c;
}

vec3 background(vec3 r, vec2 uv, float starBurst) {
    float u = dot(r, up)*.5+.5;
    vec3 upCol = vec3(1., .4, .1);
    vec3 col;
    
    float t = iGlobalTime*4.;			
    
    if(SOLO>.5){										// splitting shells	
        float colFade = S(.0, .1, fract(time));
        upCol = mix(lastCol, mainCol, colFade)*2.5;		// make the background match the doll color
    	col = mix(upCol*.05, upCol, u);
        
    	vec2 st = PolarCoords(uv);
        
        starBurst *= sat(sin(st.x*3.+t)) + sat(sin(st.x*4.+t*.7654));	// add starburst 
        col += starBurst*.5*B(.3, .7, .2, u);
        
        col *= col;
    } else {											// marching bg
        float x = atan(r.x, r.z);						// from -pi to pi	
		float y = pi*0.5-acos(r.y);  					// from -1/2pi to 1/2pi		
        
        col = upCol*u*2.;
        float a = sin(r.x);
    
        float beam = sat(sin(10.*x+a*y*5.+t));			// add light beams
        beam *= sat(sin(7.*x+a*y*3.5-t));
        float beam2 = sat(sin(42.*x+a*y*21.-t));
        beam2 *= sat(sin(34.*x+a*y*17.+t));
        beam += beam2;
        col *= 1.+beam*.1;
        
        col += dot(r, fw);								// light gradient from front
        
        vec4 r = vec4(-.3, .0, .3, .4);					// add kremlin!
        if(x>r.x && x<r.z && y>r.y && y<r.w) {
            col *= 1.-Kremlin(within(vec2(x, y), r))*.3;
        }
    }
    return col;
}

vec4 Eyes(vec2 uv, float seed) {
    
    if(uv.x<.5) {								// add seductive wink ;)
    	float a = pow(SIN(time*2.), 700.)*4.;
    	uv.y = (uv.y-.5)*(1.+a) + .5;
    }
    
    vec3 n = N31(seed+675.75864);
    vec3 green = vec3(.2, .6, .1);
    vec3 blue = vec3(.3, .3, .9);
    vec3 eyeCol = mix(green, blue, n.x)*(.7+n.y);
    vec4 eyes = vec4(0.);
    float ar = 2.3;
    float blur = .5;
    float size = .2;
    
    vec2 lp = vec2(.35, .5);
    vec2 rp = vec2(.65, .5);
    
    vec2 glint = vec2(.05);
    vec2 pupil = SOLO*(mouse-.5)*vec2(-.3, .3); 		// make her looking at you (SOLO mode only)
    
    float eyeMask = circ( eyes, uv, lp.x, lp.y, ar, size, blur, eyeCol);
	eyeMask += circ( eyes, uv, rp.x, rp.y, ar, size, blur, eyeCol);
    
    circ(eyes, uv, lp.x+pupil.x, lp.y-pupil.y, ar, size*.6, blur, vec3(.1)); //pupil
    circ(eyes, uv, lp.x-glint.x, lp.y+glint.y, ar, size*.5, blur*.5, vec3(1.)); //glint
    
    circ(eyes, uv, rp.x+pupil.x, rp.y-pupil.y, ar, size*.6, blur, vec3(.1)); //pupil
    circ(eyes, uv, rp.x-glint.x, rp.y+glint.y, ar, size*.5, blur*.5, vec3(1.)); //glint
    
    eyes.a = eyeMask;
    
    vec2 uv2 = vec2(.5-abs(uv.x-.5), uv.y);
    
    float eyeLine = circ(uv2, lp.x-.02, lp.y+.05, ar*.8, size*1.05, blur);
    eyeLine -= circ(uv2, lp.x-.02, lp.y-.03, ar*.8, size*1.05, blur);
    eyeLine = sat(eyeLine);
    eyes = mix(eyes, vec4(0.,0.,0.,1.), eyeLine);
   
    vec2 lash = vec2(lp.x-.15, lp.y+.27);
    float eyeLash = circ(uv2, lash.x, lash.y, ar, size, blur);
    eyeLash -= circ(uv2, lash.x+.005, lash.y+.05, ar, size, blur);
    eyeLash = sat(eyeLash);
    eyes = mix(eyes, vec4(0.,0.,0.,1.), eyeLash);
    
    lash += vec2(.1, .1);
    ar =3.;
    eyeLash = circ(uv2, lash.x, lash.y, ar, size, blur);
    eyeLash -= circ(uv2, lash.x+.005, lash.y+.05, ar, size, blur);
    eyeLash = sat(eyeLash);
    eyes = mix(eyes, vec4(0.,0.,0.,1.), eyeLash);
    
    return eyes;
}

vec4 Mouth(vec2 uv, float seed) {
	
    float smile = .3;//sin(iGlobalTime)*.5;;
    
    vec4 lipUpCol = vec4(1., .1, .1, 1.);
    vec4 insideCol =  vec4(1., 1., 1., 1.);
    
    uv.y -= .5;
    uv.x = abs(uv.x*2.-1.);	// mirror in the middle
    
    uv *= 1.5;
    
    float upMid = .5-pow((uv.x-.25)*2., 2.);
    float upSide = pow(1.-uv.x, .5)*.25;
    float upper = smax(upMid, upSide, .2);
    
    float lowMid = uv.x*uv.x-.5;
    float lowSide = sqrt(1.-uv.x)/-5.;
    
    float lower = smin(lowMid, lowSide, .2);
    
    float curve = uv.x*uv.x*smile;
    
    vec4 col = lipUpCol*B(lower+curve, upper+curve,.05, uv.y);
    col = mix(col, insideCol, circ(uv, 0., curve, .2, .1, .1));
    
    return col;
}

vec4 Hair(vec2 uv, float seed) {
    vec3 n = N31(seed - 845.32);
    vec3 hair1Col = vec3(.4, .25, .15);
    vec3 blond = vec3(1.8, 1.7, .2);
    vec3 brunette = vec3(.8, .5, .3);
    
    vec3 hair2Col = mix(blond, brunette, n.x);
    hair1Col = hair2Col *.5;
    
	vec4 col = vec4(0.);
    
    if(n.y>.5) {											// hair style 1
        circ(col, uv, .8, .55, 3.5, .6, .5, hair1Col);
        circ(col, uv, .8, .6, 3.5, .54, .5, hair2Col);

        circ(col, uv, .55, .6, 3.5, .6, .5, hair1Col);
        circ(col, uv, .55, .63, 3.5, .54, .5, hair2Col);

        circ(col, uv, .4, .6, 3.5, .6, .5, hair1Col);
        circ(col, uv, .41, .63, 3.3, .54, .5, hair2Col);

        circ(col, uv, .25, .5, 3.5, .6, .5, hair1Col);
        circ(col, uv, .26, .53, 3.3, .54, .5, hair2Col);
    } else {												// hair style 2
        uv.x = abs(uv.x-.5);
        float spread = n.y*2.*.09;
        float d = length((uv-vec2(.2+spread, .9))*vec2(3., 1.));

        col.rgb = hair1Col*(1.+sin(d*20.)*.5*n.z);
        col.a=S(.9, .85, d);
    }
    
    return col;
}

vec4 Face(vec2 uv, float seed) {
    vec3 scarfCol = vec3(1., .9, .5);
    vec3 faceCol = vec3(1., 1., .8);
    vec3 lineCol = vec3(.1);
   
    vec4 col = vec4(0.);
    
    vec2 st = PolarCoords(uv-.5);
    scarfCol += sin(st.x*5.)*.1;
    circ(col, uv, .5, .5, 1.4, .5, .5, scarfCol); // scarf
    float face = circ(col, uv, .5, .45, 1.3, .4, .04, faceCol);	// face

    vec2 uv2 = uv;
    uv2.x = abs(uv.x-.5)+.5;

    circ(col, uv2, .65, .27, 1.3, .06, .3, vec3(1., .7, .7)); //rouge
    circ(col, uv2, .52, .29, 2., .02, .005, vec3(.1));		// nostrils

    vec4 eyeArea = vec4(.2, .31, .8, .55);
    if(square(uv, eyeArea, .01)>0.) {
        vec4 eyes = Eyes(within(uv, eyeArea), seed);
        col = mix(col, eyes, eyes.a);
    }

    float eyeBrows = circ(uv2, .6, eyeArea.w-.03, .7, .06, .01); 
    eyeBrows -= circ(uv2, .6, eyeArea.w-.05, .7, .06, .01); 
    eyeBrows = sat(eyeBrows);
    col = mix(col, vec4(lineCol, 1.), eyeBrows);

    vec4 hairArea = vec4(.1, .6, .9, .9);
    vec4 hair = Hair(within(uv, hairArea), seed); 
    hair.rgb *= .5;
    col = mix(col, hair, hair.a*face);
    
    vec4 mouthArea = vec4(.35, .05, .65, .25);
    float mouthMask = square(uv, mouthArea, .01);
    if(mouthMask>0.) {
    	vec4 mouth = Mouth(within(uv, mouthArea), seed);
    	col = mix(col, mouth, mouth.a);
    }
    
    return col;
}

vec4 Scarf(vec2 uv, float seed) {
    vec4 lCol = vec4(lineCol, 1.);
    vec4 scarfCol = vec4(secCol, 1.);
    
    float lineThickness = .01;    
    float x = uv.x*twopi;
	float scarfY = .25+COS(x)*-.15;
    float scarfMask = S(scarfY, scarfY+.01, uv.y);
    
    scarfY -= lineThickness;
    float lineMask = S(scarfY, scarfY+.01, uv.y);
    vec4 col = mix(lCol*lineMask, scarfCol, scarfMask);
    
    float y;
    
    if(uv.y>scarfY && uv.y<scarfY+.2) {		// scarf band
        y = scarfY+.1;
    	col = mix(col, lCol, B(y, .01+y, .005, uv.y));
   		x *= 10.;
        
        y = scarfY+.05+sin(x)*.04;
        col = mix(col, lCol, B(y, .01+y, .01, uv.y));

		float d = length(vec2(fract(x/pi), (uv.y-scarfY)*10.)-vec2(.5, .6-sin(x)*.1));
        col = mix(col, vec4(1.), S(.2, .14, d));
    }
    
    vec2 mirrorUV = abs(uv-vec2(.5, -0.03));
    vec2 st = PolarCoords(mirrorUV*vec2(2.2, 1.) - vec2(.32, .5));
    vec2 sc;
    if(st.y<.21) {						// add spiral decoration on the side of the head...
        st.y *= 2.2;
        st.x += .4;
    	sc = SpiralCoords(st, 5.);
    	col = mix(col, lCol, B(.3, .5, .05, sc.y)*S(1.15, 1., sc.x));
    }
    
    st = PolarCoords(mirrorUV*vec2(2.2, 1.) - vec2(.532, .385));
    if(st.y<.11) {						// quite cumbersome.. there must be an easier way...
        st.y *= 3.;
        st.x += 3.4;
        sc = SpiralCoords(st, 5.);
    	col = mix(col, lCol, B(.3, .5, .05, sc.y)*S(1.2, 1.05, sc.x));
    }
    uv.x -= .5;
    
    vec2 tiePos = vec2(0., .3);
    vec2 uv2 = uv - tiePos;
    st = vec2(atan(uv2.x*3., uv2.y-.05), length(uv2));
    
    y = COS(st.x*4.+pi);
    y = min(y, COS(st.x*4.+pi+.5));
    
    
    float creases = mix(SIN(st.x*16.+pi), 1., sat(st.y*7.));
    creases = S(.9, .1, creases);
    y*=.2;
    
    col = mix(col, lCol, S(.02+y, .01+y, st.y));
    col = mix(col, vec4(scarfCol.rgb, 1.), S(.005+y, .0+y, st.y));
    col = mix(col, lCol, creases);
    
    circ(col, uv, tiePos.x, tiePos.y, 4., .1, .05, lineCol.rgb);
    circ(col, uv, tiePos.x, tiePos.y, 4., .085, .05, scarfCol.rgb); 
    
    return col;
}

float PointFlower(vec2 st, float numPoints, float base, float pointiness) {
	st.y *= 4.;
    float x = st.x*numPoints;
    float y = pointiness*(abs(cos(x))+(.25-abs(cos(x+pi2)))*2.)/(2.+abs(cos(x*2.+pi2))*8.)-base;
    return st.y+y;
}

vec4 Flower(vec2 uv, vec4 pf, vec4 baseCol, vec4 lineCol) {
    vec2 st = PolarCoords(uv-.5);
    
    #ifdef PSYCO
    st.x += sin(st.y*10.)*sin(iGlobalTime);
    #else
    st.x += sin(st.y*10.)*.2;
    #endif
    
    float dist = PointFlower(st, pf.x, pf.y, pf.z);//3., .4, .4);
    float alpha = S(.5, .4, dist);
    
    baseCol.rgb *= S(.0, .15, st.y);
    vec4 col = baseCol*alpha;
    
    float edge = S(.2, .5, dist)*alpha;
    col = mix(col, lineCol, edge);			// dark painted edge
   
    float highlight = SIN(st.x*pf.w);
    highlight *= B(.0, .3, .1, dist);
    highlight *= SIN(st.x);
    col = mix(col, vec4(1.), highlight);			// highlight
        
    col = mix(col, vec4(1.), S(.06, .05, st.y));  
    
    return col;
}

vec4 Leaf(vec2 uv, float stemHeight, float sweep ) {
    // uv is in 0-1 range
    
    uv.y += sweep*uv.x*uv.x;
    vec2 uv2 = (uv-vec2(.22, .5)) * vec2(4., 3.); 
    
    float side = sign(uv2.y);
    float ay = abs(uv2.y);
    
    float start = sqrt(uv2.x);
    float end = 1.-pow(uv2.x/3., 2.);
    float y = smin(start, end, 0.4);
    
    float offs = pow(abs(ay-mix(.75, -.0, uv2.x))*4., 2.);
    float veins = sin(uv2.x*30.-offs+side);
    
    y *= 1.+veins*.07;
    
    float s = S(y+.04, y, ay);
    vec4 leafCol = vec4(.2, .5, .1, s);
    
    s *= 1.+veins*.2*B(.3, 2.4, .3, uv2.x)*S(.02, .3, ay);
    s *= mix(.2, 1., ay);
    
    leafCol.rgb = (leafCol.rgb+S(-.2, .2, uv2.y)*.35)*s;
    
    s = S(.0, .23, uv.x);
    float h = mix(stemHeight, .5, s);
    float t = mix(.02, .01, s);
    t *= S(.5, .15, uv.x);
    t *= S(.15, .4, uv.x);
    float stemMask = B(h-t, h+t, .01, uv.y);
    stemMask *= S(.95, .23, uv.x);
    leafCol = mix(leafCol, vec4(.2,.5,.1,1.), stemMask);
    
    return leafCol;
}

vec4 RoseTex(vec2 uv, vec3 n) {
    vec4 flowerCol = vec4(n*n, 1.);						// flower col is just a more saturated version of main col
  	vec4 lCol = vec4(lineCol, 1.);
    
    vec2 uv2 = uv;
    
    if(uv.x>.5) {										// mirror and flip half of the texture
    	uv.x = uv.x-.5;
        uv.y = 1.-uv.y;
    }
    
    float y = sin(uv.x*twopi)*.1;						// add a wavy vine down the middle
    float vine = B(.495+y, .505+y, .01, uv.y);
    
    vec2 p1 = uv-vec2(.27, .4);							// add spiral shaped vines
    vec2 st = PolarCoords(p1);
    vec2 sc = SpiralCoords(st, 5.);
    vine += B(.48, .52, .02, sc.y)*S(.7, .4, sc.x);
    
    vec4 col = vec4(.1, .5, .1, 1.)*vine;				// add vine
    
    vec2 lc = uv*4.-vec2(1.5, 1.7);
    
    float sweep = .2;
    #ifdef PSYCO
    sweep = sin(iGlobalTime*.5)*.5;
    #endif
    
    vec4 leaf = Leaf(lc, .5, sweep);
    
    col = mix(col, leaf, leaf.a);
    lc.x +=2.;
    lc.y = 1.-lc.y-.4;
    leaf = Leaf(lc, .5, sweep);
    col = mix(col, leaf, leaf.a);
    
    vec2 fc = sc;
    fc.x = fract(fc.x*10.);
    fc.x = (fc.x-.5)*.5+.5;
    vec4 smallFlower = Flower(fc, vec4(2.5, .4, .3, 5.), flowerCol, lCol);
    smallFlower.a *= B(.1, .4, .01, sc.x);
    col = mix(col, smallFlower, smallFlower.a);
    
    vec4 rect = vec4(0., .3, .5, .9);
    vec4 flower = Flower(within(uv, rect), vec4(3., .4, .4, 30.), flowerCol, lCol);
    col = mix(col, flower, flower.a);
    
    return col;
}

vec3 MatroshkaTex(de o) {
    vec3 n = N31(o.seed);
    vec3 col = mainCol;
	
    lineCol *= max(.1, S(.8, .9, n.x));

    vec4 faceArea = vec4(.35, .65, .65, .95);
    
    if(o.uv.y>faceArea.y-.2) {
        vec2 scarfUv = within(o.uv, vec4(0., faceArea.y-.2, 1., 1.));
        vec4 scarf = Scarf(scarfUv, o.seed);
        col = mix(col, scarf.rgb, scarf.a);
    }
    
    if(o.uv.y<faceArea.y) {
    	vec4 body = RoseTex(fract(o.uv+vec2(.4,.2)), n);
    	col = mix(col, body.rgb, body.a);
    }
    
    float faceMask = square(o.uv, faceArea, .001);
    if(faceMask>0.) {
		vec4 face = Face(within(o.uv, faceArea), o.seed);
        col = mix(col, face.rgb, face.a);
    }
    
    return col;

}

float MatroshkaDist(vec3 p) {	    
    float head = sSph(p-vec3(0., 2.4, 0.), vec3(.9,  .8, .9), .7);
    float body = sSph(p-vec3(0., 1., 0.), vec3(.95, 1.48, .95), .9);

    float d = smin(head, body, .4);		// merge head and body
    d = smax(d, -p.y, .05);				// flatten bottom
    
    float y = remap01(0., 2.96, p.y);
    d += sin(y*100.)*.001;
    d += B(.3985, .40, .003, y)*.001;	// groove where the top and bottom half meet
    
    return d;
}

vec2 MatroshkaTop(vec3 p) {													// returns distance to top half of doll (x) as well as inside or outside (y)
	float d = MatroshkaDist(p);												// get normal (closed) doll dist first
    float outside = d;														// save outside doll dist
    d = smax(d, -sdSphere(p, vec3(0., 0.6, 0.), 1.), .05);					// take away bottom half of doll
    d = smax(d, -sSph(p-vec3(0., 1., 0.), vec3(.7, 1.4, .7), .95), 0.02);	// hollow out top half
    float t = S(-.005, -.01, outside-d);									// calculate wether outside or inside of doll (used for shading)
    return vec2(d, t);
}

vec2 MatroshkaBottom(vec3 p) {												// returns distance to bottom half of doll (x) as well as inside or outside (y)
    float d = MatroshkaDist(p);												// get normal (closed) doll dist first
    float outside = d;														// save outside doll dist
    d = smax(d, -sdSphere(p, vec3(0., 3.0, 0.), 2.), .03);					// take away top half
    d = min(d, sdCappedCylinder(p-vec3(0.,1.,0.), vec2(.8, .25)));			// add extra ridge
    d = smax(d, -sSph(p-vec3(0., 1.15, 0.), vec3(.7, 1., .7), 1.1), 0.02);	// hollow out bottom part
    float t = S(.005, .01, d-outside);										// calculate wether outside or inside of doll (used for shading)
    return vec2(d, t);
}


vec2 GetStoneTiles(vec3 p) {
    return vec2(p.x+sin(p.z*stones.x), p.z+sin(p.x*stones.y)*stones.z)*stones.w;
}

float Ground(vec3 p) {
    float d = p.y;
    vec2 tiles = GetStoneTiles(p);;
    vec2 id = floor(tiles);
    float bump = N2(id.x, id.y);

    vec2 tUv = tiles*pi;
    float tileMask = abs( sin(tUv.x)*sin(tUv.y) );	// make a mask that fades to 0 on the edges
    tileMask = 1.-pow(1.-tileMask, 8.);
    d -= tileMask*.1*bump;
 
    vec3 n = N31(id.x+id.y*165.32);				// add surface detail
    float detail = sin(n.x*p.x*15.)*sin(n.y*p.z*15.)*.05;
    detail += sin(n.z*p.x*p.z*5.)*.005;
    d += detail;					
   
    return d;
}

vec3 SplitMatroshkaDist(vec3 p, float open, float size) {
	// returns distance and id to splitting matroshkas
    // x = distance, y = material, z = transition
    
    float dBaby = MatroshkaDist(p*size)/size;
    vec2 bottom = MatroshkaBottom(p+vec3(0., open, 0.));
    vec2 top = MatroshkaTop(p-vec3(0., open, 0.));

    float dShell = min(bottom.x, top.x);
    
    vec3 m = vec3(0.);
    if(dBaby < dShell)
        m = vec3(dBaby, 0., 0.);
    else if(bottom.x<top.x)
        m = vec3(bottom.x, 1., bottom.y);
    else
        m = vec3(top.x, -1., top.y);
        
    return m;
}


de castRay( ray r ) {
    float dO=MIN_DISTANCE;							// the distance from the camera
    float dS=MAX_DISTANCE;							// the distance from the surface
    float t;										// used to keep track of time
    vec3 p=vec3(0.);								// local position (after repeat, resize etc)
	
    de o;
    o.m = -1.;
    
    if(SOLO<.5) {									// we are in marching mode (as in marching matroshkas, not ray marching ;))
        // Dolls ...
        t = iGlobalTime*.96;						// try to match to the beat of the music
        
        rc q;										// holds the repeated coordinate
        float pt = t*pi;							// 'polar' time
        float s = sin(pt*5.);
        float shuffle = s*.1 + t;					// used to move dolls forward
        float headBounce = s*.05 + 1.05;			// used to scale height periodically
        s = sin(pt*2.5);
        mat3 leftRight = RotY(s*.2) * RotZ(s*.1);	// used to make the doll lean left and right
        
        for( int i=0; i<MAX_STEPS; i++ )
        {
            p = r.o + r.d * dO;						// Ray march
            vec3 P=p;
            p.z -= shuffle;							// move forward
            q = Repeat(p, grid);    				// make a grid of them
            p.xz = q.p.xz;							// keep only ground layer
            p.y *= headBounce;						// make them bounce up and down
            p *= leftRight; 						// make them sway left-right
            float si = fract((q.id.x+q.id.z+5.)/5.);// make them different sizes
            s = .8 + si;							// .8 < s < 1.8
            p*=s;									
            
            dS = MatroshkaDist(p)/s;				// calculate distance to doll
            
            vec3 rC = ((2.*step(0., r.d)-1.)*q.h-q.p)/r.d;	// ray to cell boundary
            float dC = min(min(rC.x, rC.y), rC.z)+.01;		// distance to cell just past boundary
            dS = min(dS, dC);								// if cell boundary is closer than just set to the beginning of the next cell
            
            dO += dS;								// add the distance from the surface to the distance from the camera
            if( dS<RAY_PRECISION || 				// if we hit, 
               dO>MAX_DISTANCE  ||	 				// or we are past far clipping..	
               (r.d.y>0. && p.y>6.5) ||				// or if we are looking up and the ray is already above all of them..
               (p.y<.0 && r.d.y<=0.)) 				// or if we are looking down and the ray is already below the ground
               break;								// break out of the loop 
        }
		
        if(dS<=RAY_PRECISION) {							// if we got really close to the surface, we count it as a hit
            o.m=2.;									// set material id so we know later on how to shade this
            o.d=dO;									// set distance from the camera
            o.p.xyz=p;									// save local coordinate (coordinate inside of the grid cell)
            o.p.w = s;
            o.seed = q.id.z + floor((q.id.x+q.id.z+5.)/10.)*100.;
        } else if(r.d.y<0. && o.m<0.) {				// only consider ground if we are looking down and nothing was hit yet
            // Ground ...
            dO = -((r.o.y-.08)/r.d.y);				// fast forward by doing a ray-plane intersection first
            
            for( int i=0; i<MAX_STEPS; i++ )
            {
                p.xyz = r.o + r.d * dO;				// ray march
                dS = Ground( p.xyz );				// get distance to ground
                dO += dS;							// add distance from the surface to the distance from the camera
                if( dS<RAY_PRECISION || 			// if we hit 
                   dO>MAX_DISTANCE ) 				// or if we are past far clipping
                    break;							// break out of the loop
            }

            if(dS<=RAY_PRECISION) {					// if we got really close to the surface, we count it as a hit
                o.m=1.;
                o.d=dO;
                
                p.z -= shuffle;							// move forward
                q = Repeat(p, grid);    				// make a grid of them
                p.xz = q.p.xz;							// keep only ground layer
                p.y *= headBounce;						// make them bounce up and down
                p *= leftRight; 						// make them sway left-right
                s = .8+fract((q.id.x+q.id.z+5.)/5.); 	// make them different sizes
            	p*=s;
                o.p.xyz=p;
            }
        }
    } else {										// we are in solo mode
    	t = fract(time);
        float open = (1.-X2(1.-t))*3.5;				// how far the two shells are apart as a function of time
        float size = mix(1.2, 1., t);				// grow as it matures
        vec3 m;
        
        for( int i=0; i<MAX_STEPS; i++ ) {
       		p = r.o + r.d * dO;						// Ray march
            m = SplitMatroshkaDist(p, open, size);
            if( m.x<RAY_PRECISION || dO>MAX_DISTANCE ) break;
            dO += m.x;
        }
        
         if(m.x<=RAY_PRECISION) {						// if we got really close to the surface, we count it as a hit
             o.d=dO;
             o.m=2.;
             o.t = m.z;
             
             if(m.y==0.) {   						// inside matroshka	
            	o.seed = floor(time+1.);
            	o.p.xyz=p*size;
                o.p.w = size;
                o.open = open;
                o.inside = 1.;
             } else {								// outside matroshka
             	o.seed = floor(time);
                o.p.xyz = p+vec3(0., m.y*open, 0.);
                o.open = open;
                o.p.w = 1.;
                o.inside = 0.;
             }
         }      
    }
    
    return o;
}

float SplitMatroshkaAO( de o, float dist ) {
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + dist*float(i)/5.0;
        vec3 aopos =  o.nor * hr + o.pos;
        float dd = SplitMatroshkaDist( aopos, o.open, o.p.w ).x/o.p.w;
        occ += -(dd-hr)*sca;
        sca *= 0.35;
    }
    return sat( 1.0 - 3.0*occ );    
}

vec3 MatroshkaNormal( vec3 p )
{
	vec3 eps = vec3( 0.001, 0.0, 0.0 );
	vec3 nor = vec3(
	    MatroshkaDist(p+eps.xyy) - MatroshkaDist(p-eps.xyy),
	    MatroshkaDist(p+eps.yxy) - MatroshkaDist(p-eps.yxy),
	    MatroshkaDist(p+eps.yyx) - MatroshkaDist(p-eps.yyx) );
	return normalize(nor);
}

float GroundAO( de o, float dist ) {
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + dist*float(i)/5.0;
        vec3 aopos =  o.nor * hr + o.pos;
        float dd = Ground( aopos );
        occ += -(dd-hr)*sca;
        sca *= 0.35;
    }
    return sat( 1.0 - 3.0*occ );    
}

vec3 GroundNormal( vec3 p )
{
	vec3 eps = vec3( 0.001, 0.0, 0.0 );
	vec3 nor = vec3(
	    Ground(p+eps.xyy) - Ground(p-eps.xyy),
	    Ground(p+eps.yxy) - Ground(p-eps.yxy),
	    Ground(p+eps.yyx) - Ground(p-eps.yyx) );
	return normalize(nor);
}



vec3 GroundMat(de o) {
    vec2 p = o.pos.xz*3.;
    vec2 noise = vec2( NoiseTex(p, 0., 5.), NoiseTex(p, 12., 5.));
    vec3 col = vec3(1., .8, .8)*.5;

    o.nor = GroundNormal(o.pos);					// get normal
	o.nor.xz += (noise-.5)*2.;						// cheap, fake, normal perturb
    o.nor = normalize(o.nor);						// renormalize
    
    vec2 id = floor(GetStoneTiles(o.pos));
    
    col *= 1.+( N2(id) -.5)*.3;						// vary color of stones
    col *= GroundAO( o, 1. );						// get ao in the cracks between stones
    
    // add fake shadows
    o.p.z+=.1;										// offset a little bit to account for the fact that light is coming from the fort
    float dropShadow = S(.8, .4, length(o.p));		// simple drop shadow right below the doll
    o.p.z+=.6; o.p.x*=1.5;							// second shadow is behind the doll and a bit elongated	
    float shadow = S(1.7, .5, length(o.p))*.75;
    shadow = max(shadow, dropShadow);				
    col *= mix(1., .2, shadow);						// add in both shadows
    
    vec3 r = reflect(o.rd, o.nor);					// calculate reflect view vector
    float spec = sat(dot(r, light));
    spec = pow(spec, 2.);
    col += spec*.1*(1.-shadow);					// add specular, make sure its attenuated by the shadow and vary the reflection by stone
    
    return col;
}

vec3 MatroshkaMat(de o, vec2 uv) {

    vec3 col = vec3(1.);
    
    o.uv = vec2(.5-atan(o.p.x, o.p.z)/twopi, remap01(0., 2.96, o.p.y));
        
    o.nor = MatroshkaNormal(o.p.xyz);
    o.fresnel = 1.-dot(o.nor, -o.rd);
    
    mainCol = N31(o.seed);							// generate main col
    secCol = fract(mainCol*23476.76);
    
    col *= MatroshkaTex(o);

    float dif = dot(light, o.nor);
    col *= max(.4, mix(1., dif, .5));				// ehh.. too much screwing around with things.. 
    col *= 1.+o.fresnel*.2;

    vec3 r = reflect(o.rd, o.nor);					// calculate reflected view ray
    float spec = sat(dot(r, light));				// calculate specular reflection
    
    float occ = 1.-S(.25, .0, o.pos.y);				// fake occlusion when we get close to the ground
    
    vec3 ref = background(r, uv, 0.);				// sample background in the direction of the reflection
    ref *= X2(o.fresnel)*.5;						// make sure reflection is strongest at grazing angles
    ref += pow(spec, 8.)*.6;						// add specular highlight
   
    float groove =  1.-B(.3985, .40, .003, o.uv.y);	// groove where the top and bottom half meet
       
    if(SOLO>.5) {
        float fakeAo = B(1.2-o.open, 1.2+o.open, .2, o.pos.y);	// calc fake letterbox ao
        
        if(o.inside>.5) { 										// if this is the inside doll
        	col *= fakeAo;										// .. doll has a darker head when covered by shell
        	ref *= X2(fakeAo);									// .. also no bg ref when covered
         	col += ref*groove;									// add ref, but not where the center groove is
        } else {
            if( o.t>0. )  {
            	vec3 interior = vec3(1., 1., .8);  
        		interior *= SplitMatroshkaAO(o, .5); 
            	interior *= mix(fakeAo, 1., o.open/3.5);
            	col = mix(col, interior, o.t);					// the inside has a different color
            } else
                col += ref*groove;
            col = mix(col, bg, S(1.05, 3.15, o.open));	// then fade it out..
        }        	
    } else {
        ref *= mix(occ, 1., SOLO);						// only occlude close to ground when in marching mode
        col += ref*groove;								// add reflection to final color, no ref where groove is
        col *= sat(occ+.7);							// darken where it contacts the ground
    }
    
   
    return col;
}

vec4 render( ray camRay, vec2 uv ) {
    // outputs a color
    
    vec3 col = vec3(0.);
    de o = castRay(camRay);
   
    if(o.m>0.) {        
        o.pos = camRay.o + o.d*camRay.d;
    	o.rd = camRay.d;
        
        if( o.m==1. )
            col = GroundMat(o);
        else
            col = MatroshkaMat(o, uv);
    }
    
    col = mix(col, background(o.rd, uv, 0.), S(.0, 100., o.d));
    
    return vec4( col, o.m );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 UV = (fragCoord.xy / iResolution.xy)-.5;
    vec2 uv = UV;
   	uv.y *= iResolution.y/iResolution.x;
    vec2 m = iMouse.xy/iResolution.xy;
    if(m.x==0. && m.y==0.) m=vec2(.55, .45);	// hack to get a decent starting cam. Anyone have a better solution for this?
    mouse = m;
  
    vec3 col;
    
    float t = iGlobalTime;
    time = iGlobalTime*.4;
    
    #ifdef TEXTUREMODE
    	uv = fragCoord.xy / iResolution.xy;
    	//col = RoseTex(uv+.5).rgb;
    	col = vec3(Kremlin(uv));
    	//col = vec3(NoiseTex(uv, floor(t), 6.));
    #else
    
    float turn = (.5+m.x)*twopi;

    vec3 camPos;
    float camDist=8.;
    
    float mt = fract(t/269.)*269.;
    
    SOLO = B(-1., 28.3, 0.01, mt);
    SOLO += B(41.5, 54.8, 0.01, mt);
    SOLO += B(81., 107., 0.01, mt);
    SOLO += B(134., 161., 0.01, mt);
    SOLO += B(227., 240., 0.01, mt);
  
    if(SOLO>.5) {
        camPos = vec3(0., 1.5, 0.);
        mainCol = N31(floor(time+1.));
        lastCol = N31(floor(time));
    } else {
        camPos = vec3(0., 3.5, 0.);
        turn += t*.1;
    }

    float camY = INVERTMOUSE*camDist*cos((m.y)*pi);
    
    vec3 pos = vec3(0., camY, camDist)*RotY(turn);
   	
    CameraSetup(uv, camPos+pos, camPos, 1.);
    
    bg = background(cam.ray.d, uv, 1.);

    vec4 info = render(cam.ray, uv);
  
    if(info.w==-1.) {
        col = bg; 
    } else 
        col = info.rgb;
  	#endif
    
    UV *= 1.1;
    col *= 1.-dot(UV, UV);		// add vignette
    
    fragColor = vec4(col, .1);
}
</script>

<!-- https://www.shadertoy.com/view/XtlSD7 -->
<script type="shader" id="marioworld">
// "[SIG15] Mario World 1-1" by Krzysztof Narkowicz @knarkowicz
// 
// Intersting findings from original NES Super Mario Bros.:
// -Clouds and brushes of all sizes are drawn using the same small sprite (32x24)
// -Hills, clouds and bushes weren't placed manually. Every background object type is repeated after 768 pixels.
// -Overworld (main theme) drum sound uses only the APU noise generator

#define SPRITE_DEC( x, i ) 	mod( floor( i / pow( 4.0, mod( x, 8.0 ) ) ), 4.0 )
#define SPRITE_DEC2( x, i ) mod( floor( i / pow( 4.0, mod( x, 11.0 ) ) ), 4.0 )
#define RGB( r, g, b ) vec3( float( r ) / 255.0, float( g ) / 255.0, float( b ) / 255.0 )

const float MARIO_SPEED	 = 89.0;
const float GOOMBA_SPEED = 32.0;
const float INTRO_LENGTH = 2.0;

void SpriteBlock( inout vec3 color, float x, float y )
{
    // black
    float idx = 1.0;
    
    // light orange
    idx = x < y ? 3.0 : idx;
    
    // dark orange
    idx = x > 3.0 && x < 12.0 && y > 3.0 && y < 12.0 ? 2.0 : idx;
    idx = x == 15.0 - y ? 2.0 : idx;
    
    color = RGB( 0, 0, 0 );
	color = idx == 2.0 ? RGB( 231,  90,  16 ) : color;
	color = idx == 3.0 ? RGB( 247, 214, 181 ) : color;
}

void SpriteHill( inout vec3 color, float x, float y )
{
    float idx = 0.0;
    
    // dark green
    idx = ( x > y && 79.0 - x > y ) && y < 33.0 ? 2.0 : idx;
    idx = ( x >= 37.0 && x <= 42.0 ) && y == 33.0 ? 2.0 : idx;
    
    // black
    idx = ( x == y || 79.0 - x == y ) && y < 33.0 ? 1.0 : idx;
    idx = ( x == 33.0 || x == 46.0 ) && y == 32.0 ? 1.0 : idx;
    idx = ( x >= 34.0 && x <= 36.0 ) && y == 33.0 ? 1.0 : idx;
    idx = ( x >= 43.0 && x <= 45.0 ) && y == 33.0 ? 1.0 : idx;
    idx = ( x >= 37.0 && x <= 42.0 ) && y == 34.0 ? 1.0 : idx;
    idx = ( x >= 25.0 && x <= 26.0 ) && ( y >= 8.0  && y <= 11.0 ) ? 1.0 : idx;
    idx = ( x >= 41.0 && x <= 42.0 ) && ( y >= 24.0 && y <= 27.0 ) ? 1.0 : idx;
    idx = ( x >= 49.0 && x <= 50.0 ) && ( y >= 8.0  && y <= 11.0 ) ? 1.0 : idx;
    idx = ( x >= 28.0 && x <= 30.0 ) && ( y >= 11.0 && y <= 14.0 ) ? 1.0 : idx;
    idx = ( x >= 28.0 && x <= 30.0 ) && ( y >= 11.0 && y <= 14.0 ) ? 1.0 : idx;
    idx = ( x >= 44.0 && x <= 46.0 ) && ( y >= 27.0 && y <= 30.0 ) ? 1.0 : idx;
    idx = ( x >= 44.0 && x <= 46.0 ) && ( y >= 27.0 && y <= 30.0 ) ? 1.0 : idx;
    idx = ( x >= 52.0 && x <= 54.0 ) && ( y >= 11.0 && y <= 14.0 ) ? 1.0 : idx;
    idx = ( x == 29.0 || x == 53.0 ) && ( y >= 10.0 && y <= 15.0 ) ? 1.0 : idx;
    idx = x == 45.0 && ( y >= 26.0 && y <= 31.0 ) ? 1.0 : idx;
    
	color = idx == 1.0 ? RGB( 0,     0,  0 ) : color;
	color = idx == 2.0 ? RGB( 0,   173,  0 ) : color;
}

void SpritePipe( inout vec3 color, float x, float y, float h )
{
    float offset = h * 16.0;

    // light green
	float idx = 3.0;
    
    // dark green
    idx = ( ( x > 5.0 && x < 8.0 ) || ( x == 13.0 ) || ( x > 15.0 && x < 23.0 ) ) && y < 17.0 + offset ? 2.0 : idx;
    idx = ( ( x > 4.0 && x < 7.0 ) || ( x == 12.0 ) || ( x > 14.0 && x < 24.0 ) ) && ( y > 17.0 + offset && y < 30.0 + offset ) ? 2.0 : idx;    
    idx = ( x < 5.0 || x > 11.0 ) && y == 29.0 + offset ? 2.0 : idx;
	idx = fract( x * 0.5 + y * 0.5 ) == 0.5 && x > 22.0 && ( ( x < 26.0 && y < 17.0 + offset ) || ( x < 28.0 && y > 17.0 + offset && y < 30.0 + offset ) ) ? 2.0 : idx;    
    
    // black
    idx = y == 31.0 + offset || x == 0.0 || x == 31.0 || y == 17.0 + offset ? 1.0 : idx;
    idx = ( x == 2.0 || x == 29.0 ) && y < 18.0 + offset ? 1.0 : idx;
    idx = ( x > 1.0 && x < 31.0 ) && y == 16.0 + offset ? 1.0 : idx;    
    
    // transparent
    idx = ( x < 2.0 || x > 29.0 ) && y < 17.0 + offset ? 0.0 : idx;

	color = idx == 1.0 ? RGB( 0,     0,  0 ) : color;
	color = idx == 2.0 ? RGB( 0,   173,  0 ) : color;
	color = idx == 3.0 ? RGB( 189, 255, 24 ) : color;
}

void SpriteCloud( inout vec3 color, float x, float y, float isBush )
{
	float idx = 0.0;
    
	idx = y == 23.0 ? ( x <= 10.0 ? 0.0 : ( x <= 21.0 ? 5440.0 : 0.0 ) ) : idx;
	idx = y == 22.0 ? ( x <= 10.0 ? 0.0 : ( x <= 21.0 ? 32720.0 : 0.0 ) ) : idx;
	idx = y == 21.0 ? ( x <= 10.0 ? 0.0 : ( x <= 21.0 ? 131061.0 : 0.0 ) ) : idx;
	idx = y == 20.0 ? ( x <= 10.0 ? 1048576.0 : ( x <= 21.0 ? 1179647.0 : 0.0 ) ) : idx;
	idx = y == 19.0 ? ( x <= 10.0 ? 1048576.0 : ( x <= 21.0 ? 3670015.0 : 1.0 ) ) : idx;
	idx = y == 18.0 ? ( x <= 10.0 ? 1048576.0 : ( x <= 21.0 ? 4190207.0 : 7.0 ) ) : idx;
	idx = y == 17.0 ? ( x <= 10.0 ? 3407872.0 : ( x <= 21.0 ? 4177839.0 : 7.0 ) ) : idx;
	idx = y == 16.0 ? ( x <= 10.0 ? 3997696.0 : ( x <= 21.0 ? 4194299.0 : 7.0 ) ) : idx;
	idx = y == 15.0 ? ( x <= 10.0 ? 4150272.0 : ( x <= 21.0 ? 4194303.0 : 1055.0 ) ) : idx;
	idx = y == 14.0 ? ( x <= 10.0 ? 4193536.0 : ( x <= 21.0 ? 4194303.0 : 7455.0 ) ) : idx;
	idx = y == 13.0 ? ( x <= 10.0 ? 4194112.0 : ( x <= 21.0 ? 4194303.0 : 8063.0 ) ) : idx;
	idx = y == 12.0 ? ( x <= 10.0 ? 4194240.0 : ( x <= 21.0 ? 4194303.0 : 73727.0 ) ) : idx;
	idx = y == 11.0 ? ( x <= 10.0 ? 4194260.0 : ( x <= 21.0 ? 4194303.0 : 491519.0 ) ) : idx;
	idx = y == 10.0 ? ( x <= 10.0 ? 4194301.0 : ( x <= 21.0 ? 4194303.0 : 524287.0 ) ) : idx;
	idx = y == 9.0 ? ( x <= 10.0 ? 4194301.0 : ( x <= 21.0 ? 4194303.0 : 524287.0 ) ) : idx;
	idx = y == 8.0 ? ( x <= 10.0 ? 4194292.0 : ( x <= 21.0 ? 4194303.0 : 131071.0 ) ) : idx;
	idx = y == 7.0 ? ( x <= 10.0 ? 4193232.0 : ( x <= 21.0 ? 4194303.0 : 32767.0 ) ) : idx;
	idx = y == 6.0 ? ( x <= 10.0 ? 3927872.0 : ( x <= 21.0 ? 4193279.0 : 131071.0 ) ) : idx;
	idx = y == 5.0 ? ( x <= 10.0 ? 2800896.0 : ( x <= 21.0 ? 4193983.0 : 524287.0 ) ) : idx;
	idx = y == 4.0 ? ( x <= 10.0 ? 3144960.0 : ( x <= 21.0 ? 3144362.0 : 262143.0 ) ) : idx;
	idx = y == 3.0 ? ( x <= 10.0 ? 4150272.0 : ( x <= 21.0 ? 3845099.0 : 98303.0 ) ) : idx;
	idx = y == 2.0 ? ( x <= 10.0 ? 3997696.0 : ( x <= 21.0 ? 4107775.0 : 6111.0 ) ) : idx;
	idx = y == 1.0 ? ( x <= 10.0 ? 1310720.0 : ( x <= 21.0 ? 4183167.0 : 325.0 ) ) : idx;
	idx = y == 0.0 ? ( x <= 10.0 ? 0.0 : ( x <= 21.0 ? 1392661.0 : 0.0 ) ) : idx;

	idx = SPRITE_DEC2( x, idx );

	vec3 colorB = isBush == 1.0 ? RGB( 0,   173,  0 ) : RGB(  57, 189, 255 );
	vec3 colorC = isBush == 1.0 ? RGB( 189, 255, 24 ) : RGB( 254, 254, 254 );

	color = idx == 1.0 ? RGB( 0, 0, 0 ) : color;
	color = idx == 2.0 ? colorB 		: color;
	color = idx == 3.0 ? colorC 		: color;
}

void SpriteFlag( inout vec3 color, float x, float y )
{
	float idx = 0.0;
	idx = y == 15.0 ? 43690.0 : idx;
	idx = y == 14.0 ? ( x <= 7.0 ? 43688.0 : 42326.0 ) : idx;
	idx = y == 13.0 ? ( x <= 7.0 ? 43680.0 : 38501.0 ) : idx;
	idx = y == 12.0 ? ( x <= 7.0 ? 43648.0 : 39529.0 ) : idx;
	idx = y == 11.0 ? ( x <= 7.0 ? 43520.0 : 39257.0 ) : idx;
	idx = y == 10.0 ? ( x <= 7.0 ? 43008.0 : 38293.0 ) : idx;
	idx = y == 9.0 ? ( x <= 7.0 ? 40960.0 : 38229.0 ) : idx;
	idx = y == 8.0 ? ( x <= 7.0 ? 32768.0 : 43354.0 ) : idx;
	idx = y == 7.0 ? ( x <= 7.0 ? 0.0 : 43690.0 ) : idx;
	idx = y == 6.0 ? ( x <= 7.0 ? 0.0 : 43688.0 ) : idx;
	idx = y == 5.0 ? ( x <= 7.0 ? 0.0 : 43680.0 ) : idx;
	idx = y == 4.0 ? ( x <= 7.0 ? 0.0 : 43648.0 ) : idx;
	idx = y == 3.0 ? ( x <= 7.0 ? 0.0 : 43520.0 ) : idx;
	idx = y == 2.0 ? ( x <= 7.0 ? 0.0 : 43008.0 ) : idx;
	idx = y == 1.0 ? ( x <= 7.0 ? 0.0 : 40960.0 ) : idx;
	idx = y == 0.0 ? ( x <= 7.0 ? 0.0 : 32768.0 ) : idx;

	idx = SPRITE_DEC( x, idx );

	color = idx == 1.0 ? RGB(   0, 173,   0 ) : color;
	color = idx == 2.0 ? RGB( 255, 255, 255 ) : color;
}

void SpriteCastleFlag( inout vec3 color, float x, float y )
{
	float idx = 0.0;
	idx = y == 13.0 ? ( x <= 10.0 ? 8.0 : 0.0 ) : idx;
	idx = y == 12.0 ? ( x <= 10.0 ? 42.0 : 0.0 ) : idx;
	idx = y == 11.0 ? ( x <= 10.0 ? 8.0 : 0.0 ) : idx;
	idx = y == 10.0 ? ( x <= 10.0 ? 4194292.0 : 15.0 ) : idx;
	idx = y == 9.0 ? ( x <= 10.0 ? 4161524.0 : 15.0 ) : idx;
	idx = y == 8.0 ? ( x <= 10.0 ? 4161524.0 : 15.0 ) : idx;
	idx = y == 7.0 ? ( x <= 10.0 ? 1398260.0 : 15.0 ) : idx;
	idx = y == 6.0 ? ( x <= 10.0 ? 3495924.0 : 15.0 ) : idx;
	idx = y == 5.0 ? ( x <= 10.0 ? 4022260.0 : 15.0 ) : idx;
	idx = y == 4.0 ? ( x <= 10.0 ? 3528692.0 : 15.0 ) : idx;
	idx = y == 3.0 ? ( x <= 10.0 ? 3667956.0 : 15.0 ) : idx;
	idx = y == 2.0 ? ( x <= 10.0 ? 4194292.0 : 15.0 ) : idx;
	idx = y == 1.0 ? ( x <= 10.0 ? 4.0 : 0.0 ) : idx;
	idx = y == 0.0 ? ( x <= 10.0 ? 4.0 : 0.0 ) : idx;

	idx = SPRITE_DEC2( x, idx );

	color = idx == 1.0 ? RGB( 181,  49,  33 ) : color;
    color = idx == 2.0 ? RGB( 230, 156,  33 ) : color;
	color = idx == 3.0 ? RGB( 255, 255, 255 ) : color;
}

void SpriteGoomba( inout vec3 color, float x, float y, float frame )
{
	float idx = 0.0;

    // second frame is flipped first frame
    x = frame == 1.0 ? 15.0 - x : x;

    if ( frame <= 1.0 )
    {
        idx = y == 15.0 ? ( x <= 7.0 ? 40960.0 : 10.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 43008.0 : 42.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 43520.0 : 170.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 43648.0 : 682.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 43360.0 : 2410.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 42920.0 : 10970.0 ) : idx;
        idx = y ==  9.0 ? ( x <= 7.0 ? 22440.0 : 10965.0 ) : idx;
        idx = y ==  8.0 ? ( x <= 7.0 ? 47018.0 : 43742.0 ) : idx;
        idx = y ==  7.0 ? ( x <= 7.0 ? 49066.0 : 43774.0 ) : idx;
        idx = y ==  6.0 ? 43690.0 : idx;
        idx = y ==  5.0 ? ( x <= 7.0 ? 65192.0 : 10943.0 ) : idx;
        idx = y ==  4.0 ? ( x <= 7.0 ? 65280.0 : 255.0 ) : idx;
        idx = y ==  3.0 ? ( x <= 7.0 ? 65280.0 : 1535.0 ) : idx;
        idx = y ==  2.0 ? ( x <= 7.0 ? 64832.0 : 5471.0 ) : idx;
        idx = y ==  1.0 ? ( x <= 7.0 ? 62784.0 : 5463.0 ) : idx;
        idx = y ==  0.0 ? ( x <= 7.0 ? 5376.0 : 1364.0 ) : idx;
    }
    else
    {
        idx = y == 7.0 ? ( x <= 7.0 ? 40960.0 : 10.0 ) : idx;
		idx = y == 6.0 ? ( x <= 7.0 ? 43648.0 : 682.0 ) : idx;
		idx = y == 5.0 ? ( x <= 7.0 ? 42344.0 : 10586.0 ) : idx;
		idx = y == 4.0 ? ( x <= 7.0 ? 24570.0 : 45045.0 ) : idx;
		idx = y == 3.0 ? 43690.0 : idx;
		idx = y == 2.0 ? ( x <= 7.0 ? 65472.0 : 1023.0 ) : idx;
		idx = y == 1.0 ? ( x <= 7.0 ? 65280.0 : 255.0 ) : idx;
		idx = y == 0.0 ? ( x <= 7.0 ? 1364.0 : 5456.0 ) : idx; 
    }
    
    idx = SPRITE_DEC( x, idx );
    
	color = idx == 1.0 ? RGB( 0,     0,   0 ) : color;
	color = idx == 2.0 ? RGB( 153,  75,  12 ) : color;
	color = idx == 3.0 ? RGB( 255, 200, 184 ) : color;
}

void SpriteKoopa( inout vec3 color, float x, float y, float frame )
{    
	float idx = 0.0;

	if ( frame == 0.0 )
    {
		idx = y == 23.0 ? ( x <= 7.0 ? 768.0 : 0.0 ) : idx;
		idx = y == 22.0 ? ( x <= 7.0 ? 4032.0 : 0.0 ) : idx;
		idx = y == 21.0 ? ( x <= 7.0 ? 4064.0 : 0.0 ) : idx;
		idx = y == 20.0 ? ( x <= 7.0 ? 12128.0 : 0.0 ) : idx;
		idx = y == 19.0 ? ( x <= 7.0 ? 12136.0 : 0.0 ) : idx;
        idx = y == 18.0 ? ( x <= 7.0 ? 12136.0 : 0.0 ) : idx;
        idx = y == 17.0 ? ( x <= 7.0 ? 12264.0 : 0.0 ) : idx;
		idx = y == 16.0 ? ( x <= 7.0 ? 11174.0 : 0.0 ) : idx;
		idx = y == 15.0 ? ( x <= 7.0 ? 10922.0 : 0.0 ) : idx;
		idx = y == 14.0 ? ( x <= 7.0 ? 10282.0 : 341.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 30730.0 : 1622.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 31232.0 : 1433.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 24192.0 : 8037.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 24232.0 : 7577.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 28320.0 : 9814.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 40832.0 : 6485.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 26496.0 : 9814.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 23424.0 : 5529.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 22272.0 : 5477.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 24320.0 : 64921.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 65024.0 : 12246.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 59904.0 : 11007.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 43008.0 : 10752.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 40960.0 : 2690.0 ) : idx;
    }
	else
	{
        idx = y == 22.0 ? ( x <= 7.0 ? 192.0 : 0.0 ) : idx;
        idx = y == 21.0 ? ( x <= 7.0 ? 1008.0 : 0.0 ) : idx;
        idx = y == 20.0 ? ( x <= 7.0 ? 3056.0 : 0.0 ) : idx;
        idx = y == 19.0 ? ( x <= 7.0 ? 11224.0 : 0.0 ) : idx;
        idx = y == 18.0 ? ( x <= 7.0 ? 11224.0 : 0.0 ) : idx;
        idx = y == 17.0 ? ( x <= 7.0 ? 11224.0 : 0.0 ) : idx;
        idx = y == 16.0 ? ( x <= 7.0 ? 11256.0 : 0.0 ) : idx;
        idx = y == 15.0 ? ( x <= 7.0 ? 10986.0 : 0.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 10918.0 : 0.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 2730.0 : 341.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 18986.0 : 1622.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 18954.0 : 5529.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 24202.0 : 8037.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 24200.0 : 7577.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 28288.0 : 9814.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 40864.0 : 6485.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 26496.0 : 9814.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 23424.0 : 5529.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 22272.0 : 5477.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 24320.0 : 64921.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 65152.0 : 4054.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 60064.0 : 11007.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 2728.0 : 43520.0 ) : idx;
	}

	idx = SPRITE_DEC( x, idx );

	color = idx == 1.0 ? RGB( 30,  132,   0 ) : color;
	color = idx == 2.0 ? RGB( 215, 141,  34 ) : color;
	color = idx == 3.0 ? RGB( 255, 255, 255 ) : color;    
}

void SpriteQuestion( inout vec3 color, float x, float y, float t )
{
	float idx = 0.0;
	idx = y == 15.0 ? ( x <= 7.0 ? 43688.0 : 10922.0 ) : idx;
	idx = y == 14.0 ? ( x <= 7.0 ? 65534.0 : 32767.0 ) : idx;
	idx = y == 13.0 ? ( x <= 7.0 ? 65502.0 : 30719.0 ) : idx;
	idx = y == 12.0 ? ( x <= 7.0 ? 44030.0 : 32762.0 ) : idx;
	idx = y == 11.0 ? ( x <= 7.0 ? 23294.0 : 32745.0 ) : idx;
	idx = y == 10.0 ? ( x <= 7.0 ? 56062.0 : 32619.0 ) : idx;
	idx = y == 9.0 ? ( x <= 7.0 ? 56062.0 : 32619.0 ) : idx;
	idx = y == 8.0 ? ( x <= 7.0 ? 55294.0 : 32618.0 ) : idx;
	idx = y == 7.0 ? ( x <= 7.0 ? 49150.0 : 32598.0 ) : idx;
	idx = y == 6.0 ? ( x <= 7.0 ? 49150.0 : 32758.0 ) : idx;
	idx = y == 5.0 ? ( x <= 7.0 ? 65534.0 : 32757.0 ) : idx;
	idx = y == 4.0 ? ( x <= 7.0 ? 49150.0 : 32766.0 ) : idx;
	idx = y == 3.0 ? ( x <= 7.0 ? 49150.0 : 32758.0 ) : idx;
	idx = y == 2.0 ? ( x <= 7.0 ? 65502.0 : 30709.0 ) : idx;
	idx = y == 1.0 ? ( x <= 7.0 ? 65534.0 : 32767.0 ) : idx;
	idx = y == 0.0 ? 21845.0 : idx;

	idx = SPRITE_DEC( x, idx );

	color = idx == 1.0 ? RGB( 0,     0,   0 ) : color;
	color = idx == 2.0 ? RGB( 231,  90,  16 ) : color;
	color = idx == 3.0 ? mix( RGB( 255,  165, 66 ), RGB( 231,  90,  16 ), t ) : color;
}

void SpriteMushroom( inout vec3 color, float x, float y )
{
	float idx = 0.0;
	idx = y == 15.0 ? ( x <= 7.0 ? 40960.0 : 10.0 ) : idx;
	idx = y == 14.0 ? ( x <= 7.0 ? 43008.0 : 22.0 ) : idx;
	idx = y == 13.0 ? ( x <= 7.0 ? 43520.0 : 85.0 ) : idx;
	idx = y == 12.0 ? ( x <= 7.0 ? 43648.0 : 341.0 ) : idx;
	idx = y == 11.0 ? ( x <= 7.0 ? 43680.0 : 2646.0 ) : idx;
	idx = y == 10.0 ? ( x <= 7.0 ? 42344.0 : 10922.0 ) : idx;
	idx = y == 9.0 ? ( x <= 7.0 ? 38232.0 : 10922.0 ) : idx;
	idx = y == 8.0 ? ( x <= 7.0 ? 38234.0 : 42410.0 ) : idx;
	idx = y == 7.0 ? ( x <= 7.0 ? 38234.0 : 38314.0 ) : idx;
	idx = y == 6.0 ? ( x <= 7.0 ? 42346.0 : 38570.0 ) : idx;
	idx = y == 5.0 ? 43690.0 : idx;
	idx = y == 4.0 ? ( x <= 7.0 ? 64856.0 : 9599.0 ) : idx;
	idx = y == 3.0 ? ( x <= 7.0 ? 65280.0 : 255.0 ) : idx;
	idx = y == 2.0 ? ( x <= 7.0 ? 65280.0 : 239.0 ) : idx;
	idx = y == 1.0 ? ( x <= 7.0 ? 65280.0 : 239.0 ) : idx;
	idx = y == 0.0 ? ( x <= 7.0 ? 64512.0 : 59.0 ) : idx;

	idx = SPRITE_DEC( x, idx );

	color = idx == 1.0 ? RGB( 181, 49,   33 ) : color;
	color = idx == 2.0 ? RGB( 230, 156,  33 ) : color;
	color = idx == 3.0 ? RGB( 255, 255, 255 ) : color;
}

void SpriteGround( inout vec3 color, float x, float y )
{   
	float idx = 0.0;
	idx = y == 15.0 ? ( x <= 7.0 ? 65534.0 : 49127.0 ) : idx;
	idx = y == 14.0 ? ( x <= 7.0 ? 43691.0 : 27318.0 ) : idx;
	idx = y == 13.0 ? ( x <= 7.0 ? 43691.0 : 27318.0 ) : idx;
	idx = y == 12.0 ? ( x <= 7.0 ? 43691.0 : 27318.0 ) : idx;
	idx = y == 11.0 ? ( x <= 7.0 ? 43691.0 : 27254.0 ) : idx;
	idx = y == 10.0 ? ( x <= 7.0 ? 43691.0 : 38246.0 ) : idx;
	idx = y == 9.0 ? ( x <= 7.0 ? 43691.0 : 32758.0 ) : idx;
	idx = y == 8.0 ? ( x <= 7.0 ? 43691.0 : 27318.0 ) : idx;
	idx = y == 7.0 ? ( x <= 7.0 ? 43691.0 : 27318.0 ) : idx;
	idx = y == 6.0 ? ( x <= 7.0 ? 43691.0 : 27318.0 ) : idx;
	idx = y == 5.0 ? ( x <= 7.0 ? 43685.0 : 27309.0 ) : idx;
	idx = y == 4.0 ? ( x <= 7.0 ? 43615.0 : 27309.0 ) : idx;
	idx = y == 3.0 ? ( x <= 7.0 ? 22011.0 : 27307.0 ) : idx;
	idx = y == 2.0 ? ( x <= 7.0 ? 32683.0 : 27307.0 ) : idx;
	idx = y == 1.0 ? ( x <= 7.0 ? 27307.0 : 23211.0 ) : idx;
	idx = y == 0.0 ? ( x <= 7.0 ? 38230.0 : 38231.0 ) : idx;

	idx = SPRITE_DEC( x, idx );

	color = RGB( 0, 0, 0 );
	color = idx == 2.0 ? RGB( 231,  90,  16 ) : color;
	color = idx == 3.0 ? RGB( 247, 214, 181 ) : color;
}

void SpriteFlagpoleEnd( inout vec3 color, float x, float y )
{   
	float idx = 0.0;

	idx = y == 7.0 ? 1360.0  : idx;
	idx = y == 6.0 ? 6836.0  : idx;
	idx = y == 5.0 ? 27309.0 : idx;
	idx = y == 4.0 ? 27309.0 : idx;
	idx = y == 3.0 ? 27305.0 : idx;
	idx = y == 2.0 ? 27305.0 : idx;
	idx = y == 1.0 ? 6820.0  : idx;
	idx = y == 0.0 ? 1360.0  : idx;

	idx = SPRITE_DEC( x, idx );

	color = idx == 1.0 ? RGB( 0,     0,  0 ) : color;
	color = idx == 2.0 ? RGB( 0,   173,  0 ) : color;
	color = idx == 3.0 ? RGB( 189, 255, 24 ) : color;
}

void SpriteMario( inout vec3 color, float x, float y, float frame )
{    
    float idx = 0.0;

	if ( frame == 0.0 )
    {
        idx = y == 14.0 ? ( x <= 7.0 ? 40960.0 : 42.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 43008.0 : 2730.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 21504.0 : 223.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 56576.0 : 4063.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 23808.0 : 16255.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 62720.0 : 1375.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 61440.0 : 1023.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 21504.0 : 793.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 22272.0 : 4053.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 23488.0 : 981.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 43328.0 : 170.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 43584.0 : 170.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 10832.0 : 42.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 16400.0 : 5.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 16384.0 : 21.0 ) : idx;
	}
    else if ( frame == 1.0 ) 
    {
        idx = y == 15.0 ? ( x <= 7.0 ? 43008.0 : 10.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 43520.0 : 682.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 54528.0 : 55.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 63296.0 : 1015.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 55104.0 : 4063.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 64832.0 : 343.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 64512.0 : 255.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 25856.0 : 5.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 38208.0 : 22.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 42304.0 : 235.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 38208.0 : 170.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 62848.0 : 171.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 62976.0 : 42.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 43008.0 : 21.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 21504.0 : 85.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 21504.0 : 1.0 ) : idx;
    }
    else if ( frame == 2.0 ) 
    {
        idx = y == 15.0 ? ( x <= 7.0 ? 43008.0 : 10.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 43520.0 : 682.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 54528.0 : 55.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 63296.0 : 1015.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 55104.0 : 4063.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 64832.0 : 343.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 64512.0 : 255.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 42320.0 : 5.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 42335.0 : 16214.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 58687.0 : 15722.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 43535.0 : 1066.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 43648.0 : 1450.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 43680.0 : 1450.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 2708.0 : 1448.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 84.0 : 0.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 336.0 : 0.0 ) : idx;
    }
    else if ( frame == 3.0 )
    {
        idx = y == 15.0 ? ( x <= 7.0 ? 0.0 : 64512.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 40960.0 : 64554.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 43008.0 : 64170.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 21504.0 : 21727.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 56576.0 : 22495.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 23808.0 : 32639.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 62720.0 : 5471.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 61440.0 : 2047.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 38224.0 : 405.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 21844.0 : 16982.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 21855.0 : 17066.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 39487.0 : 23470.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 43596.0 : 23210.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 43344.0 : 23210.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 43604.0 : 42.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 43524.0 : 0.0 ) : idx;
    }
    else if ( frame == 4.0 )
    {
        idx = y == 29.0 ? ( x <= 7.0 ? 32768.0 : 170.0 ) : idx;
        idx = y == 28.0 ? ( x <= 7.0 ? 43008.0 : 234.0 ) : idx;
        idx = y == 27.0 ? ( x <= 7.0 ? 43520.0 : 250.0 ) : idx;
        idx = y == 26.0 ? ( x <= 7.0 ? 43520.0 : 10922.0 ) : idx;
        idx = y == 25.0 ? ( x <= 7.0 ? 54528.0 : 1015.0 ) : idx;
        idx = y == 24.0 ? ( x <= 7.0 ? 57152.0 : 16343.0 ) : idx;
        idx = y == 23.0 ? ( x <= 7.0 ? 24384.0 : 65535.0 ) : idx;
        idx = y == 22.0 ? ( x <= 7.0 ? 24400.0 : 65407.0 ) : idx;
        idx = y == 21.0 ? ( x <= 7.0 ? 65360.0 : 5463.0 ) : idx;
        idx = y == 20.0 ? ( x <= 7.0 ? 64832.0 : 5471.0 ) : idx;
        idx = y == 19.0 ? ( x <= 7.0 ? 62464.0 : 4095.0 ) : idx;
        idx = y == 18.0 ? ( x <= 7.0 ? 43264.0 : 63.0 ) : idx;
        idx = y == 17.0 ? ( x <= 7.0 ? 22080.0 : 6.0 ) : idx;
        idx = y == 16.0 ? ( x <= 7.0 ? 22080.0 : 25.0 ) : idx;
        idx = y == 15.0 ? ( x <= 7.0 ? 22096.0 : 4005.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 22160.0 : 65365.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 23184.0 : 65365.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 23168.0 : 64853.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 27264.0 : 64853.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 43648.0 : 598.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 43648.0 : 682.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 43648.0 : 426.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 43605.0 : 2666.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 43605.0 : 2710.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 43605.0 : 681.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 10837.0 : 680.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 85.0 : 340.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 5.0 : 340.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 1.0 : 5460.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 0.0 : 5460.0 ) : idx;
    }
    else if ( frame == 5.0 )
    {
        idx = y == 30.0 ? ( x <= 7.0 ? 40960.0 : 42.0 ) : idx;
        idx = y == 29.0 ? ( x <= 7.0 ? 43520.0 : 58.0 ) : idx;
        idx = y == 28.0 ? ( x <= 7.0 ? 43648.0 : 62.0 ) : idx;
        idx = y == 27.0 ? ( x <= 7.0 ? 43648.0 : 2730.0 ) : idx;
        idx = y == 26.0 ? ( x <= 7.0 ? 62784.0 : 253.0 ) : idx;
        idx = y == 25.0 ? ( x <= 7.0 ? 63440.0 : 4085.0 ) : idx;
        idx = y == 24.0 ? ( x <= 7.0 ? 55248.0 : 16383.0 ) : idx;
        idx = y == 23.0 ? ( x <= 7.0 ? 55252.0 : 16351.0 ) : idx;
        idx = y == 22.0 ? ( x <= 7.0 ? 65492.0 : 1365.0 ) : idx;
        idx = y == 21.0 ? ( x <= 7.0 ? 65360.0 : 1367.0 ) : idx;
        idx = y == 20.0 ? ( x <= 7.0 ? 64832.0 : 1023.0 ) : idx;
        idx = y == 19.0 ? ( x <= 7.0 ? 43520.0 : 15.0 ) : idx;
        idx = y == 18.0 ? ( x <= 7.0 ? 38464.0 : 22.0 ) : idx;
        idx = y == 17.0 ? ( x <= 7.0 ? 21904.0 : 26.0 ) : idx;
        idx = y == 16.0 ? ( x <= 7.0 ? 21904.0 : 90.0 ) : idx;
        idx = y == 15.0 ? ( x <= 7.0 ? 21904.0 : 106.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 21904.0 : 125.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 21904.0 : 255.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 21920.0 : 767.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 22176.0 : 2815.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 23200.0 : 2751.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 43680.0 : 2725.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 43648.0 : 661.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 27136.0 : 341.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 23040.0 : 85.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 26624.0 : 21.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 41984.0 : 86.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 21504.0 : 81.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 21760.0 : 1.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 21760.0 : 21.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 20480.0 : 21.0 ) : idx;
    }
    else if ( frame == 6.0 )
    {
        idx = y == 31.0 ? ( x <= 7.0 ? 40960.0 : 42.0 ) : idx;
        idx = y == 30.0 ? ( x <= 7.0 ? 43520.0 : 58.0 ) : idx;
        idx = y == 29.0 ? ( x <= 7.0 ? 43648.0 : 62.0 ) : idx;
        idx = y == 28.0 ? ( x <= 7.0 ? 43648.0 : 2730.0 ) : idx;
        idx = y == 27.0 ? ( x <= 7.0 ? 62784.0 : 253.0 ) : idx;
        idx = y == 26.0 ? ( x <= 7.0 ? 63440.0 : 4085.0 ) : idx;
        idx = y == 25.0 ? ( x <= 7.0 ? 55248.0 : 16383.0 ) : idx;
        idx = y == 24.0 ? ( x <= 7.0 ? 55252.0 : 16351.0 ) : idx;
        idx = y == 23.0 ? ( x <= 7.0 ? 65492.0 : 1365.0 ) : idx;
        idx = y == 22.0 ? ( x <= 7.0 ? 65364.0 : 1367.0 ) : idx;
        idx = y == 21.0 ? ( x <= 7.0 ? 64832.0 : 1023.0 ) : idx;
        idx = y == 20.0 ? ( x <= 7.0 ? 21504.0 : 15.0 ) : idx;
        idx = y == 19.0 ? ( x <= 7.0 ? 43520.0 : 12325.0 ) : idx;
        idx = y == 18.0 ? ( x <= 7.0 ? 38208.0 : 64662.0 ) : idx;
        idx = y == 17.0 ? ( x <= 7.0 ? 21840.0 : 64922.0 ) : idx;
        idx = y == 16.0 ? ( x <= 7.0 ? 21844.0 : 65114.0 ) : idx;
        idx = y == 15.0 ? ( x <= 7.0 ? 21844.0 : 30298.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 38228.0 : 5722.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 42325.0 : 1902.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 43605.0 : 682.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 44031.0 : 682.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 44031.0 : 17066.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 43775.0 : 21162.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 43772.0 : 21866.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 43392.0 : 21866.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 42640.0 : 21866.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 23189.0 : 21866.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 43605.0 : 21824.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 2389.0 : 0.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 84.0 : 0.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 84.0 : 0.0 ) : idx;
        idx = y == 0.0 ? ( x <= 7.0 ? 336.0 : 0.0 ) : idx;
    }
    else
    {
        idx = y == 31.0 ? ( x <= 7.0 ? 0.0 : 16128.0 ) : idx;
        idx = y == 30.0 ? ( x <= 7.0 ? 0.0 : 63424.0 ) : idx;
        idx = y == 29.0 ? ( x <= 7.0 ? 40960.0 : 55274.0 ) : idx;
        idx = y == 28.0 ? ( x <= 7.0 ? 43520.0 : 65514.0 ) : idx;
        idx = y == 27.0 ? ( x <= 7.0 ? 43648.0 : 21866.0 ) : idx;
        idx = y == 26.0 ? ( x <= 7.0 ? 43648.0 : 23210.0 ) : idx;
        idx = y == 25.0 ? ( x <= 7.0 ? 62784.0 : 22013.0 ) : idx;
        idx = y == 24.0 ? ( x <= 7.0 ? 63440.0 : 24573.0 ) : idx;
        idx = y == 23.0 ? ( x <= 7.0 ? 55248.0 : 32767.0 ) : idx;
        idx = y == 22.0 ? ( x <= 7.0 ? 55248.0 : 32735.0 ) : idx;
        idx = y == 21.0 ? ( x <= 7.0 ? 65492.0 : 5461.0 ) : idx;
        idx = y == 20.0 ? ( x <= 7.0 ? 64852.0 : 7511.0 ) : idx;
        idx = y == 19.0 ? ( x <= 7.0 ? 64832.0 : 6143.0 ) : idx;
        idx = y == 18.0 ? ( x <= 7.0 ? 43520.0 : 5477.0 ) : idx;
        idx = y == 17.0 ? ( x <= 7.0 ? 38228.0 : 1382.0 ) : idx;
        idx = y == 16.0 ? ( x <= 7.0 ? 21845.0 : 1430.0 ) : idx;
        idx = y == 15.0 ? ( x <= 7.0 ? 21845.0 : 410.0 ) : idx;
        idx = y == 14.0 ? ( x <= 7.0 ? 22005.0 : 602.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 38909.0 : 874.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 43007.0 : 686.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 44031.0 : 682.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 43763.0 : 17066.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 43708.0 : 21162.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 43648.0 : 21930.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 43584.0 : 21930.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 42389.0 : 21930.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 23189.0 : 21930.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 43669.0 : 21920.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 43669.0 : 0.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 10901.0 : 0.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 5.0 : 0.0 ) : idx;
    }
    
    idx = SPRITE_DEC( x, idx );
    
	color = idx == 1.0 ? RGB( 106, 107,  4 ) : color;
	color = idx == 2.0 ? RGB( 177,  52, 37 ) : color;
	color = idx == 3.0 ? RGB( 227, 157, 37 ) : color;    
}

void SpriteCoin( inout vec3 color, float x, float y, float frame )
{    
    float idx = 0.0;
	if ( frame == 0.0 )
    {
        idx = y == 14.0 ? ( x <= 7.0 ? 32768.0 : 1.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 32768.0 : 1.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 28672.0 : 5.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 28672.0 : 5.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 24576.0 : 5.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 32768.0 : 1.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 32768.0 : 1.0 ) : idx;
	}
    else if ( frame == 1.0 ) 
    {
        idx = y == 14.0 ? ( x <= 7.0 ? 32768.0 : 2.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 40960.0 : 10.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 43008.0 : 42.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 59392.0 : 41.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 47616.0 : 166.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 47616.0 : 166.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 47616.0 : 166.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 47616.0 : 166.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 47616.0 : 166.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 47616.0 : 166.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 59392.0 : 41.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 43008.0 : 42.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 40960.0 : 10.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 32768.0 : 2.0 ) : idx;;
    }
    else if ( frame == 2.0 ) 
    {
        idx = y == 14.0 ? ( x <= 7.0 ? 49152.0 : 1.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 49152.0 : 1.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 61440.0 : 7.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 49152.0 : 1.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 49152.0 : 1.0 ) : idx;
    }
    else
    {
        idx = y == 14.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 13.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 12.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 11.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 10.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 9.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 8.0 ? ( x <= 7.0 ? 0.0 : 3.0 ) : idx;
        idx = y == 7.0 ? ( x <= 7.0 ? 0.0 : 3.0 ) : idx;
        idx = y == 6.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 5.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 4.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 3.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 2.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
        idx = y == 1.0 ? ( x <= 7.0 ? 0.0 : 2.0 ) : idx;
    }
    
	idx = SPRITE_DEC( x, idx );

	color = idx == 1.0 ? RGB( 181, 49,   33 ) : color;
	color = idx == 2.0 ? RGB( 230, 156,  33 ) : color;
	color = idx == 3.0 ? RGB( 255, 255, 255 ) : color;    
}

void SpriteBrick( inout vec3 color, float x, float y )
{    
	float ymod4 = floor( mod( y, 4.0 ) );    
    float xmod8 = floor( mod( x, 8.0 ) );
    float ymod8 = floor( mod( y, 8.0 ) );
    
    // dark orange
    float idx = 2.0;
   
    // black
    idx = ymod4 == 0.0 ? 1.0 : idx;
    idx = xmod8 == ( ymod8 < 4.0 ? 3.0 : 7.0 ) ? 1.0 : idx;

    // light orange
    idx = y == 15.0 ? 3.0 : idx;

    color = idx == 1.0 ? RGB( 0,     0,   0 ) : color;
	color = idx == 2.0 ? RGB( 231,  90,  16 ) : color;
	color = idx == 3.0 ? RGB( 247, 214, 181 ) : color;
}

void DrawCastle( inout vec3 color, float x, float y )
{
	if ( x >= 0.0 && x < 80.0 && y >= 0.0 && y < 80.0 )
	{
		float ymod4    = mod( y, 4.0 );
		float xmod8    = mod( x, 8.0 );
		float xmod16_4 = mod( x + 4.0, 16.0 );
		float xmod16_3 = mod( x + 5.0, 16.0 );
		float ymod8    = mod( y, 8.0 );

		// dark orange
		float idx = 2.0;

		// black
		idx = ymod4 == 0.0 && y <= 72.0 && ( y != 44.0 || xmod16_3 > 8.0 ) ? 1.0 : idx;
		idx = x >= 24.0 && x <= 32.0 && y >= 48.0 && y <= 64.0 ? 1.0 : idx;
		idx = x >= 48.0 && x <= 56.0 && y >= 48.0 && y <= 64.0 ? 1.0 : idx;
		idx = x >= 32.0 && x <= 47.0 && y <= 25.0 ? 1.0 : idx;
		idx = xmod8 == ( ymod8 < 4.0 ? 3.0 : 7.0 ) && y <= 72.0 && ( xmod16_3 > 8.0 || y <= 40.0 || y >= 48.0 ) ? 1.0 : idx;  

		// white
		idx = y == ( xmod16_4 < 8.0 ? 47.0 : 40.0 ) ? 3.0 : idx;
		idx = y == ( xmod16_4 < 8.0 ? 79.0 : 72.0 ) ? 3.0 : idx;
		idx = xmod8 == 3.0 && y >= 40.0 && y <= 47.0 ? 3.0 : idx;
		idx = xmod8 == 3.0 && y >= 72.0 ? 3.0 : idx;

		// transparent
		idx = ( x < 16.0 || x >= 64.0 ) && y >= 48.0 ? 0.0 : idx;
		idx = x >= 4.0  && x <= 10.0 && y >= 41.0 && y <= 47.0 ? 0.0 : idx;
		idx = x >= 68.0 && x <= 74.0 && y >= 41.0 && y <= 47.0 ? 0.0 : idx;             
		idx = y >= 73.0 && xmod16_3 > 8.0 ? 0.0 : idx;

		color = idx == 1.0 ? RGB(   0,   0,   0 ) : color;
		color = idx == 2.0 ? RGB( 231,  90,  16 ) : color;
		color = idx == 3.0 ? RGB( 247, 214, 181 ) : color;
	}
}

void DrawKoopa( inout vec3 color, float x, float y, float frame )
{
    if ( x >= 0.0 && x <= 15.0 )
    {
        SpriteKoopa( color, x, y, frame );
    }
}

void KoopaWalk( inout vec3 color, float worldX, float worldY, float time, float frame, float startX )
{
    float x = worldX - startX + floor( time * GOOMBA_SPEED );
    DrawKoopa( color, x, worldY - 16.0, frame );    
}

void DrawHitQuestion( inout vec3 color, float questionX, float questionY, float time, float questionT, float questionHitTime )
{
	float t = clamp( ( time - questionHitTime ) / 0.25, 0.0, 1.0 );
    t = 1.0 - abs( 2.0 * t - 1.0 );

    questionY -= floor( t * 8.0 );
    if ( questionX >= 0.0 && questionX <= 15.0 )
    {            
    	if ( time >= questionHitTime )
        {                
        	SpriteQuestion( color, questionX, questionY, 1.0 );
            if ( questionX >= 3.0 && questionX <= 12.0 && questionY >= 1.0 && questionY <= 15.0 )
            {
                color = RGB( 231, 90, 16 );
            }
        }
        else
        {
         	SpriteQuestion( color, questionX, questionY, questionT );
        }
    }
}

void DrawW( inout vec3 color, float x, float y )
{
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
        if (    ( x <= 3.0 || x >= 10.0 ) 
             || ( x >= 4.0 && x <= 5.0 && y >= 2.0 && y <= 7.0 )
             || ( x >= 8.0 && x <= 9.0 && y >= 2.0 && y <= 7.0 )
             || ( x >= 6.0 && x <= 7.0 && y >= 4.0 && y <= 9.0 )
           )
        {
            color = RGB( 255, 255, 255 );
        }
    }
}

void DrawO( inout vec3 color, float x, float y )
{
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
        if (    ( x <= 1.0 || x >= 12.0 ) && ( y >= 2.0 && y <= 11.0 )
             || ( x >= 2.0 && x <= 4.0 )
             || ( x >= 9.0 && x <= 11.0 )
             || ( y <= 1.0 || y >= 11.0 ) && ( x >= 2.0 && x <= 11.0 )
           )
        {
            color = RGB( 255, 255, 255 );
        }
    }
}

void DrawR( inout vec3 color, float x, float y )
{
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
        if (    ( x <= 3.0 )
			 || ( y >= 12.0 && x <= 11.0 )
             || ( x >= 10.0 && y >= 6.0 && y <= 11.0 )
             || ( x >= 8.0  && x <= 9.0 && y <= 7.0 )
             || ( x <= 9.0  && y >= 4.0 && y <= 5.0 )
             || ( x >= 8.0  && y <= 1.0 )
             || ( x >= 6.0  && x <= 11.0 && y >= 2.0 && y <= 3.0 )
           )
        {
            color = RGB( 255, 255, 255 );
        }
    }
}

void DrawL( inout vec3 color, float x, float y )
{
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
        if ( x <= 3.0 || y <= 1.0 )
        {
            color = RGB( 255, 255, 255 );
        }
    }
}

void DrawD( inout vec3 color, float x, float y )
{    
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
    	color = RGB( 255, 255, 255 );        
        
        if (    ( x >= 4.0 && x <= 7.0 && y >= 2.0 && y <= 11.0 ) 
           	 || ( x >= 8.0 && x <= 9.0 && y >= 4.0 && y <= 9.0 ) 
             || ( x >= 12.0 && ( y <= 3.0 || y >= 10.0 ) )
             || ( x >= 10.0 && ( y <= 1.0 || y >= 12.0 ) )
           )
        {
            color = RGB( 0, 0, 0 );
        }
    }
}

void Draw1( inout vec3 color, float x, float y )
{    
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
        if (    ( y <= 1.0 )
             || ( x >= 5.0 && x <= 8.0 )
             || ( x >= 3.0 && x <= 4.0 && y >= 10.0 && y <= 11.0 )
           )
        {
            color = RGB( 255, 255, 255 );
        }
    }
}

void DrawM( inout vec3 color, float x, float y )
{    
    if ( x >= 0.0 && x < 14.0 && y >= 0.0 && y < 14.0 )
    {
        if ( y >= 4.0 && y <= 7.0 )
        {
            color = RGB( 255, 255, 255 );
        }
    }
}

void DrawIntro( inout vec3 color, float x, float y, float screenWidth, float screenHeight )
{
    color = RGB( 0, 0, 0 );
        
    float offset 	= 18.0;     
    float textX 	= floor( x - ( screenWidth - offset * 8.0 - 7.0 ) / 2.0 );
    float textY 	= floor( y - ( screenHeight - 7.0 ) / 2.0 - 16.0 * 2.0 );
    float marioX	= textX - offset * 4.0;
    float marioY	= textY + 16.0 * 3.0;
	
    DrawW( color, textX - offset * 0.0, textY );
    DrawO( color, textX - offset * 1.0, textY );
    DrawR( color, textX - offset * 2.0, textY );
    DrawL( color, textX - offset * 3.0, textY );
    DrawD( color, textX - offset * 4.0, textY );
    Draw1( color, textX - offset * 6.0, textY );
    DrawM( color, textX - offset * 7.0, textY );
    Draw1( color, textX - offset * 8.0, textY );
    
    if ( marioX >= 0.0 && marioX <= 15.0 )
    {
    	SpriteMario( color, marioX, marioY, 4.0 );
    }
}

float CoinAnimY( float worldY, float time, float coinTime )
{
	return worldY - 4.0 * 16.0 - floor( 64.0 * ( 1.0 - abs( 2.0 * ( clamp( ( time - coinTime ) / 0.8, 0.0, 1.0 ) ) - 1.0 ) ) );
}

float QuestionAnimY( float worldY, float time, float questionHitTime )
{
     return worldY - 4.0 * 16.0 - floor( 8.0 * ( 1.0 - abs( 2.0 * clamp( ( time - questionHitTime ) / 0.25, 0.0, 1.0 ) - 1.0 ) ) );
}

float GoombaSWalkX( float worldX, float startX, float time, float goombaLifeTime )
{
    return worldX + floor( min( time, goombaLifeTime ) * GOOMBA_SPEED ) - startX;
}

void DrawGame( inout vec3 color, float time, float pixelX, float pixelY, float screenWidth, float screenHeight )
{
    float mushroomPauseStart 	= 16.25;    
    float mushroomPauseLength 	= 2.0;    
    float flagPauseStart		= 38.95;
    float flagPauseLength		= 1.5;

    float cameraP1		= clamp( time - mushroomPauseStart, 0.0, mushroomPauseLength );
    float cameraP2		= clamp( time - flagPauseStart,     0.0, flagPauseLength );
    float cameraX 		= floor( min( ( time - cameraP1 - cameraP2 ) * MARIO_SPEED - 240.0, 3152.0 ) );
    float worldX 		= pixelX + cameraX;
    float worldY  		= pixelY - 8.0;
    float tileX			= floor( worldX / 16.0 );
    float tileY			= floor( worldY / 16.0 );
    float tile2X		= floor( worldX / 32.0 );
    float tile2Y		= floor( worldY / 32.0 );    
    float worldXMod16	= mod( worldX, 16.0 );
    float worldYMod16 	= mod( worldY, 16.0 );


    // default background color
    color = RGB( 92, 148, 252 );

    
    // draw hills
    float bigHillX 	 = mod( worldX, 768.0 );
    float smallHillX = mod( worldX - 240.0, 768.0 );
    float hillX 	 = min( bigHillX, smallHillX );
    float hillY      = worldY - ( smallHillX < bigHillX ? 0.0 : 16.0 );
    SpriteHill( color, hillX, hillY );


    // draw clouds and bushes
	float sc1CloudX = mod( worldX - 296.0, 768.0 );
    float sc2CloudX = mod( worldX - 904.0, 768.0 );
    float mcCloudX  = mod( worldX - 584.0, 768.0 );
    float lcCloudX  = mod( worldX - 440.0, 768.0 );    
    float scCloudX  = min( sc1CloudX, sc2CloudX );
    float sbCloudX 	= mod( worldX - 376.0, 768.0 );
    float mbCloudX  = mod( worldX - 664.0, 768.0 );  
	float lbCloudX  = mod( worldX - 184.0, 768.0 );
    float cCloudX	= min( min( scCloudX, mcCloudX ), lcCloudX );
    float bCloudX	= min( min( sbCloudX, mbCloudX ), lbCloudX );
    float sCloudX	= min( scCloudX, sbCloudX );
    float mCloudX	= min( mcCloudX, mbCloudX );
    float lCloudX	= min( lcCloudX, lbCloudX );
    float cloudX	= min( cCloudX, bCloudX );
    float isBush	= bCloudX < cCloudX ? 1.0 : 0.0;
    float cloudSeg	= cloudX == sCloudX ? 0.0 : ( cloudX == mCloudX ? 1.0 : 2.0 );
    float cloudY	= worldY - ( isBush == 1.0 ? 8.0 : ( ( cloudSeg == 0.0 && sc1CloudX < sc2CloudX ) || cloudSeg == 1.0 ? 168.0 : 152.0 ) );
	if ( cloudX >= 0.0 && cloudX < 32.0 + 16.0 * cloudSeg )
    {
        if ( cloudSeg == 1.0 )
        {
        	cloudX = cloudX < 24.0 ? cloudX : cloudX - 16.0;
        }
        if ( cloudSeg == 2.0 )
        {
        	cloudX = cloudX < 24.0 ? cloudX : ( cloudX < 40.0 ? cloudX - 16.0 : cloudX - 32.0 );
        }
        
    	SpriteCloud( color, cloudX, cloudY, isBush );
    }

    
    
    // draw flag pole
    if ( worldX >= 3175.0 && worldX <= 3176.0 && worldY <= 176.0 )        
    {
        color = RGB( 189, 255, 24 );
    }
    
    // draw flag
    float flagX = worldX - 3160.0;
    float flagY = worldY - 159.0 + floor( 122.0 * clamp( ( time - 39.0 ) / 1.0, 0.0, 1.0 ) );
    if ( flagX >= 0.0 && flagX <= 15.0 )
    {
    	SpriteFlag( color, flagX, flagY );
    }     
    
    // draw flagpole end
    float flagpoleEndX = worldX - 3172.0;
    float flagpoleEndY = worldY - 176.0;
    if ( flagpoleEndX >= 0.0 && flagpoleEndX <= 7.0 )
    {
    	SpriteFlagpoleEnd( color, flagpoleEndX, flagpoleEndY );
    }
    
    

    // draw blocks
   	if (    ( tileX >= 134.0 && tileX < 138.0 && tileX - 132.0 > tileY )
         || ( tileX >= 140.0 && tileX < 144.0 && 145.0 - tileX > tileY )
         || ( tileX >= 148.0 && tileX < 153.0 && tileX - 146.0 > tileY && tileY < 5.0 )
         || ( tileX >= 155.0 && tileX < 159.0 && 160.0 - tileX > tileY ) 
         || ( tileX >= 181.0 && tileX < 190.0 && tileX - 179.0 > tileY && tileY < 9.0 )
         || ( tileX == 198.0 && tileY == 1.0 )
       )
    {
        SpriteBlock( color, worldXMod16, worldYMod16 );
    }
    
    
    // draw pipes
    float pipeY = worldY - 16.0;  
    float pipeH	= 0.0;    
    float pipeX = worldX - 179.0 * 16.0;
    if ( pipeX < 0.0 )
    {
        pipeX = worldX - 163.0 * 16.0;
        pipeH = 0.0;
    }
    if ( pipeX < 0.0 )
    {
        pipeX = worldX - 57.0 * 16.0;
        pipeH = 2.0;
    }
    if ( pipeX < 0.0 )
    {
        pipeX = worldX - 46.0 * 16.0;
        pipeH = 2.0;
    } 
    if ( pipeX < 0.0 )
    {
        pipeX = worldX - 38.0 * 16.0;
        pipeH = 1.0;
    }         
    if ( pipeX < 0.0 )
    {
        pipeX = worldX - 28.0 * 16.0;
        pipeH = 0.0;
    }
    if ( pipeX >= 0.0 && pipeX <= 31.0 && pipeY >= 0.0 && pipeY <= 31.0 + pipeH * 16.0 )
	{
		SpritePipe( color, pipeX, pipeY, pipeH );
	}
    
    
    // draw mushroom
    float mushroomStart = 15.7;    
    if ( time >= mushroomStart && time <= 17.0 )
    {
        float jumpTime = 0.5;
        
        float mushroomX = worldX - 1248.0;
        float mushroomY = worldY - 4.0 * 16.0;
        if ( time >= mushroomStart )
        {
            mushroomY = worldY - 4.0 * 16.0 - floor( 16.0 * clamp( ( time - mushroomStart ) / 0.5, 0.0, 1.0 ) );
        }
        if ( time >= mushroomStart + 0.5 )
        {
            mushroomX -= floor( MARIO_SPEED * ( time - mushroomStart - 0.5 ) );
        }
        if ( time >= mushroomStart + 0.5 + 0.4 )
        {
            mushroomY = mushroomY + floor( sin( ( ( time - mushroomStart - 0.5 - 0.4 ) ) * 3.14 ) * 4.0 * 16.0 );
        }
        
        if ( mushroomX >= 0.0 && mushroomX <= 15.0 )
        {
        	SpriteMushroom( color, mushroomX, mushroomY );
        }
    }

    
    // draw coins
    float coinFrame = floor( mod( time * 12.0, 4.0 ) );
    float coinX 	= worldX - 2720.0;
    float coinTime 	= 33.9;    
    float coinY 	= CoinAnimY( worldY, time, coinTime );
    if ( coinX < 0.0 )
    {
    	coinX 		= worldX - 1696.0;
    	coinTime 	= 22.4;    
    	coinY 		= CoinAnimY( worldY, time, coinTime );        
    }
    if ( coinX < 0.0 )
    {
    	coinX 		= worldX - 352.0;
    	coinTime 	= 5.4;    
    	coinY 		= CoinAnimY( worldY, time, coinTime );
    } 
    
    if ( coinX >= 0.0 && coinX <= 15.0 && time >= coinTime + 0.1 )
    {   
        SpriteCoin( color, coinX, coinY, coinFrame );
    }

    
    // draw questions
	float questionT = clamp( sin( time * 6.0 ), 0.0, 1.0 );    
    if (    ( tileY == 4.0 && ( tileX == 16.0 || tileX == 20.0 || tileX == 109.0 || tileX == 112.0 ) )
         || ( tileY == 8.0 && ( tileX == 21.0 || tileX == 94.0 || tileX == 109.0 ) )
         || ( tileY == 8.0 && ( tileX >= 129.0 && tileX <= 130.0 ) )
       )
    {
        SpriteQuestion( color, worldXMod16, worldYMod16, questionT );
    }
    
    
    // draw hitted questions
    float questionHitTime 	= 33.9;
    float questionX 		= worldX - 2720.0;
    if ( questionX < 0.0 )
    {
        questionHitTime = 22.4;
        questionX		= worldX - 1696.0;
    }
    if ( questionX < 0.0 )
    {
        questionHitTime = 15.4;
        questionX		= worldX - 1248.0;
    }
    if ( questionX < 0.0 )
    {
        questionHitTime = 5.3;
        questionX		= worldX - 352.0;
    }    
    questionT		= time >= questionHitTime ? 1.0 : questionT;    
    float questionY = QuestionAnimY( worldY, time, questionHitTime );
    if ( questionX >= 0.0 && questionX <= 15.0 )
    {
    	SpriteQuestion( color, questionX, questionY, questionT );
    }
    if ( time >= questionHitTime && questionX >= 3.0 && questionX <= 12.0 && questionY >= 1.0 && questionY <= 15.0 )
    {
        color = RGB( 231, 90, 16 );
    }    

    
    // draw bricks
   	if (    ( tileY == 4.0 && ( tileX == 19.0 || tileX == 21.0 || tileX == 23.0 || tileX == 77.0 || tileX == 79.0 || tileX == 94.0 || tileX == 118.0 || tileX == 168.0 || tileX == 169.0 || tileX == 171.0 ) )
         || ( tileY == 8.0 && ( tileX == 128.0 || tileX == 131.0 ) )
         || ( tileY == 8.0 && ( tileX >= 80.0 && tileX <= 87.0 ) )
         || ( tileY == 8.0 && ( tileX >= 91.0 && tileX <= 93.0 ) )
         || ( tileY == 4.0 && ( tileX >= 100.0 && tileX <= 101.0 ) )
         || ( tileY == 8.0 && ( tileX >= 121.0 && tileX <= 123.0 ) )
         || ( tileY == 4.0 && ( tileX >= 129.0 && tileX <= 130.0 ) )
       )
    {
        SpriteBrick( color, worldXMod16, worldYMod16 );
    }   
    
    
    // draw castle flag
    float castleFlagX = worldX - 3264.0;
    float castleFlagY = worldY - 64.0 - floor( 32.0 * clamp( ( time - 44.6 ) / 1.0, 0.0, 1.0 ) );
    if ( castleFlagX > 0.0 && castleFlagX < 14.0 )
    {
    	SpriteCastleFlag( color, castleFlagX, castleFlagY );
	}
    
    DrawCastle( color, worldX - 3232.0, worldY - 16.0 );

    // draw ground
    if ( tileY <= 0.0
         && !( tileX >= 69.0  && tileX < 71.0 )
         && !( tileX >= 86.0  && tileX < 89.0 ) 
         && !( tileX >= 153.0 && tileX < 155.0 ) 
       )
    {
        SpriteGround( color, worldXMod16, worldYMod16 );
    }    
    

    // draw Koopa
    float goombaFrame = floor( mod( time * 5.0, 2.0 ) );
    KoopaWalk( color, worldX, worldY, time, goombaFrame, 2370.0 );
    
    
    // draw stomped walking Goombas
    float goombaY 			= worldY - 16.0;        
    float goombaLifeTime 	= 26.3;
    float goombaX 			= GoombaSWalkX( worldX, 2850.0 + 24.0, time, goombaLifeTime );
    if ( goombaX < 0.0 )
    {
        goombaLifeTime 	= 25.3;
        goombaX 		= GoombaSWalkX( worldX, 2760.0, time, goombaLifeTime );
    }
    if ( goombaX < 0.0 ) 
    {
		goombaLifeTime 	= 23.5;
        goombaX 		= GoombaSWalkX( worldX, 2540.0, time, goombaLifeTime );
    }
    if ( goombaX < 0.0 ) 
    {
        goombaLifeTime 	= 20.29;
        goombaX 		= GoombaSWalkX( worldX, 2150.0, time, goombaLifeTime );
    }
    if ( goombaX < 0.0 )
    {
        goombaLifeTime 	= 10.3;
		goombaX 		= worldX - 790.0 - floor( abs( mod( ( min( time, goombaLifeTime ) + 6.3 ) * GOOMBA_SPEED, 2.0 * 108.0 ) - 108.0 ) );
    }
	goombaFrame = time > goombaLifeTime ? 2.0 : goombaFrame;
    if ( goombaX >= 0.0 && goombaX <= 15.0 )
    {
        SpriteGoomba( color, goombaX, goombaY, goombaFrame );
    }    
    
    // draw walking Goombas
    goombaFrame 		= floor( mod( time * 5.0, 2.0 ) );
    float goombaWalkX 	= worldX + floor( time * GOOMBA_SPEED );
    goombaX 			= goombaWalkX - 3850.0 - 24.0;
    if ( goombaX < 0.0 ) goombaX = goombaWalkX - 3850.0;
    if ( goombaX < 0.0 ) goombaX = goombaWalkX - 2850.0;
    if ( goombaX < 0.0 ) goombaX = goombaWalkX - 2760.0 - 24.0;
    if ( goombaX < 0.0 ) goombaX = goombaWalkX - 2540.0 - 24.0;
    if ( goombaX < 0.0 ) goombaX = goombaWalkX - 2150.0 - 24.0;
    if ( goombaX < 0.0 ) goombaX = worldX - 766.0 - floor( abs( mod( ( time + 6.3 ) * GOOMBA_SPEED, 2.0 * 108.0 ) - 108.0 ) );
    if ( goombaX < 0.0 ) goombaX = worldX - 638.0 - floor( abs( mod( ( time + 6.6 ) * GOOMBA_SPEED, 2.0 * 84.0 ) - 84.0 ) );
    if ( goombaX < 0.0 ) goombaX = goombaWalkX - 435.0;
    if ( goombaX >= 0.0 && goombaX <= 15.0 )
    {
        SpriteGoomba( color, goombaX, goombaY, goombaFrame );
    }
    

    
    // Mario jump
    float marioBigJump1 	= 27.1;
    float marioBigJump2 	= 29.75;
    float marioBigJump3 	= 35.05;    
    float marioJumpTime 	= 0.0;
    float marioJumpScale	= 0.0;
    
    if ( time >= 4.2   ) { marioJumpTime = 4.2;   marioJumpScale = 0.45; }
    if ( time >= 5.0   ) { marioJumpTime = 5.0;   marioJumpScale = 0.5;  }
    if ( time >= 6.05  ) { marioJumpTime = 6.05;  marioJumpScale = 0.7;  }
    if ( time >= 7.8   ) { marioJumpTime = 7.8;   marioJumpScale = 0.8;  }
    if ( time >= 9.0   ) { marioJumpTime = 9.0;   marioJumpScale = 1.0;  }
    if ( time >= 10.3  ) { marioJumpTime = 10.3;  marioJumpScale = 0.3;  }
    if ( time >= 11.05 ) { marioJumpTime = 11.05; marioJumpScale = 1.0;  }
    if ( time >= 13.62 ) { marioJumpTime = 13.62; marioJumpScale = 0.45; }
    if ( time >= 15.1  ) { marioJumpTime = 15.1;  marioJumpScale = 0.5;  }
    if ( time >= 18.7  ) { marioJumpTime = 18.7;  marioJumpScale = 0.6;  }
    if ( time >= 19.65 ) { marioJumpTime = 19.65; marioJumpScale = 0.45; }
    if ( time >= 20.29 ) { marioJumpTime = 20.29; marioJumpScale = 0.3;  }
    if ( time >= 21.8  ) { marioJumpTime = 21.8;  marioJumpScale = 0.35; }
    if ( time >= 22.3  ) { marioJumpTime = 22.3;  marioJumpScale = 0.35; }
    if ( time >= 23.0  ) { marioJumpTime = 23.0;  marioJumpScale = 0.40; }
    if ( time >= 23.5  ) { marioJumpTime = 23.5;  marioJumpScale = 0.3;  }
    if ( time >= 24.7  ) { marioJumpTime = 24.7;  marioJumpScale = 0.45; }
    if ( time >= 25.3  ) { marioJumpTime = 25.3;  marioJumpScale = 0.3;  }
    if ( time >= 25.75 ) { marioJumpTime = 25.75; marioJumpScale = 0.4;  }
    if ( time >= 26.3  ) { marioJumpTime = 26.3;  marioJumpScale = 0.25; }
    if ( time >= marioBigJump1 ) 		{ marioJumpTime = marioBigJump1; 		marioJumpScale = 1.0; }
    if ( time >= marioBigJump1 + 1.0 ) 	{ marioJumpTime = marioBigJump1 + 1.0; 	marioJumpScale = 0.6; }
    if ( time >= marioBigJump2 ) 		{ marioJumpTime = marioBigJump2; 		marioJumpScale = 1.0; }
    if ( time >= marioBigJump2 + 1.0 ) 	{ marioJumpTime = marioBigJump2 + 1.0;	marioJumpScale = 0.6; }    
    if ( time >= 32.3  ) { marioJumpTime = 32.3;  marioJumpScale = 0.7;  }
    if ( time >= 33.7  ) { marioJumpTime = 33.7;  marioJumpScale = 0.3;  }
    if ( time >= 34.15 ) { marioJumpTime = 34.15; marioJumpScale = 0.45; }
    if ( time >= marioBigJump3 ) 				{ marioJumpTime = marioBigJump3; 				marioJumpScale = 1.0; }
    if ( time >= marioBigJump3 + 1.2 ) 			{ marioJumpTime = marioBigJump3 + 1.2; 			marioJumpScale = 0.89; }
    if ( time >= marioBigJump3 + 1.2 + 0.75 ) 	{ marioJumpTime = marioBigJump3 + 1.2 + 0.75; 	marioJumpScale = 0.5; }
    
    float marioJumpOffset 		= 0.0;
    float marioJumpLength 		= 1.5  * marioJumpScale;
    float marioJumpAmplitude	= 76.0 * marioJumpScale;
    if ( time >= marioJumpTime && time <= marioJumpTime + marioJumpLength )
    {
        float t = ( time - marioJumpTime ) / marioJumpLength;
        marioJumpOffset = floor( sin( t * 3.14 ) * marioJumpAmplitude );
    }
    
    
    // Mario land
    float marioLandTime 	= 0.0;
    float marioLandAplitude = 0.0;
    if ( time >= marioBigJump1 + 1.0 + 0.45 ) 			{ marioLandTime = marioBigJump1 + 1.0 + 0.45; 			marioLandAplitude = 109.0; }
    if ( time >= marioBigJump2 + 1.0 + 0.45 ) 			{ marioLandTime = marioBigJump2 + 1.0 + 0.45; 			marioLandAplitude = 109.0; }
	if ( time >= marioBigJump3 + 1.2 + 0.75 + 0.375 ) 	{ marioLandTime = marioBigJump3 + 1.2 + 0.75 + 0.375; 	marioLandAplitude = 150.0; }
    
    float marioLandLength = marioLandAplitude / 120.0;
	if ( time >= marioLandTime && time <= marioLandTime + marioLandLength )
    {
        float t = 0.5 * ( time - marioLandTime ) / marioLandLength + 0.5;
       	marioJumpOffset = floor( sin( t * 3.14 ) * marioLandAplitude );
    }
    
    
    // Mario flag jump
    marioJumpTime 		= flagPauseStart - 0.3;
    marioJumpLength 	= 1.5  * 0.45;
    marioJumpAmplitude	= 76.0 * 0.45;
    if ( time >= marioJumpTime && time <= marioJumpTime + marioJumpLength + flagPauseLength ) 
    {
        float time2 = time;
        if ( time >= flagPauseStart && time <= flagPauseStart + flagPauseLength ) 
        {
            time2 = flagPauseStart;
        }
        else if ( time >= flagPauseStart )
        {
            time2 = time - flagPauseLength;
        }
		float t = ( time2 - marioJumpTime ) / marioJumpLength;
        marioJumpOffset = floor( sin( t * 3.14 ) * marioJumpAmplitude );
    }
    

    // Mario base (ground offset)
    float marioBase = 0.0;
    if ( time >= marioBigJump1 + 1.0 && time < marioBigJump1 + 1.0 + 0.45 )
    {
        marioBase = 16.0 * 4.0;
    }
    if ( time >= marioBigJump2 + 1.0 && time < marioBigJump2 + 1.0 + 0.45 )
    {
        marioBase = 16.0 * 4.0;
    }    
    if ( time >= marioBigJump3 + 1.2 && time < marioBigJump3 + 1.2 + 0.75 )
    {
        marioBase = 16.0 * 3.0;
    }    
    if ( time >= marioBigJump3 + 1.2 + 0.75 && time < marioBigJump3 + 1.2 + 0.75 + 0.375 )
    {
        marioBase = 16.0 * 7.0;
    }

    float marioX		= pixelX - 112.0;
    float marioY		= pixelY - 16.0 - 8.0 - marioBase - marioJumpOffset;    
    float marioFrame 	= marioJumpOffset == 0.0 ? floor( mod( time * 10.0, 3.0 ) ) : 3.0;
    if ( time >= mushroomPauseStart && time <= mushroomPauseStart + mushroomPauseLength )
    {
    	marioFrame = 1.0;
    }    
    if ( time > mushroomPauseStart + 0.7 )
    {
        float t = time - mushroomPauseStart - 0.7;
    	if ( mod( t, 0.2 ) <= mix( 0.0, 0.2, clamp( t / 1.3, 0.0, 1.0 ) ) )
        {
            // super mario offset
            marioFrame += 4.0;
        }
    }    
    if ( marioX >= 0.0 && marioX <= 15.0 && cameraX < 3152.0 )
    {
        SpriteMario( color, marioX, marioY, marioFrame );
    }
}

vec2 CRTCurveUV( vec2 uv )
{
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs( uv.yx ) / vec2( 6.0, 4.0 );
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

void DrawVignette( inout vec3 color, vec2 uv )
{    
    float vignette = uv.x * uv.y * ( 1.0 - uv.x ) * ( 1.0 - uv.y );
    vignette = clamp( pow( 16.0 * vignette, 0.3 ), 0.0, 1.0 );
    color *= vignette;
}

void DrawScanline( inout vec3 color, vec2 uv )
{
    float scanline 	= clamp( 0.95 + 0.05 * cos( 3.14 * ( uv.y + 0.008 * iGlobalTime ) * 240.0 * 1.0 ), 0.0, 1.0 );
    float grille 	= 0.85 + 0.15 * clamp( 1.5 * cos( 3.14 * uv.x * 640.0 * 1.0 ), 0.0, 1.0 );    
    color *= scanline * grille * 1.2;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // we want to see at least 224x192 (overscan) and we want multiples of pixel size
    float resMultX  = floor( iResolution.x / 224.0 );
    float resMultY  = floor( iResolution.y / 192.0 );
    float resRcp	= 1.0 / max( min( resMultX, resMultY ), 1.0 );
    
    float time			= iGlobalTime;
    float screenWidth	= floor( iResolution.x * resRcp );
    float screenHeight	= floor( iResolution.y * resRcp );
    float pixelX 		= floor( fragCoord.x * resRcp );
    float pixelY 		= floor( fragCoord.y * resRcp );

    vec3 color = RGB( 92, 148, 252 );
 	DrawGame( color, time, pixelX, pixelY, screenWidth, screenHeight );
    if ( time < INTRO_LENGTH )
    {
        DrawIntro( color, pixelX, pixelY, screenWidth, screenHeight );
    }    

    
    // CRT effects (curvature, vignette, scanlines and CRT grille)
    vec2 uv    = fragCoord.xy / iResolution.xy;
    vec2 crtUV = CRTCurveUV( uv );
    if ( crtUV.x < 0.0 || crtUV.x > 1.0 || crtUV.y < 0.0 || crtUV.y > 1.0 )
    {
        color = vec3( 0.0, 0.0, 0.0 );
    }
    DrawVignette( color, crtUV );
    DrawScanline( color, uv );
    
	fragColor.xyz 	= color;
    fragColor.w		= 1.0;
}
</script>