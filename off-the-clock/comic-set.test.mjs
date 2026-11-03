import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const glb = readFileSync(new URL('./assets/models/comic-set.glb', import.meta.url));
const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
const byName = name => json.nodes.find(node => node.name === name);

test('the comic-set model keeps the parts and materials the page drives', () => {
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  for (const name of ['comic', 'backing_board', 'sleeve', 'sleeve_front', 'sleeve_flap', 'sleeve_weld_edges']) assert.ok(byName(name), name);
  const materials = new Set(json.materials.map(material => material.name));
  for (const name of ['cover_front', 'cover_back', 'film']) assert.ok(materials.has(name), name);
  const comicMesh = json.meshes[byName('comic').mesh];
  assert.deepEqual(comicMesh.extras?.targetNames, ['free_bow']);
  assert.ok(!(json.extensionsRequired ?? []).includes('KHR_draco_mesh_compression'));
});

test('the comic is true size, centred 0.0185 in front of its board', () => {
  const comicMesh = json.meshes[byName('comic').mesh];
  const positions = comicMesh.primitives.map(primitive => json.accessors[primitive.attributes.POSITION]);
  const min = [0, 1, 2].map(axis => Math.min(...positions.map(p => p.min[axis])));
  const max = [0, 1, 2].map(axis => Math.max(...positions.map(p => p.max[axis])));
  assert.ok(Math.abs(max[0] - min[0] - 1.745) < .005, `width ${max[0] - min[0]}`);
  assert.ok(Math.abs(max[1] - min[1] - 2.7) < .005, `height ${max[1] - min[1]}`);
  assert.ok(Math.abs((max[2] + min[2]) / 2 - .0185) < .002, `centre ${(max[2] + min[2]) / 2}`);
});
