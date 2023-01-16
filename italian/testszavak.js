var volt = new Array(jo.length);
var l = 0;
function check(oj) {
	var i = parseInt(oj.name.substring(1));
	var ok = jovalasz(i, oj.value.toLowerCase());
	oj.style.backgroundColor = ok? "00F000" : "FF0000";
	if (ok && !volt[i]) {
		l++;
	}
	volt[i] = true;
	window.status = l + " / " + (jo.length - 1) + " jó válaszod van.";
}
function jovalasz(index, value) {
	var x = jo[index];
	var ok = x == value; // x instanceof Object eset
	for(i in x) { // x instanceof Array eset
		ok |= x[i] == value;
	}
	return ok;
}
function kitolt() {
	for (var i = 1; i < jo.length; i++) {
		document.all["v" + i].value = jo[i];
	}
}
