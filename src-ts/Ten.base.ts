/* Ten */
if (typeof(Ten) == 'undefined') {


Ten = <any>{};
Ten.NAME = 'Ten';
Ten.VERSION = 0.44;

/* Ten.Class */
Ten.Class = <Ten.Class>function(klass, prototype) {
    if (klass && klass.initialize) {
        var c = klass.initialize;
    } else if(klass && klass.base) {
        // @ts-ignore
        var c = function() { return klass.base[0].apply(this, arguments) };
    } else {
        // @ts-ignore
        var c = function() {};
    }
    c.prototype = prototype || {};
    c.prototype.constructor = c;
    Ten.Class.inherit(c, klass);
    if (klass && klass.base) {
        for (var i = 0;  i < klass.base.length; i++) {
            var parent = klass.base[i];
            if (i == 0) {
                c.SUPER = parent;
                c.prototype.SUPER = parent.prototype;
            }
            Ten.Class.inherit(c, parent);
            Ten.Class.inherit(c.prototype, parent.prototype);
        }
    }
    return c;
}
Ten.Class.inherit = function(child,parent) {
    for (var prop in parent) {
        if (typeof(child[prop]) != 'undefined' || prop == 'initialize') continue;
        child[prop] = parent[prop];
    }
}

/*
// Basic Ten Classes
*/

/* Ten.Function */
Ten.Function = {
    bind: function(f,o) {
        return function() {
            return f.apply(o, arguments);
        }
    },
    method: function(obj, method) {
        return Ten.Function.bind(obj[method], obj);
    }
};

/* Ten.Array */
Ten.Array = {
    flatten: function(arr) {
        var ret = [];
        (function(arr) {
            for (var i = 0; i < arr.length; i++) {
                var o = arr[i];
                if (Ten.Array.isArray(o)) {
                    arguments.callee(o);
                } else {
                    ret.push(o);
                }
            }
        })(arr);
        return ret;
    },
    dup: function(arr) {
        var res = [];
        for (var i = 0; i < arr.length; i++) {
            res[i] = arr[i];
        }
        return res;
    },
    indexOf: function(arr,e) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == e) return i;
        }
        return -1;
    },
    isArray: function(o) {
        return (o instanceof Array ||
                (o && typeof(o.length) === 'number' && typeof(o) != 'string' && !o.nodeType));
    },
    find: function (arr, cond) {
        var code = (cond instanceof Function) ? cond : function (v) {
            return v == cond;
        };
        var arrL = arr.length;
        for (var i = 0; i < arrL; i++) {
            if (code(arr[i])) {
                return arr[i];
            }
        }
        return undefined; // not null
    },
    forEach: function (arraylike, code) {
        var length = arraylike.length;
        for (var i = 0; i < length; i++) {
            var r = code(arraylike[i]);
            if (r && r.stop) return r.returnValue;
        }
        return null;
    }
};

/* Ten.JSONP */
Ten.JSONP = new Ten.Class({
    initialize: function(uri,obj,method) {
        if (Ten.JSONP.Callbacks.length) {
            setTimeout(function() {new Ten.JSONP(uri,obj,method)}, 500);
            return;
        }
        var del = uri.match(/\?/) ? '&' : '?';
        uri += del + 'callback=Ten.JSONP.callback';
        if (!uri.match(/timestamp=/)) {
            uri += '&' + encodeURI(<string><any>new Date());
        }
        if (typeof(obj) == 'function' && typeof(method) == 'undefined') {
            obj = {callback: obj};
            method = 'callback';
        }
        if (obj && method) Ten.JSONP.addCallback(obj,method);
        this.script = document.createElement('script');
        this.script.src = uri;
        this.script.type = 'text/javascript';
        this.script.onerror = function () {Ten.JSONP.Callbacks = [];};
        document.getElementsByTagName('head')[0].appendChild(this.script);
    },
    addCallback: function(obj,method) {
        Ten.JSONP.Callbacks.push({object: obj, method: method});
    },
    callback: function(args) {
        // alert('callback called');
        var cbs = Ten.JSONP.Callbacks;
        for (var i = 0; i < cbs.length; i++) {
            var cb = cbs[i];
            cb.object[cb.method].call(cb.object, args);
        }
        Ten.JSONP.Callbacks = [];
    },
    MaxBytes: 1800,
    Callbacks: []
});

/* Ten.XHR */
Ten.XHR = new Ten.Class({
    initialize: function(uri,opts,obj,callPropertyName) {
        Ten.EventDispatcher.implementEventDispatcher(this);
        this.method = 'GET';

        if (!uri) return;

        if (!Ten.XHR.isSafeUri(uri)) {
            throw "host differs : " + uri;
        }

        if (!opts) opts = {};

        if (opts.method)
            this.method = opts.method;

        var self = this;
        this.addEventListener('complete', function() {
            if (!obj) return;
            if (typeof(obj) == 'function' && typeof(callPropertyName) == 'undefined') {
                obj.call(obj, self.request);
            } else {
                obj[callPropertyName].call(obj, self.request);
            }
        });

        this.load(uri, opts.data);
    },
    getXMLHttpRequest: function() {
        var xhr;
        var tryThese = [
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
            function () { return new ActiveXObject('Microsoft.XMLHTTP'); },
            function () { return new ActiveXObject('Msxml2.XMLHTTP.4.0'); }
        ];
        for (var i = 0; i < tryThese.length; i++) {
            var func = tryThese[i];
            try {
                xhr = func;
                return func();
            } catch (e) {
                //alert(e);
            }
        }
        return xhr;
    },
    isSafeUri: function(uri) {
        if (uri.match(/^\w+:/) || uri.match(/^\/\//)) {
            if (uri.split('/')[2] == location.host) return true;
            else return false;
        } else if (uri.match(/^\/[^\/]/) || uri == '/') {
            return true;
        } else if (!uri || uri.length == 0) {
            return false;
        }
        return true;
    },
    makePostData: function(data) {
        var regexp = /%20/g;
        if (typeof data == 'string' || (data instanceof String)) {
            return encodeURIComponent(<string>data).replace(regexp, '+');
        }
        var pairs = [];
        for (var k in data) {
            if (typeof data[k] == 'undefined') continue;
            var prefix = encodeURIComponent(k).replace(regexp, '+') + '=';
            var values = Array.prototype.concat(data[k]);
            for (var i = 0; i < values.length; i++) {
                var pair = prefix + encodeURIComponent(values[i]).replace(regexp, '+');
                pairs.push(pair);
            }
        }
        return pairs.join('&');
    }
},{
    load: function(url, params) {
        var req = Ten.XHR.getXMLHttpRequest();
        this.request = req;

        var self = this;
        req.onreadystatechange = function() {
            self.stateChangeHandler.call(self, req);
        };
        params = params ? Ten.XHR.makePostData(params) : null;

        req.open(this.method, url, true);
        if (this.method == 'POST')
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.send(params);
    },
    stateChangeHandler: function(req) {
        this.dispatchEvent('state_change');

        if (req.readyState == 4) {
            this.dispatchEvent('ready', req.status.toString());

            if (req.status >= 200 && req.status < 300) {
                this.dispatchEvent('complete', req);
            } else {
                this.dispatchEvent('error', req);
            }
        }
    }
});



/* Ten.Observer */
Ten.Observer = new Ten.Class({
    initialize: function(element,event,obj,method) {
        var func = obj;
        if (typeof(method) == 'string') {
            func = obj[method];
        }
        this.element = element;
        this.event = event;
        this.listener = function(event) {
            return func.call(obj, new Ten.Event(event || window.event));
        }
        this.start();
    }
},{
    stop: function() {
        if (this.element.removeEventListener) {
            this.element.removeEventListener(this.event,this.listener,false);
        } else if (this.element.detachEvent) {
            this.element.detachEvent(this.event,this.listener);
        }
    },
    start: function() {
        if (this.element.addEventListener) {
            if (this.event.indexOf('on') == 0) {
                this.event = this.event.substr(2);
            }
            this.element.addEventListener(this.event, this.listener, false);
        } else if (this.element.attachEvent) {
            this.element.attachEvent(this.event, this.listener);
        }
    }
});

/* Ten.Event */
Ten.Event = new Ten.Class({
    initialize: function(e) {
        this.event = e;
        if (e) {
            this.target = e.target || e.srcElement;
            this.shiftKey = e.shiftKey;
            this.ctrlKey = e.ctrlKey;
            this.altKey = e.altKey;
        }
    },
    KeyMap: {
        8:"backspace", 9:"tab", 13:"enter", 19:"pause", 27:"escape", 32:"space",
        33:"pageup", 34:"pagedown", 35:"end", 36:"home", 37:"left", 38:"up",
        39:"right", 40:"down", 44:"printscreen", 45:"insert", 46:"delete",
        112:"f1", 113:"f2", 114:"f3", 115:"f4", 116:"f5", 117:"f6", 118:"f7",
        119:"f8", 120:"f9", 121:"f10", 122:"f11", 123:"f12",
        144:"numlock", 145:"scrolllock"
    }
},{
    mousePosition: function() {
        if (!this.event.clientX) return null;
        return Ten.Geometry.getMousePosition(this.event);
    },
    isKey: function(name) {
        var ecode = this.event.keyCode;
        if (!ecode) return false;
        var ename = Ten.Event.KeyMap[ecode];
        if (!ename) return false;
        return (ename == name);
    },
    targetIsFormElements: function() {
        if (!this.target) return false;
        var T = (this.target.tagName || '').toUpperCase();
        return (T == 'INPUT' || T == 'SELECT' || T == 'OPTION' ||
                T == 'BUTTON' || T == 'TEXTAREA');
    },
    stop: function() {
        var e = this.event;
        if (e.stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
        } else {
            e.cancelBubble = true;
            e.returnValue = false;
        }
    },
    preventDefault: function () {
        var e = this.event;
        if (e.preventDefault) e.preventDefault();
        e.returnValue = false;
        this._isDefaultPrevented = true;
    },
    isDefaultPrevented: function () {
        return this._isDefaultPrevented || this.event.defaultPrevented || (this.event.returnValue === false);
    }
});

/* Ten.EventDispatcher */
Ten.EventDispatcher = new Ten.Class({
    initialize: function() {
        this._eventListeners = {};
    },
    implementEventDispatcher: function(obj) {
        Ten.Class.inherit(obj, Ten.EventDispatcher.prototype);
        obj._eventListeners = {};
    }
}, {
    hasEventListener: function(type) {
        return (this._eventListeners[type] instanceof Array && this._eventListeners[type].length > 0);
    },
    addEventListener: function(type, listener) {
        if (!this.hasEventListener(type)) {
            this._eventListeners[type] = [];
        }
        var listeners = this._eventListeners[type];
        for (var i = 0;  i < listeners.length; i++) {
            if (listeners[i] == listener) {
                return;
            }
        }
        listeners.push(listener);
    },
    removeEventListener: function(type, listener) {
        if (this.hasEventListener(type)) {
            var listeners = this._eventListeners[type];
            for (var i = 0;  i < listeners.length; i++) {
                if (listeners[i] == listener) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        }
    },
    dispatchEvent: function(type, opt) {
        if (!this.hasEventListener(type)) return false;
        var listeners = this._eventListeners[type];
        for (var i = 0;  i < listeners.length; i++) {
            listeners[i].call(this, opt);
        }
        return true; // preventDefault is not implemented
    }
});

/* Ten.DOM */
Ten.DOM = new Ten.Class({
    createElementFromString : function (str, opts) {
        if (!opts) opts = { data: {} };
        if (!opts.data) opts.data = { };

        var t, cur = opts.parent || document.createDocumentFragment(), root, stack = [cur];
        while (str.length) {
            if (str.indexOf("<") == 0) {
                if ((t = str.match(/^\s*<(\/?[^\s>\/]+)([^>]+?)?(\/)?>/))) {
                    var tag = t[1], attrs = t[2], isempty = !!t[3];
                    if (tag.indexOf("/") == -1) {
                        child = document.createElement(tag);
                        if (attrs) attrs.replace(/([a-z]+)=(?:'([^']+)'|"([^"]+)")/gi,
                            function (m, name, v1, v2) {
                                var v = text(v1 || v2);
                                if (name == "class") root && (root[v] = child), child.className = v;
                                child.setAttribute(name, v);
                            }
                        );
                        cur.appendChild(root ? child : (root = child));
                        if (!isempty) {
                            stack.push(cur);
                            cur = child;
                        }
                    } else cur = stack.pop();
                } else throw("Parse Error: " + str);
            } else {
                if ((t = str.match(/^([^<]+)/))) cur.appendChild(document.createTextNode(text(t[0])));
            }
            str = str.substring(t[0].length);
        }

        function text (str) {
            return str
                .replace(/&(#(x)?)?([^;]+);/g, function (_, isNumRef, isHex, ref) {
                    return isNumRef ? String.fromCharCode(parseInt(ref, isHex ? 16 : 10)):
                                      {"lt":"<","gt":"<","amp":"&"}[ref];
                })
                .replace(/#\{([^}]+)\}/g, function (_, name) {
                    return (typeof(opts.data[name]) == "undefined") ? _ : opts.data[name];
                });
        }

        return root;
    },

    getElementsByTagAndClassName: function(tagName, className, parent) {
        if (typeof(parent) == 'undefined') parent = document;
        if (!tagName) return Ten.DOM.getElementsByClassName(className, parent);
        var children = parent.getElementsByTagName(tagName);
        if (className) {
            var elements = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (Ten.DOM.hasClassName(child, className)) {
                    elements.push(child);
                }
            }
            return elements;
        } else {
            return children;
        }
    },
    getElementsByClassName: function(className, parent) {
        if (typeof(parent) == 'undefined') parent = document;
        var ret = [];
        if (parent.getElementsByClassName) {
            var nodes =  parent.getElementsByClassName(className);
            for (var i = 0 , len = nodes.length ; i < len ; i++ ) ret.push(nodes.item(i));
            return ret;
        } else {
            if (!className) return ret;
            (function(parent) {
                var elems = parent.childNodes;
                for (var i = 0; i < elems.length; i++) {
                    var e = elems[i];
                    if (Ten.DOM.hasClassName(e, className)) {
                        ret.push(e);
                    }
                    arguments.callee(e);
                }
            })(parent);
            ret = Ten.Array.flatten(ret);
            return ret;
        }
    },
    hasClassName: function(element, className) {
        if (!element || !className) return false;
        var cname = element.className;
        if (!cname) return false;
        cname = ' ' + cname.toLowerCase() + ' ';
        cname = cname.replace(/[\n\r\t]/g, ' ');
        className = ' ' + className.toLowerCase() + ' ';
        return (cname.indexOf(className) != -1);
    },
    addClassName: function(element, className) {
        if (Ten.DOM.hasClassName(element, className)) return;
        var c = element.className || '';
        c = c.length ? c + " " + className : className;
        element.className = c;
    },
    removeClassName: function(element, className) {
        if (!Ten.DOM.hasClassName(element, className)) return;
        var c = element.className;
        var classes = c.split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] == className) {
                classes.splice(i,1);
                break;
            }
        }
        element.className = classes.join(' ');
    },
    removeEmptyTextNodes: function(element) {
        var nodes = element.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) {
                node.parentNode.removeChild(node);
            }
        }
    },
    nextElement: function(elem) {
        do {
            elem = elem.nextSibling;
        } while (elem && elem.nodeType != 1);
        return elem;
    },
    prevElement: function(elem) {
        do {
            elem = elem.previousSibling;
        } while (elem && elem.nodeType != 1);
        return elem;
    },
    nextSiblingInSource: function(elem) {
        if (elem.childNodes && elem.childNodes.length) {
            return elem.childNodes[0];
        } else if (elem.nextSibling) {
            return elem.nextSibling;
        } else if (elem.parentNode && elem.parentNode.nextSibling) {
            return elem.parentNode.nextSibling;
        }
        return null;
    },
    firstElementChild: function (node) {
        var el = node.firstElementChild || node.firstChild;
        while (el && el.nodeType != 1) {
            el = el.nextSibling;
        }
        return el;
    },
    getElementSetByClassNames: function (map, container) {
        var elements = {root: []};

        if (map.root) {
            if (map.root instanceof Array) {
                elements.root = map.root;
            } else {
                if (Ten.DOM.hasClassName(container, map.root)) {
                    elements.root = [container];
                } else {
                    elements.root = Ten.DOM.getElementsByClassName(map.root, container);
                }
            }
            delete map.root;
        }

        var root = elements.root[0] || container || document.body || document.documentElement || document;
        for (var n in map) {
            if (map[n] instanceof Array) {
                elements[n] = map[n];
            } else if (map[n]) {
                elements[n] = Ten.DOM.getElementsByClassName(map[n], root);
            }
        }

        return elements;
    },
    getAncestorByClassName: function (className, node) {
        while (node != null) {
            node = node.parentNode;
            if (Ten.DOM.hasClassName(node, className)) {
                return node;
            }
        }
        return null;
    },
    someParentNode: function(el, func) {
        if (el.parentNode) {
            if (func(el.parentNode)) {
                return true;
            } else {
                return Ten.DOM.someParentNode(el.parentNode, func);
            }
        } else {
            return false;
        }
    },
    insertBefore: function(node, ref) {
        ref.parentNode.insertBefore(node, ref);
    },
    insertAfter: function(node, ref) {
        if (ref.nextSibling) {
            ref.parentNode.insertBefore(node, ref.nextSibling);
        } else {
            ref.parentNode.appendChild(node);
        }
    },
    unshiftChild: function(elem, child) {
        if (elem.firstChild) {
            elem.insertBefore(child, elem.firstChild);
        } else {
            elem.appendChild(child);
        }
    },
    replaceNode: function(newNode, oldNode) {
        var parent = oldNode.parentNode;
        if (newNode && parent && parent.nodeType == 1) {
            parent.insertBefore(newNode, oldNode);
            parent.removeChild(oldNode);
        }
    },
    removeElement: function(elem) {
        if (!elem.parentNode) return;
        elem.parentNode.removeChild(elem);
    },
    removeAllChildren: function(node) {
        while (node.firstChild)
            node.removeChild(node.firstChild);
    },
    scrapeText: function(node) {
        if (typeof node.textContent == 'string') return node.textContent;
        if (typeof node.innerText == 'string') return node.innerText;
        var rval = [];
        (function (node) {
            var cn = node.childNodes;
            if (cn) {
                for (var i = 0; i < cn.length; i++) {
                    arguments.callee.call(this, cn[i]);
                }
            }
            var nodeValue = node.nodeValue;
            if (typeof(nodeValue) == 'string') {
                rval.push(nodeValue);
            }
        })(node);
        return rval.join('');
    },
    getSelectedText: function() {
        if (window.getSelection)
            return '' + (window.getSelection() || '');
        else if (document.getSelection)
            return document.getSelection();
        else if (document.selection)
            return document.selection.createRange().text;
        else
            return '';
    },
    clearSelection: function() {
        if (window.getSelection) {
            window.getSelection().collapse(document.body, 0);
        } else if (document.getSelection) {
            document.getSelection().collapse(document.body, 0);
        } else {
            var selection = document.selection.createRange();
            selection.setEndPoint("EndToStart", selection);
            selection.select();
        }
    },
    show: function(elem) {
        elem.style.display = 'block';
    },
    hide: function(elem) {
        elem.style.display = 'none';
    },
    addObserver: function() {
        var c = Ten.DOM;
        if (c.observer || c.loaded) return;
        c.observer = new Ten.Observer(window,'onload',c,'finishLoad');
        var ua = navigator.userAgent.toUpperCase();
        if (window.opera || ua.indexOf('FIREFOX') >= 0) {
            new Ten.Observer(window,'DOMContentLoaded',c,'finishLoad');
        } else if ((ua.indexOf('MSIE') >= 0 || ua.toLowerCase().indexOf('webkit') >= 0) && window == top) {
            var i = 0;
            (function() {
                if (i++ > 10000) return null;
                try {
                    if (document.readyState != 'loaded' &&
                        document.readyState != 'complete') {
                            (<any>document.documentElement).doScroll('left');
                        }
                } catch(error) {
                    return setTimeout(arguments.callee, 13);
                }
                return c.finishLoad();
            })();
        }
    },
    finishLoad: function() {
        var c = Ten.DOM;
        if (!c.loaded) {
            c.dispatchEvent('DOMContentLoaded');
            c.dispatchEvent('onload'); // for backward compatibility
            c.loaded = true;
            c.observer.stop();
            c.observer = null;
        }
    },
    observer: null,
    loaded: false
});
Ten.EventDispatcher.implementEventDispatcher(Ten.DOM);
Ten.DOM.addObserver();

/* Ten.Element */
Ten.Element = new Ten.Class({
    initialize: function(tagName, attributes) {
        var elem = document.createElement(tagName);
        for (var a in attributes) {
            if (a == 'style') {
                Ten.Style.applyStyle(elem, attributes[a])
            } else if (a == 'value' && tagName.toLowerCase() == 'input') {
                elem.setAttribute('value', attributes[a]);
            } else if (a.indexOf('on') == 0) {
                new Ten.Observer(elem, a, attributes[a]);
            } else {
                elem[a] = attributes[a];
            }
        }
        var children = Array.prototype.slice.call(arguments, 2);
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (typeof child == 'string')
                child = document.createTextNode(child);
            if (!child)
                continue;
            elem.appendChild(child);
        }
        Ten.Element.dispatchEvent('create',elem);
        return elem;
   }
});
Ten.EventDispatcher.implementEventDispatcher(Ten.Element);

/* Ten.Cookie */
Ten.Cookie = new Ten.Class({
    initialize: function(string) {
        this.cookies = this.constructor.parse(string);
    },
    parse: function(string) {
        var cookies = { };

        var segments = (string || document.cookie).split(/;\s*/);
        while (segments.length) {
            try {
                var segment = segments.shift().replace(/^\s*|\s*$/g, '');
                if (!segment.match(/^([^=]*)=(.*)$/))
                    continue;
                var key = RegExp.$1, value: string | string[] = RegExp.$2;
                if (value.indexOf('&') != -1) {
                    value = value.split(/&/);
                    for (var i = 0; i < value.length; i++)
                        value[i] = decodeURIComponent(value[i]);
                } else {
                    value = decodeURIComponent(value);
                }
                key = decodeURIComponent(key);

                cookies[key] = value;
            } catch (e) {
            }
        }

        return cookies;
    }
}, {
    set: function(key, value, option) {
        this.cookies[key] = value;

        if (value instanceof Array) {
            for (var i = 0; i < value.length; i++)
                value[i] = encodeURIComponent(value[i]);
            value = value.join('&');
        } else {
            value = encodeURIComponent(value);
        }
        var cookie = encodeURIComponent(key) + '=' + value;

        option = option || { };
        if (typeof option == 'string' || option instanceof Date) {
            // deprecated
            option = {
                expires: option
            };
        }

        if (!option.expires) {
            option.expires = this.defaultExpires;
        }
        if (/^\+?(\d+)([ymdh])$/.exec(option.expires)) {
            var count = parseInt(RegExp.$1);
            var field = ({ y: 'FullYear', m: 'Month', d: 'Date', h: 'Hours' })[RegExp.$2];

            var date = new Date;
            date['set' + field](date['get' + field]() + count);
            option.expires = date;
        }

        if (option.expires) {
            if (option.expires.toUTCString)
                option.expires = option.expires.toUTCString();
            cookie += '; expires=' + option.expires;
        }
        if (option.domain) {
            cookie += '; domain=' + option.domain;
        }
        if (option.path) {
            cookie += '; path=' + option.path;
        } else {
            cookie += '; path=/';
        }

        return document.cookie = cookie;
    },
    get: function(key) {
        return this.cookies[key];
    },
    has: function(key) {
        return (key in this.cookies) && !(key in Object.prototype);
    },
    clear: function(key) {
        this.set(key, '', new Date(0));
        delete this.cookies[key];
    }
});

/* Ten.Selector */
Ten.Selector = new Ten.Class({
    initialize: function(selector) {
        this.selectorText = selector;
        var sels = selector.split(/\s+/);
        var child = null;
        var separator = null;
        for (var i = sels.length - 1; i >= 0; i--) {
            if (sels[i] == '>') {
                continue;
            } else if ((i > 0) && sels[i-1] == '>') {
                separator = sels[i-1];
            }
            var opt = separator ? {separator: separator} : null;
            separator = null;
            var node = new Ten.SelectorNode(sels[i],child,opt);
            child = node;
        }
        this.childNode = child;
    },
    getElementsBySelector: function(selector, parent) {
        var sels = selector.split(/\s*,\s*/);
        var ret = [];
        for (var i = 0; i < sels.length; i++) {
            var sel = new Ten.Selector(sels[i]);
            ret = ret.concat(sel.getElements(parent));
        }
        ret = Ten.Array.flatten(ret);
        return ret;
    }
},{
    getElements: function(parent) {
        if (typeof(parent) == 'undefined') {
            parent = document;
        }
        return this.childNode.getElements(parent);
    }
});

/* Ten.SelectorNode */
Ten.SelectorNode = new Ten.Class({
    initialize: function(selector, child, opt) {
        if (selector) {
            selector = selector.replace(/\s/g,'');
        }
        this.option = opt;
        this.selectorText = selector;
        this.childNode = child;
        this.parseSelector();
    }
},{
    getElementsBySelector: null, // will be overridden by parser
    parseSelector: function() {
        var f = 'getElementsBySelector';
        var t = this.selectorText;
        var match;
        if ((match = t.match(/^(.+)\:([\w\-+()]+)$/))) {
            t = match[1];
            this.pseudoClass = match[2];
        }
        if (t.match(/^[\w-]+$/)) {
            this[f] = function(parent) {
                return parent.getElementsByTagName(t);
            };
        } else if ((match = t.match(/^([\w-]+)?#([\w-]+)$/))) {
            var tname = match[1];
            var idname = match[2];
            this[f] = function(parent) {
                var e = document.getElementById(idname);
                if (!tname ||
                    e.tagName.toLowerCase() == tname.toLowerCase()) {
                        return [e];
                    } else {
                        return [];
                    }
            };
        } else if ((match = t.match(/^([\w-]+)?\.([\w-]+)/))) {
            var tname = match[1];
            var cname = match[2];
            this[f] = function(parent) {
                return Ten.DOM.getElementsByTagAndClassName(tname,cname,parent);
            };
        }
        if (this.option && this.option.separator) this.parseSeparator();
        if (this.pseudoClass) this.parsePseudoClass();
    },
    parsePseudoClass: function() {
        if (!this.pseudoClass) return;
        var pseudo = this.pseudoClass;
        var f = 'getElementsBySelector';
        var func = this[f];
        var match;
        if ((match = pseudo.match(/^(.+)-child(\((\d+)\))?$/))) {
            var type = match[1];
            var n = match[3];
            var index;
            if (type == 'first') {
                index = 0;
            } else if (type == 'last') {
                index = -1;
            } else if (type == 'nth' && n) {
                index = n - 1;
            }
            if (typeof index == 'number') {
                this[f] = function(parent) {
                    var elems = func(parent);
                    if (index < 0) index = elems.length + index;
                    if (elems[index]) {
                        return [elems[index]];
                    } else {
                        return [];
                    }
                }
            }
        } else if ((match = pseudo.match(/^nth-child\((\d+)n\+(\d+)\)$/))) {
            var a = new Number(match[1]);
            var b = new Number(match[2]);
            this[f] = function(parent) {
                var elems = func(parent);
                var ret = [];
                for (var n = 0; n < 1000; n++) {
                    var i = (<number>a) * n + (<number>b) - 1;
                    if (i < 0) continue;
                    if (typeof elems[i] == 'undefined') break;
                    ret.push(elems[i]);
                }
                return ret;
            };
        }
    },
    parseSeparator: function() {
        if (!this.option) return;
        var sep = this.option.separator;
        if (!sep) return;
        var f = 'getElementsBySelector';
        var func = this[f];
        if (sep == '>') {
            this[f] = function(parent) {
                var elems = func(parent);
                var ret = [];
                for (var i = 0; i < elems.length; i++) {
                    if (elems[i].parentNode == parent) ret.push(elems[i]);
                }
                return ret;
            }
        }
    },
    getElements: function(parent) {
        if (typeof this.getElementsBySelector != 'function') return null;
        var ret = [];
        var elems = this.getElementsBySelector(parent);
        if (elems && this.childNode) {
            for (var i = 0; i < elems.length; i++) {
                ret.push(this.childNode.getElements(elems[i]));
            }
            return ret;
        } else {
            return elems;
        }
    }
});

/* Ten._Selector */
Ten._Selector = new Ten.Class({
    base : [Ten.Selector],
    initialize: function(selector) {
        this.selectorText = selector;
        var sels = selector.split(/\s+/);
        var child = null;
        var separator = null;
        for (var i = sels.length - 1; i >= 0; i--) {
            if (sels[i] == '>') {
                continue;
            } else if ((i > 0) && sels[i-1] == '>') {
                separator = sels[i-1];
            }
            var opt = separator ? {separator: separator} : null;
            separator = null;
            var node = new Ten._SelectorNode(sels[i],child,opt);
            child = node;
        }
        this.childNode = child;
    },
    getElementsBySelector: function(selector, parent) {
        var sels = selector.split(/\s*,\s*/);
        var ret = [];
        for (var i = 0; i < sels.length; i++) {
            var sel = new Ten._Selector(sels[i]);
            ret = ret.concat(sel.getElements(parent));
        }
        ret = Ten._Selector._elementArrayFlatten(ret);
        if (selector.indexOf(',') >= 0) ret.sort(Ten._Selector._sortByElementOrder);
        return ret;
    },
    _sortByElementOrder: function(a, b) {
        var depthA = Ten._Selector._getNodeDepth(a);
        var depthB = Ten._Selector._getNodeDepth(b);
        if (depthA > depthB) for (var i = 0; i < (depthA - depthB) ; i++ ) a = a.parentNode;
        else if (depthA < depthB) for (var i = 0; i < (depthB - depthA) ; i++ ) b = b.parentNode;
        return Ten._Selector._getSiblingDepth(b) - Ten._Selector._getSiblingDepth(a);
    },
    _getNodeDepth: function(elem) {
        var i = 0;
        for (var n = elem ; n ; n = n.parentNode, i++){}
        return i;
    },
    _getSiblingDepth: function(elem) {
        var i = 0;
        for (var n = elem; n ; n = n.nextSibling, i++){}
        return i;
    },
    _elementArrayFlatten : function(arr) {
        var ret = [];
        (function(arr) {
            for (var i = 0; i < arr.length; i++) {
                var o = arr[i];
                if ((o && o instanceof Array) ||
                    (o && typeof(o.length) === 'number'
                       && typeof(o) != 'string'
                       && !o.tagName)){
                    arguments.callee(o);
                } else {
                    ret.push(o);
                }
            }
        })(arr);
        return ret;
    }
},{
});

/* Ten._SelectorNode */
Ten._SelectorNode = new Ten.Class({
    base : [Ten.SelectorNode]
},{
    parsePseudoClass: function() {
        if (!this.pseudoClass) return;
        var pseudo = this.pseudoClass;
        var f = 'getElementsBySelector';
        var func = this[f];
        var match;
        if ((match = pseudo.match(/^(.+)-child(\((\d+)\))?$/))) {
            var type = match[1];
            var n = match[3];
            var index;
            if (type == 'first') {
                index = 0;
            } else if (type == 'last') {
                index = -1;
            } else if (type == 'nth' && n) {
                index = n - 1;
            }
            if (typeof index == 'number') {
                this[f] = function(parent) {
                    var elems = func(parent);
                    var ret = [];
                    for (var i = 0, len = elems.length ; i < len ; i++ ) {
                        var children =  elems[i].parentNode.childNodes;
                        if((index >= 0 && children[index] == elems[i])
                            || (index < 0 && children[children.length - 1] == elems[i]))
                                 ret.push(elems[i]);
                    }
                    return ret;
                }
            }
        } else if ((match = pseudo.match(/^nth-child\((\d+)n\+(\d+)\)$/))) {
            var a = new Number(match[1]);
            var b = new Number(match[2]);
            this[f] = function(parent) {
                var elems = func(parent);
                var tagName = elems[0].tagName;
                var parents = [];
                var checkArray = function (array , e) {
                    for (var i = 0 , len = array.length; i < len ; i++) {
                        if (array[i] == e) return;
                    }
                    array.push(e);
                }
                for (var i = 0, len = elems.length ; i < len ; i++ ){
                   checkArray(parents, elems[i].parentNode);
                }
                var ret = [];
                for (var j = 0, len = <any>parents.length ; j < len ; j++) {
                    var children = parents[j].childNodes;
                    for (var n = 0; n < children.length; n++) {
                        var i = (<number>a) * n + (<number>b) - 1;
                        if (i < 0) continue;
                        if (children[i] && children[i].tagName == tagName) ret.push(children[i]);
                    }
                }
                return ret;
            };
        }
    }
});

/* Ten.querySelector */
if (document.querySelector) {
    Ten.querySelector = function (selector, elem) {
        if (elem) return (elem.querySelector) ? elem.querySelector(selector) : null;
        return document.querySelector(selector);
    }
} else {
    Ten.querySelector = function (selector, elem) {
        return Ten._Selector.getElementsBySelector(selector, elem)[0] || null;
    }
}

if (document.querySelectorAll) {
    Ten.querySelectorAll = function (selector, elem) {
        var elems ;
        try {
            if (elem) elems = (elem.querySelectorAll) ? elem.querySelectorAll(selector) : [];
            else  elems = document.querySelectorAll(selector);
        } catch (e) {
            return (elem) ? Ten._Selector.getElementsBySelector(selector, elem) : Ten._Selector.getElementsBySelector(selector);
        }
       // return Array.prototype.slice.apply(elems);
        var ret = [];
        for (var i = 0 , len = elems.length ; i < len ; i++ ) ret.push(elems[i]);
        return ret;
    }
    Ten.DOM.orig_getElementsByTagAndClassName = Ten.DOM.getElementsByTagAndClassName;
    Ten.DOM.getElementsByTagAndClassName = function(tag,klass,parent) {
        var selector = tag || '';
        if (klass) selector += '.' + klass;
        if (!tag && !klass) return [];
        try {
            return Ten.querySelectorAll(selector, parent);
        } catch(e) {
            return Ten.DOM.orig_getElementsByTagAndClassName(tag, klass, parent);
        }
    }
} else {
    Ten.querySelectorAll = Ten._Selector.getElementsBySelector;
}

/* Ten.Color */
Ten.Color = new Ten.Class({
    initialize: function(r,g,b,a) {
        if (typeof(a) == 'undefined' || a === null) a = 1;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    },
    parseFromString: function(str) {
        var match;
        if ((match = str.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i))) {
            var hexstr = match[1];
            var w = hexstr.length / 3;
            var rgb = [];
            for (var i = 0; i < 3; i++) {
                var hex = hexstr.substr(w * i, w);
                if (hex.length == 1) hex += hex;
                rgb.push(parseInt(hex,16));
            }
            return new Ten.Color(rgb[0],rgb[1],rgb[2]);
        } else if ((match = str.match(/^rgb\(([\d.,\s]+)\)/))) {
            var rdba = match[1].split(/[\s,]+/);
            return new Ten.Color(rdba[0],rdba[1],rdba[2],rdba[3]);
        }
        return null;
    },
    parseFromElementColor: function(elem,prop) {
        var ret;
        for (var color; elem; elem = elem.parentNode) {
            color = Ten.Style.getElementStyle(elem, prop);
            if (typeof(color) != 'undefined' && color != 'transparent') {
                ret = color;
                break;
            }
        }
        return ret ? Ten.Color.parseFromString(ret) : null;
    }
},{
    asRGBString: function() {
        if (this.a < 1) {
            return 'rgba(' + this.r + ',' + this.g + ',' + this.b +
                ',' + this.a + ')';
        } else {
            return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
        }
    },
    asHexString: function() {
        var str = '#';
        var cls = ['r','g','b'];
        for (var i = 0; i < 3; i ++) {
            var c = Math.round(this[cls[i]]);
            var s = c.toString(16);
            if (c < 16) s = '0' + s;
            str += s;
        }
        return str;
    },
    overlay: function(color) {
        if (color.a == 1) return color;
        r = Math.round(color.r * color.a + this.r * this.a * (1 - color.a));
        g = Math.round(color.g * color.a + this.g * this.a * (1 - color.a));
        b = Math.round(color.b * color.a + this.b * this.a * (1 - color.a));
        return new Ten.Color(r,g,b);
    }
});

/* Ten.Style */
Ten.Style = new Ten.Class({
    applyStyle: function(elem, style) {
        var cssText = elem.style.cssText;
        var estyle = elem.style;
        for (var prop in style) {
            var value = style[prop];
            if (typeof value == 'function') {
                estyle[prop] = value.call(elem);
            } else {
                estyle[prop] = value;
            }
        }
        return function() {
            elem.style.cssText = cssText;
        };
    },
    getGlobalRule: function(selector) {
        selector = selector.toLowerCase();
        if (Ten.Style._cache[selector]) {
            return Ten.Style._cache[selector];
        } else if (Ten.Style._cache[selector] === null) {
            return null;
        } else {
            for (var i = document.styleSheets.length - 1; i >= 0; i--) {
                var ss = document.styleSheets[i];
                try {
                    var cssRules = ss.cssRules || ss.rules;
                } catch(e) {
                    continue;
                }
                if (cssRules) {
                    for (var j = cssRules.length - 1; j >= 0; j--) {
                        var rule = cssRules[j];
                        if (rule.selectorText &&
                            rule.selectorText.toLowerCase() == selector) {
                                Ten.Style._cache[selector] = rule;
                                return rule;
                            }
                    }
                }
            }
        }
        Ten.Style._cache[selector] = null;
        return null;
    },
    getGlobalStyle: function(selector, prop) {
        var rule = Ten.Style.getGlobalRule(selector);
        if (rule && rule.style[prop]) {
            return rule.style[prop];
        } else {
            return null;
        }
    },
    getElementStyle: function(elem, prop) {
        var style = elem.style ? elem.style[prop] : null;
        if (!style) {
            var dv = document.defaultView;
            if (dv && dv.getComputedStyle) {
                try {
                    var styles = dv.getComputedStyle(elem, null);
                } catch(e) {
                    return null;
                }
                prop = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                style = styles ? styles.getPropertyValue(prop) : null;
            } else if (elem.currentStyle) {
                style = elem.currentStyle[prop];
            }
        }
        return style;
    },
    scrapeURL: function(url) {
        if (url.match(/url\((.+)\)/)) {
            url = RegExp.$1;
            url = url.replace(/[\'\"<>]/g, '');
            return url;
        }
        return null;
    },
    _cache: {}
});

/* Ten.Geometry */
Ten.Geometry = new Ten.Class({
    initialize: function() {
        if (Ten.Geometry._initialized) return;
        var func = Ten.Geometry._functions;
        var de = document.documentElement;
        if (window.innerWidth) {
            func.getXScroll = function() { return window.pageXOffset; }
            func.getYScroll = function() { return window.pageYOffset; }
        } else if (de && de.clientWidth) {
            func.getXScroll = function() { return de.scrollLeft; }
            func.getYScroll = function() { return de.scrollTop; }
        } else if (document.body.clientWidth) {
            func.getXScroll = function() { return document.body.scrollLeft; }
            func.getYScroll = function() { return document.body.scrollTop; }
        }

        func.getWindowHeight = function(w) { return Ten.Geometry._getRoot(w).clientHeight; }
        func.getWindowWidth  = function(w) { return Ten.Geometry._getRoot(w).clientWidth; }

        func.getDocumentHeight = function(w) { return Ten.Geometry._getRoot(w).scrollHeight; }
        func.getDocumentWidth  = function(w) { return Ten.Geometry._getRoot(w).scrollWidth; }

        Ten.Geometry._initialized = true;
    },
    _getRoot : function(w) {
        if (!w) w = window;
        var root = /BackCompat/i.test(w.document.compatMode) ? document.body : document.documentElement;
        return root;
    },
    _initialized: false,
    _functions: {},
    getScroll: function() {
        if (!Ten.Geometry._initialized) new Ten.Geometry;
        return {
            x: Ten.Geometry._functions.getXScroll(),
            y: Ten.Geometry._functions.getYScroll()
        };
    },
    getMousePosition: function(pos) {
        // pos should have clientX, clientY same as mouse event
        if (!Ten.Browser.isChrome && (navigator.userAgent.indexOf('Safari') > -1) &&
            (navigator.userAgent.indexOf('Version/') < 0)) {
            return {
                x: pos.clientX,
                y: pos.clientY
            };
        } else {
            var scroll = Ten.Geometry.getScroll();
            return {
                x: pos.clientX + scroll.x,
                y: pos.clientY + scroll.y
            };
        }
    },
    getElementPosition: function(e) {
        var pos = {x:0, y:0};
        if (document.documentElement.getBoundingClientRect) { // IE
            var box = e.getBoundingClientRect();
            var owner = e.ownerDocument;
            pos.x = box.left + Math.max(owner.documentElement.scrollLeft, owner.body.scrollLeft) - 2;
            pos.y = box.top  + Math.max(owner.documentElement.scrollTop,  owner.body.scrollTop) - 2
        } else if(document.getBoxObjectFor) { //Firefox
            pos.x = document.getBoxObjectFor(e).x;
            pos.y = document.getBoxObjectFor(e).y;
        } else {
            do {
                pos.x += e.offsetLeft;
                pos.y += e.offsetTop;
            } while ((e = e.offsetParent));
        }
        return pos;
    },
    getWindowSize: function() {
        if (!Ten.Geometry._initialized) new Ten.Geometry;
        return {
            w: Ten.Geometry._functions.getWindowWidth(),
            h: Ten.Geometry._functions.getWindowHeight()
        };
    },
    getDocumentSize: function(w) {
        if (!Ten.Geometry._initialized) new Ten.Geometry;
        w = w || window;
        return {
            w: Ten.Geometry._functions.getDocumentWidth(w),
            h: Ten.Geometry._functions.getDocumentHeight(w)
        };
    }
});

/* Ten.Position */
Ten.Position = new Ten.Class({
    initialize: function(x,y) {
        this.x = x;
        this.y = y;
    },
    add: function(a,b) {
        return new Ten.Position(a.x + b.x, a.y + b.y);
    },
    subtract: function(a,b) {
        return new Ten.Position(a.x - b.x, a.y - b.y);
    }
});

/* Ten.Logger */
Ten.Logger = new Ten.Class({
    initialize: function(level, fallbackElement) {
        this.level = level || 'info';
        this.fallbackElement = fallbackElement;
        this.logFunction = this.constructor.logFunction;
        this.logs = [];
    },
    LEVEL: {
        error: 0,
        warn:  1,
        info:  2,
        debug: 3
    },
    logFunction: function(level, args) {
        if (typeof console == 'undefined') {
            try {
                if (window.opera) {
                    // Opera
                    opera.postError(args.join(', '));
                } else {
                    // fub
                    external.consoleLog(args.join(', '));
                }
            } catch (e) {
                if (this.fallbackElement && this.fallbackElement.appendChild) {
                    this.fallbackElement.appendChild(document.createTextNode(level + ': ' + args.join(', ')));
                    this.fallbackElement.appendChild(document.createElement('br'));
                }
            }
        } else if (typeof console[level] == 'function') {
            if (navigator.userAgent.indexOf('Safari') >= 0) {
                // Safari
                console[level](args.join(', '));
            } else {
                // Firefox (with Firebug)
                console[level].apply(console, args);
            }
        } else if (typeof console.log == 'function') {
            console.log(args.join(', '));
        }
    }
}, {
    logs: null,
    log: function(level) {
        var LEVEL = this.constructor.LEVEL;
        if (!(level in LEVEL) || LEVEL[level] > LEVEL[this.level])
            return;

        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        this.logs.push([level, args]);

        this.logFunction(level, args);
    },
    error: function() {
        return this._log('error', arguments);
    },
    warn: function() {
        return this._log('warn', arguments);
    },
    info: function() {
        return this._log('info', arguments);
    },
    debug: function() {
        return this._log('debug', arguments);
    },
    _log: function(level, _arguments) {
        var args = [level];
        for (var i = 0; i < _arguments.length; i++)
            args.push(_arguments[i]);
        return this.log.apply(this, args);
    }
});

/* DEPRECATED: Ten.Browser */
Ten.Browser = <Ten.Browser><any>{
    isIE: navigator.userAgent.indexOf('MSIE') != -1,
    isIE6 : navigator.userAgent.indexOf('MSIE 6.') != -1,
    isIE7 : navigator.userAgent.indexOf('MSIE 7.') != -1,
    isIE8 : navigator.userAgent.indexOf('MSIE 8.') != -1,
    isIE9 : navigator.userAgent.indexOf('MSIE 9.') != -1,
    geIE10 : /MSIE [0-9]{2,}\./.test(navigator.userAgent),
    /* Gecko */
    isMozilla: navigator.userAgent.indexOf('Mozilla') != -1 && !/compatible|WebKit/.test(navigator.userAgent),
    /* Presto */
    isOpera: !!window.opera,
    isWebKit: navigator.userAgent.indexOf('WebKit') != -1,
    isSafari: navigator.userAgent.indexOf('WebKit') != -1 && navigator.userAgent.indexOf('Chrome/') == -1,
    isChrome : navigator.userAgent.indexOf('Chrome/') != -1,
    isFirefox : navigator.userAgent.indexOf('Firefox/') != -1,
    isDSi : navigator.userAgent.indexOf('Nintendo DSi') != -1,
    is3DS : navigator.userAgent.indexOf('Nintendo 3DS') != -1,
    isWii : navigator.userAgent.indexOf('Nintendo Wii') != -1 && !navigator.userAgent.indexOf('Nintendo WiiU'),
    isWiiU: navigator.userAgent.indexOf('Nintendo WiiU'),
    /* Android smartphones */
    isAndroid : navigator.userAgent.indexOf('Android') != -1 && navigator.userAgent.indexOf('Mobile') != -1,
    /* iPhone and iPod touch */
    isIPhone : (navigator.userAgent.indexOf('iPod;') != -1 || navigator.userAgent.indexOf('iPhone;') != -1 || navigator.userAgent.indexOf('iPhone Simulator;') != -1),
    isIPad : navigator.userAgent.indexOf('iPad') != -1,
    isBB: navigator.userAgent.indexOf('BlackBerry') == 0,
    isWM: navigator.userAgent.indexOf('IEMobile') != -1 || navigator.userAgent.indexOf('Windows Phone') != -1,
    isOSX: navigator.userAgent.indexOf('OS X ') != -1,
    isSupportsXPath : !!document.evaluate,
    noQuirks: document.compatMode == 'CSS1Compat',
    version: {
        string: (/(?:Firefox\/|MSIE |Opera\/|Chrome\/|Version\/)([\d.]+)/.exec(navigator.userAgent) || []).pop(),
        valueOf: function() { return parseFloat(this.string) },
        toString: function() { return this.string }
    }
};
/* Touch small devices */
Ten.Browser.isTouch = Ten.Browser.isIPhone || Ten.Browser.isAndroid || Ten.Browser.isDSi || Ten.Browser.is3DS;
Ten.Browser.isSmartPhone = Ten.Browser.isIPhone || Ten.Browser.isAndroid;
Ten.Browser.leIE7 = Ten.Browser.isIE6 || Ten.Browser.isIE7;

if (!Ten.Browser.isIE) Ten.JSONP.MaxBytes = 7000;

if (!Ten.Browser.CSS) Ten.Browser.CSS = {};
Ten.Browser.CSS.noFixed = Ten.Browser.isIE6 || (Ten.Browser.isIE && !Ten.Browser.noQuirks);

Ten.Event.onKeyDown = ((Ten.Browser.isFirefox && Ten.Browser.isOSX) || Ten.Browser.isOpera) ? 'onkeypress' : 'onkeydown';

/*include Ten.Deferred*/

} // if (typeof(Ten) == undefined)
