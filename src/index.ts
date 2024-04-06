import deepEqual from 'fast-deep-equal';
import { getVersion } from 'valtio/vanilla';
import * as Y from 'yjs';

const isProxyObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && getVersion(x) !== undefined;

const isProxyArray = (x: unknown): x is unknown[] =>
  Array.isArray(x) && getVersion(x) !== undefined;

const toJSON = (yv: unknown) => {
  if (yv instanceof Y.AbstractType) {
    return yv.toJSON();
  }

  return yv;
};

const getNestedValues = <T>(
  p: Record<string, T> | T[],
  y: Y.Map<T> | Y.Array<T>,
  path: (string | number)[],
) => {
  let pv: any = p;
  let yv: any = y;
  for (let i = 0; i < path.length; i += 1) {
    const k = path[i];
    if (yv instanceof Y.Map) {
      // child may already be deleted
      if (!pv) break;
      pv = pv[k];
      yv = yv.get(k as string);
    } else if (yv instanceof Y.Array) {
      // child may already be deleted
      if (!pv) break;
      const index = Number(k);
      pv = pv[k];
      yv = yv.get(index);
    } else {
      pv = null;
      yv = null;
    }
  }

  return { p: pv, y: yv };
};

export function bind<T>(
  p: Record<string, T> | T[],
  y: Y.Map<T> | Y.Array<T>,
): () => void {
  if (isProxyArray(p) && !(y instanceof Y.Array)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('proxy not same type');
    }
  }

  if (isProxyObject(p) && !isProxyArray(p) && !(y instanceof Y.Map)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('proxy not same type');
    }
  }

  // initialize from y
  initializeFromY(p, y);

  if (isProxyArray(p) && y instanceof Y.Array) {
    p.splice(y.length);
  }

  // subscribe y
  const unsubscribeY = subscribeY(y, p);

  return () => {
    unsubscribeY();
  };
}

function initializeFromY<T>(
  p: Record<string, T> | T[],
  y: Y.Map<T> | Y.Array<T>,
) {
  if (isProxyObject(p) && y instanceof Y.Map) {
    y.forEach((yv, k) => {
      if (!deepEqual(p[k], toJSON(yv))) {
        p[k] = toJSON(yv);
      }
    });
  }

  if (isProxyArray(p) && y instanceof Y.Array) {
    y.forEach((yv, i) => {
      if (!deepEqual(p[i], toJSON(yv))) {
        insertYValueToP(yv, p, i);
      }
    });
  }
}

function insertYValueToP<T>(
  yv: T,
  p: Record<string, T> | T[],
  k: number | string,
) {
  if (isProxyObject(p) && typeof k === 'string') {
    p[k] = toJSON(yv);
  } else if (isProxyArray(p) && typeof k === 'number') {
    p.splice(k, 0, toJSON(yv));
  }
}

function subscribeY<T>(y: Y.Map<T> | Y.Array<T>, p: Record<string, T> | T[]) {
  const observer = (events: Y.YEvent<any>[]) => {
    events.forEach((event) => {
      const path = event.path;
      const parent = getNestedValues(p, y, path);

      if (parent.y instanceof Y.Map) {
        event.changes.keys.forEach((item, k) => {
          if (item.action === 'delete') {
            delete parent.p[k];
          } else {
            const yv = parent.y.get(k);
            insertYValueToP(yv, parent.p, k);
          }
        });
      } else if (parent.y instanceof Y.Array) {
        if (deepEqual(parent.p, toJSON(parent.y))) {
          return;
        }

        let retain = 0;
        event.changes.delta.forEach((item) => {
          if (item.retain) {
            retain += item.retain;
          }
          if (item.delete) {
            parent.p.splice(retain, item.delete);
          }
          if (item.insert) {
            if (Array.isArray(item.insert)) {
              item.insert.forEach((yv, i) => {
                insertYValueToP(yv, parent.p, retain + i);
              });
            } else {
              insertYValueToP(item.insert as unknown as T, parent.p, retain);
            }
            retain += item.insert.length;
          }
        });
      }
    });
  };

  y.observeDeep(observer);
  return () => {
    y.unobserveDeep(observer);
  };
}
