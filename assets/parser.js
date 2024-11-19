"use strict";

function Enum() {
	for (let i=0; i<arguments.length; i++) {
		this[arguments[i]] = Symbol(arguments[i]);
	}
	Object.freeze(this);
}

const TTYPE = Object.freeze(new Enum("START", "INTEGER", "DECIMAL",
    "SEPARATOR", "SINGLE", "IDENTIFIER", "SUBSCRIPT", "LONGIDENT",
    "EQUAL"));


/*  Fonction du lexeur (tokenize)
 *  Découper la saisie en objets élémentaires (tokens) :
 *      - nombres (sous forme décimale)
 *      - opérations, parenthèses, égalité
 *      - identifiants (commence par alpha, contient "_", digits)
 *  Un nombre est positif, la gestion du signe se fait dans le parseur
 *
 *  La seule situation problématique est après le séparateur décimal, on attend un digit
 * 
 * 	Le lexeur ne se soucie pas de la validité de l'expression latex d'un identifiant
 */

function Token(text, type, index) {
    this.text = text;
    this.type = type;
    this.index = index;
}

function throwParseError(i, message) {
    throw("Expression mal formée (position " + i + ", " + message +")");
}

function tokenize(inString) {
    
    //Malheureusement, la grammaire arithmétique est contextuelle sur au moins deux points :
    //- interpretation du sign "-"
    //- sens d'une parenthèse après un dentifiant (application de fonction
        //ou multiplication d'une variable

    // pour l'instant, ne traite que les expressions simples, mais extensible
        
    var tokens = [];            // stockage des tokens identifiés
    var token = "";             // le token en traitement
    var type = TTYPE.START;      // le type du token en traitement
    var c = "";

    console.log("Tokenizing '" + inString + "'");

    var i;                      // compteur de boucle, défini niveau fonction, conservé
    
    for (i=0; i<inString.length; i++) {
        c = inString[i];

        if (/[a-zA-Z']/.test(c)) {
            switch (type) {
                case TTYPE.INTEGER:
                case TTYPE.DECIMAL:
                    tokens.push(new Token(token, type, i));
                    tokens.push(new Token("*", TTYPE.SINGLE, i));
                    token = c;
                    type = TTYPE.IDENTIFIER;
                    break;
                case TTYPE.SINGLE:
                case TTYPE.EQUAL:
                    tokens.push(new Token(token, type, i));
                case TTYPE.START:
                    token = c;
                    type = TTYPE.IDENTIFIER;
                    break;
                case TTYPE.IDENTIFIER:
                    token += c
                    break;
                default:
                    throwParseError(i, "")
            }
        } else
        if (c=="_") {
            switch (type) {
                case TTYPE.IDENTIFIER:
                    token += c;
                    type = TTYPE.SUBSCRIPT;
                    break;
                default:
                    throwParseError(i, "le signe soulignement doit suivre une ou plusieurs lettres")
            }
        } else
        if (/[0-9]/.test(c)) {
            switch (type) {
                case TTYPE.SINGLE:
                case TTYPE.EQUAL:
                    tokens.push(new Token(token, type, i));
                case TTYPE.START:
                    token = c;
                    type = TTYPE.INTEGER;
                    break;
                case TTYPE.INTEGER:
                case TTYPE.DECIMAL:
                case TTYPE.LONGIDENT:
                    token += c;
                    break;
                case TTYPE.SUBSCRIPT:
                    type = TTYPE.LONGIDENT
                    token += c;
                    break;
                case TTYPE.SEPARATOR:
                    token += c;
                    type = TTYPE.DECIMAL;
                    break;
                default:
                    throwParseError(i)
            }
        } else
        if (/[\.,]/.test(c)) {
            switch (type) {
                case TTYPE.INTEGER:
                    token += ".";
                    type = TTYPE.SEPARATOR;
                    break;
                default:
                    throwParseError(i)
            }
        } else
        if (/[\+\*\/]/.test(c)) {
            switch (type) {
                case TTYPE.INTEGER:
                case TTYPE.DECIMAL:
                case TTYPE.IDENTIFIER:
                case TTYPE.LONGIDENT:
                    tokens.push(new Token(token, type, i));
                    token = c;
                    type = TTYPE.SINGLE;
                    break;
                default:
                    throwParseError(i)
            }
        } else
        if (c == "-") {
            switch (type) {
                case TTYPE.INTEGER:
                case TTYPE.DECIMAL:
                case TTYPE.IDENTIFIER:
                case TTYPE.LONGIDENT:
                    tokens.push(new Token(token, type, i));
                    token = c;
                    type = TTYPE.SINGLE;
                    break;
                case TTYPE.EQUAL:
                    tokens.push(new Token(token, type, i));
                case TTYPE.START:
                    tokens.push(new Token("-1", TTYPE.INTEGER, i));
                    tokens.push(new Token("*", TTYPE.SINGLE, i));
                    token="";
                    type = TTYPE.START;
                    break;
                default:
                    throwParseError(i)
            }
        } else
        if (c == "=") {
            switch (type) {
                case TTYPE.INTEGER:
                case TTYPE.DECIMAL:
                case TTYPE.IDENTIFIER:
                case TTYPE.LONGIDENT:
                    tokens.push(new Token(token, type, i));
                    token = c;
                    type = TTYPE.EQUAL;
                    break;
                default:
                    throwParseError(i)
            }
        } else
        if (/\s/.test(c)) {
        } else {
            throw("Caractère interdit : '"+ c + "'.");
        }
        
    }
        
    switch (type) {
        case TTYPE.INTEGER:
        case TTYPE.DECIMAL:
        case TTYPE.IDENTIFIER:
        case TTYPE.LONGIDENT:
        case TTYPE.SINGLE:
            tokens.push(new Token(token, type, i));
            break;
        case TTYPE.START:
            break;
        default:
            throwParseError("fin", "");
    }

    return tokens;
}


const TNODES = Object.freeze(new Enum("SIDE", "EQUATION", "STANDARD"));

function Node(value, base, index) {
    this.value = value;
    this.base = TeXify(base);
    this.index = index;
}

const opPrecedence = {
    "=" : -1,
	"-" : 0,
	"+" : 0,
	"*"	: 1,
	"/" : 1
}

const One = DecimalFraction(1);
const MinusOne = new DecimalFraction(-1);

function parse(tokens) {
	var output = [];
	var operators = [];
    var t, n;
	for (let i=0; i<tokens.length; i++) {
		t = tokens[i];
        if (t.type == TTYPE.SINGLE || t.type == TTYPE.EQUAL) {
            while (operators[operators.length-1] && opPrecedence[operators[operators.length-1].text] >= opPrecedence[t.text]) {
                output.push(operators.pop());
            }
            
            if (t.type == TTYPE.EQUAL) {
                output.push(t);
            } else {
                operators.push(t);
            }
            
        } else {
            if (t.type == TTYPE.IDENTIFIER || t.type == TTYPE.LONGIDENT) {
                n = new Node(One, t.text, t.index);
            } else {
                n = new Node(new DecimalFraction(t.text), "", t.index);
            }
            output.push(n);
        }
	}

    while (operators[0]) {
        output.push(operators.pop());
    }

    return output;
}

    
function includes(list, element) {
    for (let i=0; i<list.length; i++) {
        if (list[i]==element) {
            return true;
        }
    }
    return false;
}

    // Digestion
function parseLinEq(output, variables) {
    // La pile est par défaut additive : si aucune opération ne reste à faire, les
    // noeuds présents sont additionnés
    console.log("Digesting.");

    var members = [];
    var stack = [];
    var absent = true;
    var a, b;

    for (var i=0; i<output.length; i++) {
        let t = output[i];                  // parcours des noeuds de l'arbre
        if (t.text == "=") {            // "=" ? on sauvegarde un membre et passe au suivant
            members.push(stack);
            stack = [];
        } else
        if (t.text == "+") {            // "+" ? on dépile et vérifie si la même base est déjà présente
            a = stack.pop();
            absent = true;              // par défaut, c'est non
            for (var j=0; j<stack.length; j++) {
                if (a.base == stack[j].base) {
                    stack[j].value = stack[j].value.add(a.value); // si on trouve, on rajoute
                    absent = false;
                }
            }
            if (absent) {               // sinon, on rempile
                stack.push(a);
            }
        } else
        if (t.text == "-") {
            a = stack.pop();
            a.value = a.value.mul(MinusOne);
            absent = true;
            for (var j=0; j<stack.length; j++) {
                if (a.base == stack[j].base) {
                    stack[j].value = stack[j].value.add(a.value);
                    absent = false;
                }
            }
            if (absent) {
                stack.push(a);
            }
        } else
        if (t.text == "*") {
            b = stack.pop();
            a = stack.pop();
            if (a.base != "" && b.base != "") {
                throw("L'expression définie n'est pas affine (position " + t.index + ").")
            }
            var base = a.base == "" ? b.base : a.base;
            stack.push(new Node(a.value.mul(b.value), base));
        } else
        if (t.text == "/") {
            b = stack.pop();
            if (b.base != "") {
                throw("L'expression définie n'est pas affine (position " + t.index + ").")
            }
            a = stack.pop();
            var base = a.base == "" ? b.base : a.base;
            stack.push(new Node(a.value.div(b.value), base));
        } else {
            if (variables) { // si une liste de variables a été fournie, vérifier
                if (!includes(variables, t.base)) {
                    throw("Utilisation de l'inconnue non définie '\\("+ t.base + "\\)' en position " + t.index + ".");
                }
            }
            stack.push(t);
        }
    }
    members.push(stack);
    return members;
}

// Structures et outils numériques

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

function Fraction(num, den) {
    this.num = num;
    this.den = den;

    if (den == 0) {
        throw("Division by zero");
    }

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

    this.inv = function() {
        return new Fraction(this.den, this.num);
    }

    this.neg = function() {
        return new Fraction(this.den, -this.num);
    }

    this.approx = function() {
        return this.num/this.den;
    }

    this.TeX = function(variable) {
        var sign = this.num < 0 ? "-" : "+";
        if (this.den == 1) {
            if (variable!="") {
                if (this.num == 1) {
                    return "+" + variable;
                } else
                if (this.num == -1) {
                    return "-" + variable;
                } 
            }
            return sign + Math.abs(this.num) + variable;
        } else {
            return sign + "\\frac{" + Math.abs(this.num) + "}{" + this.den + "}" + variable;
        }
    }

    this.shortTeX = function(variable) {
        let tex = this.TeX(variable);
        if (tex[0] == "+") {
            return tex.slice(1);
        }
        return tex;
    }

    this.clone = function() {
        return new Fraction(this.num, this.den);
    }

    this.isNull = function() {
        return (this.num == 0);
    }
    
    this.isOne = function() {
        return (this.num == this.den);
    }

}

function DecimalFraction(value) {
    var dec = "" + value;
    var den = 1;
    var decPart;
    dec = dec.split(".");
    if (dec.length > 1) {
        decPart = dec[1].length < 7 ? dec[1] : dec[1].slice(0,6);
        den = Math.pow(10, decPart.length);
        value = 1*decPart + den*dec[0];
    }
    return new Fraction(value, den);
}

