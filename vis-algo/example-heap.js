// @formatter:off
/*
int parentOfLast = ((A.length - 1) - 1) / 2;
for (int i = parentOfLast; 0 <= i; --i) {
	sift(A, i, A.length);
}

void sift(int[] heap, int start, int end) {
	int parent = start;
	while (true) {
		int greatest = greatest(heap, parent, 2*parent+1, 2*parent+2, end);
		if (greatest == parent) break;
		swap(heap, parent, child);
		parent = child; // repeat to continue sifting down the child now
	}
}
*/
// @formatter:on

// noinspection JSUnusedGlobalSymbols anonymous function is not allowed, but no-one will call this method
/**
 * @param {Number[]} input
 * @returns {code.Program}
 */
function build(input) {
	var utils = {
		arrayIndex: function arrayIndex(arrayVar, indexExpr, classes) {
			return {
				classes: classes,
				loc: indexExpr,
				filter: ':not(.connector)',
				value: function () {
					return "at&nbsp;" + indexExpr.execute();
				},
				highlight: arrayVar
			};
		},
		arrayValue: function (arrayVar, indexExpr, classes, noConnector) {
			return {
				classes: classes,
				loc: indexExpr,
				filter: noConnector ? ':not(.connector)' : '',
				value: function () {
					var index = indexExpr.execute();
					var value = arrayVar.getAt(index).execute();
					return value === undefined ? "outside array" : "=" + value + " at&nbsp;" + index;
				},
				highlight: arrayVar
			};
		},
		subtreeHighlight: function (startExpr, endExpr) {
			var startIndex = startExpr.execute();
			var endIndex = endExpr.execute();
			var clz = [];
			var q = [];
			q.push(startIndex);
			clz.push({loc: startIndex, classes: ['parent']});
			while (q.length !== 0) {
				var node = q.pop();
				var left = node * 2 + 1;
				var right = node * 2 + 2;
				if (left < endIndex) {
					clz.push({loc: left, classes: ['child left']});
					q.push(left);
				}
				if (right < endIndex) {
					clz.push({loc: right, classes: ['child right']});
					q.push(right);
				}
			}
			return clz;
		}
	};
	var sift = function () {
		var heap = new code.VarArray('heap', 'int32');
		var start = new code.Variable('start', 'index');
		var end = new code.Variable('end', 'index');
		var parent = new code.Variable('parent', 'index');
		var left = new code.Variable('left', 'index');
		var right = new code.Variable('right', 'index');
		var greatest = new code.Variable('greatest', 'index');
		var tmp = new code.Variable('tmp', 'index');
		var leftExpr = new code.ExprAdd(new code.ExprMul(parent.read(), 2), 1);
		var rightExpr = new code.ExprAdd(new code.ExprMul(parent.read(), 2), 2);
		// @formatter:off
		function  leftIndexValid() { return new code.ExprLessThan( left.read(), end.read()); }
		function rightIndexValid() { return new code.ExprLessThan(right.read(), end.read()); }
		// @formatter:on
		var greatestLeft = new code.ExprLessThan(heap.getAt(greatest.read()), heap.getAt(left.read()));
		var greatestRight = new code.ExprLessThan(heap.getAt(greatest.read()), heap.getAt(right.read()));

		var highlighters = {
			parent: utils.arrayValue(heap, parent.read(), 'parent', true),
			greatest: utils.arrayValue(heap, greatest.read(), 'child', true),
			left: utils.arrayValue(heap, leftExpr, 'child left'),
			right: utils.arrayValue(heap, rightExpr, 'child right'),
			start: utils.arrayValue(heap, start.read(), 'parent'),
			end: utils.arrayValue(heap, new code.ExprSub(end.read(), 1), '')
		};

		function highlight() {
			var index = parent.read().execute();
			var ind = views.HeapVis.heapIndices(index);
			var clz = [
				{loc: ind.left, classes: ['child', 'left']},
				{loc: ind.right, classes: ['child', 'right']},
				{loc: ind.index, classes: 'parent', filter: ':not(.connector)'}
			];
			heap.varView.highlight(clz);
		}

		var unhighlight = new code.MagicDescription("", {
			onShow: function () {
				heap.varView.unhighlight();
			}
		});
		var func = new code.Function('sift', [heap, start, end], new code.Block(
				new code.MagicDescription("Let's check the heap property in the subtree rooted at [start](start). "
				                          + "This assumes that the sub-heaps rooted at the children are already valid.", $.extend({
					onShow: function () {
						heap.varView.highlight(utils.subtreeHighlight(start.read(), end.read()));
					}
				}, highlighters)),
				parent.define(start.read()),
				unhighlight,
				code.While.infinite([
					new code.MagicClearDescription(),
					new code.MagicDescription("Check the heap property at the [current parent node](parent) by checking the [left](left) and [right](right) children. ",
							$.extend({onShow: highlight}, highlighters)),
					new code.MagicClass(heap, parent, 'in-progress'),
					left.define(leftExpr),
					new code.MagicClass(heap, left.read(), 'in-progress'),
					right.define(rightExpr),
					new code.MagicClass(heap, right.read(), 'in-progress'),
					new code.MagicDescription("Let's assume for a moment that the current [parent](parent) is the greatest.", highlighters),
					greatest.define(parent.read()),
					new code.If(new code.ExprAnd(leftIndexValid(), greatestLeft), [
						new code.MagicClass(heap, left.read(), 'failed'),
						new code.MagicDescription("The [current parent](parent) violates the heap property against its [left child](left), save the [left child](left) as the current greatest.", highlighters),
						greatest.assign(left.read())
					], [
						new code.If(new code.ExprNot(leftIndexValid()), [
							new code.MagicDescription("There's no left child of the [current parent](parent).", highlighters)
						], [
							new code.MagicClass(heap, left.read(), 'done'),
							new code.MagicDescription("The [left child](left) doesn't violate the heap property.", highlighters)
						])
					]),
					new code.If(new code.ExprAnd(rightIndexValid(), greatestRight), [
						new code.MagicClass(heap, right.read(), 'failed'),
						new code.If(new code.ExprEq(parent.read(), greatest.read()), [
							new code.MagicDescription("The [current parent](parent) violates the heap property against its [right child](right), save the [right child](right) as the current greatest.", highlighters)
						], [
							new code.MagicDescription("The [current parent](parent) violates the heap property against its [right child](right), it is also larger than the [left child](left), save the [right child](right) as the current greatest.", highlighters)
						]),
						greatest.assign(right.read())
					], [
						new code.If(rightIndexValid(), [
							new code.If(new code.ExprLessThan(heap.getAt(parent.read()), heap.getAt(right.read())), [
								new code.MagicClass(heap, right.read(), 'failed'),
								new code.MagicDescription("The [current parent](parent) violates the heap property against its [right child](right), but the [right child](right) is not greater than the [left child](left), no need to modify the [current greatest](greatest).", highlighters)
							], [
								new code.MagicClass(heap, right.read(), 'done'),
								new code.MagicDescription("The [right child](right) doesn't violate the heap property.", highlighters)
							])
						], [
							new code.MagicDescription("There's no right child of the [current parent](parent).", highlighters)
						])
					]),
					new code.MagicDescription("The greatest of the three nodes is [](greatest).", highlighters),
					new code.If(new code.ExprEq(greatest.read(), parent.read()), [
						new code.MagicClass(heap, parent, 'done'),
						new code.MagicDescription("The heap property is valid, nothing to do.", highlighters),
						unhighlight,
						new code.Break(),
						new code.MagicClearDescription() // TODO figure out how to make this work here
					], [
						new code.MagicDescription("Swapping the parent's value with the [chosen child](greatest) will restore the heap property at [this node](parent). "
						                          + "The greater one of the children were chosen so after the swap the other child will also validate the heap property with the [new parent](greatest).", highlighters)
					]),
					//tmp.define(heap.getAt(parent)), heap.setAt(parent, heap.getAt(greatest)), heap.setAt(greatest, tmp),
					new code.MagicCall('swap', function swap(aEx, a, iEx, i, jEx, j) {
						var tmp = aEx.getValueAt(i);
						aEx.setValueAt(i, aEx.getValueAt(j));
						aEx.setValueAt(j, tmp);
					}, heap, parent, greatest),
					new code.MagicClearDescription(),
					new code.MagicDescription("Now the heap property is restored: the value at [parent](parent) is greater than both the [left](left) and the [right](right) children. Continue on with the [changed child](greatest)", highlighters),
					new code.MagicClass(heap, parent, 'done'),
					new code.If(new code.ExprEq(greatest.read(), left.read()), [
						new code.MagicClass(heap, left.read(), 'in-progress'),
						new code.MagicClass(heap, right.read(), 'done')
					], [
						new code.MagicClass(heap, right.read(), 'in-progress'),
						new code.MagicClass(heap, left.read(), 'done')
					]),
					parent.assign(greatest.read()),
					unhighlight
				])
		));
		func.variables = [heap, start, end, parent, greatest, tmp];
		func.variables.input = [heap, start, end];
		func.variables.output = [];
		return func;
	}();

	var heapify = function () {
		var heap = new code.VarArray('toHeap', 'int32');
		var i = new code.Variable('i', 'index');
		var last = new code.Variable('last', 'index');
		var lastExpr = new code.ExprSub(new code.FieldGet(heap, 'length'), 1);
		var parentOfLast = new code.Variable('parentOfLast', 'index');
		var highlighters = {
			index: utils.arrayValue(heap, i.read(), ''),
			lastIndex: utils.arrayIndex(heap, lastExpr, ''),
			first: utils.arrayValue(heap, new code.ExprAdd(parentOfLast.read(), 1), 'child', true),
			parent: utils.arrayValue(heap, new code.ExprDiv(new code.ExprSub(lastExpr, 1), 2), 'parent', true),
			last: utils.arrayValue(heap, lastExpr, 'child', true)
		};
		var func = new code.Function('heapify', [heap], new code.Block(
				new code.MagicClearDescription(),
				new code.MagicDescription("The [last item](last) in the array is the [right-most leaf node at the deepest level](last) in the binary heap.", highlighters),
				last.define(lastExpr),
				new code.MagicDescription("The [parent](parent) of that [last node](last) will show us where the leaves start.", highlighters),
				parentOfLast.define(new code.ExprDiv(new code.ExprSub(last.read(), 1), 2)),
				new code.MagicDescription("The [first leaf](first) is the one right after the [parent](parent) of the [last child](last).", highlighters),
				new code.For(i.define(0), new code.ExprLessThanOrEqual(i.read(), last.read()), i.preIncrement(), [
					new code.If(new code.ExprLessThanOrEqual(i.read(), parentOfLast.read()), [
						new code.MagicClass(heap, i, 'failed')
					], [
						new code.MagicClass(heap, i, 'done')
					])
				]),
				new code.MagicDescription("We know that all the leaves validate the heap property: they don't have children. "
				                          + "The rest of the nodes will need to be checked and maybe corrected. "
				                          + "The algorithm goes backwards to maintain that all children of each processed node are already valid.", highlighters),
				new code.For(i.define(parentOfLast.read()), new code.ExprLessThanOrEqual(0, i.read()), i.preDecrement(), [
					new code.MagicClearDescription(),
					new code.MagicDescription("Check [current node](index) if it violates the heap property and fix it if it does.", highlighters),
					new code.MagicClass(heap, i, 'in-progress'),
					new code.FunctionCall(sift, [heap.read(), i.read(), new code.FieldGet(heap, 'length')]),
					new code.MagicClearDescription(), // TODO see sift/break
					new code.MagicClass(heap, i, 'done')
				])
		));
		func.variables = [heap, i];
		func.variables.input = [heap];
		func.variables.output = [heap];
		return func;
	}();

	// noinspection JSUnusedLocalSymbols tests base cases of the algorithm
	var test = function () {
		var arr = new code.VarArray('arr', 'int32');
		var func = new code.Function('main', [], new code.Block(
				new code.MagicClearDescription(),
				new code.FunctionCall(sift, [new code.Constant([1, 2, 3], 'int32[]'), new code.Constant(0), new code.Constant(3)]),
				new code.MagicClearDescription(),
				new code.FunctionCall(sift, [new code.Constant([1, 3, 2], 'int32[]'), new code.Constant(0), new code.Constant(3)]),
				new code.MagicClearDescription(),
				new code.FunctionCall(sift, [new code.Constant([3, 1, 2], 'int32[]'), new code.Constant(0), new code.Constant(3)]),
				new code.MagicClearDescription(),
				new code.FunctionCall(sift, [new code.Constant([3, 2, 1], 'int32[]'), new code.Constant(0), new code.Constant(3)]),
				new code.MagicClearDescription(),
				new code.FunctionCall(sift, [new code.Constant([2, 1, 3], 'int32[]'), new code.Constant(0), new code.Constant(3)]),
				new code.MagicClearDescription(),
				new code.FunctionCall(sift, [new code.Constant([2, 3, 1], 'int32[]'), new code.Constant(0), new code.Constant(3)]),
				new code.MagicClearDescription()
		));
		func.variables = [];
		func.variables.input = [];
		func.variables.output = [];
		return func;
	}();
	var main = function () {
		var heap = new code.VarArray('input', 'int32');
		var func = new code.Function('main', [], new code.Block(
				heap.define(input),
				new code.FunctionCall(heapify, [heap.read()])
		));
		func.variables = [];
		func.variables.input = [];
		func.variables.output = [];
		return func;
	}();

	var program = new code.Program(main, [heapify, sift]);
	program.startAt = 2;
	var all = program.funcs.concat(program.main);
	program.variables = $.map(all, function (func) {
		func.variables.forEach(function (vari) {
			vari.enclosing = func;
		});
		return func.variables;
	});
	program.variables.input = $.map(all, function (func) {
		return func.variables.input;
	});
	program.variables.output = $.map(all, function (func) {
		return func.variables.output;
	});
	return program;
}
