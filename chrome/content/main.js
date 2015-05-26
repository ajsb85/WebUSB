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
file.append("hidapi.dll");

dump(file.path);

var lib = ctypes.open(file.path);

/* 	if (hid_init())
		return -1;

	devs = hid_enumerate(0x0, 0x0); */
  
var hid =  lib.declare("hid_init",
                        ctypes.winapi_abi,
                        ctypes.bool      /* return type */);
var struct_hid_device_info;

  struct_hid_device_info = new ctypes.StructType('hid_device_info', [
    {'path': ctypes.char.ptr},
    {'vendor_id': ctypes.unsigned_short},
    {'product_id': ctypes.unsigned_short},
    {'serial_number': ctypes.char16_t.ptr},
    {'release_number': ctypes.unsigned_short},
    {'manufacturer_string': ctypes.char16_t.ptr},
    {'product_string': ctypes.char16_t.ptr},
    {'usage_page': ctypes.unsigned_short},
    {'usage': ctypes.unsigned_short},
    {'interface_number': ctypes.int}
  ]);  
/* Declare the signature of the function we are going to call */
var enumerate = lib.declare("hid_enumerate",
                         ctypes.winapi_abi,
                         struct_hid_device_info,
                         ctypes.int32_t,
                         ctypes.int32_t);

hid();
var log_enumerate = enumerate(0, 0); 

dump(struct_hid_device_info);
// 20 on 32-bit, 32 on 64-bit if I'm not mistaken

//dump(log_enumerate);

lib.close();

/* Some constants used with the Windows API. */
const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;

const SWP_NOSIZE = 1;
const SWP_NOMOVE = 2;

var aotUser32Lib = ctypes.open("user32");

var setWindowPos = aotUser32Lib.declare("SetWindowPos",
                                  ctypes.winapi_abi,
                                  ctypes.bool,      /* return type */
                                  ctypes.uint32_t,  /* HWND hWnd */
                                  ctypes.int32_t,   /* HWND hWndInsertAfter */
                                  ctypes.int32_t,   /* int x */
                                  ctypes.int32_t,   /* int y */
                                  ctypes.int32_t,   /* int cx */
                                  ctypes.int32_t,   /* int cy */
                                  ctypes.uint32_t   /* UINT uFlags */
                                 );

var getActiveWindow = aotUser32Lib.declare("GetActiveWindow",
                                     ctypes.winapi_abi,
                                     ctypes.uint32_t /* return type HWND */
                                    );

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
    aot.setWindowToTop(true);

    // We want to set the always on top flag after minimize/restore again
    window.addEventListener("activate", aot.setFromMenu, false);
  }
};

this.addEventListener("load", aot.load, false);