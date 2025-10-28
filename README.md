## ShellJS Node HID

ShellJS Node HID is a Keycard Shell Node implementation of the communication layer.

**\[Node]**/Electron **(HID)** – uses `node-hid` and `usb`.

#### Installation
```
npm install @choppu/shelljs-node-hid
```


#### Usage example

```typescript
import ShellJSNodeHID from "shelljs-node-hid";
...
let transport: any;
transport = await ShellJSNodeHID.TransportNodeHid.default.create();
...
```
