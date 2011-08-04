
@cc_on
@set @withTry = true

var DBG = {
    // Parse function text to find names of parameters, such
    // that those can be matched with values later
    parseFunction: function (fn) {
        var fnText = fn.toString();
        var res = "<???>";
        // get rid of comments and newlines:
        fnText = fnText.replace(/\/\/.*(?=\r\n|\n\r|$)/g,"");
        fnText = fnText.replace(/\/\*(?:\*(?!\/)|[^*])*\*\//g,"");
        fnText = fnText.replace(/\r\n|\n\r/g, "");
        
        // find function name
        var r = fnText.match(/^\s*function\s+(\w*)\s*\(/)
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
    listFunction: function (fn) {
        var fnText = fn.toString().split(/\n\r|\r\n/);
        for (ln in fnText) {
            println(("    " + ln.toString()).right(4), " ", fnText[ln]);
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
                    for (level in stack) {
                        var fnInfo = stack[level];
                        print(level, " ", fnInfo.name, "(");
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
                        if (cmdParts[1].match(/^\d+$/) != null) {
                            var stackLevel = parseInt(cmdParts[1], 10);
                            if (stackLevel >= 0 && stackLevel < stack.length) {
                                fn = stack[stackLevel].func;
                            } else {
                                println("ERROR: stack level ",
                                        stackLevel,
                                        " does not exist");
                            }
                        } else {
                            fn = evalFn(cmdParts[1]);
                        }
                        if (fn != null) {
                            this.listFunction(fn);
                        }
                    } else {
                        prinln("ERROR: function name was not supplied");
                    }
                    break;
                
                case "?":   // "help"
                    println("\ndbg commands:\n",
                            "g          - resume execution.\n",
                            "w          - print call stack.\n",
                            "l <fun>    - print source of function <fun>.\n",
                            "             <fun> is either function name or\n",
                            "             stack level (as displayed by w).\n",
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
                        println("Error: [", err.number, "] ", err.description);
                    }
                    @end
            }
        }
    }
};


// this is the function to be inserted at the breakpoint site:
// eval(dbgBreak("Place1"));
function dbgBreak(msg) {
    return "DBG.repl(\"" + msg.toString() +
           "\" , function (v) { return eval(v); }, " +
           "typeof arguments != \"undefined\" && arguments != null ? arguments.callee : null)";
}

