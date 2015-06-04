# WebUSB

Expose USB devices to Gecko applications through JS c-types and the HID API library, and provide an implementation of the WebUSB specification for Web content access.

Currently this is a XULRunner application, for the purpose of easily experimenting. The goal is to have the code allow for re-use in any style of Gecko-based application, eg Firefox desktop, Firefox OS or XULRunner applications.

The core USB access is done through HID API (https://github.com/signal11/hidapi), which provides cross-platform access to USB and Bluetooth. We're only using the USB part. The benefit of using HID API library is that we don't need to write OS-specific implementations in JS c-types directly.

The implementation is in two parts:

* A JavaScript module implementing the c-types code which accesses USB through HIDAPI binaries
* A JavaScript module implementing the WebUSB API and exposing it to Web content
