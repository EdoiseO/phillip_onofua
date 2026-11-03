import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { comics } from './comics.js';

const here = path => new URL(path, import.meta.url);

test('every blind bag lists its three pulls with local covers', () => {
  const bags = comics.filter(comic => comic.blindBag);
  assert.ok(bags.length > 0);
  for (const bag of bags) {
    assert.equal(bag.pulls?.length, 3, bag.id);
    for (const pull of bag.pulls) {
      assert.match(pull.cover, /^\.\/assets\/covers\/pulls\//, `${bag.id} ${pull.variant}`);
      assert.ok(existsSync(here(pull.cover)), pull.cover);
      assert.ok(['foil', 'gloss'].includes(pull.finish), pull.variant);
      // Backs are photos of my own copies; a reused back names the copy it came from.
      assert.match(pull.back, /^\.\/assets\/backs\/pulls\//, `${bag.id} ${pull.variant}`);
      assert.ok(existsSync(here(pull.back)), pull.back);
    }
    if (bag.bagBack) assert.ok(existsSync(here(bag.bagBack)), bag.bagBack);
  }
});

test('verified packaging backs have local artwork and source information', () => {
  for (const id of ['ben10-6', 'ben10-9']) {
    const bag = comics.find(comic => comic.id === id);
    assert.ok(bag?.bagBack, id);
    assert.ok(existsSync(here(bag.bagBack)), bag.bagBack);
    assert.equal(bag.backVerified, true, id);
    assert.equal(bag.backStatus, 'verified-outer-packaging', id);
    assert.match(bag.backSource, /^https:\/\//, id);
    assert.match(bag.backSourcePage, /^https:\/\//, id);
  }
});

test('the bag model keeps the nodes and clips the page drives', () => {
  const glb = readFileSync(here('./assets/models/blind-bag.glb'));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
  const nodes = new Set(json.nodes.map(node => node.name));
  for (const name of ['blind_bag', 'bag_body', 'seal_bottom', 'tear_strip', 'fin_seal']) assert.ok(nodes.has(name), name);
  const clips = new Set(json.animations.map(clip => clip.name));
  for (const name of ['tear_open', 'hover']) assert.ok(clips.has(name), name);
  const materials = new Set(json.materials.map(material => material.name));
  for (const name of ['art_front', 'art_back']) assert.ok(materials.has(name), name);
  // The site's policy blocks workers, so the model must not need a Draco decoder.
  assert.ok(!(json.extensionsRequired ?? []).includes('KHR_draco_mesh_compression'));
});
