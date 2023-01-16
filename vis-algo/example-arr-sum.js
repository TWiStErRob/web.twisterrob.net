// @formatter:off
/*
int[] arr = new int[] { input };
long sum = 0;
for (int i = 0; i < arr.length; ++i) {
	sum = sum + arr[i];
}
 */
// @formatter:on

// noinspection JSUnusedGlobalSymbols anonymous function is not allowed, but no-one will call this method
/**
 * @param {Number[]} input
 * @returns {code.Program}
 */
function build(input) {
	var main = function () {
		var arr = new code.VarArray('arr', 'int32');
		var sum = new code.Variable('sum', 'int64');
		var i = new code.Variable('i', 'index');

		var highlighters = {
			sum: {
				loc: code.TRUE,
				value: function () {
					return sum.read().execute();
				},
				highlight: sum
			},
			index: {
				loc: i.read(),
				value: function () {
					return i.read().execute();
				},
				highlight: arr
			},
			value: {
				loc: i.read(),
				value: function () {
					return arr.value[i.value];
				},
				highlight: arr
			}
		};

		function rangeHighlight(startExpr, endExpr, classes) {
			var clz = [];
			for (var i = startExpr.execute(), end = endExpr.execute(); i < end; ++i) {
				clz.push({loc: i, classes: classes});
			}
			return clz;
		}

		var func = new code.Function('main', [], new code.Block(
				arr.define(input),
				new code.MagicDescription("Let's start with an initial sum of 0."),
				sum.define(0),
				new code.MagicDescription("Let's step through each array item.", $.extend({
					onShow: function () {
						arr.varView.highlight(rangeHighlight(new code.Constant(0), arr.field('length'), ''));
					}
				}, highlighters)),
				code.For.eachArray(i, arr, [
					new code.MagicClearDescription(),
					new code.MagicClass(arr, i, 'in-progress'),
					new code.MagicDescription("Let's add the [](index)<sup>th</sup> item ([](value)) to the [sum](sum).", $.extend({
						onShow: function () {
							arr.varView.unhighlight();
							arr.varView.highlight(rangeHighlight(new code.Constant(0), new code.ExprAdd(i.read(), 1), 'none'));
						}
					}, highlighters)),
					sum.assign(new code.ExprAdd(sum.read(), arr.getAt(i.read()))),
					new code.MagicClass(arr, i, 'done'),
					new code.MagicDescription("The [](index)<sup>th</sup> item ([](value)) has been accumulated into [sum](sum).", highlighters)
				])
		));
		func.variables = [arr, sum, i];
		func.variables.input = [arr];
		func.variables.output = [sum];
		return func;
	}();

	var program = new code.Program(main);
	program.startAt = 1;
	program.variables = main.variables;
	program.variables.input = main.variables.input;
	program.variables.output = main.variables.output;
	return program;
}
