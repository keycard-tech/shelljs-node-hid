import ShellJS from "@choppu/shelljs";
import type { DeviceTypes } from "@choppu/shelljs";
import { Emitter, nativeGetDevices } from "usb/index.js";
import type { UsbDevice } from "usb/index.js";

const deviceToLog = ({ productId, bus, address }: UsbDevice) => `productId=${productId} bus=${bus} address=${address}`;

const readSerialNumber = (device: UsbDevice) => {
  try {
    return device.serialNumber;
  } catch {
    return null;
  }
};

let usbDebounce = 1000;
export const setUsbDebounce = (n: number) => {
  usbDebounce = n;
};

const mapRawDevice = (device: UsbDevice) =>
  ({
    locationId: Number.parseInt(device.bus, 10), // Nb we dont use this but the mapping might be incorrect.
    vendorId: device.vendorId,
    productId: device.productId,
    deviceName: "",
    manufacturer: "",
    serialNumber: readSerialNumber(device),
    deviceAddress: device.address,
  }) as unknown as DeviceTypes.Device;

const isShellDevice = ({ vendorId }: UsbDevice) => vendorId === ShellJS.HIDFraming.shellUSBVendorId;

type Listener = {
  onAttach: (device: UsbDevice) => void;
  onDetach: (handle: string) => void;
};

// addAttach and removeAttach address no particular callback: one emitter serves every subscription
const emitter = new Emitter();
const listeners = new Set<Listener>();

// registering is asynchronous, an unsubscribe must not overtake the register it follows
let hotplugQueue: Promise<unknown> = Promise.resolve();

const enqueue = (operation: () => Promise<unknown>) => {
  const pending = hotplugQueue.then(operation);
  hotplugQueue = pending.then(
    () => {},
    () => {},
  );
  return pending;
};

const watch = (listener: Listener) => {
  const first = listeners.size === 0;
  listeners.add(listener);

  return first
    ? enqueue(() =>
        Promise.all([
          emitter.addAttach(device => listeners.forEach(l => l.onAttach(device))),
          emitter.addDetach(handle => listeners.forEach(l => l.onDetach(handle))),
        ]),
      )
    : hotplugQueue;
};

const unwatch = (listener: Listener) => {
  listeners.delete(listener);

  return listeners.size === 0 ? enqueue(() => Promise.all([emitter.removeAttach(), emitter.removeDetach()])) : hotplugQueue;
};

export const listenDevices = (onAdd: (arg0: DeviceTypes.Device) => void, onRemove: (arg0: DeviceTypes.Device) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let stopped = false;

  const knownDevices = new Map<string, UsbDevice>();

  const add = (device: UsbDevice) => {
    ShellJS.ShellLogs.log("usb-detection", "add: " + deviceToLog(device));

    if (!timeout) {
      timeout = setTimeout(() => {
        onAdd(mapRawDevice(device));
        timeout = null;
      }, usbDebounce);
    }
  };

  const remove = (device: UsbDevice) => {
    ShellJS.ShellLogs.log("usb-detection", "remove: " + deviceToLog(device));

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    } else {
      onRemove(mapRawDevice(device));
    }
  };

  // devices plugged in before subscribing are remembered unannounced, so a later detach is recognized
  nativeGetDevices().then(
    devices => {
      if (stopped) return;

      for (const device of devices) {
        if (isShellDevice(device)) knownDevices.set(device.handle, device);
      }
    },
    () => {},
  );

  const listener: Listener = {
    onAttach: device => {
      if (stopped || !isShellDevice(device)) return;
      knownDevices.set(device.handle, device);
      add(device);
    },
    onDetach: handle => {
      const device = knownDevices.get(handle);
      if (stopped || !device) return;
      knownDevices.delete(handle);
      remove(device);
    },
  };

  watch(listener).catch(e => console.warn("usb: failed to watch hotplug events", e));

  return () => {
    stopped = true;
    if (timeout) clearTimeout(timeout);
    unwatch(listener).catch(() => {});
  };
};
