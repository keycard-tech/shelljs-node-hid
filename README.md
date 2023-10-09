## KProJS Node HID

KProJS Node HID is based on [@ledgerhq/hw-transport-node-hid](@ledgerhq/hw-transport-node-hid) and allows to communicate with Keycard Pro using usb HID.

**\[Node]**/Electron **(HID)** – uses `node-hid` and `usb`.

#### Usage example

```typescript
import KProJSNodeHID from "kprojs-node-hid";
...
let transport: any;
transport = await KProJSNodeHID.TransportNodeHid.default.create();
...
```
