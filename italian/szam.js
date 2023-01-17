/**
 * index	név
 * 0 -20	ugyanaz
 * 21-27	30 - 100 step 10
 * 28-29	1 000: egyes, többes szám
 * 30-31	1 000 000: egyes, többes szám
 * 32-33	1 000 000 000: egyes, többes szám
 * Checkarray: for (i=0;i<=33;i++) {alert(i + ": " + szamok[i])}
 */
var szamok = ["","uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci","undici","dodici","tredici","quattordici","quindici","sedici","diciasette","diciotto","diciannove","venti","trenta","quaranta","cinquanta","sessanta","settanta","ottanta","novanta","cento","mille","mila","millione","milioni","miliardo","miliardi"];
function Kiszamol(szam) {
	if (parseInt(szam) == 0) return "";
	var szamki = "";
	var szazasok = "";
	var ezresek = "";
	var milliosok = "";
	var milliardosok = "";
	var sorszam = false;
	//nullákat leszedi az elejéről
	while (szam.substring(0, 1) == "0") {
		szam = szam.substring(1);
	}
	//sorszám 1.
	if (szam.substring(szam.length - 1, szam.length) == "."
		|| szam.substring(szam.length - 1, szam.length) == "o") {
			sorszam = true;
			szam = szam.substring(0, szam.length - 1);
	}
	//tízes+egyes
	if (szam.length>=1) {
		var TE = szam.substring(szam.length-2,szam.length)
		E=TE.substring(1,2)
		if (TE.substring(0,1)==0) {TE=E}
		if (TE<=20) {szamki = szamok[parseInt(TE)]}
		for (i=2;i<=9;i++) {
			k = 20+i-2
			if (TE>=20 && TE.substring(0,1)==i) {szamki = ((E==1 || E==8)?szamok[k].substring(0,szamok[k].length-1):szamok[k]) + szamok[parseInt(E)]}
		}
	}
	//százas
	if (szam.length>=3) {
		var S = szam.substring(szam.length-3,szam.length-2)
		if (S>0) {szazasok = ((S==1)?"":szamok[S]) + szamok[28]}
		if (szazasok) {((TE.substring(0,1)==1 || TE.substring(0,1)==8)? szamki = szazasok.substring(0,szazasok.length-1) + szamki:szamki = szazasok + szamki)}
	
	}
	TSE = szamki //Ha belülről hívta a végén retunrolja
	//ezres (mille, mila)
	if (szam.length>=4) {
		var EZ = szam.substring(szam.length-6,szam.length-3)
		if (parseInt(szam)!=0) {EZ = Kiszamol(EZ)}
		if (EZ!=0) {ezresek = ((EZ==szamok[1])? szamok[29]: EZ + szamok[30])}
		if (ezresek) {((S==8)? szamki = ezresek.substring(0,ezresek.length-1) + szamki:szamki = ezresek + szamki)}
	}
	//hosszabb
	if (szam.length>=7) {szamki="Bocsika, a program csak 999 999-ig képes számolni!"}
	//sorszám 2.
	if (sorszam) {szamki = "<br>Hímnem: <b>" + szamki.substring(0,szamki.length-1) + "esimo</b><br>" + "Nőnem : <b>" + szamki.substring(0,szamki.length-1) + "esima</b>"}
	document.all["szamki"].innerHTML = "<pre>" + "A(z) <i>" + szam + "</i> " + ((sorszam)?"sor":"") + "szám: <b>" + szamki + "</b></pre>"
	return TSE;
}