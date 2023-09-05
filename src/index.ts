import * as ListenDevices from "./listen-devices"
import * as TransportNodeHid from "./transport-node-hid"
import * as TransportNodeHidNoEvents from "./transport-node-hid-noevents"

export let KProJSNodeHID = {
  ListenDevices: ListenDevices,
  TransportNodeHid: TransportNodeHid,
  TransportNodeHidNoEvents: TransportNodeHidNoEvents
}

export default KProJSNodeHID;
Object.assign(module.exports, KProJSNodeHID);