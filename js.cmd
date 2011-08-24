@set @a=0 /*
@set @a=
@%js32path%cscript //E:JScript //I //Nologo %~dpnx0 %*
@goto :EOF */

/*
    JavaScript REPL Environment (JSREPL).
    
    This file contains top-level JSREPL loop.
 
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

// If this is set to true, then most critical blocks will be wrapped
// in try/catch, which will create a more robust environment, but
// it might be hard to tell the exact location of the error.
// When debugging set this to false, such that script host prints
// file/line info to stdout (the side effect is that execution will
// terminate at that point)
@set @withTry = true

@set @JSREPL_Version = 1.1

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

var JSREPL_interactive = true;

// were any arguments passed in?
var scriptArgs = WScript.Arguments;
if (scriptArgs.length > 0) {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var script = scriptArgs(0);
    // check if the first parameter is a file
    if (fso.FileExists(script)) {
        // set this to true in your script to stay in interactive environment afterwards
        JSREPL_interactive = false;
        eval(load(script));
    } else {
        println("ERROR: script file '", script, "' does not exist.");
    }
}

if (JSREPL_interactive) {    // Running in interactive mode
    var cmdLine = "";
    WScript.Echo(
        "\nInteractive JavaScript REPL console. Version ", @JSREPL_Version, "\n\n",
        "When no parameters are passed on command line, JSREPL starts\n",
        "in interactive mode with the following commands available:\n",
        "   println(<expr>[, ...]) - prints expressions to stdout with \\n.\n",
        "   print(<expr>[,...])    - prints expressions to stdout without \\n.\n",
        "   \\ at the end of line   - indicates continuation for multiline input.\n",
        "   load <file>            - loads and executes file in current session.\n",
        "   list <fn>              - list the source of the function. <fn> must\n",
        "                          - be function name without parentheses.\n",
        "   bp <fn> <line>         - inserts a breakpoint in function <fn> before\n",
        "                            line <line>. Lines are zero-based.\n",
        "   bd <id>                - removes breakpoint with id <id>.\n",
        "   bl                     - lists all breakpoints.\n",
        "   quit                   - terminates execution.\n\n",
        "When a file name is passed as a first parameter on a command line,\n",
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
                                DBG.listFunction(cmdParts[1], eval(cmdParts[1]));
                            } else {
                                println("ERROR: Function name not provided.");
                            }
                            break;
                        
                        case "bp":
                            var fnText = BreakPoints.addBP(cmdParts[1], eval(cmdParts[1]), cmdParts[2]);
                            if (fnText != null) {
                                eval(fnText);
                            }
                            break;
                            
                        case "bd":
                            var fnSaved = BreakPoints.removeBP(cmdParts[1]);
                            if (fnSaved != null) {
                                eval(fnSaved);
                            }
                            break;
                        
                        case "bl":
                            BreakPoints.listBP();
                            break;
                        
                        default:
                            var val = eval(cmdLine);
                            if (typeof(val) != "undefined") {
                                println(val);
                            } else {
                                println(); 
                            }
                    }
                @if (@withTry)
                }
                catch (err) {
                    println("\n", err.format());
                }
                @end
                cmdLine = "";       // otherwise just accumulate cmdLine
            } else {
                cmdLine = cmdLine.substr(0, cmdLine.length - 1) + "\n\r";
            }
        }
    }
}

