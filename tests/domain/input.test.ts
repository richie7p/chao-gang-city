import { test } from "node:test";
import assert from "node:assert/strict";
import { ActionEdges, Input } from "../../src/game/input";

test("touch interaction survives a frame without physics and fires once during catch-up", () => {
  const input = new Input(); const edges = new ActionEdges();
  input.latchTouchUse(); edges.push(input.sample());
  const held = input.sample(); edges.push(held);
  assert.equal(edges.consume(held).usePressed, true);
  assert.equal(edges.consume(held).usePressed, false);
});

test("jump and talk edges are consumed once and cleared when leaving play", () => {
  const input = new Input(); const edges = new ActionEdges();
  input.keys.add("Space"); input.latchTouchTalk();
  const first = input.sample(); edges.push(first);
  const step = edges.consume(first); assert.equal(step.jumpPressed, true); assert.equal(step.talkPressed, true);
  assert.equal(edges.consume(first).jumpPressed, false);
  edges.push(first); edges.clear(); assert.equal(edges.consume(first).talkPressed, false);
});
test("keyboard steering signs and one-shot interaction edges", () => {
  const input = new Input(); input.keys.add("KeyW"); input.keys.add("KeyA"); input.keys.add("KeyE");
  const first = input.sample(); assert.equal(first.throttle, 1); assert.equal(first.steer, 1); assert.equal(first.usePressed, true);
  assert.equal(input.sample().usePressed, false); input.keys.delete("KeyA"); input.keys.add("KeyD"); assert.equal(input.sample().steer, -1);
});
test("hidden pages clear held keys and dispose removes the visibility listener", () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  class TrackedDocument extends EventTarget {
    hidden = true;
    listeners = new Set<EventListenerOrEventListenerObject>();
    override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
      if (type === "visibilitychange" && callback) this.listeners.add(callback);
      super.addEventListener(type, callback, options);
    }
    override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
      if (callback) this.listeners.delete(callback); super.removeEventListener(type, callback, options);
    }
  }
  const doc = new TrackedDocument();
  Object.defineProperty(globalThis, "window", { value: new EventTarget(), configurable: true });
  Object.defineProperty(globalThis, "document", { value: doc, configurable: true });
  const input = new Input();
  try {
    input.attach(new EventTarget() as HTMLElement); input.keys.add("KeyW");
    doc.dispatchEvent(new Event("visibilitychange")); assert.equal(input.sample().throttle, 0);
    assert.equal(doc.listeners.size, 1); input.dispose(); assert.equal(doc.listeners.size, 0);
  } finally {
    input.dispose();
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else Reflect.deleteProperty(globalThis, "window");
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument); else Reflect.deleteProperty(globalThis, "document");
  }
});
