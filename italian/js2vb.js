var pi= Math.PI
var e = Math.E
var random = rnd(10)
function rnd(szam) {return Math.floor(Math.random()*szam)+1}
function left(szoveg,hossz) {var vissza = szoveg.substring (0, hossz); return vissza;}
function right(szoveg,hossz) {var vissza = szoveg.substring (szoveg.length - hossz, szoveg.length); return vissza;}
function mid(szoveg,start,hossz) {var vissza = szoveg.substring (start-1, start-1+hossz); return vissza;}
function mid2(szoveg,start,end) {var vissza = szoveg.substring (start-1, end); return vissza;}
function len(szoveg) {return szoveg.length;}
function replaceall(szoveg,mit,mire) {return replace(szoveg,mit,mire,-1);}
function replace(szoveg,mit,mire,hanyszor) {
var szamlalo=0
var csereltszoveg = szoveg
var start=0
while (hanyszor!=szamlalo) {
	szamlalo++
	var talalat = csereltszoveg.indexOf(mit)
	csereltszoveg = csereltszoveg.substring (start, talalat) + mire + csereltszoveg.substring (talalat + mit.length, csereltszoveg.length)
	if (csereltszoveg.indexOf(mit)==-1 && hanyszor==-1) break;}
return csereltszoveg;}
function lcase(szoveg) {return szoveg.toLowerCase()}
function ucase(szoveg) {return szoveg.toUpperCase()}
function cstr(szam) {return szam.toString()}
function sqrt(szam) {return Math.sqrt(szam)}
function hatvany(szam,hatvany) {return Math.pow(szam,hatvany)}
function bool(szam) {return szam}
function hex(szam) {return szam}
function dec(szam) {return szam}
function okt(szam) {return szam}
function chr(szam) {return szam}
function str(szoveg) {return szoveg.charCodeAt(0)}
function int(szoveg) {return parseInt(szoveg)}
function float(szoveg) {return parseFloat(szoveg)}

function RegExEx(szoveg,pattern,swiccs) {var RgEx = new RegExp(pattern,swiccs); return RgEx.exec(szoveg);} //Switch: g=global, i=ignore case, gi=both