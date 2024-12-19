"use strict";

// Raos v.0.1 deuxième jet
// Code javascript du logiciel raos

const version = "0.2.241217.001";
document.title = 'Raos ' + version;

// Annonce
console.log("Démarrage de Raos v." + version);
                                                                                                                           
/*
HELPER FUNCTIONS

-- pour la structure

clear(node)                             Détruit le nœud et tous ses enfants.
clearChildren(node)                     Détruit tous les enfants du nœud.

setAttributes(element, object)          Définit de multiples attributs pour l'élément, définis par les attributs de l'objet fourni

-- pour la mise en forme

TeXifyPart(data)                        Met en forme une membre d'équation.
TeXify(texte)                           Emballage des indices pour rendu correct en TeX.

-- routines de validation


*/

/*  fonction: 	clear(node)
    Détruit le nœud et tous ses enfants. 

 	Utilisé pour effacer des étapes de résolution, et
  	pour tout réinitialiser pour un nouveau système.
 */
function clear(node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild);
    }
    node.parentNode.removeChild(node);
}

/*  fonction: 	clearChildren(node)
    Détruit tous les enfants du nœud. */
function clearChildren(node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild);
    }
}

function show(element) {
	element.classList.remove("hide");
}

function hide(element) {
	element.classList.add("hide");
}

/*  fonction: 	setAttributes(element, object)
    Définit de multiples attributs pour l'élément, définis par les attributs de l'objet fourni. */
function setAttributes(el, attrs) {
    for(let key in attrs) el.setAttribute(key, attrs[key]);
};

/*  fonction:   TeXifyPart(data)
    Met en forme une membre d'équation. */
function TeXifyPart(data) {
    let outString="";
    for (let j=0; j<_unknowns.length; j++) { // pour chaque inconnue
        for (let i=0; i<data.length; i++) { // pour chaque donnée
            if (data[i].base == _unknowns[j]) { // si elle est associée à l'inconnue
                if (!data[i].value.isNull()) { // et si le coef n'est pas nul
                    outString += data[i].value.TeX(_unknowns[j]); // on ajoute à l'affichage
                }
            }
        }
    }
    if (outString == "") { // si la chaîne résultante est vide, c'est que le membre est nul
        return "0";
    }
    if (outString[0] == "+") { // si le résultat commence par '+', on coupe
        return outString.slice(1);
    }
    return outString;
}

/*  fonction:   TeXify(texte)
    Emballage des indices pour rendu correct en TeX
        2       -> 2
        2x      -> 2x
        x_1     -> x_{1}
        x_{1}   -> x_{1}
*/
function TeXify(variable) {
    return variable.replace(/_\{*(.*?)\}*$/, "_{$1}")
}

/*  fonction: ValidateUnknown(texte)
    S'assure que le nom d'inconnue saisi est valide
        ^       marque de début
        $       marque de fin
	TODO : rappeler les noms admissibles
    TODO : mieux composer la regexp
*/

function validateUnknown(text) {
    // TODO : ne marche pas comme prévu, doit autoriser c_n, y', z'', x_{n+1} etc
    // return /^[a-zA-Z][a-zA-Z']*(_(\{[a-zA-Z\d\+\-]*\}|[a-zA-Z\d]))?$/.test(text);
    return /^[a-zA-Z][a-zA-Z']*(_\{[a-zA-Z\d\+\-]*\}|[a-zA-Z\d])?$/.test(text);
}

/* 
======================
VARIABLES ESSENTIELLES
======================

TODO : voir si on regroupe tout ça dans un unique objet
*/

let _unknowns = [];
let _lines = new Array();
let _problem = null;
let _lineId = 0;
let _nLines = 0;
let _combCoefEntries = {};
let _entryMode = true;

let _fontScale = 100;


/*
=============
ELEMENTS HTML
=============
*/

/*
const formDiv = document.getElementById("form-div");
const linesDiv = document.getElementById("lines-div");
const unknownsDiv = document.getElementById("unknowns-div");
*/
const quickStart = document.getElementById("quick-start");
const solveDiv = document.getElementById("solve-div");
const resolutionSteps = document.getElementById("resolution-steps");

const manualDiv = document.getElementById("manual-div");

const errorMessage = document.getElementById("error-message");

const lineInputTable = document.getElementById("line-input-table");

//  - conteneurs pour messages d'erreur
const lineErrorContainer = document.getElementById("line-error-container");
const validateErrorContainer = document.getElementById("validate-error-container");
const unknownsErrorContainer = document.getElementById("unknowns-error-container");

const opErrorContainer = document.getElementById("op-error-container");
const substErrorContainer = document.getElementById("subst-error-container");
const combErrorContainer = document.getElementById("comb-error-container");

//  - éléments de saisie
const unknownsEntry = document.getElementById("unknowns-entry"); // TODO à supprimer ?
const lineEntry = document.getElementById("line-entry"); // TODO à supprimer ?

//  - boutons (et éléments associés)

//  -- boutons de la barre de titre
const switchManualButton = document.getElementById("manual-switch");
const manualResizeButton = document.getElementById("manual-resize");
const manualChoice = document.getElementById("manual-choice");
const manualInFrame = document.getElementById("manual-in-frame");
const manualInTab = document.getElementById("manual-in-tab");
const switchMobileModeButton = document.getElementById("mode-switch");
const decreaseSizeButton = document.getElementById("decrease-size");
const increaseSizeButton = document.getElementById("increase-size");
const switchFullscreenButton = document.getElementById("fullscreen");


const newSystemButton = document.getElementById("fast-input");
const newSystemModal = document.getElementById("new-system");
const newSystemInput = document.getElementById("new-system-input");
const newSystemError = document.getElementById("new-system-error");
const validateSystemButton = document.getElementById("validate-system-input");
const cancelSystemButton = document.getElementById("cancel-system-input");


const swapButton = document.getElementById("swap-button");
const operationButton = document.getElementById("op-button");
const substitutionButton = document.getElementById("subst-button");
const combinationButton = document.getElementById("comb-button");

const lineSubmit = document.getElementById("line-submit"); // TODO à supprimer ?
const unknownsSubmit = document.getElementById("unknowns-submit"); // TODO à supprimer ?

const validateButton = document.getElementById("validate-button");

// Éléments relatifs aux actions de résolution


const swapContainer = document.getElementById("swap-container");
const opContainer = document.getElementById("op-container");
const combContainer = document.getElementById("comb-container");
const substContainer = document.getElementById("subst-container");

const swapLine = document.getElementById("swap-line");
const opLine = document.getElementById("op-line");
const substLine = document.getElementById("subst-line");
const combLine = document.getElementById("comb-line");

const swapSubmit = document.getElementById("swap-submit");
const opSubmit = document.getElementById("op-submit");
const substSubmit = document.getElementById("subst-submit");
const combSubmit = document.getElementById("comb-submit");

const opEntry = document.getElementById("op-entry");
const opAltEntry = document.getElementById("op-alt-entry");
const eraseOpEntryButton = document.getElementById("erase-op-entry");
const virtualKbdButtons = document.querySelectorAll(".virtual-kbd");
const virtualKeyboard = document.getElementById("virtual-kbd");
const opKeyboard = document.getElementById("op-kbd");
const combKeyboard = document.getElementById("comb-kbd");

const combCoefTable = document.getElementById("comb-coef-table");
const combCoefEntries = [];

//  - autres éléments
const title = document.getElementById("title"); // TODO à supprimer ?
const unknownListDisplay = document.getElementById("unknown-list-display"); // TODO à supprimer ?

// Initialisation des éléments de la page

var keyboardTarget = opEntry;






const paneScrollbar = document.getElementById('pane-scrollbar');

// Handle scrolling when the range input changes
paneScrollbar.addEventListener('input', () => {
	if (paneScrollbar.value < 25) {
		paneScrollbar.value = 25;
	} else if (paneScrollbar.value > 75) {
		paneScrollbar.value=75;
	}
	manualDiv.style["flex"] = "0 0 " + paneScrollbar.value + "%";
});









// Affectation des callbacks
switchManualButton.addEventListener("click", switchManual);
manualInFrame.addEventListener("click", showManualFrame);
manualInTab.addEventListener("click", showManualTab);
// manualChoice.addEventListener("click", e => manualChoice.classList.add("hide"));
manualChoice.addEventListener("click", e => hide(manualChoice));
// newSystemModal.addEventListener("click", e => newSystemModal.classList.add("hide"));
newSystemModal.addEventListener("click", e => hide(newSystemModal));
document.getElementById("new-system-content").addEventListener("click", e => {console.log("Bummer!"); e.stopPropagation();});
manualResizeButton.addEventListener("click", toggleResizeScrollbar);

switchMobileModeButton.addEventListener("click", setEntryMode);

decreaseSizeButton.addEventListener("click", decreaseFontSize);
increaseSizeButton.addEventListener("click", increaseFontSize);
switchFullscreenButton.addEventListener("click", switchFullscreenMode);

newSystemButton.addEventListener("click", showNewSystemModal);
validateSystemButton.addEventListener("click", validateNewSystem);
cancelSystemButton.addEventListener("click", cancelNewSystem);

function cancelNewSystem(e) {
    newSystemInput.value = "";
    // newSystemModal.classList.add("hide");
    // newSystemError.classList.add("hide");
    hide(newSystemModal);
    hide(newSystemError);
}

function showNewSystemModal(e) {
    console.log("Showing system input modal.");
    newSystemModal.classList.remove("hide");
}

function validateNewSystem(e) {
	moveErrorDivTo(newSystemError);
    let input = newSystemInput.value;
    if (input===null) {
		return;
	}
	let unknowns = [];
	let data = [];
	try {
		let inputArray = input.split(";");
		if (inputArray.length==0) {
			throw("saisie vide");
		}
		if (inputArray.length==1) {
			throw("une seule ligne");
		}
		for (let i=0; i<inputArray.length; i++) {
			data.push(parseLinEq(parse(tokenize(inputArray[i]))));	
		}
        console.log("Done tokenizing.");
		for (let i=0; i<data.length; i++) {
			let line = data[i];
			if (line.length != 2) {
				throw("ligne "+(i+1)+" mal formée : trop ou trop peu de signes '='");
			}
			for (let j=0; j<2; j++) {
				let part = line[j];
				for (let k=0; k<part.length; k++) {
					if (part[k].base != "" && !includes(unknowns, part[k].base)) {
						unknowns.push(part[k].base);
					} 
				}
			}
		}
	} catch(e) {
        raosError("La saisie n'est pas correcte ("+e+").");
		return;
    }

    console.log("Proceeding.");

    // newSystemModal.classList.add("hide");
    // newSystemError.classList.add("hide");
    hide(newSystemModal);
    hide(newSystemError);
	
	newSystemInput.value = "";

    collapseConfigs();

	_unknowns = unknowns;
	_unknowns.push("");
	_nLines = data.length;

	let system = new System();
	for (let i=0; i<data.length; i++) {
		let line = new Line(new Part(data[i][0]), new Part(data[i][1]));
		system.addLine(line);
	}

	_problem = new Problem(system);

	let virtualKbdRows = [];
	
	for (let j=0; j<4; j++) {
		virtualKbdRows.push(document.getElementById("virtual-kbd-row-" + j));
	}

	console.log(_unknowns);

    // suppression des boutons "inconnues" du clavier virtuel
    document.querySelectorAll(".virtual-kbd-var").forEach( n => n.remove() );

    // creation des boutons "inconnues" du clavier virtuel
	let i=0;
	for (let j=0; j<_unknowns.length; j++) {
		let name = _unknowns[j];
		if (name != "") {
			console.log("creating key for unknown '" + name + "'.");
			let button = document.createElement("button");
			button.classList.add("virtual-kbd");
			button.classList.add("virtual-kbd-var");
			button.classList.add("virtual-kbd");
			button.classList.add("virtual-kbd-var");
			button.id = "unknown-" + name;
			button.innerHTML = "\\("+name+"\\)";
            button.dataset.value = name;
            button.addEventListener("click", opKbdPress);
			let item = document.createElement("td");
			item.appendChild(button);
			virtualKbdRows[i%4].appendChild(item);
			typesetMathjax([button]);
			i++;
		}
	}
	
	setupResolutionEnvironment();
    setEntryModeRoutine(_entryMode);
	_problem.showLastStep();
    selectKeyboardTarget(opEntry);
}

swapButton.addEventListener("click", showSwapConfig);
operationButton.addEventListener("click", showOpConfig);
substitutionButton.addEventListener("click", showSubstConfig);
combinationButton.addEventListener("click", showCombConfig);

opEntry.addEventListener("click", selectKeyboardTargetEvent);

/*
TODO : penser à supprimer si ça ne sert pas
unknownsEntry.addEventListener("keyup", validateKeyUnknownsEntry);
unknownsSubmit.addEventListener("click", validateUnknownsEntry);

lineEntry.addEventListener("keyup", validateKeyLineEntry);
lineSubmit.addEventListener("click", validateLineEntry);

validateButton.addEventListener("click", validateSystem); 

*/

swapSubmit.addEventListener("click", executeSwap);
opSubmit.addEventListener("click", executeOp);
substSubmit.addEventListener("click", executeSubst);
combSubmit.addEventListener("click", executeComb);

eraseOpEntryButton.addEventListener("click", (e) => {
    opEntry.value = "";
})

function noresponse() {};

function typesetMathjax(elementlist, response=noresponse) {
	MathJax.typesetPromise(elementlist).then(() => {
		response();
		console.log("MathJax 3 has typeset the element " + elementlist);
	}).catch((err) => console.error("Error typesetting MathJax:", err));
}
// - fonctions relatives à l'utilisation du clavier virtuel

function oldtypesetMathjax(elementlist) {
	MathJax.Hub.Queue(["Typeset", MathJax.Hub].concat(elementlist));
}
    

function selectKeyboardTargetEvent(event) {
    selectKeyboardTarget(event.target);
    if (mobileMode) {
        event.stopPropagation();
    }
}

function selectKeyboardTarget(target) {
    console.log("Selecting target", target);
    let potentialTargets = document.querySelectorAll(".math-entry");
    potentialTargets.forEach(elem => {
        if (elem==target) {
            target.dataset.selected="1";
        } else {
            elem.dataset.selected="0";
        }
    });
    keyboardTarget = target;
    target.focus();
}

function opKbdPress(event) {
    if (event.currentTarget.dataset.value=="D") {
        keyboardTarget.value = keyboardTarget.value.slice(0, -1);
    } else {
        keyboardTarget.value = keyboardTarget.value + event.currentTarget.dataset.value;
    }
    keyboardTarget.focus();
}

for (let i=0; i<virtualKbdButtons.length; i++) {
	virtualKbdButtons[i].addEventListener("click", opKbdPress);
}

combLine.addEventListener("change", updateCombLabels);

/*
TODO : s'en débarrasser
window.addEventListener("resize", function(e) {
		
        alert(window.getComputedStyle(document.getElementById("main-div")).height); 
        document.body.style["height"]="101%"; 
        console.log(window.getComputedStyle(document.getElementById("main-div")))})

document.addEventListener("fullscreenchange", function(e) {alert("resize"); document.body.style.zoom=2.00000001})

document.body.addEventListener("resize", function(e) {alert("resize"); document.body.style.zoom=1.00000001})
*/

// Définition des callbacks


function decreaseFontSize(e) {
    _fontScale /= 1.1;
    resolutionSteps.style["font-size"] = (_fontScale | 0) + "%";
    //typesetMathjax([solveDiv]);
    // document.querySelector(".step-sys").forEach(function(e) {typesetMathjax([e);})
}


function increaseFontSize(e) {
    _fontScale *= 1.1;
    resolutionSteps.style["font-size"] = (_fontScale | 0) + "%";
    //typesetMathjax([solveDiv]);
}

var fullscreenMode = false;

/* D'après https://www.w3schools.com/howto/howto_js_fullscreen.asp */
function switchFullscreenMode(e) {
	console.log("Requesting full screen.");
    let elem = document.documentElement;

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
        console.log("Switching to fullscreen mode.");
        switchFullscreenButton.dataset.state = "1";
    } else {  
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        console.log("Switching out of fullscreen mode.");
        switchFullscreenButton.dataset.state = "0";
    }
}

/* fonction: newSystem(e)
Lance la saisie d'un nouveau système. Est activé au départ et par appui sur la touche */

const newConf = "Ceci effacera le système en cours de saisie ou de résolution. Continuer néanmoins ?"

function newSystem(e) {
    if (confirm(newConf)) {
        executeNewSystem();
    }
}

function executeNewSystem() {
	/* On efface tout. */
    _unknowns = [];
    _problem = null;
    _lineId = 0;
    _nLines = 0;

    for (let i in _lines) {
        let target = document.getElementById("input-line-" + i);
        clear(target);
    }
    _lines = [];

    collapseConfigs(-1);

    setActionButtonDisabled(true);

}

function setActionButtonDisabled(value) {
	for (let b of [swapButton, operationButton, substitutionButton, combinationButton]) {
		b.disabled = value;
	}
}

/* fonction(callback): switchManual(evenement)
Bascule l'affichage du mode d'emploi */
function switchManual(e) {
    console.log("Manual requested.");
    
    if (manualShow) {
        console.log("Hiding iframe.");
        // manualDiv.classList.add("hide");
	hide(manualDiv);
        manualShow = false;
        switchManualButton.dataset.state = "0";
        // manualResizeButton.classList.add("hide");
	hide(manualResizeButton);
	    hide(paneScrollbar);

    } else {
        manualChoice.classList.remove("hide");
    }
}

function showManualFrame(e) {
    console.log("Showing iframe.");
    manualDiv.classList.remove("hide");
    manualShow = true;
    switchManualButton.dataset.state = "1";
    manualChoice.classList.add("hide");
    manualResizeButton.classList.remove("hide");
    
}

function showManualTab(e) {
    window.open("mode_d_emploi/index.html", '_blank').focus();
    manualChoice.classList.add("hide");
}

var resizeScrollbarVisible = false;

function toggleResizeScrollbar(e) {
    if (resizeScrollbarVisible) {
        paneScrollbar.classList.add("hide");
        manualResizeButton.dataset.state = 0;
        resizeScrollbarVisible = false;
    } else {
        paneScrollbar.classList.remove("hide");
        manualResizeButton.dataset.state = 1;
        resizeScrollbarVisible = true;
    }
}

/* fonction(callback): validateKeyUnknownsEntry(evenement)
Touche "entrée" dans le champ de saisie des inconnues */
function validateKeyUnknownsEntry(e) {
    if(e && e.keyCode == 13) {
        validateUnknownsEntry();
    }
}

/* fonction(callback): validateUnknownsEntry(evenement)
Bouton 'Valider' de la saisie des inconnues 
TODO voir si ça sert encore*/
function validateUnknownsEntry(e) {
    // TODO déplacer le cadre d'erreur au bon endroit
    moveErrorDivTo(unknownsErrorContainer);

    let input = unknownsEntry.value; // récupération de la saisie
    let unknowns = input.match(/\S+/g) || []; // conversion en tableau

    if (unknowns.length < 2) {
        raosError("Saisir au moins deux noms d'inconnues.");
        unknownsEntry.focus();
        return;
    }

    let listText = ""; //préparation de l'affichage

    // On passe en revue chaque inconnue saisie
    for (let i = 0; i < unknowns.length; i++) {
        unknowns[i] = TeXify(unknowns[i]); // normalisation
        if (!validateUnknown(unknowns[i])) { // test de conformité
            raosError("Nom de variable illicite '" + unknowns[i] + "'.");
            unknownsEntry.focus();
            return;
        }
        listText += "\\(" + unknowns[i] + "\\)\ "; // ajouter à la chaîne d'affichage
    }

    unknowns.push(""); // ajout de l'inconnue vide pour les termes constants

    _unknowns = unknowns;

    // passage à la prochaine étape
    unknownsDiv.style.display="none";
    linesDiv.style.display="block";

    lineEntry.focus();

    unknownListDisplay.innerHTML = listText;
    typesetMathjax([ unknownListDisplay]);
}

/* fonction(callback): validateKeyLineEntry(evenement)
*/
function validateKeyLineEntry(e) {
    if(e && e.keyCode == 13) {
        validateLineEntry();
    }
}

/* fonction(callback): validateLineEntry(evenement)
*/
function validateLineEntry() {

    // déplacer la fenêtre d'erreur au bon endroit
    moveErrorDivTo(lineErrorContainer);

    // Récupération de la saisie
    let input = lineEntry.value;
    let data = null;
    let leftContent = null;
    let rightContent = null;
    try {
        // On tente de parser la saisie
        data = parseLinEq(parse(tokenize(input)), _unknowns)

        // le résultat doit contenir exactement deux membres
        if (data.length != 2) {
            throw("L'expression saisie n'est pas une équation bien formée (nécessite exactement <b>un</b> signe '=').");
        }

        // Reste à les formater
        leftContent = TeXifyPart(data[0], _unknowns);
        rightContent = TeXifyPart(data[1], _unknowns);
    } catch(e) {
        // Mais il a pu y avoir des erreurs
        raosError(e);

        // Peut-être y a-t-il des maths dans l'affichage
        typesetMathjax([ errorMessage]);

        // Comme il y a eu erreur, on quitte dès à présent
        return;
    }

    // Il n'y a pas eu d'erreur. Continuons :

    // Stockage des données brutes dans la ligne temporaire
    let id = _lineId; // pour utiliser la valeur actuelle dans le callback suivant
    _lineId++;
    _lines[id] = data;

    // Création de l'affichage
    let line = document.createElement("tr");
    line.setAttribute("class", "input");
    line.setAttribute("id", "input-line-" + id);

    let left = document.createElement("td");
    left.setAttribute("class", "eqn-left");
    left.innerHTML = "\\(" + leftContent + "\\)";

    let eq = document.createElement("td");
    eq.setAttribute("class", "eqn-equal");
    eq.innerHTML = "\\(=\\)";

    let right = document.createElement("td");
    right.innerHTML = "\\(" + rightContent + "\\)";
    right.setAttribute("class", "eqn-right");

    let suppress = document.createElement("td");
    suppress.setAttribute("class", "line-suppr");
    let suppressButton = document.createElement("button");
    // ???????????
    //suppressButton.innerHTML = "🞬";
    suppressButton.addEventListener("click", function (e) {removeSystemLine(id);});
    suppress.appendChild(suppressButton);


    line.append(left);
    line.append(eq);
    line.append(right);
    line.append(suppress);

    // Finalement, l'affichage
    lineInputTable.appendChild(line);

    // Et là il y a forcément des maths à rendre
    typesetMathjax([left,  eq, right]);

    // La saisie était valide, on nettoie le champ de saisie (et
    // on lui redonne l'antenne au passage).
    resetLineInput();
}

function resetLineInput() {
    lineEntry.value = "";
    lineEntry.focus();
}

function removeSystemLine(id) {
    delete _lines[id];
    let target = document.getElementById("input-line-"+id);
    clear(target);
    lineEntry.focus();
}


function setCombEntry(i, target) {
	let line = document.getElementById("comb-entry-line-"+i);
    let subscript = document.getElementById("comb-end-sub-"+i);
    line.setAttribute("data-target", (i==target));
    subscript.innerHTML = 1*target+1;
}

var mobileMode=false;

function setEntryMode() {
    if (mobileMode) {
        console.log("Switching to computer mode.");
        mobileMode = false;
        switchMobileModeButton.dataset.state="0";
        // cache le clavier
        virtualKeyboard.classList.add("hide");
    } else {
        console.log("Switching to mobile mode.");
        mobileMode = true;
        switchMobileModeButton.dataset.state="1";
        // affiche le clavier
        virtualKeyboard.classList.remove("hide");
    }
    document.querySelectorAll(".math-entry").forEach(e => {e.dataset.mobile = mobileMode; e.readOnly=mobileMode});
    //force le réaffichage, y compris du clavier virtuel, si nécessaire
    collapseConfigs(activeOperationMode);
    keyboardTarget.focus();
}

// §§§§§§§§§§§§§
function getCombEntryValue(e) {
    keyboardTarget = e;
    /*
    let target = e.target.id.slice(12);
    let value = prompt("");
    if (value) {
        document.getElementById("comb-entry-"+target).value = value;
        e.target.innerHTML=value;
    }*/
}

// §§§§§§§§§§§§§
function getOpEntryValue(e) {
    let value = prompt("");
    if (value) {
        opEntry.value = value;
        e.target.innerHTML=value;
    }
}

// §§§§§§§§§§§§§§§§§§§§§§§§
function setEntryModeRoutine(touch) {
    console.log("SHOULD NOT BE CALLED!");
    let entries = document.getElementsByClassName("comb-entry");
    let buttons = document.getElementsByClassName("comb-alt-entry");
    for (let i=0; i<_nLines; i++) {
        if (touch) {
            buttons[i].innerHTML = entries[i].value; 
        }
    }
    if (touch) opAltEntry.innerHTML=opEntry.value;

    switchMobileModeButton.setAttribute("data-state", touch ? "1" : "0");
    //modeKeyboard.setAttribute("data-state", touch ? "0" : "1");
    _entryMode = touch;
}

function setupResolutionEnvironment() {
	// vidange du tableau des étapes

    clearChildren(resolutionSteps);

    // vidange des listes déroulantes de choix de ligne
    while (swapLine.length >  0) swapLine.remove(0);
    while (opLine.length > 0) opLine.remove(0);
    while (substLine.length > 0) substLine.remove(0);
    while (combLine.length > 0) combLine.remove(0);

    // remplissage des listes déroulantes
    // TODO : faire double boucle
    for (let selector of [swapLine, opLine, substLine, combLine]) {
	    for (let i=0; i<_nLines; i++) {
	        let o = new Option("ℓ"+subScript(i+1), i);
	        selector.add(o);
	    }
    }

    // vidange du tableau de coefficients
    clearChildren(combCoefTable);
    //reconstruction du tableau des coefficients
    for (let i=0; i<_nLines; i++) {
        let coefLine = document.createElement("tr");
        coefLine.setAttribute("id", "comb-entry-line-"+i);
		coefLine.setAttribute("class", "comb-entry-line");
        
        coefLine.innerHTML = 
        	"<td>&ell;<sub>"+(i+1)+"</sub>&nbsp;&larr;&nbsp;&ell;<sub>"
        	+(i+1)+"</sub>&nbsp;</td>"
        	+"<td id='comb-end-"+i+"' class='comb-end'>"
        	+"&plus;&nbsp;<input type='text' id='comb-entry-"+i
        	+"' class='comb-entry math-entry' data-selected=0/>"
            +"&nbsp;&times&nbsp;&ell;"
        	+"<sub id='comb-end-sub-"+i+"'>1</sub></td>";

        combCoefTable.appendChild(coefLine);

        setCombEntry(i, 0);
    }
    document.querySelectorAll('.comb-entry').forEach(e => e.addEventListener("click", selectKeyboardTargetEvent));
    setActionButtonDisabled(false);

}

function validateSystem(e) {
    moveErrorDivTo(validateErrorContainer);
    let nLines = 0;
    for (let i=0; i<_lines.length; i++) {
        if (_lines[i]) nLines++;
    }
    if (nLines < 2) {
        raosError("Il faut au moins deux lignes dans le système.");
        return;
    }

    // Tout est bon, on passe à la résolution

    _nLines = nLines;

    setupResolutionEnvironment();
    
    // création du problème de départ
    // - le système de départ
    let system = new System();

    // - que l'on peuple progressivement avec les lignes saisies
    for (let i=0; i<_lines.length; i++) {
        if (_lines[i]) {
            let line = new Line(new Part(_lines[i][0]), new Part(_lines[i][1]));
            system.addLine(line);
        }
    }



    _problem = new Problem(system);
    _problem.showLastStep();

}

/*
EXECUTION DES ACTIONS
*/

/*  fonction(callback): executeSwap(evenement)
    Réalise l'échange des membres de la ligne sélectionnée */

function executeSwap(e) {
    // récupère la ligne sélectionnée, convertie en nombre
    let lNo = 1 * swapLine.value;
    let step = _problem.cloneLastStep(STYPE.SWAP, lNo+1);
    let line = step.system.lines[lNo];
    let temp = line.left;
    line.left = line.right;
    line.right = temp;
    _problem.showLastStep();
    collapseConfigs(-1);
}

/* executeOp et les utilitaires associés */

const opButtons = {
    "+": document.getElementById("op-add"),
    "-": document.getElementById("op-sub"),
    "*": document.getElementById("op-mul"),
    "/": document.getElementById("op-div"),
    active: "+"
};

function switchOpButton(op) {
    for (let i=0; i<4; i++) {
        let c = "+-*/"[i];
        opButtons[c].setAttribute("data-selected", c==op ? "true" : "false");
    }
    opButtons.active = op;
}

switchOpButton("+");

for (var i=0; i<4; i++) {
    const c = "+-*/"[i];
    var d = c; // TODO ça sert à quelque chose, ça ?
    opButtons[c].addEventListener("click", function(e) {switchOpButton(c);});
}

function executeOp(e) {
    moveErrorDivTo(opErrorContainer); // on prépare l'affichage des erreurs
    let lNo = 1 * opLine.value; // récupération de la ligne à modifier
    let operand;
    try {
        // récupération et digestion de l'expression à utiliser
        operand = parseLinEq(parse(tokenize(opEntry.value)), _unknowns);
    } catch(e) {
        // s'il y a eu erreur, on affiche
        raosError(e);
        return;
    }
    if (operand.length > 1) {
        // il y a trop d'éléments dans le résultat de la digestion ?
        // quelqu'un a saisi un signe "="
        raosError("Saisir une expression sans signe égal.");
        return;
    }
    // on récupère le terme digéré
    operand = operand[0];
    if (operand.length == 0) { // il pourrait être vide, c'est interdit
        raosError("Saisie vide.");
        return;
    }
    // pour une multiplicatioon ou une division, il y a beaucoup de vérifications à faire
    if (opButtons.active=="*" || opButtons.active=="/") {
        if (operand.length>1 || operand[0].base != "") { // la saisie n'est pas une constante
            raosError("Pour multiplication et division, l'expression saisie doit être un nombre.");
            return;
        }
        let value = operand[0].value;
        if (value.isNull()) {
            raosError("Multiplication et division par 0 interdites.");
            return;
        }
        let data = {line:lNo+1, op:opButtons.active, value:value.shortTeX("")};
        if (opButtons.active == "/") {
            value = value.inv();
        }
        let step = _problem.cloneLastStep(STYPE.OPERATION, data);
        let line = step.system.lines[lNo];
        for (let u of _unknowns) {
            line.left.coefs[u] = line.left.coefs[u].mul(value);
            line.right.coefs[u] = line.right.coefs[u].mul(value);
        }
        _problem.showLastStep();
    } else { // c'est plus simple pour une somme ou une soustraction
        let data = {line:lNo+1, op:opButtons.active, value:TeXifyPart(operand)};
        let step = _problem.cloneLastStep(STYPE.OPERATION, data);
        let line = step.system.lines[lNo];
        if (opButtons.active == "+") {
            for (let o of operand) {
                line.left.coefs[o.base] = line.left.coefs[o.base].add(o.value);
                line.right.coefs[o.base] = line.right.coefs[o.base].add(o.value);
            }
        } else {
            for (let o of operand) {
                line.left.coefs[o.base] = line.left.coefs[o.base].sub(o.value);
                line.right.coefs[o.base] = line.right.coefs[o.base].sub(o.value);
            }
        }
        _problem.showLastStep();
    }
    collapseConfigs(-1);
    opEntry.value = "";
}

/* executeSubst */

function executeSubst(e) {

    moveErrorDivTo(substErrorContainer);

    let lNo = substLine.value;

    // le terme de gauche est-il une inconnue unique ?

    let nZeroCount = 0;
    let line = _problem.lastStep().system.lines[lNo];
    let target;
    for (let u of _unknowns) {
        if (!line.left.coefs[u].isNull()) {nZeroCount++; target=u;}
    }

    if (nZeroCount > 1
            || nZeroCount == 0
            || target==""
            || !line.left.coefs[target].isOne()
            || !line.right.coefs[target].isNull()) {
        raosError("Ne permet pas une substitution.");
        return;
    }

    var data = {target:target, value:line.right.TeX()};
    let step = _problem.cloneLastStep(STYPE.SUBSTITUTION, data);
    let lines = step.system.lines;

    for (let i=0; i<step.system.lines.length; i++) { // on parcourt chaque ligne
        if (i != lNo) { // si ce n'est pas celle qui sert à la substitution
            for (let u of _unknowns) { // pour chaque inconnue
                if (u !=target) {
                    let coef = lines[lNo].right.coefs[u];
                    lines[i].left.coefs[u] = coef.mul(lines[i].left.coefs[target]).add(lines[i].left.coefs[u]);
                    lines[i].right.coefs[u] = coef.mul(lines[i].right.coefs[target]).add(lines[i].right.coefs[u]);
                }
            }
            lines[i].left.coefs[target] = DecimalFraction(0);
            lines[i].right.coefs[target] = DecimalFraction(0);
        }
    }
    _problem.showLastStep();
    collapseConfigs(-1);
}

// §§§§§§ pourquoi setcombentry 
// Reprendre : arreter de multiplier les querys ? homogébéiser : query ou elementbyid
function updateCombLabels(e) {
	let target = combLine.value;
	for (let i=0; i<_nLines; i++) {
		setCombEntry(i, target);
	}
    if (document.getElementById("comb-entry-" + target) == keyboardTarget) {
        if (target=="0") {
            selectKeyboardTarget(document.querySelector("#comb-entry-1"));
        } else {
            selectKeyboardTarget(document.querySelector("#comb-entry-0"));
        }
    }
    keyboardTarget.focus();

}

function executeComb(e) {
	moveErrorDivTo(combErrorContainer);
	let target = combLine.value;
	let coefs = new Object();
	let i;
	try {
		for (let i=0; i<_nLines; i++) {
			if (i != target) {
				let entry = document.getElementById("comb-entry-"+i).value;
				let data = parseLinEq(parse(tokenize(entry)), [""]);
				if (data.length > 1) {
					raosError("Saisie non constante ligne "+(i+1));
					return;
				}
				data = data[0];
				if (data.length > 1) {
					// ne devrait pas avoir lieu
					raosError("Saisie non constante ligne "+(i+1));
					return;
				}
				if (data.length==0) {
					coefs[i]= new DecimalFraction(0);
				} else {
					coefs[i]=data[0].value;	
				}
				
			}
		}
	} catch (e) {
		raosError(e+" (ligne "+(i+1)+")");
		return;
	}

	let data = {line:target, coefs:coefs};
	let step = _problem.cloneLastStep(STYPE.COMBINATION, data);
	let targetLine = step.system.lines[target];
	for (let i=0; i<_nLines; i++) {
		if (i != target) {
			for (let o of _unknowns) {
				step.system.lines[i].left.coefs[o] = 
					step.system.lines[target].left.coefs[o].mul(coefs[i]).add(
						step.system.lines[i].left.coefs[o]);
				step.system.lines[i].right.coefs[o] = 
					step.system.lines[target].right.coefs[o].mul(coefs[i]).add(
						step.system.lines[i].right.coefs[o]);
			}
		}
	}
	_problem.showLastStep();
    collapseConfigs(-1);
    for (let i=0; i<_nLines; i++) {
        document.getElementById("comb-entry-"+i).value = "";
    }
}


function collapseOneConfig(div, show) {
	if (show) {
        div.classList.remove("hide");
		div.scrollIntoView();
	} else {
        div.classList.add("hide");
    }
}

var activeOperationMode = null;

function collapseConfigs(code=-1) {
    collapseOneConfig(swapContainer, code==0);
    collapseOneConfig(opContainer, code==1);
    collapseOneConfig(opKeyboard, ((code==1)||(code==3))&&mobileMode);
    collapseOneConfig(substContainer, code==2);
    collapseOneConfig(combContainer, code==3);
    activeOperationMode = code;
}

/*
INVOCATION DES ACTIONS
*/

function showSwapConfig() {
    collapseConfigs(0);
}

function showOpConfig() {
    console.log("Entering operation mode.");
    enableKeyboardUnknowns(true);
    moveKeyboardTo(opKeyboard);
    collapseConfigs(1);
    selectKeyboardTarget(opEntry);
}

function showSubstConfig() {
    collapseConfigs(2);
}

//!!!!
function showCombConfig() {
    console.log("Entering substitution mode.");
    enableKeyboardUnknowns(false);
    moveKeyboardTo(combKeyboard);
    collapseConfigs(3);
    if (combLine.value==0) {
        selectKeyboardTarget(document.querySelector("#comb-entry-1"));
    } else {
        selectKeyboardTarget(document.querySelector("#comb-entry-0"));
    }
}

// affichage des erreurs
function moveErrorDivTo(target) { // déplacement du conteneur au bon endroit
    if (errorMessage.parentNode) {
        errorMessage.parentNode.classList.add("hide");
    	//errorMessage.parentNode.style.display = "none";
        errorMessage.parentNode.removeChild(errorMessage);
    }
    target.appendChild(errorMessage);
	target.classList.add("hide");
}

function moveKeyboardTo(target) {
    if (virtualKeyboard.parentNode) {
    	//virtualKeyboard.parentNode.style.display = "none";
        virtualKeyboard.parentNode.classList.add("hide");
        virtualKeyboard.parentNode.removeChild(virtualKeyboard);
    }
    target.appendChild(virtualKeyboard);
    virtualKeyboard.parentNode.classList.remove("hide");
}

let timeoutId = 0;

function raosError(message) { // affichage du message
    console.log("Erreur : "+message);
    errorMessage.innerHTML = '<b>Erreur : </b> <i>' + message + '</i>';
    typesetMathjax([errorMessage]);
    // On fait apparaitre le message d'erreur et on l'inscrit
    // pour disparition dans 6 secondes
    errorMessage.parentNode.classList.remove("hide");
    errorMessage.scrollIntoView();
    clearTimeout(timeoutId); // supprimer une erreur précédente pas encore disparue
    timeoutId = setTimeout(function() {errorMessage.parentNode.classList.add("hide");}, 4000);
}

// Structure des données

function cloneObject(o) {
    let newO = new Object();
    for (let key in o) {
        newO[key] = o[key].clone();
    }
    return newO;
}

function Part(data) { // membre d'une équation
    this.coefs = new Object(); // objet pour regrouper les coefs des inconnues
    for (let i=0; i<_unknowns.length; i++) { // que l'on initialise à 0
        this.coefs[_unknowns[i]] = new DecimalFraction(0);
    }
    for (let i=0; i<data.length; i++) { // puis que l'on met à jour avec les valeurs fournies dans data
        this.coefs[data[i].base] = data[i].value;
    }

    this.clone = function() {
        let newPart = new Part([]);
        newPart.coefs = cloneObject(this.coefs);
        return newPart;
    }

    this.TeX = function() {
        let outString = "";
        for (let i=0; i<_unknowns.length; i++) {
            let coef = this.coefs[_unknowns[i]];
            if (!coef.isNull()) {
                outString += coef.TeX(_unknowns[i]);
            }
        }
        if (outString == "") {
            return "0";
        } else
        if (outString[0] == "+") {
            return outString.slice(1);
        }
        return outString;
    }
}

function Line(left, right) {
    this.left = left;
    this.right = right;

    this.clone = function() {
        return new Line(this.left.clone(), this.right.clone());
    }
}

function System() {
    this.lines = [];

    this.addLine = function(line) {
        this.lines.push(line);
    }

    this.clone = function() {
        let newSystem = new System();
        for (let i=0; i<this.lines.length; i++) {
            newSystem.addLine(this.lines[i].clone());
        }
        return newSystem;
    }
}

const STYPE = {
    INITIAL: 0,
    OPERATION: 1,
    SUBSTITUTION: 2,
    COMBINATION: 3,
    DEVELOPEMENT: 4,
    REDUCTION: 5,
    SWAP: 6,
}

const opName = {
    "+" : "addition de",
    "-" : "soustraction de",
    "*" : "multiplication par",
    "/" : "division par"
}

function Step(system, type, data, id) {
    this.system = system;
    this.type = type;
    this.data = data;
    this.id = id;

    this.clone = function() {
        return new Step(this.system.clone(), 0, 0, 0)
    }

    this.show = function() {
        var tr = document.createElement("tr");
        tr.setAttribute("id","step-"+this.id);
        tr.className += " step-row";
        var id_td = document.createElement("td");
        id_td.setAttribute("class", "step-id");
        id_td.setAttribute("id", "step-id-"+this.id);
        var sys_td = document.createElement("td");
        sys_td.setAttribute("class", "step-sys");
        var comment_td = document.createElement("td");
        comment_td.setAttribute("class", "step-comment");

        // Numérotation
        id_td.innerHTML = "" + (this.id+1) + ".";

        // Système
        var data = this.data;
        var system = this.system;
        var line;
        var systemText = "\\(\\left\\{\\begin{array}{rcl|l}\n";
        for (var i=0; i<system.lines.length; i++) {
            line = system.lines[i];
            systemText += line.left.TeX() + " & = & " + line.right.TeX() + " & \\ell_{" + (i+1) + "}";
            if (this.type == STYPE.COMBINATION) {
                systemText += "\\leftarrow\\ell_{" + (i+1) + "}";
                if (!(data.line == i || data.coefs[i].isNull())) {
                	systemText += data.coefs[i].TeX("\\ell") + "_{" + (1*data.line+1) + "}";
                }
            }
            systemText += "\\\\\n";
        }
        systemText += "\\end{array}\\right.\\)";
        sys_td.innerHTML = systemText;

        // Commentaire
        switch (this.type) {
            case STYPE.INITIAL:
                comment_td.innerHTML = "Système initial.";
                tr.className += " initial"; // TODO classList.add n'est pas mieux ?
                break;
            case STYPE.SWAP:
                comment_td.innerHTML = "Échange des deux membres de la ligne &ell;<sub>" + this.data + "</sub>.";
                break;
            case STYPE.OPERATION:
                comment_td.innerHTML = "Ligne " + data.line + "&nbsp;: "
                    + opName[data.op] + " \\(" + data.value + "\\).";
                break;
            case STYPE.SUBSTITUTION:
                comment_td.innerHTML = "Substitution de \\(" + data.value + "\\) à \\(" + data.target + "\\).";
                break;
            case STYPE.DEVELOPEMENT:
                comment_td.innerHTML = "Développement (automatique).";
                tr.setAttribute("class", "automatic");
                break;
            case STYPE.REDUCTION:
                comment_td.innerHTML = "Simplification (automatique).";
                tr.setAttribute("class", "automatic");
                break;
            case STYPE.COMBINATION:
                comment_td.innerHTML = "Combinaison linéaire.";
                break;
        }

        id_td.addEventListener("click", removeNextSteps);

        tr.appendChild(id_td);
        tr.appendChild(sys_td);
        tr.appendChild(comment_td);

        resolutionSteps.append(tr);

	// TODO URGENT : corriger la ligne ci-dessous !
        typesetMathjax([tr], function() {tr.scrollIntoView();});
    }
}

function removeNextSteps(e) {
    if (confirm("Effacer les étapes suivantes ?")) {
    	let target = e.target.id.slice(8);
    	while (_problem.stepCount-1 > target) {
    		_problem.stepCount--;
    		clear(document.getElementById("step-"+_problem.stepCount));
	}
    }
}

function Problem(system) {
    this.stepCount = 0;
    this.steps = [new Step(system, STYPE.INITIAL, null, this.stepCount)];
    this.stepCount++;

    this.addStep = function(step) {
        this.steps[this.stepCount] = step;
        this.stepCount++;
    }

    this.showLastStep = function() {
        this.steps[this.stepCount-1].show();
    }

    this.cloneLastStep = function(type, data) {
        let newStep = this.steps[this.stepCount-1].clone();
        newStep.data = data;
        newStep.type = type;
        newStep.id = this.stepCount;
        this.steps[this.stepCount]=newStep;
        this.stepCount++;
        return newStep;
    }

    this.lastStep = function() {
        return this.steps[this.stepCount-1];
    }
}


// indices pour listes de sélection

let unicodeSubScripts = "₀₁₂₃₄₅₆₇₈₉";

function subScript(n) {
	let out = subScriptRoutine(n);
	return out=="" ? "0" : out;
}

function subScriptRoutine(n) {
    if (n==0) {
            return "";
    } else {
        // TODO : pourquoi 'true' en deuxième argument ?
        return subScriptRoutine(Math.floor(n/10), true) + unicodeSubScripts[n % 10];
    }
}

const newShort = "Saisissez le système ci-dessous, en séparant les lignes d'un point-virgule."


function fastInput(input) {
    collapseConfigs();
    // quickStart.style.display = "none";
	if (input===null) {
		return;
	}
	let unknowns = [];
	let data = [];
	try {
		let inputArray = input.split(";");
		if (inputArray.length==0) {
			throw("saisie vide");
		}
		if (inputArray.length==1) {
			throw("une seule ligne");
		}
		for (let i=0; i<inputArray.length; i++) {
			data.push(parseLinEq(parse(tokenize(inputArray[i]))));	
		}
		for (let i=0; i<data.length; i++) {
			let line = data[i];
			if (line.length != 2) {
				throw("ligne "+(i+1)+" mal formée : trop ou trop peu de signes '='");
			}
			for (let j=0; j<2; j++) {
				let part = line[j];
				for (let k=0; k<part.length; k++) {
					if (part[k].base != "" && !includes(unknowns, part[k].base)) {
						unknowns.push(part[k].base);
					} 
				}
			}
		}
	} catch(e) {
		alert("La saisie n'est pas correcte ("+e+").");
		return;
	}

	_unknowns = unknowns;
	_unknowns.push("");
	_nLines = data.length;

	let system = new System();
	for (let i=0; i<data.length; i++) {
		let line = new Line(new Part(data[i][0]), new Part(data[i][1]));
		system.addLine(line);
	}

	_problem = new Problem(system);

	let virtualKbdRows = [];
	
	for (let j=0; j<4; j++) {
		virtualKbdRows.push(document.getElementById("virtual-kbd-row-" + j));
	}

	console.log(_unknowns);

    // suppression des boutons "inconnues" du clavier virtuel
    document.querySelectorAll(".virtual-kbd-var").forEach( n => n.remove() );

    // creation des boutons "inconnues" du clavier virtuel
	let i=0;
	for (let j=0; j<_unknowns.length; j++) {
		let name = _unknowns[j];
		if (name != "") {
			console.log("creating key for unknown '" + name + "'.");
			let button = document.createElement("button");
			button.classList.add("virtual-kbd");
			button.classList.add("virtual-kbd-var");
			button.id = "unknown-" + name;
			button.innerHTML = "\\("+name+"\\)";
            button.dataset.value = name;
            button.addEventListener("click", opKbdPress);
			let item = document.createElement("td");
			item.appendChild(button);
			virtualKbdRows[i%4].appendChild(item);
			typesetMathjax(button);
			i++;
		}
	}
	
	setupResolutionEnvironment();
    setEntryModeRoutine(_entryMode);
	_problem.showLastStep();
    selectKeyboardTarget(opEntry);
}

function enableKeyboardUnknowns(mode) {
    console.log("Enabling unknowns buttons : ", mode);
    document.querySelectorAll(".virtual-kbd-var").forEach( n => mode ? n.classList.remove("hide") : n.classList.add("hide") );
}



setActionButtonDisabled(true);
setEntryModeRoutine(false);

const urlParams = new URLSearchParams(window.location.search);
const urlData = urlParams.get('sys');

if (urlData) {
    fastInput(urlData);
}


//  - au démarrage, charger le mode d'emploi et le cacher
manualDiv.innerHTML = '<iframe id="manual-iframe" src="mode_d_emploi/index.html" style="width:100%; height:100%;" />'
manualDiv.classList.add("hide");

//  - initialisation de la bascule du mode d'emploi

let manualShow = false;

