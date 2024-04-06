import * as Y from 'yjs';
import { proxy } from 'valtio/vanilla';
import { bind } from '../src/index';

describe('bind', () => {
  it('nested map from y.map', async () => {
    const doc = new Y.Doc();
    const p = proxy<{ foo?: { bar?: string } }>({});
    const m = doc.getMap('map') as any;

    bind(p, m);
    expect(p.foo).toBe(undefined);
    expect(m.get('foo')).toBe(undefined);

    m.set('foo', new Y.Map());
    m.get('foo').set('bar', 'a');
    expect(p?.foo?.bar).toBe('a');
    expect(m.get('foo').get('bar')).toBe('a');
  });

  it('can unsubscribe', async () => {
    const doc = new Y.Doc();
    const p = proxy<{ foo?: string }>({});
    const m = doc.getMap('map');

    const unsub = bind(p, m);

    unsub();
    expect(p.foo).toBe(undefined);

    m.set('foo', 'a');
    expect(m.get('foo')).toBe('a');
    expect(p.foo).toBe(undefined);

    p.foo = 'b';
    await Promise.resolve();
    expect(m.get('foo')).toBe('a');
    expect(p.foo).toBe('b');
  });
});
