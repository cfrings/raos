const PSTATE = {
    NONE: 0,
    INTEGRAL: 1,
    DECIMAL: 2,
    SEPARATOR: 5,
    OPERATION: 3,
    IDENTIFIER: 4,
    EQUAL: 6,
    SIGN: 7
}

const TTYPE = {
    NONE: -1,
    NUMBER: 0,
    OPERATION: 1,
    IDENTIFIER: 2,
    EQUALITY: 3
}

function mathParse(inputString) {
    var tokens = [];
    var c;
    var token = "", tokenType = TTYPE.NONE;
    var state = PSTATE.NONE;
    for (let i=0; i<inputString.length; i++) {
        c = inputString[i];
        console.log("Processing [" + i + "] '" + c + "' (state: " + state
            + ", token: '" + token + "', type: " + tokenType + ").");
        console.log(state, token, tokenType);
        switch (true) {
            case /\s/.test(c):
                console.log("whitespace");
                break;
            case /[\+\-]/.test(c):
                console.log("+/-");
                switch(state) {
                    case PSTATE.EQUAL:
                        tokens.push({type:tokenType, content:token});
                    case PSTATE.NONE:
                        state = PSTATE.SIGN;
                        token = (c=="-") ? "-" : "";
                        tokenType = TTYPE.NUMBER;
                        break;
                    case PSTATE.INTEGRAL:
                    case PSTATE.DECIMAL:
                    case PSTATE.IDENTIFIER:
                        tokens.push({type:tokenType, content:token});
                        state = PSTATE.OPERATION;
                        token = c;
                        tokenType = TTYPE.OPERATION;
                        break;
                    default:
                        throw("parseError at position " + i);
                }
                break;
            case /[\*\/]/.test(c):
                console.log("div/mul");
                switch(state) {
                    case PSTATE.INTEGRAL:
                    case PSTATE.DECIMAL:
                    case PSTATE.IDENTIFIER:
                        state = PSTATE.OPERATION;
                        tokens.push({type:tokenType, content:token});
                        token = c;
                        tokenType = TTYPE.OPERATION;
                        break;
                    default:
                        throw("parseError at position " + i);
                }
                break;
            case /[\.,]/.test(c):
                console.log("decimal separator");
                switch(state) {
                    case PSTATE.INTEGRAL:
                        state = PSTATE.SEPARATOR;
                        token += ",";
                        break;
                    default:
                        throw("parseError at position " + i);
                }
                break;
            case /=/.test(c):
                console.log("equal");
                switch(state) {
                    case PSTATE.INTEGRAL:
                    case PSTATE.DECIMAL:
                    case PSTATE.IDENTIFIER:
                        tokens.push({type:tokenType, content:token});
                        state = PSTATE.EQUAL;
                        token = "=";
                        tokenType = TTYPE.EQUALITY;
                        break;
                    default:
                        throw("parseError at position " + i);
                }
                break;
            case /\d/.test(c):
                console.log("digit");
                switch(state) {
                    case PSTATE.EQUAL:
                    case PSTATE.OPERATION:
                        tokens.push({type:tokenType, content:token});
                    case PSTATE.NONE:
                        state = PSTATE.INTEGRAL
                        token = c;
                        tokenType = TTYPE.NUMBER;
                        break;
                    case PSTATE.SIGN:
                        state = PSTATE.INTEGRAL;
                        token += c;
                        break;
                    case PSTATE.SEPARATOR:
                        state = PSTATE.DECIMAL;
                    case PSTATE.INTEGRAL:
                    case PSTATE.DECIMAL:
                        token += c;
                        break;
                    default:
                        throw("parseError at position " + i);
                }
                break;
            default:
                console.log("other");
                switch(state) {
                    case PSTATE.INTEGRAL:
                    case PSTATE.DECIMAL:
                        tokens.push({type:tokenType, content:token});
                        tokens.push({type:TTYPE.OPERATION, content:"*"});
                        state = PSTATE.IDENTIFIER;
                        token = c;
                        tokenType = TTYPE.IDENTIFIER;
                        break;
                    case PSTATE.OPERATION:
                    case PSTATE.EQUAL:
                        tokens.push({type:tokenType, content:token});
                    case PSTATE.NONE:
                        state = PSTATE.IDENTIFIER;
                        token = c;
                        tokenType = TTYPE.IDENTIFIER;
                        break;
                    case PSTATE.SIGN:
                        if (token == "-") {
                            tokens.push({type:TTYPE.NUMBER, content:"1"});
                            tokens.push({type:TTYPE.OPERATION, content:"*"});
                        }
                        state = PSTATE.IDENTIFIER;
                        token = c;
                        tokenType = TTYPE.IDENTIFIER;
                        break;
                    case PSTATE.IDENTIFIER:
                        token += c;
                        break;
                    default:
                        throw("parseError at position " + i);
                }
                
        }
    }
    tokens.push({type:tokenType, content:token});
    return tokens;
}

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    var c;
    while (a != 0) {
        c = a;
        a = b % a;
        b = c;
    }
    return b;
}

function Fraction(num=0, den=1) {
    this.num = num;
    this.den = den;

    this.normalize = function() {
        if (this.den < 0) {
            this.num *= -1;
            this.den *= -1;
        }

        var g = gcd(this.num, this.den);
        this.num /= g;
        this.den /= g;
    }

    this.normalize();

    this.add = function(other) {
        var n, d;
        n = this.num * other.den + this.den * other.num;
        d =this.den * other.den;
        return new Fraction(n, d);
    }

    this.sub = function(other) {
        var n, d;
        n = this.num * other.den - this.den * other.num;
        d =this.den * other.den;
        return new Fraction(n, d);
    }

    this.mul = function(other) {
        var n, d;
        n = this.num * other.num;
        d =this.den * other.den;
        return new Fraction(n, d);
    }

    this.div = function(other) {
        var n, d;
        n = this.num * other.den;
        d = this.den * other.num;
        return new Fraction(n, d);
    }


    
}

function DecimalFraction(value) {
    var dec = "" + value;
    var den = 1;
    var decPart;
    console.log(dec.split("."));
    dec = dec.split(".");
    if (dec.length > 1) {
        decPart = dec[1].length < 7 ? dec[1] : dec[1].slice(0,6);
        den = Math.pow(10, decPart.length);
        value = 1*decPart + den*dec[0];
    }
    return new Fraction(value, den);
}

var a = new Fraction(312, -51231);
console.log(a);
