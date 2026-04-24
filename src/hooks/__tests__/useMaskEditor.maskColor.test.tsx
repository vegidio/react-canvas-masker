import { render, waitFor } from '@testing-library/react';
import { Image as NodeImage } from 'canvas';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { MaskEditor, MaskEditorCanvasRef } from '../../components/MaskEditor';

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverShim {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = ResizeObserverShim;
}

(globalThis as any).Image = NodeImage;
(window as any).Image = NodeImage;

function createImageDataUrl(width: number, height: number, fill = '#cccccc') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
}

describe('useMaskEditor - maskColor retint', () => {
  it('retints non-white painted pixels when maskColor changes', async () => {
    const src = createImageDataUrl(32, 32);
    const canvasRef = React.createRef<MaskEditorCanvasRef>();

    const { rerender } = render(
      <MaskEditor
        src={src}
        maskColor="#ff0000"
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    await waitFor(
      () => {
        const c = canvasRef.current?.maskCanvas;
        expect(c).toBeTruthy();
        expect(c!.width).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    const maskCanvas = canvasRef.current!.maskCanvas!;
    const ctx = maskCanvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 10, 1, 1);

    const before = ctx.getImageData(10, 10, 1, 1).data;
    expect([before[0], before[1], before[2]]).toEqual([255, 0, 0]);

    rerender(
      <MaskEditor
        src={src}
        maskColor="#00ff00"
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    await waitFor(
      () => {
        const after = ctx.getImageData(10, 10, 1, 1).data;
        expect([after[0], after[1], after[2]]).toEqual([0, 255, 0]);
      },
      { timeout: 2000 },
    );
  });

  it('preserves pure-white erase marks across maskColor changes', async () => {
    const src = createImageDataUrl(32, 32);
    const canvasRef = React.createRef<MaskEditorCanvasRef>();

    const { rerender } = render(
      <MaskEditor
        src={src}
        maskColor="#ff0000"
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    await waitFor(
      () => {
        const c = canvasRef.current?.maskCanvas;
        expect(c).toBeTruthy();
        expect(c!.width).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    const maskCanvas = canvasRef.current!.maskCanvas!;
    const ctx = maskCanvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(5, 5, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, 4, 4);

    rerender(
      <MaskEditor
        src={src}
        maskColor="#00ff00"
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    await waitFor(
      () => {
        const painted = ctx.getImageData(6, 6, 1, 1).data;
        expect([painted[0], painted[1], painted[2]]).toEqual([0, 255, 0]);
      },
      { timeout: 2000 },
    );

    const erased = ctx.getImageData(21, 21, 1, 1).data;
    expect([erased[0], erased[1], erased[2]]).toEqual([255, 255, 255]);
  });
});
