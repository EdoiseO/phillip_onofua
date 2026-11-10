import { useLayoutEffect, useRef } from 'react';
import { CollectionHeader } from './off-the-clock/CollectionHeader.jsx';
import { CollectionStory } from './off-the-clock/CollectionStory.jsx';
import { CollectionViewer } from './off-the-clock/CollectionViewer.jsx';
import { CollectionFooter } from './off-the-clock/CollectionFooter.jsx';
import { CompactsDialog } from './off-the-clock/CompactsDialog.jsx';
import { InspectionDialog } from './off-the-clock/InspectionDialog.jsx';
import { StickerDialog } from './off-the-clock/StickerDialog.jsx';

// The controller uses the browser import map to share one vendored Three.js
// instance with Compacts, which loads only when its tab is opened.
const controllerUrl = '/off-the-clock/main.js?v=53.0';

export function OffTheClock() {
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const root = stage.closest('#off-clock-root');
    let mounted = true;
    let dispose;

    import(/* @vite-ignore */ controllerUrl)
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
        <main className="experience" id="experience" tabIndex={-1}>
          <CollectionStory />
          <CollectionViewer stageRef={stageRef} />
        </main>
        <CollectionFooter />
      </div>
      <CompactsDialog />
      <InspectionDialog />
      <StickerDialog />
    </>
  );
}
