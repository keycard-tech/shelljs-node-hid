import { usb } from "usb";
import type { DeviceTypes } from "shelljs";
import ShellJS from "shelljs";

const deviceToLog = ({ deviceDescriptor: { idProduct }, busNumber, deviceAddress }: {deviceDescriptor: any, idProduct: any; busNumber: any, deviceAddress: any }) =>
  `productId=${idProduct} busNumber=${busNumber} deviceAddress=${deviceAddress}`;

let usbDebounce = 1000;
export const setUsbDebounce = (n: number) => {
  usbDebounce = n;
};

const mapRawDevice = ({
  busNumber: locationId,
  deviceAddress,
  deviceDescriptor: { idVendor: vendorId, idProduct: productId, iSerialNumber: serialNumber },
}: usb.Device): DeviceTypes.Device => ({
  locationId, // Nb we dont use this but the mapping might be incorrect.
  vendorId,
  productId,
  deviceName: "",
  manufacturer: "",
  serialNumber,
  deviceAddress,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const listenDevices = (onAdd: (arg0: DeviceTypes.Device) => void, onRemove: (arg0: DeviceTypes.Device) => void) => {
  let timeout: any;

  const add = (device: any) => {
    if (device.deviceDescriptor.idVendor !== ShellJS.HIDFraming.shellUSBVendorId) return;
    ShellJS.ShellLogs.log("usb-detection", "add: " + deviceToLog(device));

    if (!timeout) {
      // a time is needed for the device to actually be connectable over HID..
      // we also take this time to not emit the device yet and potentially cancel it if a remove happens.
      timeout = setTimeout(() => {
        onAdd(mapRawDevice(device));
        timeout = null;
      }, usbDebounce);
    }
  };

  const remove = (device: any) => {
    if (device.deviceDescriptor.idVendor !== ShellJS.HIDFraming.shellUSBVendorId) return;
    ShellJS.ShellLogs.log("usb-detection", "remove: " + deviceToLog(device));

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    } else {
      onRemove(mapRawDevice(device));
    }
  };

  usb.on("attach", add);
  usb.on("detach", remove);

  return () => {
    if (timeout) clearTimeout(timeout);
    usb.unrefHotplugEvents();
  };
};

process.on("exit", () => {
  usb.unrefHotplugEvents();
});