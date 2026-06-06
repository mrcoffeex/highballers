__d(
  function (g, r, i, a, m, e, d) {
    "use strict";
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      Object.defineProperty(e, "isPushNotificationsSupportedEnvironment", {
        enumerable: !0,
        get: function () {
          return n.isPushNotificationsSupportedEnvironment;
        },
      }),
      Object.defineProperty(e, "addNotificationResponseListener", {
        enumerable: !0,
        get: function () {
          return t.addNotificationResponseListener;
        },
      }),
      Object.defineProperty(e, "cancelGameReminder", {
        enumerable: !0,
        get: function () {
          return t.cancelGameReminder;
        },
      }),
      Object.defineProperty(e, "registerForPushNotifications", {
        enumerable: !0,
        get: function () {
          return t.registerForPushNotifications;
        },
      }),
      Object.defineProperty(e, "scheduleGameReminder", {
        enumerable: !0,
        get: function () {
          return t.scheduleGameReminder;
        },
      }));
    var n = r(d[0]),
      t = r(d[1]);
  },
  1597,
  [989, 1601],
);
__d(
  function (g, r, i, a, m, e, d) {
    "use strict";
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.registerForPushNotifications = async function (n) {
        return null;
      }),
      (e.scheduleGameReminder = async function (n, t, u) {
        return null;
      }),
      (e.cancelGameReminder = async function (n) {
        return;
      }),
      (e.addNotificationResponseListener = function (n) {
        return () => {};
      }));
  },
  1601,
  [],
);
