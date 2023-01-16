"use strict";
var current = window.current = {
	program: null,
	stepper: null,
	vars: {},
	startCode: function (program, codeContainer, visContainer) {
		this.program = program;
		this.stepper = new Stepper(program);

		var visitor = new HTMLCodeVisitor(codeContainer);
		visitor.debug = true;
		visitor.showMagic = $('#showMagic').is(':checked');
		program.accept(visitor);
		for (var prop in this.vars) {
			//noinspection JSUnfilteredForInLoop
			delete this.vars[prop];
		}
		visContainer.find('[data-var-name]').remove();
		for (var i = 0; i < program.variables.length; ++i) {
			var model = program.variables[i];
			var vis = [model instanceof code.VarArray ? views.ArrayVis : views.PrimitiveVis];
			if (model.name.toLowerCase().indexOf('heap') !== -1) {
				vis.push(views.HeapVis);
			}
			var view;
			if (model instanceof code.VarArray) {
				view = new views.ArrayView(model, vis);
			} else {
				view = new views.PrimitiveView(model, vis);
			}
			this.vars[model.name] = view;
			model.outScoped();
			visContainer.append(view.view);
		}
		for (var j = 0; j < program.variables.input.length; ++j) {
			var inVar = program.variables.input[j];
			var inVarView = this.vars[inVar.name];
			inVar.isIn = true;
			inVarView.nameView.append($('<span class="dir">in</span>'));
		}
		for (var k = 0; k < program.variables.output.length; ++k) {
			var outVar = program.variables.output[k];
			var outVarView = this.vars[outVar.name];
			outVar.isOut = true;
			outVarView.nameView.append($('<span class="dir">out</span>'));
		}
	},
	stepToNext: function () {
		while (true) {
			var ev = current.stepper.step();
			if (ev.event == Stepper.event.TERMINATE) {
				console.log("TERMINATED");
				return false;
			}
			var elem = ev.elem;
			if (!elem.view) { // FIXME if magic is on, code.Magic still has a view and not executed
				if (elem instanceof code.Magic && ev.event == Stepper.event.FINISH) {
					console.log('Magic', ev.event, elem);
					elem.execute();
				} else {
					console.log('Skip', ev.event, elem);
				}
				continue;
			}
			console.log('Next', ev.event, elem);
			switch (ev.event) {
				case Stepper.event.START:
					if (!('step' in elem) || (code.FunctionCall.skipMode && elem instanceof code.FunctionCall)) {
						elem.view.addClass('highlight');
						elem.view.closest('.line').addClass('active');
						return true;
					}
					break;
				case Stepper.event.FINISH:
					elem.view.removeClass('highlight');
					elem.view.closest('.line').removeClass('active');
					break;
			}
		}
	}
};
var views = {};

views.VariableView = function VariableView(model, visualizations) {
	this.vis = visualizations.map(function (vis) {
		return new vis(model, this);
	}, this);
	this.model = model;
	this.view = $('<div>').addClass('var').attr('data-var-name', model.name);
	this.view.model = model;
	model.varView = this;
	this.nameView = $('<div>').addClass('var-name').text(model.name).appendTo(this.view);
	this.valueView = $('<div>').addClass('var-value').appendTo(this.view);

	this.vis.forEach(function (vis) {
		if (!this.valueView.is(':empty')) {
			this.valueView.append('<hr>');
		}
		this.valueView.append(vis.view);
	}, this);

	$(model).bind('declare.var', $.proxy(function (/*e*/) {
		this.view.removeClass('out-of-scope');
	}, this));
	$(model).bind('delete.var', $.proxy(function (/*e, oldVal*/) {
		if (!model.isOut) {
			this.view.addClass('out-of-scope');
		}
	}, this));
};

views.VariableView.prototype.highlight = function (highlights) {
	if (this.highlights) {
		if (!this.backlights) {
			var backup = this.highlights;
			this.unhighlight();
			this.backlights = backup;
		} else {
			throw "Who didn't unhighlight()?";
		}
	}
	highlights.forEach(function (hl) {
		hl.classes = typeof hl.classes === 'string' ? hl.classes : (hl.classes || []).join(' ');
		var child = this.getFor(hl.loc);
		hl.selection = hl.filter ? child.filter(hl.filter) : child;
		hl.selection.addClass('highlight').addClass(hl.classes);
	}, this);
	this.getAll().filter(':not(.highlight)').addClass('irrelevant');
	this.highlights = highlights;
};
views.VariableView.prototype.unhighlight = function () {
	var highlights = this.highlights;
	if (!highlights) {
		throw "No highlights";
	}
	highlights.forEach(function (hl) {
		hl.selection.removeClass('highlight').removeClass(hl.classes);
	}, this);
	this.getAll().removeClass('irrelevant');
	delete this.highlights;
	if (this.backlights) {
		this.highlight(this.backlights);
		delete this.backlights;
	} else {
	}
};
views.VariableVis = function VariableVis(model, varView, classes) {
	this.model = model;
	this.varView = varView;
	this.view = $('<div>').addClass(classes);

	$(model).bind('change.var', $.proxy(function (e, oldVal, newVal) {
		this.update(newVal, oldVal);
	}, this));
	$(model).bind('delete.var', $.proxy(function (/*e, oldVal*/) {
		if (!model.isOut) {
			this.reset();
		} else {
			this.clean();
		}
	}, this));
};
/**
 * Variable value changed.
 * @param newVal
 * @param oldVal
 */
views.VariableVis.prototype.update = function (newVal, oldVal) {
	throw "Update(" + newVal + "," + oldVal + ") not implemented for " + this.constructor.name;
};
/**
 * Variable out of scope, reset to uninitialized state
 */
views.VariableVis.prototype.reset = function () {
	this.view.text('<uninitialized>');
};
/**
 * Variable out of scope, remove all highlights
 */
views.VariableVis.prototype.clean = function () {
};

inherit(views.VariableView, views.PrimitiveView = function PrimitiveView(model, visualizations) {
	this.super.constructor.call(this, model, visualizations);
});
views.PrimitiveView.prototype.getSelector = function () {
	return '.value';
};
views.PrimitiveView.prototype.getFor = function () {
	return this.view.find(this.getSelector());
};
views.PrimitiveView.prototype.getAll = function () {
	return this.view.find('.value');
};
inherit(views.VariableVis, views.PrimitiveVis = function PrimitiveVis(model, varView) {
	this.super.constructor.call(this, model, varView, 'primitive value');
});
views.PrimitiveVis.prototype.update = function (value) {
	this.view.text(value);
};

inherit(views.VariableView, views.ArrayView = function ArrayView(model, visualizations) {
	this.super.constructor.apply(this, arguments);

	$(model).bind('change.arr', $.proxy(function (e, index, oldVal, newVal) {
		this.vis.forEach(function (vis) {
			//vis.children().removeClass('changed');
			var child = vis.getAt(index);
			child.text(newVal).addClass('changed');
			setTimeout(function () {
				child.removeClass('changed')
			}, 1500);
		}, this);
	}, this));
	$(model).bind('read.arr', $.proxy(function (e, index/*, val*/) {
		this.vis.forEach(function (vis) {
			//vis.children().removeClass('read');
			var child = vis.getAt(index);
			child.addClass('read');
			setTimeout(function () {
				child.removeClass('read')
			}, 1500);
		}, this);
	}, this));
});
views.ArrayView.prototype.getSelector = function (index) {
	return '[data-index="' + index + '"]';
};
views.ArrayView.prototype.getFor = function (index) {
	return this.view.find(this.getSelector(index));
};
views.ArrayView.prototype.getAll = function () {
	return this.view.find('[data-index]');
};
inherit(views.VariableVis, views.ArrayVis = function ArrayVis(model, varView) {
	this.super.constructor.call(this, model, varView, 'array with-indices');
	this.view
			.on('mouseenter', '.value', function () {
				varView.highlight([{loc: $(this).data('index'), classes: 'user'}]);
			})
			.on('mouseleave', '.value', function () {
				varView.unhighlight();
			})
	;
});
views.ArrayVis.prototype.clean = function () {
	this.view.children()
			.removeClass('read')
			.removeClass('changed')
	;
};
views.ArrayVis.prototype.update = function (value) {
	this.view.empty();
	this.view.append($('<div>').addClass('item length').text(value.length));
	for (var i = 0; i < value.length; ++i) {
		var itemView = $('<div>').addClass('item value').attr('data-index', i).text(value[i]);
		this.view.append(itemView);
	}
	this.view.append($('<div>').addClass('item length').text(value.length));
};
views.ArrayVis.prototype.getAt = function (index) {
	return this.view.find('.value').eq(index);
};

inherit(views.VariableVis, views.HeapVis = function HeapVis(model, varView) {
	this.super.constructor.call(this, model, varView, 'heap');
	this.view
			.on('mouseenter', '.node', function () {
				var index = $(this).data('index');
				var ind = views.HeapVis.heapIndices(index);
				var clz = [
					{loc: ind.left, classes: ['child', 'left']},
					{loc: ind.right, classes: ['child', 'right']},
					{loc: ind.index, classes: '', filter: ':not(.connector)'},
					{loc: ind.index, classes: 'parent', filter: '.connector'}
				];
				clz = clz.concat(ind.parents.map(function (parent) {
					return {loc: parent, classes: ['parent']};
				}));
				varView.highlight(clz);
			})
			.on('mouseleave', '.node', function () {
				varView.unhighlight();
			})
			.on('mouseenter', '.connector', function () {

				var ind = views.HeapVis.heapIndices($(this).data('index'));
				var clz = [
					{loc: ind.parent, classes: 'parent', filter: ':not(.connector)'},
					{loc: ind.index, classes: ['child', ind.side], filter: ':not(.connector)'},
					{loc: ind.index, classes: '', filter: '.connector'}
				];
				varView.highlight(clz);
			})
			.on('mouseleave', '.connector', function () {
				varView.unhighlight();
			})
	;
});
views.HeapVis.prototype.getAt = function (index) {
	return this.view.find('.value[data-index=' + index + ']');
};

views.HeapVis.allIndex = function (model, index) {
	return '[data-var-name="' + model.name + '"] [data-index="' + index + '"]';
};

views.HeapVis.getParents = function getParents(index) {
	var parents = [];
	if (0 < index) {
		var parent = index;
		do {
			parent = Math.floor((parent - 1) / 2);
			parents.push(parent);
		} while (parent > 0);
	}
	return parents;
};

views.HeapVis.heapIndices = function heapIndices(index) {
	var ind = {
		index: index,
		left: index * 2 + 1,
		right: index * 2 + 2,
		parents: views.HeapVis.getParents(index)
	};
	ind.parent = ind.parents[0];
	if (ind.parents.length > 0) {
		ind.side = ind.index == ind.parent * 2 + 1 ? 'left' : 'right';
	} else {
		ind.side = 'root';
	}
	return ind;
};
views.HeapVis.prototype.clean = function () {
	this.view.find('.node')
			.removeClass('read')
			.removeClass('changed')
	;
};
views.HeapVis.prototype.update = function (value) {
	this.view.empty();
	var height = Math.floor(Math.log(value.length) / Math.LN2) + 1;
	var completeSize = Math.pow(2, height) - 1;

	function build(value, index, side) {
		if (completeSize <= index) return undefined; // outside the tree, children of last row

		var view = $('<div class="node-container">');
		if (side === true) {
			view.addClass('left');
		} else if (side === false) {
			view.addClass('right');
		}
		if (value.length <= index) { // outside the tree, non-existent leaves of last row
			// FIXME report bug flip <=
			view.addClass('leaf').append($('<div class="node empty">').html('&nbsp;'));
		} else {
			var parent = Math.floor((index - 1) / 2);
			var leftChild = index * 2 + 1;
			var rightChild = index * 2 + 2;
			if (side !== undefined) {
				view.append($('<div class="connector vert">'));
				view.append($('<div class="connector hor">'));
				view.find('.connector')
						.attr('data-index', index)
						.attr('data-index-parent', parent)
						.attr('data-index-child', index)
				;
			}
			var node = $('<div class="value node">')
					.text(value[index])
					.attr('data-index', index)
					.attr('data-index-parent', parent)
					.appendTo(view);
			var left = build(value, leftChild, true);
			var right = build(value, rightChild, false);
			if (!left && !right) view.addClass('leaf');
			view.append(left);
			if (left && left.find('.empty').length === 0) {
				node.attr('data-index-child-left', leftChild);
			}
			view.append(right);
			if (right && right.find('.empty').length === 0) {
				node.attr('data-index-child-right', rightChild);
			}
		}
		return view;
	}

	this.view.append(build(value, 0));
};

inherit(code.Statement, code.Magic = function Magic() {

});
code.Magic.prototype.step = function () {
	return null; // disable evaluation
};
code.Magic.prototype.toString = function () {
	return 'magic';
};
inherit(code.Magic, code.MagicClass = function MagicClass(array, index, classes) {
	this.array = array;
	this.index = index instanceof code.Variable ? index.read() : index;
	this.classes = classes;
});
code.MagicClass.prototype.accept = function (vis) {
	vis.magic(this);
};
code.MagicClass.prototype.execute = function () {
	$('[data-var-name="' + this.array.name + '"] [data-index="' + this.index.execute() + '"]')
			.removeClass('failed in-progress done')
			.addClass(this.classes);
};
inherit(code.Magic, code.MagicClearDescription = function MagicClearDescription() {

});
code.MagicClearDescription.prototype.accept = function (vis) {
	vis.magic(this);
};
code.MagicClearDescription.prototype.execute = function () {
	$('#desc').empty();
};
inherit(code.Magic, code.MagicDescription = function MagicDescription(text, params) {
	this.text = text;
	this.params = params;
});
code.MagicDescription.prototype.accept = function (vis) {
	vis.magic(this);
};
code.MagicDescription.prototype.execute = function () {
	function buildElem(text, link) {
		var param = params[link];
		if (!param) {
			throw new Error("Cannot resolve param '" + link + "' for text '" + text + "'");
		}
		var elem;
		var value = param.value();
		if (0 < text.length) {
			var textElem = '<span class="highlight ' + param.classes + '">' + text + '</span>';
			elem = $('<span data-value="' + value + '">' + textElem + '&nbsp;(' + value + ")</span>");
		} else {
			elem = $('<span data-value="' + value + '">' + value + "</span>");
		}
		if (param.loc) {
			elem.attr('data-loc', param.loc.execute());
		}

		if (param.loc && param.highlight) {
			elem.on('mouseenter', function () {
				param.highlight.varView.highlight([{
					loc: param.loc.execute(),
					classes: param.classes,
					filter: param.filter
				}]);
			});
			elem.on('mouseleave', function () {
				param.highlight.varView.unhighlight();
			});
		}
		return elem;
	}

	var text = $("<p>");
	if (this.params) {
		var params = this.params;
		if (typeof params.onShow === 'function') {
			params.onShow();
		}
		if (!this.text) return;
		// [...](...) or [](...)
		var regex = /\[([^\[]*?)]\((.+?)\)/gm;
		var match, lastIndex = 0;
		while ((match = regex.exec(this.text)) !== null) {
			text.append(this.text.substring(lastIndex, match.index));
			lastIndex = match.index + match[0].length;
			text.append(buildElem(match[1], match[2]));
		}
		text.append(this.text.substring(lastIndex, this.text.length));
	} else {
		text.append(this.text);
	}
	$('#desc').append(text);
};
inherit(code.Magic, code.MagicHighlight = function MagicHighlight(array, index, operation) {
	this.array = array;
	this.index = index;
	this.operation = operation;
});
code.MagicHighlight.prototype.accept = function (vis) {
	vis.magic(this);
};
code.MagicHighlight.prototype.execute = function () {
	this.array.view.getAt(this.index.execute()).filter('.value.node').trigger('mouseover');
};
