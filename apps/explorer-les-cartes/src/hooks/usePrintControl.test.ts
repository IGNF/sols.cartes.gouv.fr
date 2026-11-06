import { renderHook } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { describe, expect, it, vi } from 'vitest';
import usePrintControl from './usePrintControl';

function fakeMap(withColumn: boolean) {
  const target = document.createElement('div');
  if (withColumn)
    target.innerHTML = '<div id="position-container-top-left"><div id="GPzoom-1"></div></div>';
  const addControl = vi.fn((control: { element: HTMLElement }) => target.append(control.element));
  const removeControl = vi.fn((control: { element: HTMLElement }) => control.element.remove());
  return {
    map: { addControl, removeControl, getTargetElement: () => target } as unknown as OlMap,
    target,
    addControl,
    removeControl,
  };
}

describe('usePrintControl', () => {
  it('ajoute le bouton en fin de colonne haut gauche et le retire au démontage', () => {
    const { map, target, removeControl } = fakeMap(true);
    const onOpen = vi.fn();
    const { unmount } = renderHook(() => usePrintControl(map, onOpen));
    const column = target.querySelector('#position-container-top-left');
    expect(column?.lastElementChild).toHaveClass('map-print');
    column?.querySelector<HTMLButtonElement>('.map-print button')?.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeControl).toHaveBeenCalledTimes(1);
    expect(target.querySelector('.map-print')).toBeNull();
  });

  it('laisse le bouton où OpenLayers le met sans colonne geopf, et ne fait rien sans carte', () => {
    const { map, target, addControl } = fakeMap(false);
    renderHook(() => usePrintControl(map, vi.fn()));
    expect(addControl).toHaveBeenCalledTimes(1);
    expect(target.querySelector('.map-print')).not.toBeNull();
    const none = fakeMap(true);
    renderHook(() => usePrintControl(null, vi.fn()));
    expect(none.addControl).not.toHaveBeenCalled();
  });
});
