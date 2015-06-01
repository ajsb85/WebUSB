function showMore() {
  document.getElementById("more-text").hidden = false;
}

Components.utils.import("resource://gre/modules/ctypes.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");


// Or using Services.jsm and Ci = Components.interfaces
var file = Components.classes["@mozilla.org/file/directory_service;1"].
           getService(Components.interfaces.nsIProperties).
           get("CurProcD", Components.interfaces.nsIFile);

// Append the file name.
file.append("hidapi-mac");

//dump(file.path + '\n');

var lib = ctypes.open(file.path);

/* 	if (hid_init())
		return -1;

	devs = hid_enumerate(0x0, 0x0); */
  
var hid =  lib.declare("hid_init",
                        ctypes.default_abi,
                        ctypes.bool); // return type
var struct_hid_device_info;

  struct_hid_device_info = ctypes.StructType('hid_device_info', [
    {'path': ctypes.char.ptr},
    {'vendor_id': ctypes.unsigned_short},
    {'product_id': ctypes.unsigned_short},
    {'serial_number': ctypes.unsigned.ptr},
    {'release_number': ctypes.unsigned_short},
    {'manufacturer_string': ctypes.unsigned.ptr},
    {'product_string': ctypes.unsigned.ptr},
    {'usage_page': ctypes.unsigned_short},
    {'usage': ctypes.unsigned_short},
    {'interface_number': ctypes.int}
  ]);  
/* Declare the signature of the function we are going to call */
var enumerate = lib.declare("hid_enumerate",
                         ctypes.default_abi,
                         struct_hid_device_info,
                         ctypes.int32_t,
                         ctypes.int32_t);

hid();
/*
var log_enumerate = enumerate(0, 0); 

dump(struct_hid_device_info + '\n');
// 20 on 32-bit, 32 on 64-bit if I'm not mistaken

dump(log_enumerate + '\n');
*/

var devs = enumerate(0, 0),
    cur_dev = devs
while (cur_dev) {
  dump("Device Found\n  type: %04hx %04hx\n  path: %s\n  serial_number: %ls", cur_dev.vendor_id, cur_dev.product_id, cur_dev.path, cur_dev.serial_number);
  dump("\n");
  dump("  Manufacturer: %ls\n", cur_dev.manufacturer_string);
  dump("  Product:      %ls\n", cur_dev.product_string);
  dump("  Release:      %hx\n", cur_dev.release_number);
  dump("  Interface:    %d\n",  cur_dev.interface_number);
  dump("\n");
  if (cur_dev.next)
    cur_dev = devs.next()
  else
    cur_dev = null
}

lib.close();

/* Some constants used with the Windows API. */
/*
const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;

const SWP_NOSIZE = 1;
const SWP_NOMOVE = 2;

var aotUser32Lib = ctypes.open("user32");

var setWindowPos = aotUser32Lib.declare("SetWindowPos",
                                  ctypes.winapi_abi,
                                  ctypes.bool,      // return type
                                  ctypes.uint32_t,  // HWND hWnd
                                  ctypes.int32_t,   // HWND hWndInsertAfter
                                  ctypes.int32_t,   // int x
                                  ctypes.int32_t,   // int y
                                  ctypes.int32_t,   // int cx
                                  ctypes.int32_t,   // int cy
                                  ctypes.uint32_t   // UINT uFlags
                                 );

var getActiveWindow = aotUser32Lib.declare("GetActiveWindow",
                                     ctypes.winapi_abi,
                                     ctypes.uint32_t // return type HWND
                                    );
*/

var aot = {
  prefs: {},

  setFromMenu: function () {
    aot.setWindowToTop(true);
  },

  setWindowToTop: function (flag) {
    // Make sure the contact list is focused. This is usually no problem since we 
    //  only invoke this method when the contact list window is active anyways.
    //  It's just a safeguard, since we're going to use user32.dll:GetActiveWindow().
    let blistWin = Services.wm.getMostRecentWindow("Messenger:blist");
    if (blistWin)
      blistWin.focus()
    else
      return;

    try {
      // Get active contact list window
      let hWnd = getActiveWindow();
      setWindowPos(hWnd, flag === true ? HWND_TOPMOST : HWND_NOTOPMOST , 0 ,0 ,0 , 0, SWP_NOSIZE | SWP_NOMOVE);
    } catch (ex) {
      Components.utils.reportError(ex);
    }
  },

  load: function() {
    // Get and apply saved status
    //aot.setWindowToTop(true);

    // We want to set the always on top flag after minimize/restore again
    window.addEventListener("activate", aot.setFromMenu, false);
  }
};

this.addEventListener("load", aot.load, false);
