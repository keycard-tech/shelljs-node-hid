## ShellJS Node HID

ShellJS Node HID is based on [@ledgerhq/hw-transport-node-hid](@ledgerhq/hw-transport-node-hid) and allows to communicate with Keycard Pro using usb HID.

**\[Node]**/Electron **(HID)** – uses `node-hid` and `usb`.

#### Usage example

```typescript
import ShellJSNodeHID from "shelljs-node-hid";
...
let transport: any;
transport = await ShellJSNodeHID.TransportNodeHid.default.create();
...
```
