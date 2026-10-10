'use strict';

module.exports = function createSDKAdapter(sdk, { actionIds, onMessage, log }) {
  const streamDeck = sdk.default;
  const placements = new Map();
  const emit = (message) => onMessage(JSON.stringify(message));

  function forward(event, ev, manifestId) {
    const context = ev.action.id;
    if (event === 'willAppear') {
      placements.set(context, { action: ev.action, layout: Promise.resolve() });
    }
    emit({ event, context, action: manifestId, device: ev.action.device.id, payload: ev.payload });
    if (event === 'willDisappear') placements.delete(context);
  }

  class ForwardAction extends sdk.SingletonAction {
    constructor(manifestId) { super(); this.actionId = manifestId; }
    onWillAppear(ev) { forward('willAppear', ev, this.actionId); }
    onWillDisappear(ev) { forward('willDisappear', ev, this.actionId); }
    onDidReceiveSettings(ev) { forward('didReceiveSettings', ev, this.actionId); }
    onKeyDown(ev) { forward('keyDown', ev, this.actionId); }
    onKeyUp(ev) { forward('keyUp', ev, this.actionId); }
    onDialDown(ev) { forward('dialDown', ev, this.actionId); }
    onDialUp(ev) { forward('dialUp', ev, this.actionId); }
    onDialRotate(ev) { forward('dialRotate', ev, this.actionId); }
    onTouchTap(ev) { forward('touchTap', ev, this.actionId); }
  }

  for (const UUID of actionIds) {
    class PluginAction extends ForwardAction { constructor() { super(UUID); } }
    const Decorated = sdk.action({ UUID })(PluginAction) || PluginAction;
    streamDeck.actions.registerAction(new Decorated());
  }
  streamDeck.devices.onDeviceDidDisconnect((ev) => {
    emit({ event: 'deviceDidDisconnect', device: ev.device.id });
  });

  return {
    async connect() {
      await streamDeck.connect();
      log('connected to Stream Deck through official SDK');
    },
    sendJSON(message) {
      const placement = placements.get(message.context);
      if (!placement) return;
      const { action } = placement;
      const payload = message.payload || {};
      const current = () => placements.get(message.context) === placement;
      const screen = action.isDial() || action.isNeoInfobar();
      const fail = () => log('Stream Deck SDK command failed:', message.event);
      if (message.event === 'setFeedbackLayout' && screen) {
        placement.layout = placement.layout.then(() => {
          if (current()) return action.setFeedbackLayout(payload.layout);
        });
        placement.layout.catch(fail);
        return;
      }
      Promise.resolve().then(async () => {
        if (message.event === 'setFeedback') await placement.layout;
        if (!current()) return;
        switch (message.event) {
          case 'setImage': if (action.isKey()) return action.setImage(payload.image); break;
          case 'setFeedback': if (screen) return action.setFeedback(payload); break;
          case 'setSettings': return action.setSettings(payload);
          case 'showAlert': if (!action.isNeoInfobar()) return action.showAlert(); break;
        }
      }).catch(fail);
    },
  };
};
