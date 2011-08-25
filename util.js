/*
    JavaScript REPL Environment (JSREPL).
    
    This file contains various utility functions as used by JSREPL.
 
    Copyright (C) 2011 Giedrius Zizys (gzizys@hotmail.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the
    
    Free Software Foundation, 
    51 Franklin St, Suite 500
    Boston, MA 02110-1335
    USA

*/

// Print the repr of all arguments
function print() {
    for (var i = 0; i < arguments.length; i++) {
        var v = arguments[i];
        WScript.StdOut.Write(v == null ? "null" : v.toString());
    }
}

function println() {
    print.apply(null, arguments);
    WScript.StdOut.WriteLine();
}

// Useful utility function to keep around
String.prototype.right = function(i) {
    return i >= 0 && i <= this.length ? this.substr(this.length - i) : "";
}

String.prototype.startsWith = function(s) {
    return this.substr(0, s.length) == s;
}

String.prototype.endsWith = function(s) {
    return this.right(s.length) == s;
}

String.prototype.endsWith = function(s) {
    return this.right(s.length) == s;
}

String.prototype.replicate = function(n) {
    var acc = this;
    var val = "";
    var i = n;
    while (i > 0) {
        if (i & 0x0001) {
            val += acc;
        }
        acc += acc;
        i >>= 1;
    }
    
    return val;
}

String.prototype.lJustify = function(w) {
    return (this + " ".replicate(w)).substr(0, w);
}

String.prototype.rJustify = function(w) {
    return (" ".replicate(w) + this).right(w);
}

Error.prototype.format = function() {
    return this.name + " [0x" + (Math.pow(2,32) + this.number).toString(16) + "]: " + this.description;
}

function Arr(aIn) {
    return {
        a: aIn,
    
        // functional style decorators    
        filter: function (filterFn) {
            var aNew = new Array();
            for (i in this.a) {
                if (filterFn(this.a[i], i)) {
                    aNew.push(this.a[i]);
                }
            }
            this.a = aNew;
            return this;
        },
    
        map: function (mapFn) {
            var aNew = new Array();
            for (i in this.a) {
                var newEl = mapFn(this.a[i], i);
                aNew.push(newEl);
            }
            this.a = aNew;
            return this;
        },
        
        mapSome: function (mapFn) {
            var aNew = new Array();
            for (i in this.a) {
                var newEl = mapFn(this.a[i], i);
                if (newEl != null) {
                    aNew.push(newEl);
                }
            }
            this.a = aNew;
            return this;
        },
        
        forEach: function (iteratorFn) {
            for (i in this.a) {
                iteratorFn(this.a[i], i);
            }
            return this;
        },
    
        // Aggregating methods
        any: function (filterFn) {
            for (i in this.a) {
                if (filterFn(this.a[i], i)) {
                    return true;
                }
            }
            return false;
        },
        
        all: function (filterFn) {
            for (i in this.a) {
                if (!filterFn(this.a[i], i)) {
                    return false;
                }
            }
            return true;
        },
        
        find: function (filterFn) {
            for (i in this.a) {
                if (filterFn(this.a[i], i)) {
                    return this.a[i];
                }
            }
            return null;
        },
        
        findIdx: function (filterFn) {
            for (i in this.a) {
                if (filterFn(this.a[i], i)) {
                    return i;
                }
            }
            return null;
        },
        
        fold: function (accumulatorFn, init) {
            var acc = init;
            for (i in this.a) {
                acc = accumulatorFn(acc, this.a[i], i);
            }
            return acc;
        },
        
        keys: function () {
            var k = new Array();
            for (i in this.a) {
                k.push(i);
            }
            return k;
        }
    };
}

// Utility function to sort object arrays on a specified key
function sortOnFn(propName) {
    return function(e1, e2) {
        var v1 = e1[propName];
        var v2 = e2[propName];
        return v1 == v2 ? 0 : (v1 < v2 ? -1 : 1);
    };
}



