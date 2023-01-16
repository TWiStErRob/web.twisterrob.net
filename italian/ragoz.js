ragok = {
	sz : ["E/1", "E/2", "E/3", "T/1", "T/2", "T/3"],
	are : ["o", "i", "a", "iamo", "ate", "ano"],
	ere : ["o", "i", "e", "iamo", "ete", "ono"],
	ire : ["o", "i", "e", "iamo", "ite", "ono"],
	isc : ["isco", "isci", "isce", "isciamo", "iscite", "iscono"]
};
rendhagyók = {
	venire : [["ven", "go"], ["vien", "i"], ["vien", "e"], ["ven", "iamo"], ["ven", "ite"], ["ven", "gono"]],
	salire : [["sal", "go"], ["sal", "i"], ["sal", "e"], ["sal", "iamo"], ["sal", "ite"], ["sal", "gono"]],
	dire : [["dic", "o"], ["dic", "i"], ["dic", "e"], ["dic", "iamo"], ["d", "ite"], ["dic", "ono"]],
	fare : [["facci", "o"], ["fa", "i"], ["f", "a"], ["facc", "iamo"], ["f", "ate"], ["f", "anno"]],
	andare : [["vad", "o"], ["va", "i"], ["v", "a"], ["and", "iamo"], ["and", "ate"], ["v", "anno"]],
	avere : [["h", "o"], ["ha", "i"], ["h", "a"], ["abb", "iamo"], ["av", "ete"], ["h", "anno"]]
};
function outputRagozás(igenév) {
	var szótõ = "";
	var végzõdés = "";
	var eredmény = "Hibás ige!";
	var rendhagyó = igenév.substring(igenév.length - 1, igenév.length) == "*";
	if (rendhagyó) {
		igenév = igenév.substring(0, igenév.length - 1);
	}
	szótõ = igenév.slice(0, igenév.length - 3);
	végzõdés = igenév.slice(igenév.length - 3, igenév.length);
	if(rendhagyó && végzõdés == "ire") végzõdés = "isc";
	eredmény = "";
		for(var i = 0; i < 6; ++i) {
			igeMegRag = rendhagyók[igenév] === undefined?
				szótõ + "<b>" + ragok[végzõdés][i] + "</b>"
				:
				rendhagyók[igenév][i][0] + "<b>" + rendhagyók[igenév][i][1] + "</b>";
			eredmény += ragok.sz[i] + ".: <i>" + igeMegRag + "</i><br>";
	}
	document.all["ragoz"].innerHTML = "A" + (isVowel(igenév.substring(0, 1))?"z":"") + " <i>" + igenév + "</i> ragozása:<br>" + eredmény;
}
function isVowel(letter) {
	var mghk = ["a","e","i","o","u","á","é","í","ó","ú","ö","õ","ü","û"];
	for(x in mghk) {
		if (letter == mghk[x]) {
			return true;
		}
	}
	return false;
}