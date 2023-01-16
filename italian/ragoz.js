ragok = {
	sz : ["E/1", "E/2", "E/3", "T/1", "T/2", "T/3"],
	are : ["o", "i", "a", "iamo", "ate", "ano"],
	ere : ["o", "i", "e", "iamo", "ete", "ono"],
	ire : ["o", "i", "e", "iamo", "ite", "ono"],
	isc : ["isco", "isci", "isce", "isciamo", "iscite", "iscono"]
};
rendhagy�k = {
	venire : [["ven", "go"], ["vien", "i"], ["vien", "e"], ["ven", "iamo"], ["ven", "ite"], ["ven", "gono"]],
	salire : [["sal", "go"], ["sal", "i"], ["sal", "e"], ["sal", "iamo"], ["sal", "ite"], ["sal", "gono"]],
	dire : [["dic", "o"], ["dic", "i"], ["dic", "e"], ["dic", "iamo"], ["d", "ite"], ["dic", "ono"]],
	fare : [["facci", "o"], ["fa", "i"], ["f", "a"], ["facc", "iamo"], ["f", "ate"], ["f", "anno"]],
	andare : [["vad", "o"], ["va", "i"], ["v", "a"], ["and", "iamo"], ["and", "ate"], ["v", "anno"]],
	avere : [["h", "o"], ["ha", "i"], ["h", "a"], ["abb", "iamo"], ["av", "ete"], ["h", "anno"]]
};
function outputRagoz�s(igen�v) {
	var sz�t� = "";
	var v�gz�d�s = "";
	var eredm�ny = "Hib�s ige!";
	var rendhagy� = igen�v.substring(igen�v.length - 1, igen�v.length) == "*";
	if (rendhagy�) {
		igen�v = igen�v.substring(0, igen�v.length - 1);
	}
	sz�t� = igen�v.slice(0, igen�v.length - 3);
	v�gz�d�s = igen�v.slice(igen�v.length - 3, igen�v.length);
	if(rendhagy� && v�gz�d�s == "ire") v�gz�d�s = "isc";
	eredm�ny = "";
		for(var i = 0; i < 6; ++i) {
			igeMegRag = rendhagy�k[igen�v] === undefined?
				sz�t� + "<b>" + ragok[v�gz�d�s][i] + "</b>"
				:
				rendhagy�k[igen�v][i][0] + "<b>" + rendhagy�k[igen�v][i][1] + "</b>";
			eredm�ny += ragok.sz[i] + ".: <i>" + igeMegRag + "</i><br>";
	}
	document.all["ragoz"].innerHTML = "A" + (isVowel(igen�v.substring(0, 1))?"z":"") + " <i>" + igen�v + "</i> ragoz�sa:<br>" + eredm�ny;
}
function isVowel(letter) {
	var mghk = ["a","e","i","o","u","�","�","�","�","�","�","�","�","�"];
	for(x in mghk) {
		if (letter == mghk[x]) {
			return true;
		}
	}
	return false;
}