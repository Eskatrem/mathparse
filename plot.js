//functions to plot maths functions.
function log10(x) {
    return Math.log(x)/Math.log(10);
}

function min(a) {
    if(a === null || a === undefined || a.length === 0) {
        return Infinity;
    }
    return a.reduce(function(x,y) {return Math.min(x,y);});
}

function max(a) {
    if(a === null || a === undefined || a.length === 0) {
        return -Infinity;
    }
    return a.reduce(function(x,y) {return Math.max(x,y);});
}

var operators = ["+", "-", "*","/", "^"];
var functions = {
    tan: Math.tan,
    cos: Math.cos,
    sin: Math.sin,
    log: Math.log,
    log10: log10,
    exp: Math.exp,
    E:Math.floor,
    min: min,
    max: max
};

var functionsNames = Object.keys(functions);

function getOpsOutsideParenthesis(expr, op) {
    var n = expr.length;
    var nParenthesis = 0;
    var res = [];
    for(var i = 0; i < n; i++) {
        if(nParenthesis < 0) {
            throw("error: unbalanced parenthesis");        
        }
        var tmpChar = expr[i];
        if(tmpChar === op && nParenthesis === 0) {
            res.push(i);
        } else if (tmpChar === "(") {
            nParenthesis++;
        } else if (tmpChar === ")") {
            nParenthesis--;
        }
    }
    return res;
}

function isExactMatch(str, regexp) {
    var match = str.match(regexp);
    return match !== null && str == match[0];
}

function isNumber(expr) {
    return isExactMatch(expr, /[0-9]+/) || isExactMatch(expr, /[0-9]*\.[0-9]+/);
}

function isVariable(expr) {
    return isExactMatch(expr, /[A-z]+[0-9]*/);
}

function isTerminalNode(expr) {
    return isVariable(expr) || isNumber(expr);
}

function getSplits(str, splits) {
    var res = [];
    var splitStart = 0;
    var nSplits = splits.length;
    for(var i = 0; i < nSplits; i++) {
        var splitEnd = splits[i];
        res.push(str.substring(splitStart, splitEnd));
        splitStart = splitEnd + 1;
    }
    res.push(str.substring(splitStart,str.length));
    return res;
}

function findMainNode(expr) {
    expr = expr.replace(/\s+/g, '');
    console.log("entrance of findMainOperator: expr = " + expr);
    if(isTerminalNode(expr)) {
        return new Node(expr,[]);
    }
    var mainNode;
    var nOperators = operators.length;
    var splits;
    for(var i = 0; i < nOperators; i++){
        
        var op = operators[i];
        console.log("finding operator " + op + " expr = " + expr);
        splits = getOpsOutsideParenthesis(expr,op);
        if(splits.length > 0) {
            mainNode = op;
            var chunks = getSplits(expr, splits);
            console.log("chunks:");
            console.log(chunks);
            return new Node(mainNode, chunks.map(findMainNode));
        }
    }
    //now handle when the main node is a function
    console.log("expr = " + expr);
    var head = expr.match(/[A-z]+[0-9]*/);
    if(head !== null) {
        head = head[0];
        var func = functions[head];
        if(func === null) {
            throw("function " + head + " is unknwown!");
        }
        var headLength = head.length;
        var core = expr.substring(headLength+1, expr.length-1); //take what"s after function name and remove the parenthesis
        var coreSplits = core.split(",");
        if(coreSplits.length === 1) {
            return new FunctionNode(head, [findMainNode(core)]);//TODO: change this line to handle multiple variables functions. typically, core should be splitted by coma.                
        }
        console.log("coreSplits:");
        console.log(coreSplits);
        return new FunctionNode(head,coreSplits.map(findMainNode));

    }
//    debugger;
    //if the main function couldn"t be found, throw an exception
    throw("error: invalid expression");
}

function Node(node, neighbours) {
    this.node = node;
    this.neighbours = neighbours;
    this.isTerminal = function() {
        return this.neighbours.length === 0;
    };
    this.isVariable = function() {
        return this.isTerminal() && isNaN(parseFloat(this.node));
    };
    this.eval = function(vals) {
        if(this.isTerminal()) {
            if(this.isVariable()) {
                var val = vals[this.node];
                if(val === undefined) {
                    throw ("no value specified for variable" + this.node);
                }
                return val;
            }
            return parseFloat(this.node);
        }
        var neighboursValues = this.neighbours.map(function(neighbour) {return neighbour.eval(vals);});
        var func;
        if(this.node === "+") {
            func = function(x,y) {return x+y;};
        }
        if(this.node === "-") {
            func = function(x,y) {return x-y;};
        }
        if(this.node === "*") {
            func = function(x,y) {return x*y;};
        }
        if(this.node === "/") {
            func = function(x,y) {return x/y;};
        }
        if(this.node === "^") {
            func = function(x,y) {return Math.pow(x,y);};
        }
        return neighboursValues.reduce(func);
    };
}

function FunctionNode(funcName, neighbours) {
    this.Node = funcName;
    this.func = functions[this.Node];
    this.neighbours = neighbours;
    this.isVariable = function() {return false;};
    this.isTerminal = function() {return false;};
    this.eval = function(vals) {
        var neighboursEvals = neighbours.map(function(neighbour){return neighbour.eval(vals);});
        console.log("neighboursEvals:");
        console.log(neighboursEvals);
        return this.func(neighboursEvals);
    };
}

function draw(func) {
    var canvas = document.getElementById("plotZone");
    var ctx = canvas.getContext("2d");
    var thick = 1;
    var color = "rgb(11,153,11)";
    var scale = 40;
    var dx = 4;
    var x0 = 0.5 + 0.5*canvas.width;
    var y0 = 0.5 + 0.5 * canvas.height;
    var iMin = -x0/dx;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    ctx.beginPath();
    ctx.lineWidth = thick;
    ctx.strokeStyle = color;

    for (var i=iMin;i<=iMax;i++) {
        xx = dx*i; yy = scale*func.eval({x:xx/scale});
        if (i==iMin) ctx.moveTo(x0+xx,y0-yy);
        else         ctx.lineTo(x0+xx,y0-yy);
    }
    ctx.stroke();
}

function plotString(str) {
    var func = findMainNode(str);
    draw(func);
}

function plot() {
    var input = document.getElementById("plotInput").value;
    var func = findMainNode(input);
    draw(func);
    
}