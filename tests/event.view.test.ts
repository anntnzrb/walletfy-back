/**
 * @fileoverview Unit tests for Event view helpers
 */

import { renderEvent, renderEventCollection } from '@views/event.view';

describe('renderEvent', () => {
  it('converts Date into ISO strings while preserving fields', () => {
    const event = {
      id: 'event-1',
      nombre: 'Ingreso',
      descripcion: 'Test',
      cantidad: 100,
      fecha: new Date('2024-01-01T00:00:00.000Z'),
      tipo: 'ingreso' as const,
      adjunto: 'https://example.com',
    };

    const rendered = renderEvent(event);

    expect(rendered).toEqual({
      id: 'event-1',
      nombre: 'Ingreso',
      descripcion: 'Test',
      cantidad: 100,
      fecha: '2024-01-01T00:00:00.000Z',
      tipo: 'ingreso',
      adjunto: 'https://example.com',
    });
  });

  it('leaves unparsable fecha values untouched', () => {
    const event = {
      id: 'event-2',
      nombre: 'Ingreso',
      cantidad: 100,
      fecha: 'not-a-date',
      tipo: 'ingreso' as const,
    } as const;

    const rendered = renderEvent(event);

    expect(rendered.fecha).toBe('not-a-date');
  });
});

describe('renderEventCollection', () => {
  it('maps paginated results using renderEvent', () => {
    const result = renderEventCollection({
      data: [
        {
          id: 'event-1',
          nombre: 'Ingreso',
          cantidad: 100,
          fecha: new Date('2024-01-01T00:00:00.000Z'),
          tipo: 'ingreso' as const,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    expect(result).toEqual({
      data: [
        {
          id: 'event-1',
          nombre: 'Ingreso',
          cantidad: 100,
          descripcion: undefined,
          fecha: '2024-01-01T00:00:00.000Z',
          tipo: 'ingreso',
          adjunto: undefined,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });
});
