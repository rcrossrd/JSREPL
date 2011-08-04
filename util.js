/*
 
    Utility functions for JavaScript projects
 
*/

// Print the repr of all arguments
function print() {
    for (var i = 0; i < arguments.length; i++) {
        WScript.StdOut.Write(arguments[i].toString());
    }
}

// This is exact copy of the previous one with extra newline,
// It is ugly, but effective way to deal with variable number
// of arguments
function println() {
    for (var i = 0; i < arguments.length; i++) {
        WScript.StdOut.Write(arguments[i].toString());
    }
    WScript.StdOut.WriteLine();
}

// Useful utility function to keep around
String.prototype.right = function(i) {
    return i >= 0 && i < this.length ? this.substr(this.length - i) : "";
}

String.prototype.startsWith = function(s) {
    return this.substr(0, s.length) == s;
}

String.prototype.endsWith = function(s) {
    return this.right(s.length) == s;
}

