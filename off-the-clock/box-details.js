// White, handled paperboard. All detail is procedural; no image assets are generated.
// Geometry is sized for the short-box body and lid in model.js.
function randomSource(seed = 31229) {
  return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
}

function texture(THREE, width, height, draw, color = true) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  result.anisotropy = 8;
  return result;
}

export function createCardboardTextures(THREE) {
  const random = randomSource();
  const map = texture(THREE, 1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#dddcd5'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 65000; i++) {
      const v = random();
      ctx.strokeStyle = v > .5 ? `rgba(255,255,247,${.07 + random() * .16})` : `rgba(102,94,73,${.025 + random() * .055})`;
      const x = random() * w, y = random() * h;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 3.3, y + 1 + random() * 2); ctx.stroke();
    }
    // Very faint vertical fluting beneath the white outer paper.
    for (let x = 0; x < w; x += 13) {
      const shade = ctx.createLinearGradient(x, 0, x + 13, 0);
      shade.addColorStop(0, '#60543900'); shade.addColorStop(.48, '#60543904'); shade.addColorStop(1, '#ffffff00');
      ctx.fillStyle = shade; ctx.fillRect(x, 0, 13, h);
    }
    for (let side = 0; side < 2; side++) {
      const edge = ctx.createLinearGradient(side ? w : 0, 0, side ? w - 26 : 26, 0);
      edge.addColorStop(0, '#8d826422'); edge.addColorStop(1, '#8d826400');
      ctx.fillStyle = edge; ctx.fillRect(side ? w - 26 : 0, 0, 26, h);
    }
    for (let i = 0; i < 22; i++) {
      const x = random() * w, y = random() * h;
      ctx.strokeStyle = `rgba(94,83,62,${.035 + random() * .025})`; ctx.lineWidth = .5 + random();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 9, y + 2, x + 20, y - 3, x + 30 + random() * 32, y + 2); ctx.stroke();
    }
    // Sparse paper-coating losses at handled edges. Broken, asymmetric chips
    // expose kraft fibres without turning the white panels into a brown frame.
    const wear = randomSource(7291);
    for (let side = 0; side < 4; side++) {
      ctx.save(); ctx.translate(w/2,h/2);ctx.rotate(side*Math.PI/2);ctx.translate(-w/2,-h/2);
      for (let i = 0; i < 38; i++) {
        const x=wear()*w,depth=1+wear()*7,length=3+wear()*22;
        if(wear()>.72)continue;
        ctx.fillStyle=`rgba(157,132,91,${.15+wear()*.34})`;
        ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+length,0);
        ctx.lineTo(x+length*.8,depth*.6);ctx.lineTo(x+length*.47,depth);
        ctx.lineTo(x+length*.18,depth*.3);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#fff9e18a';ctx.lineWidth=.65;
        ctx.beginPath();ctx.moveTo(x+length*.18,depth*.3);ctx.lineTo(x+length*.47,depth);ctx.lineTo(x+length*.8,depth*.6);ctx.stroke();
      }
      // A few feathered rub marks near corners, plus fine creases.
      for(const x of [18,w-28]){
        const rub=ctx.createRadialGradient(x,8,0,x,8,35);
        rub.addColorStop(0,'#9a805b26');rub.addColorStop(1,'#9a805b00');ctx.fillStyle=rub;ctx.fillRect(x-35,0,70,43);
      }
      for(let i=0;i<10;i++){
        const x=wear()*w,y=3+wear()*10;
        ctx.strokeStyle=`rgba(125,112,89,${.08+wear()*.13})`;ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5+wear()*16,y+wear()*3);ctx.stroke();
      }
      ctx.restore();
    }
  });
  const bumpMap = texture(THREE, 512, 512, (ctx, w, h) => {
    const image = ctx.createImageData(w, h), pixels = image.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const value = 105 + Math.floor(random() * 48);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value; pixels[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, false);
  const roughnessMap = texture(THREE, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      const v = 210 + Math.floor(random() * 35); ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(random() * w, random() * h, 1 + random() * 4, 1);
    }
  }, false);
  return { map, bumpMap, roughnessMap, bumpScale: .012, roughness: .93, color: 0xffffff };
}

export function addBoxDetails({ THREE, body, lid, W = 2.4, H = 2.9, D = 3.5, T = .068 }) {
  const textures = [], materials = [], meshes = [];
  const keepTexture = value => (textures.push(value), value);
  const keepMaterial = value => (materials.push(value), value);
  const ink = '#333b39';
  function plane(parent, width, height, material, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(...position); mesh.rotation.set(...rotation);
    mesh.receiveShadow = true; mesh.castShadow = false;
    parent.add(mesh); meshes.push(mesh); return mesh;
  }
  const paperMaterial = map => keepMaterial(new THREE.MeshStandardMaterial({ map, roughness: .96, color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  const decalMaterial = map => keepMaterial(new THREE.MeshStandardMaterial({ map, transparent: true, roughness: .94, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));

  // The label is intentionally big enough to be legible at the ordinary shelf view.
  const labelTexture = keepTexture(texture(THREE, 1024, 640, (ctx, w, h) => {
    ctx.fillStyle = '#e8e0c9'; ctx.fillRect(0, 0, w, h);
    const random = randomSource(17);
    for (let i = 0; i < 7000; i++) { ctx.fillStyle = `rgba(102,85,47,${random() * .08})`; ctx.fillRect(random() * w, random() * h, 1, 1); }
    ctx.fillStyle = '#8795a1'; ctx.fillRect(0, 0, 17, h);
    ctx.strokeStyle = '#8b816334'; ctx.lineWidth = 3; ctx.strokeRect(27, 18, w - 45, h - 36);
    ctx.fillStyle = ink; ctx.textBaseline = 'top';
    ctx.font = '600 42px monospace'; ctx.fillText('PERSONAL COLLECTION', 65, 53);
    ctx.save(); ctx.translate(62, 132); ctx.rotate(-.012);
    ctx.font = '900 184px Arial, sans-serif'; ctx.fillText('COMICS', 0, 0); ctx.restore();
    ctx.fillStyle = '#555b50'; ctx.font = '41px monospace'; ctx.fillText('ISSUES & VARIANTS', 65, 388);
    ctx.strokeStyle = '#7f816e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(65, 468); ctx.lineTo(960, 468); ctx.stroke();
    ctx.font = '500 38px monospace'; ctx.fillText('OFF THE CLOCK', 65, 514);
    ctx.textAlign = 'right'; ctx.fillStyle = '#687581'; ctx.fillText('BOX 001', 960, 514);
  }));
  plane(body, 1.65, 1.03, paperMaterial(labelTexture), [0, 1.27, D / 2 + T / 2 + .009], [0, 0, -.018]);

  const foldTexture = keepTexture(texture(THREE, 768, 1024, (ctx, w, h) => {
    const random = randomSource(618);
    ctx.lineCap = 'round';
    for (const x of [w * .07, w * .93]) {
      const sign = x < w / 2 ? 1 : -1;
      ctx.strokeStyle = '#746c5242'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sign * 3, h - 94); ctx.lineTo(x + sign * 62, h - 10); ctx.stroke();
      ctx.strokeStyle = '#ffffff85'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 3, 0); ctx.lineTo(x + 3 + sign * 3, h - 94); ctx.stroke();
    }
    ctx.strokeStyle = '#887d5b35'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h - 17); ctx.lineTo(w, h - 18); ctx.stroke();
    for (let i = 0; i < 190; i++) {
      const x = random() > .5 ? random() * 16 : w - random() * 16;
      const y = random() * h;
      ctx.fillStyle = `rgba(150,129,91,${.07 + random() * .16})`;
      ctx.fillRect(x, y, random() * 5, 1 + random() * 6);
    }
  }));
  const foldMaterial = decalMaterial(foldTexture);
  plane(body, W - .012, H - .01, foldMaterial, [0, H / 2, D / 2 + T / 2 + .005]);
  plane(body, W - .012, H - .01, foldMaterial, [0, H / 2, -D / 2 - T / 2 - .005], [0, Math.PI, 0]);

  // Exposed corrugated layers across all four top cut edges.
  const fluteTexture = keepTexture(texture(THREE, 768, 64, (ctx, w, h) => {
    ctx.fillStyle = '#b6a888'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#eee9dd'; ctx.fillRect(0, 0, w, 8); ctx.fillRect(0, h - 8, w, 8);
    ctx.strokeStyle = '#74674c'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const y = h / 2 + Math.sin(x * Math.PI / 9) * 18;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#dacdb0'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= w; x++) { const y = h / 2 + Math.sin(x * Math.PI / 9) * 18 + 3; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  }));
  const rimMaterial = paperMaterial(fluteTexture);
  for (const side of [-1, 1]) {
    plane(body, D, T * .95, rimMaterial, [side * W / 2, H + .016, 0], [-Math.PI / 2, 0, Math.PI / 2]);
    plane(body, W, T * .95, rimMaterial, [0, H + .016, side * D / 2], [-Math.PI / 2, 0, 0]);
  }

  const sideStamp = keepTexture(texture(THREE, 1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#626c6888'; ctx.font = '600 66px monospace'; ctx.fillText('OTHER WORLDS', 52, 110);
    ctx.font = '35px monospace'; ctx.fillText('HANDLE WITH CURIOSITY.', 55, 176);
    ctx.strokeStyle = '#626c6860'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(55, 220); ctx.lineTo(w - 55, 220); ctx.stroke();
    ctx.font = '30px monospace'; ctx.fillText('ARCHIVE / 001', 55, 276);
    ctx.font = '25px monospace'; ctx.fillText('BAGGED. BOARDED. KEPT.', 55, 331);
  }));
  plane(body, 1.35, .675, decalMaterial(sideStamp), [W / 2 + T / 2 + .006, .83, -.25], [0, Math.PI / 2, 0]);

  const tapeTexture = keepTexture(texture(THREE, 256, 512, (ctx, w, h) => {
    const random = randomSource(842);
    ctx.fillStyle = '#d0c4a65a'; ctx.fillRect(6, 5, w - 12, h - 10);
    ctx.fillStyle = '#8b775e0f';
    for (let i = 0; i < 5500; i++) ctx.fillRect(random() * w, random() * h, .6, random() * 4);
    ctx.strokeStyle = '#a18d6428'; ctx.lineWidth = 3; ctx.strokeRect(6, 5, w - 12, h - 10);
    ctx.clearRect(0, 0, 24, 16); ctx.clearRect(w - 17, h - 13, 17, 13);
  }));
  const tapeMaterial = decalMaterial(tapeTexture);
  plane(body, .27, .49, tapeMaterial, [-.97, .31, D / 2 + T / 2 + .011], [0, 0, -.09]);

  const lidStamp = keepTexture(texture(THREE, 1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#64736b'; ctx.font = '600 58px monospace'; ctx.fillText('THE SHORT BOX', 60, 124);
    ctx.font = '32px monospace'; ctx.fillStyle = '#7b8177'; ctx.fillText('A FEW BIG ADVENTURES.', 63, 198);
    ctx.strokeStyle = '#7c887970'; ctx.lineWidth = 2; ctx.strokeRect(35, 49, 945, 204);
    ctx.font = '28px monospace'; ctx.fillText('001 / PERSONAL ARCHIVE', 62, 312);
  }));
  plane(lid, 1.48, .74, decalMaterial(lidStamp), [-.08, .132, .36], [-Math.PI / 2, 0, -.025]);
  // Tiny thickness cues along the lid's folded skirt, strongest at the end seams.
  const creaseMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: 0xb7b3a6, roughness: 1 }));
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      plane(lid, .008, .26, creaseMaterial, [x * (W / 2 + .035), -.064, z * (D / 2 + .109)], [0, z < 0 ? Math.PI : 0, 0]);
    }
  }
  return {
    meshes,
    dispose() { meshes.forEach(m => { m.removeFromParent(); m.geometry.dispose(); }); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); }
  };
}
