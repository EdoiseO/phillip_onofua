import { useLayoutEffect, useRef } from 'react';
import { offTheClockController } from '../off-the-clock-controller.js';
import { CollectionHeader } from './off-the-clock/CollectionHeader.jsx';
import { CollectionStory } from './off-the-clock/CollectionStory.jsx';
import { CollectionViewer } from './off-the-clock/CollectionViewer.jsx';
import { CollectionFooter } from './off-the-clock/CollectionFooter.jsx';
import { InspectionDialog } from './off-the-clock/InspectionDialog.jsx';
import { StickerDialog } from './off-the-clock/StickerDialog.jsx';

export function OffTheClock() {
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const root = stage.closest('#off-clock-root');
    let mounted = true;
    let dispose;

    // Use the browser import map so Compacts shares the same Three.js instance.
    import(/* @vite-ignore */ offTheClockController)
      .then(({ mountOffTheClock }) => {
        if (mounted) dispose = mountOffTheClock(stage, root);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Unable to load the 3D collection', error);
        stage.querySelector('#loading').hidden = true;
        stage.querySelector('#unavailable').hidden = false;
        root.querySelector('#open-cue').hidden = true;
      });

    return () => {
      mounted = false;
      dispose?.();
    };
  }, []);

  return (
    <>
      <CollectionHeader />
      <div className="page">
        <main className="experience" id="experience" data-collection="comics" tabIndex={-1}>
          <CollectionStory />
          <CollectionViewer stageRef={stageRef} />
        </main>
        <CollectionFooter />
      </div>
      <InspectionDialog />
      <StickerDialog />
    </>
  );
}
