var _yjpark$elm_wx_app_websocket$Native_WebSocket = function() {

var ns = _elm_lang$core$Native_Scheduler;

var just = _elm_lang$core$Maybe$Just;
var nothing = _elm_lang$core$Maybe$Nothing;

var isDebugMode = false;

var inited = false;
var isOpen = false;
var socket = null;

function debug(api, msg, res) {
  if (isDebugMode) {
    console.log('[WxAppWebSocket] ' + api + ': ' + msg, socket, res);
  }
}

function error(api, msg, res) {
  console.error('[WxAppWebSocket] ' + api + ': ' + msg, socket, res);
}

function checkSocket(api, msg, res) {
  if (socket == null) {
    error(api, 'Invalid Socket: ' + msg, res);
  } else if (socket.settings == null) {
    error(api, 'Invalid Socket Settings: ' + msg, res);
  } else {
    debug(api, msg, res);
    return true;
  }
  return false;
}

function init() {
  if (inited) return;

  wx.onSocketOpen(function(res) {
    if (checkSocket('wx.onSocketOpen', 'isOpen = ' + isOpen, res)) {
      isOpen = true;
    }
  });
  wx.onSocketError(function(res) {
    if (checkSocket('wx.onSocketError', 'spawn onClose', res)) {
      ns.rawSpawn(socket.settings.onClose({
        code: -1,
        reason: res.toString(),
        wasClean: false
      }));
    }
  });
  wx.onSocketMessage(function(res) {
    if (checkSocket('wx.onSocketMessage', 'spawn onMessage', res)) {
      ns.rawSpawn(A2(socket.settings.onMessage, socket, res.data));
    }
  });
  wx.onSocketClose(function(res) {
    if (checkSocket('wx.onSocketClose', 'isOpen = ' + isOpen + 'spawn onClose', res)) {
      if (isOpen) {
        ns.rawSpawn(socket.settings.onClose({
          code: 0,
          reason: res.toString(),
          wasClean: true
        }));
      }
      isOpen = false;
    }
  });
}

function open(url, settings) {
  init();

  return ns.nativeBinding(function(callback) {
    isOpen = false;
    socket = {
      "url": url,
      "settings": settings,
      "tip": "this is a fake socket for WxAppWebSocket"
    };
    wx.connectSocket({
      url: url,
      success: function(res) {
        debug('wx.connectSocket', 'succeed', res);
        callback(ns.succeed(socket));
      },
      fail: function(res) {
        error('wx.connectSocket', 'failed', res);
        callback(ns.fail({
          ctor: err.name === 'ConnectFailed',
          _0: res
        }));
      }
    });
    return function() {
      close(0, "Close", socket);
    };
  });
}

function send(socket, string) {
  return ns.nativeBinding(function(callback) {
    var result = nothing;
    if (socket == null) {
      result = just({ ctor: 'InvalidSocket' });
    } else if (socket.settings == null) {
      result = just({ ctor: 'InvalidSocketSettings' });
    } else if (!isOpen) {
      result = just({ ctor: 'NotOpen' });
    } else {
      wx.sendSocketMessage({
        data: string,
        success: function(res) {
          debug('wx.sendSocketMessage succeed', string, res);
          //callback(ns.succeed(socket));
        },
        fail: function(res) {
          error('wx.sendSocketMessage failed', string, res);
          /*
          callback(ns.fail({
            ctor: err.name === 'SendFailed',
            _0: res
          }));
          */
        }
      });
    }
    debug('send', string, result);
    callback(ns.succeed(result));
  });
}

function close(code, reason, socket) {
  return ns.nativeBinding(function(callback) {
    if (!isOpen) {
      return callback(ns.fail(just({
        ctor: 'NotOpened'
      })));
    }
    wx.closeSocket();
    callback(ns.succeed(nothing));
  });
}

function bytesQueued(socket) {
  return ns.nativeBinding(function(callback) {
    console.error("[WxAppWebSocket] bytesQueued not supported");
    callback(ns.succeed(0));
  });
}


/*
 * GOCHA: This is not the right way to do, these methods are not
 * pure, so need to be carefully in Elm world to make sure the result
 * is not cached somehow.
 * Need to wrap these in proper way, maybe by subscription
 */
function is_open() {
  return isOpen;
}

function is_debug_mode() {
  return isDebugMode;
}

function set_debug_mode(debugMode) {
  console.error("[WxAppWebSocket] set_debug_mode: ", isDebugMode, " -> ", debugMode);
  isDebugMode = debugMode;
}

return {
  open: F2(open),
  send: F2(send),
  close: F3(close),
  bytesQueued: bytesQueued,
  is_open: is_open,
  is_debug_mode: is_debug_mode,
  set_debug_mode: set_debug_mode
};

}();
