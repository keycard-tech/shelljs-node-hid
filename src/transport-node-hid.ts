import HID from "node-hid";
import KProJS from "kprojs"
import TransportNodeHidNoEvents, { getDevices } from "./transport-node-hid-noevents";
import type { TransportTypes, HIDTypes } from "kprojs";
import { listenDevices } from "./listen-devices";

const DISCONNECT_TIMEOUT = 5000;

let transportInstance: any;
let disconnectTimeout: any;

const clearDisconnectTimeout = () => {
  if (disconnectTimeout) {
    clearTimeout(disconnectTimeout);
  }
};

const setDisconnectTimeout = () => {
  clearDisconnectTimeout();
  disconnectTimeout = setTimeout(
    () => TransportNodeHidSingleton.autoDisconnect(),
    DISCONNECT_TIMEOUT,
  );
};

/**
 * node-hid Transport implementation
 * @example
 import KProJSNodeHID from "kprojs-node-hid";
 ...
 let transport: any;
 transport = await KProJSNodeHID.create();
...
 */

export default class TransportNodeHidSingleton extends TransportNodeHidNoEvents {
  preventAutoDisconnect = false;
  /**
   *
   */
  static isSupported = TransportNodeHidNoEvents.isSupported;

  /**
   *
   */
  static list = TransportNodeHidNoEvents.list;

  /**
   */
  static listen = (observer: TransportTypes.Observer<HIDTypes.ListenDescriptorEvent>): TransportTypes.Subscription => {
    let unsubscribed: any;
    Promise.resolve(getDevices()).then((devices: any) => {
      // this needs to run asynchronously so the subscription is defined during this phase
      for (const device of devices) {
        if (!unsubscribed) {
          const deviceModel = KProJS.KProDevice.identifyUSBProductId(device.productId);
          observer.next({
            type: "add",
            descriptor: "",
            device: {
              name: device.deviceName,
            },
            deviceModel
          });
        }
      }
    });

    const onAdd = (device: any) => {
      const deviceModel = KProJS.KProDevice.identifyUSBProductId(device.productId);
      observer.next({
        type: "add",
        descriptor: "",
        deviceModel,
        device: {
          name: device.deviceName,
        }
      });
    };

    const onRemove = (device: any) => {
      const deviceModel = KProJS.KProDevice.identifyUSBProductId(device.productId);
      observer.next({
        type: "remove",
        descriptor: "",
        deviceModel,
        device: {
          name: device.deviceName,
        },
      });
    };

    const stop = listenDevices(onAdd, onRemove);

    function unsubscribe() {
      stop();
      unsubscribed = true;
    }

    return {
      unsubscribe
    };
  };

  /**
   * convenience wrapper for auto-disconnect logic
   */
  static async autoDisconnect(): Promise<void> {
    if (transportInstance && !transportInstance.preventAutoDisconnect) {
      KProJS.KProLogs.log("hid-verbose", "triggering auto disconnect");
      TransportNodeHidSingleton.disconnect();
    } else if (transportInstance) {
      // If we have disabled the auto-disconnect, try again in DISCONNECT_TIMEOUT
      clearDisconnectTimeout();
      setDisconnectTimeout();
    }
  }

  /**
   * globally disconnect the transport singleton
   */
  static async disconnect() {
    if (transportInstance) {
      transportInstance.device.close();
      transportInstance.emit("disconnect");
      transportInstance = null;
    }
    clearDisconnectTimeout();
  }

  /**
   * if path="" is not provided, the library will take the first device
   */
  static open(): Promise<TransportNodeHidSingleton> {
    clearDisconnectTimeout();
    return Promise.resolve().then(() => {
      if (transportInstance) {
        KProJS.KProLogs.log("hid-verbose", "reusing opened transport instance");
        return transportInstance;
      }

      const device = getDevices()[0];
      if (!device) throw new KProJS.KProError.CantOpenDevice("no device found");
      KProJS.KProLogs.log("hid-verbose", "new HID transport");
      transportInstance = new TransportNodeHidSingleton(new HID.HID(device.path as string));
      const unlisten = listenDevices(
        () => {},
        () => {
          // assume any keycard pro disconnection concerns current transport
          if (transportInstance) {
            transportInstance.emit("disconnect");
          }
        },
      );

      const onDisconnect = () => {
        if (!transportInstance) return;
        KProJS.KProLogs.log("hid-verbose", "transport instance was disconnected");
        transportInstance.off("disconnect", onDisconnect);
        transportInstance = null;
        unlisten();
      };

      transportInstance.on("disconnect", onDisconnect);
      return transportInstance;
    });
  }

  setAllowAutoDisconnect(allow: boolean): void {
    this.preventAutoDisconnect = !allow;
  }

  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */
  async exchange(apdu: Buffer): Promise<Buffer> {
    clearDisconnectTimeout();
    const result = await super.exchange(apdu);
    setDisconnectTimeout();
    return result;
  }

  close(): Promise<void> {
    // intentionally, a close will not effectively close the hid connection but
    // will allow an auto-disconnection after some inactivity
    this.preventAutoDisconnect = false;
    return Promise.resolve();
  }
}