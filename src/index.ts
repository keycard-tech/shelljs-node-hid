import * as ListenDevices from "./listen-devices"
import * as TransportNodeHid from "./transport-node-hid"
import * as TransportNodeHidNoEvents from "./transport-node-hid-noevents"

export let ShellJSNodeHID = {
  ListenDevices: ListenDevices,
  TransportNodeHid: TransportNodeHid,
  TransportNodeHidNoEvents: TransportNodeHidNoEvents
}

export default ShellJSNodeHID;
Object.assign(module.exports, ShellJSNodeHID);