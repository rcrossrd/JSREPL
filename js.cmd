@set @a=0 /*
@set @a=
@%js32path%cscript //E:JScript //I //Nologo %~dpnx0 %*
@goto :EOF */

@cc_on

// If this is set to true, then most critical blocks will be wrapped
// with try/catch, which will create a more robust environment, but
// it might be hard to tell the exact location of the error.
// When debugging set this to false, such that script host prints
// file/line info to stdout (the side effect is that execution will
// terminate at that point)
@set @withTry = true

// Import specified file into current context
function load(filePath) {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    if (fso.FileExists(filePath)) {
        return fso.OpenTextFile(filePath).ReadAll();
    } else {
        var alternatePath = fso.BuildPath(fso.GetParentFoldername(WScript.ScriptFullName), filePath);
        if (fso.FileExists(alternatePath)) {
            return fso.OpenTextFile(alternatePath).ReadAll();
        }
    }
    
    return null;
}

// Utility functions
eval(load("util.js"));

// debugging functions - depends on the above utility functions
eval(load("dbg.js"));


// were any arguments passed in?
var scriptArgs = WScript.Arguments;
if (scriptArgs.length > 0) {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var script = scriptArgs(0);
    // check if the first parameter is a file
    if (fso.FileExists(script)) {
        eval(load(script));
    } else {
        println("ERROR: script file '", script, "' does not exist.");
    }
} else {    // Running in interactive mode
    var cmdLine = "";
    WScript.Echo(
        "\nSimple JavaScript REPL console\n\n",
        "When no parameters are passed on command line console starts\n",
        "in interactive more with the following commands available:\n",
        "    println(<expr>[, ...]) - prints expressions to stdout with \\n.\n",
        "   print(<expr>[,...])    - prints expressions to stdout without \\n.\n",
        "   \\ at the end of line  - indicates continuation for multiline input.\n",
        "   load <file>            - loads and executes file in current session.\n",
        "   list <fn>              - list the source of the function. <fn> must\n",
        "                          - be function name without parentheses.",
        "   quit                   - terminates execution.\n",
        "when file name is passed as a first parameter on a command line,\n",
        "it is executed in the context of this console and all arguments\n",
        "are passed on to the script as is.\n");
    
    // Run main REPL loop for the interactive console
    while (cmdLine.toLowerCase() != "quit" ) {
        WScript.StdOut.Write(cmdLine == "" ? "# " : ":");
        cmdLine += WScript.StdIn.ReadLine();
       
        if (cmdLine.toLowerCase() != "quit") {
            if (cmdLine.right(1) != "\\") {
                @if (@withTry) 
                try {
                @end
                    var cmdParts = cmdLine.split(" ");
                    switch (cmdParts[0]) {
                        case "load":
                            WScript.Echo(eval(load(cmdParts[1])));
                            break;
                        
                        case "list":
                            if (cmdParts.length > 1) {
                                DBG.listFunction(eval(cmdParts[1]));
                            } else {
                                println("ERROR: Function name not provided.");
                            }
                            break;
                        
                        default:
                            WScript.Echo(eval(cmdLine)); 
                    }
                @if (@withTry)
                }
                catch (err) {
                    println("\nError:\n[", err.number, "] ", err.description);
                }
                @end
                cmdLine = "";       // otherwise just accumulate cmdLine
            } else {
                cmdLine = cmdLine.substr(0, cmdLine.length - 1);
            }
        }
    }
}

