## ShellJS Node HID

ShellJS Node HID is a Keycard Shell Node implementation of the communication layer.

**\[Node]**/Electron **(HID)** – uses `node-hid` and `usb`.

#### Installation
```
npm install @choppu/shelljs-node-hid
```


#### Usage example

```typescript
import ShellJSNodeHID from "@choppu/shelljs-node-hid";
...
let transport: any;
transport = await ShellJSNodeHID.TransportNodeHid.default.create();
...
```

#### Note

`usb` v3 dropped `unrefHotplugEvents()`: a live device subscription keeps the event loop
open, so unsubscribe to let the process exit.
