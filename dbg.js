/*
    JavaScript REPL Environment (JSREPL).
    
    This file contains debugger REPL and breakpoint classes.
 
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


@cc_on
@set @withTry = true

// Debugger REPL object - can be used directly in the user code
// by inserting static breakpoints:
//
//  eval(dbgBreak("Label"));
//
// Upon execution it will start debugger REPL.
//
var DBG = {
    // Parse function text to find names of parameters, such
    // that those can be matched with values later
    parseFunction: function (fn) {
        var fnText = fn;
        if (typeof(fn) == "function") {
            fnText = fn.toString();
        }
        var res = "<Global>";
        // get rid of comments and newlines:
        fnText = fnText.replace(/\/\/.*(?=\r\n|\n\r|$)/g,"");
        fnText = fnText.replace(/\/\*(?:\*(?!\/)|[^*])*\*\//g,"");
        fnText = fnText.replace(/\r\n|\n\r/g, "");
        
        // find function name
        var r = fnText.match(/^\s*function(?:\s+(\w*)|)\s*\(/)
        if (r != null) {
            res = RegExp.$1 == "" ? "<anonymous>" : RegExp.$1.toString();
        }
        
        // find arguments
        var reParamName = /\s*(\w*|"(?:\\"|[^"])*")\s*(,|\))/;
        var params = new Array();
        var lastIndex = RegExp.lastIndex;
        while (lastIndex >= 0 && (r = fnText.substr(lastIndex).match(reParamName)) != null) {
            lastIndex = RegExp.lastIndex != -1 ? lastIndex + RegExp.lastIndex : -1;
            if (RegExp.$1.length > 0) {
                params.push(RegExp.$1);
            }
            if (RegExp.$2 == ")") { // end of parameters
                break;
            }
        }
        return { name: res, params: params, func: fn};
    },
    
    
    // Display source code of a function object
    listFunction: function (functionName, fn) {
        var fnText = null;
        if (functionName in BreakPoints.bpList) {
            fnText = BreakPoints.bpList[functionName].savedFunc;
        } else {
            fnText = fn.toString().split(/\n\r|\r\n/);
        }
        var ln = 0;
        for (l in fnText) {
            var line = fnText[l];
            if (!(line.startsWith("eval(dbgBreak(") &&
                line.endsWith("// <dbg_break>"))) {
                println(ln.toString().rJustify(4), " ", line);
                ln++;
            }
        }
    },
    
    // stack walk and add function info to stack array
    walkStack: function (fn) {
        var stack = new Array();
        while (fn != null) {
            stack.push(this.parseFunction(fn));
            fn = fn.caller;
        }
        return stack;
    },

    // "debugger" REPL function
    repl: function (msg, evalFn, fn) {
        WScript.StdOut.WriteLine("\ndbg break - \"" + msg +
                                 "\"  ? - displays list of debugger commands.");
        var stack = this.walkStack(fn);
        var input = "";
        // run debugger REPL loop
        while (input != "g") {
            WScript.StdOut.Write("dbg> ");
            input = WScript.StdIn.ReadLine();
            var cmdParts = input.split(" ");
            switch (cmdParts[0]) {
                case "g":   // "go"
                    break;
                
                case "w":   // "where"
                    println("Call stack:\n\nLevel Function\n~~~~~ ~~~~~~~~~~~~");
                    for (level in stack) {
                        var fnInfo = stack[level];
                        print(level.rJustify(5), " ", fnInfo.name, "(");
                        var totalParams = fnInfo.params.length;
                        var totalArgs = fnInfo.func.arguments != null ?
                                            fnInfo.func.arguments.length :
                                            0;
                        var maxParams = Math.max(totalArgs, totalParams);
                        // for each function display all parameters and args -
                        // either one can have more than the other
                        for (a = 0; a < maxParams; a++) {
                            var paramName = a < totalParams ?
                                                fnInfo.params[a] + "=" :
                                                "";
                            var p = fnInfo.func.arguments[a];
                            var paramValue = a < totalArgs ? p.toString() : "";
                            if (typeof p == "string") {
                                paramValue = "\"" + paramValue + "\"";
                            }
                            print(a == 0 ? "" : ", ", paramName, paramValue);
                        }
                        println(")");
                    }
                    break;
                
                case "l":   // "list"
                    if (cmdParts.length > 1) {
                        var fn = null;
                        var functionName = null;
                        if (cmdParts[1].match(/^\d+$/) != null) {
                            var stackLevel = parseInt(cmdParts[1], 10);
                            if (stackLevel >= 0 && stackLevel < stack.length) {
                                fn = stack[stackLevel].func;
                                functionName = stack[stackLevel].name;
                            } else {
                                println("ERROR: stack level ",
                                        stackLevel,
                                        " does not exist");
                            }
                        } else {
                            fn = evalFn(cmdParts[1]);
                            functionName = cmdParts[1];
                        }
                        if (fn != null) {
                            this.listFunction(functionName, fn);
                        }
                    } else {
                        prinln("ERROR: function name was not supplied");
                    }
                    break;
                
                case "bl":
                    BreakPoints.listBP();
                    break;
                
                case "?":   // "help"
                    println("\ndbg commands:\n\n",
                            "g          - resume execution.\n",
                            "w          - print call stack.\n",
                            "l <fun>    - print source of function <fun>.\n",
                            "             <fun> is either function name or\n",
                            "             stack level (as displayed by w).\n",
                            "bl         - list all breakpoints.\n",
                            "q          - quit execution of the script.\n",
                            "<expr>     - evaluate <expr> in the context of\n",
                            "             the current function\.n");
                    break;
                
                case "q":   // "quit"
                    WScript.Quit();
                    break;
                
                default:    // "eval"
                    @if (@withTry)
                    try {
                    @end
                        println(evalFn(input));
                    @if (@withTry)
                    } catch (err) {
                        println(err.format());
                    }
                    @end
            }
        }
    }
};


// this is the function to be inserted at the breakpoint site:
//
// eval(dbgBreak("Place1"));
//
function dbgBreak(msg) {
    return "DBG.repl(\"" + msg.toString() +
           "\" , function (v) { return eval(v); }, " +
           "typeof arguments != \"undefined\" && arguments != null ? arguments.callee : null)";
}

// Dynamic breakpoint implementation - should only be called from JSREPL.
// But then, there might be interesting usage cases when called from user
// code too...
//
var BreakPoints = {
    bpList : new Array(),
    bpIndex : new Array(),
    bpId: 0,                    // Global BP id counter
    
    //
    // Private utility functions for internal object usage
    //
    
    // Takes function text and inserts lines with breakpoints
    updateFnBreaks: function (bpInfo, bpLine) {
        var lineNos = Arr(bpInfo.breaks).map(function(eBr) { return eBr.line; }).a;
        if (typeof(bpLine) != "undefined") {
            lineNos.push(bpLine);
        }
        lineNos.sort();
        
        var fnLines = bpInfo.savedFunc.slice(0);    // copy the array
        var bpLabelPrefix = bpInfo.name + "(";
        for (iLN in lineNos) {
            var offset = lineNos[iLN] + parseInt(iLN);    // compensating for lines inserted already
            if (offset < fnLines.length) {
                var bpLabel = bpInfo.name + "(" + lineNos[iLN].toString() + ")";
                fnLines.splice(offset, 0 /*=toDelete*/, "eval(dbgBreak(\"" + bpLabel + "\")) // <dbg_break>");
            } else {
                println("ERROR: line ", lineNos[iLN], " is outside of the function");
                return null;
            }
        }
        return fnLines.join("\n\r");
    },
    
    // returns a new or an existing breakpoint info for the functionName
    getFunctionBPs: function (functionName, fn) {
        if (functionName in this.bpList) {
            return this.bpList[functionName];
        }
        var bpInfo = {
            savedFunc: fn.toString().split(/\n\r|\r\n/),
            fn: fn,
            name: functionName,
            breaks: new Array()
        };
        
        return bpInfo;
    },
    
    //
    // public functions to be used by other objects
    //
    
    // add new breakpoint
    addBP : function(functionName, fn, line) {
        if (bpLine < 1) {
            println("ERROR: cannot insert breakpoint before the first line");
            return null;
        }
        
        var bpLine = parseInt(line);
        if (typeof(fn) == "function") {
            var fnInfo = DBG.parseFunction(fn);
            var bpInfo = this.getFunctionBPs(functionName, fn);
            if (Arr(bpInfo.breaks).any(function(eBr) { return eBr.line == bpLine; })) {
                println("ERROR: there is already a breakpoint at line ", bpLine,
                        "in function ", functionName, ".");
                return null;
            }
            var newFunctionText = this.updateFnBreaks(bpInfo, bpLine);
            // was this anonymous function referenced via variable?
            if (fnInfo.name == "<anonymous>") {
                // make the assignment
                newFunctionText = functionName + " = " + newFunctionText;
            }
            if (newFunctionText != null) {
                // a new breakpoint being added?
                if (bpInfo.breaks.length == 0) {
                    this.bpList[functionName] = bpInfo;
                }
                var newBP = {id: 0, line:bpLine, parent: bpInfo};
                newBP.id = (this.bpId++).toString();
                bpInfo.breaks.push(newBP);
                bpInfo.breaks.sort(sortOnFn("line"));
                // add reverse lookup entry (force a property behavior)
                this.bpIndex[newBP.id] = newBP;
            }
            return newFunctionText;
        } else {
            println("ERROR: '", functionName, "' is not a function");
        }
        return null;
    },
    
    // delete existing breakpoint
    removeBP : function(bpId) {
        if (!(bpId in this.bpIndex)) {
            printl("ERROR: breakpoint with index ", bpId, " is not set.");
            return null;
        }
        // find and delete function breakpoint
        var bpInfo = this.bpIndex[bpId].parent;
        var iBp = Arr(bpInfo.breaks).findIdx(function(e) { return e.id == bpId; });
        bpInfo.breaks.splice(iBp, 1);
        delete this.bpIndex[bpId];
        // was this the last breakpoint in this function?
        if (bpInfo.breaks.length == 0) {
            delete  this.bpList[bpInfo.name];
        }
        
        // generate function with the remainging breakpoints
        var newFunctionText = this.updateFnBreaks(bpInfo);
        // newFunctionText should not be null, i.e. it is better to
        // have null reference access here and fix the circumstances
        // leading to it, than to defensively check for null.
        var fnInfo = DBG.parseFunction(bpInfo.fn);
        // was this anonymous function referenced via variable?
        if (fnInfo.name == "<anonymous>") {
            // make the assignment
            newFunctionText = bpInfo.name + " = " + newFunctionText;
        }
        return newFunctionText;
    },
    
    // list all breakpoints
    listBP: function() {
        println("Active breakpoints:\n\n Id  Function(line)\n~~~~ ~~~~~~~~~~~~~~");
        Arr(this.bpList).forEach(function(eFn) {
            Arr(eFn.breaks).forEach(function(eBr) {
                println(eBr.id.rJustify(4), " ", eFn.name, "(", eBr.line, ")");
            });
        });
    }
}

