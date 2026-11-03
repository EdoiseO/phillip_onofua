// Reviewed glTF models, each loaded once and cloned per use.
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cache=new Map();
export function loadModel(url){
  // The page's policy keeps connect-src to 'self', which blocks fetch() of the
  // blob URLs the loader makes for embedded images. Decode them as <img>
  // elements instead; img-src already allows blob:.
  if(!cache.has(url))cache.set(url,new GLTFLoader().register(parser=>{parser.textureLoader=new TextureLoader(parser.options.manager);return {name:'image-element-textures'};}).loadAsync(url));
  return cache.get(url);
}
