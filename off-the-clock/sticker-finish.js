// One surface and no time-based animation: the foil follows the reflected view
// direction, including when a sticker bends around a corner or sits on the lid.
const foilFragment = /* glsl */ `
#if defined( USE_IRIDESCENCE ) && defined( USE_MAP )
  if (gl_FrontFacing) {
    vec3 foilReflection = inverseTransformDirection(
      reflect(-geometryViewDir, geometryNormal), viewMatrix
    );
    float foilSweep = dot(vMapUv, vec2(0.82, 0.56))
      + dot(foilReflection, vec3(0.95, 0.65, 0.25));
    float foilBand = pow(0.5 + 0.5 * cos(6.2831853 * foilSweep), 3.0);
    float foilPhase = dot(vMapUv, vec2(1.4, 0.95))
      + dot(foilReflection, vec3(0.65, 0.55, 0.2));
    vec3 foilSpectrum = 0.5 + 0.5 * cos(6.2831853 *
      (foilPhase + vec3(0.0, 0.3333333, 0.6666667)));
    float inkLightness = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float inkChroma = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b)
      - min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
    float foilStrength = (0.18 + 0.6 * smoothstep(0.06, 0.8, inkLightness))
      * (1.0 - 0.35 * inkChroma) * (0.3 + 0.7 * foilBand) * iridescence;
    // Reflect a colored band over the print, rather than replace its colors.
    // Dark lettering keeps its contrast; white cutout borders show more foil.
    outgoingLight = outgoingLight * (1.0 - foilStrength * (1.0 - foilSpectrum))
      + foilSpectrum * foilStrength * 0.3;
  }
#endif
`;

export function installStickerFinish(material){
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <map_fragment>','#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = vec3(0.96);')
      .replace('#include <opaque_fragment>',foilFragment+'\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=>'sticker-view-dependent-foil-v2';
}

export function setStickerFinish(material,finish){
  const holo=finish==='holo';
  if((material.iridescence>0)!==holo)material.needsUpdate=true;
  material.iridescence=holo?1:0;
  material.metalness=holo?.16:0;
  material.roughness=holo?.23:.27;
  material.clearcoatRoughness=holo?.1:.12;
}
